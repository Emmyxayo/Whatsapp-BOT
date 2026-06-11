import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type OrgContext = {
  orgName: string;
  label?: string | null;
  body?: string | null;
  keyDetails?: string | null;
  contact?: string | null;
  faqs: { question: string; answer: string }[];
};

// Haiku is the cheapest model and plenty for "answer from this org's info".
const MODEL = "claude-haiku-4-5-20251001";

export async function generateReply(
  memberMessage: string,
  ctx: OrgContext
): Promise<string> {
  const faqBlock = ctx.faqs.length
    ? ctx.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
    : "None provided.";

  // Scoped to ONE purpose: answering members and customers about THIS
  // organization's info. This keeps the bot a task-specific assistant,
  // per Meta's 2026 rules.
  const system = `You are the WhatsApp assistant for ${ctx.orgName}.
Answer members and customers using only the information below.
Be warm, brief (2-5 sentences), and clear. If something isn't in the
information, say you don't have that detail and suggest they contact the
organization directly. Do not discuss anything unrelated to this organization.

${ctx.label ?? "LATEST UPDATE"}:
${ctx.body ?? "No update posted yet."}

KEY DETAILS:
${ctx.keyDetails ?? "Not provided."}

CONTACT:
${ctx.contact ?? "Not provided."}

FREQUENTLY ASKED:
${faqBlock}`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: memberMessage }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || "Welcome! Ask me about this organization's latest update or details.";
}
