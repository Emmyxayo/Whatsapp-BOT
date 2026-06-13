import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReply, type ConversationTurn } from "@/lib/claude";
import { detectIntentReply } from "@/lib/intent";
import { sendWhatsAppText } from "@/lib/whatsapp";

// A conversation is treated as a session within WhatsApp's 24-hour window.
// A message after a gap longer than this counts as a fresh start: we greet
// warmly and don't carry stale history into the prompt.
const SESSION_GAP_MS = 6 * 60 * 60 * 1000; // 6 hours

// How many recent exchanges to remember (each is one in + one out message,
// so ~8 messages of context).
const HISTORY_EXCHANGES = 4;

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
    const [{ data: update }, { data: faqs }, { data: recentRows }] = await Promise.all([
      supabase
        .from("org_updates")
        .select("label, body, key_details, contact")
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
    ]);

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

    // Fast path: clear, common questions answered straight from the org's
    // fields — cheaper, faster, and perfectly consistent. Skipped on first
    // contact so the warm greeting isn't bypassed; anything ambiguous or
    // unanswered by a field falls through to Claude.
    let reply: string | null = null;
    if (!isFirstContact) {
      reply = detectIntentReply(text, {
        keyDetails: update?.key_details,
        contact: update?.contact,
      });
    }

    if (reply === null) {
      reply = await generateReply(
        text,
        {
          orgName: organization.name,
          label: update?.label,
          body: update?.body,
          keyDetails: update?.key_details,
          contact: update?.contact,
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
