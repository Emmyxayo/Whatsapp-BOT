import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReply, type ConversationTurn } from "@/lib/claude";
import { detectIntentReply } from "@/lib/intent";
import { detectEscalation, escalationAcknowledgement } from "@/lib/escalation";
import { sendWhatsAppText } from "@/lib/whatsapp";

// A conversation is treated as a session within WhatsApp's 24-hour window.
// A message after a gap longer than this counts as a fresh start: we greet
// warmly and don't carry stale history into the prompt.
const SESSION_GAP_MS = 6 * 60 * 60 * 1000; // 6 hours

// How many recent exchanges to remember (each is one in + one out message,
// so ~8 messages of context).
const HISTORY_EXCHANGES = 4;

// Per-member rate limit: cap how many messages one WhatsApp number can have us
// process in a short window. Protects against abuse and runaway Claude costs.
// A normal back-and-forth stays well under this; a flood gets one heads-up then
// goes quiet until the window clears.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // messages per member per window
const RATE_LIMIT_NOTICE =
  "You've sent a lot of messages very quickly — give me a moment to catch up and try again shortly. 🙏";

// ---- GET: Meta calls this once to verify your webhook ----
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ---- POST: a member sent a message ----
export async function POST(req: NextRequest) {
  // Always 200 fast so Meta doesn't retry; do the work, then return.
  try {
    const body = await req.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // Ignore delivery/read receipts and anything without a text body.
    if (!message || message.type !== "text") {
      return NextResponse.json({ ok: true });
    }

    const phoneNumberId: string = value.metadata.phone_number_id;
    const from: string = message.from; // member's WhatsApp number
    const text: string = message.text.body;

    // Route to the right organization by the number the message arrived on.
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("whatsapp_phone_number_id", phoneNumberId)
      .single();

    if (!organization) {
      console.warn("No organization for phone_number_id:", phoneNumberId);
      return NextResponse.json({ ok: true });
    }

    // Load this organization's updates + FAQs, plus this member's recent
    // messages so Claude has short-term memory.
    const [{ data: update }, { data: faqs }, { data: recentRows }, { count: recentCount }] =
      await Promise.all([
        supabase
          .from("org_updates")
          .select("about, hours, location, announcements, contact, giving, events")
          .eq("organization_id", organization.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("faqs").select("question, answer").eq("organization_id", organization.id),
        supabase
          .from("conversations")
          .select("message_in, message_out, created_at")
          .eq("organization_id", organization.id)
          .eq("member_wa_id", from)
          .order("created_at", { ascending: false })
          .limit(HISTORY_EXCHANGES),
        // How many messages we've processed for this member in the rate window.
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .eq("member_wa_id", from)
          .gte("created_at", new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()),
      ]);

    // Rate limit: if this member is over the cap, don't run the (expensive)
    // pipeline. Send a single gentle heads-up — detected by checking whether the
    // last reply we logged was already the notice — then go quiet so a flood
    // can't loop. We log the one notice so subsequent floods see it and stay
    // silent; we don't process or bill anything for them.
    if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
      console.warn(
        `Rate limit: ${from} hit ${recentCount} messages in ${RATE_LIMIT_WINDOW_MS}ms for org ${organization.id}`
      );
      if (recentRows?.[0]?.message_out !== RATE_LIMIT_NOTICE) {
        await sendWhatsAppText(phoneNumberId, from, RATE_LIMIT_NOTICE);
        await supabase.from("conversations").insert({
          organization_id: organization.id,
          member_wa_id: from,
          message_in: text,
          message_out: RATE_LIMIT_NOTICE,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Decide whether this message continues the current session or starts a
    // fresh one. The latest stored message's age is the gap.
    const lastAt = recentRows?.[0]?.created_at
      ? new Date(recentRows[0].created_at).getTime()
      : null;
    const isFirstContact = lastAt === null || Date.now() - lastAt > SESSION_GAP_MS;

    // Build chronological history from complete exchanges only (keeps the
    // user/assistant turns cleanly alternating). Dropped on a fresh start.
    const history: ConversationTurn[] = isFirstContact
      ? []
      : [...recentRows!]
          .reverse()
          .filter((r) => r.message_in && r.message_out)
          .flatMap((r) => [
            { role: "user" as const, content: r.message_in as string },
            { role: "assistant" as const, content: r.message_out as string },
          ]);

    // Human handoff: before generating any answer, check whether this member
    // needs a real person — they asked explicitly, sounded frustrated, or are
    // repeating a question the bot didn't resolve. Uses their recent messages
    // (regardless of session gap) to spot repeats. This takes priority over the
    // intent fast-path and Claude so we never paper over a real need with a
    // canned answer.
    const priorMemberMessages = (recentRows ?? [])
      .map((r) => r.message_in)
      .filter((m): m is string => Boolean(m));
    const escalationReason = detectEscalation(text, priorMemberMessages);

    if (escalationReason) {
      // Open an escalation for the organization to follow up on.
      await supabase.from("escalations").insert({
        organization_id: organization.id,
        member_wa_id: from,
        message: text,
        reason: escalationReason,
      });

      const ack = escalationAcknowledgement(organization.name);
      await sendWhatsAppText(phoneNumberId, from, ack);

      // Log the exchange like any other so usage stays accurate.
      await supabase.from("conversations").insert({
        organization_id: organization.id,
        member_wa_id: from,
        message_in: text,
        message_out: ack,
      });

      // TODO(admin-alert): notify the org's admins out-of-band so they don't
      // have to be watching the dashboard. Two practical options:
      //   1. Email — call a transactional email provider (e.g. Resend) here
      //      with the org's admin email (add an `admin_email` column on
      //      organizations, or look it up from the linked auth user). Keep it
      //      best-effort: wrap in try/catch so a failed alert never blocks the
      //      member's acknowledgement above.
      //   2. WhatsApp — send a templated message to the admin's number via
      //      sendWhatsAppText. Note Meta requires a pre-approved template to
      //      message outside the 24-hour window, so this needs a registered
      //      "escalation_alert" template before it can go live.
      // For now escalations surface in the dashboard's Handoffs section.

      return NextResponse.json({ ok: true });
    }

    // Fast path: clear, common questions answered straight from the org's
    // fields — cheaper, faster, and perfectly consistent. Skipped on first
    // contact so the warm greeting isn't bypassed; anything ambiguous or
    // unanswered by a field falls through to Claude.
    let reply: string | null = null;
    if (!isFirstContact) {
      reply = detectIntentReply(text, {
        hours: update?.hours,
        location: update?.location,
        contact: update?.contact,
        giving: update?.giving,
        events: update?.events,
      });
    }

    if (reply === null) {
      reply = await generateReply(
        text,
        {
          orgName: organization.name,
          about: update?.about,
          hours: update?.hours,
          location: update?.location,
          announcements: update?.announcements,
          contact: update?.contact,
          giving: update?.giving,
          events: update?.events,
          faqs: faqs ?? [],
        },
        { history, isFirstContact }
      );
    }

    await sendWhatsAppText(phoneNumberId, from, reply);

    // Log the exchange (for usage/billing visibility).
    await supabase.from("conversations").insert({
      organization_id: organization.id,
      member_wa_id: from,
      message_in: text,
      message_out: reply,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}
