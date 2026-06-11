// Sends a text reply via the official WhatsApp Cloud API.
// Because the member messaged first, this reply lands inside the free
// 24-hour service window — so it costs you nothing on the WhatsApp side.

const GRAPH = "https://graph.facebook.com/v21.0";

export async function sendWhatsAppText(
  phoneNumberId: string,
  to: string,
  body: string
): Promise<void> {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed:", res.status, err);
  }
}
