import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReply } from "@/lib/claude";
import { sendWhatsAppText } from "@/lib/whatsapp";

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

    // Load this organization's updates + FAQs.
    const [{ data: update }, { data: faqs }] = await Promise.all([
      supabase
        .from("org_updates")
        .select("label, body, key_details, contact")
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("faqs").select("question, answer").eq("organization_id", organization.id),
    ]);

    const reply = await generateReply(text, {
      orgName: organization.name,
      label: update?.label,
      body: update?.body,
      keyDetails: update?.key_details,
      contact: update?.contact,
      faqs: faqs ?? [],
    });

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
