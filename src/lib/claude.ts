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

// A single prior exchange, oldest-first, used to give Claude short-term memory
// so follow-ups ("what about the evening one?") resolve naturally.
export type ConversationTurn = { role: "user" | "assistant"; content: string };

type ReplyOptions = {
  // Recent messages for this member, in chronological order (user/assistant…).
  history?: ConversationTurn[];
  // True when this is the member's first message ever, or the first after a
  // long gap (a fresh session within WhatsApp's 24-hour window).
  isFirstContact?: boolean;
};

// Haiku is the cheapest model and plenty for "answer from this org's info".
const MODEL = "claude-haiku-4-5-20251001";

export async function generateReply(
  memberMessage: string,
  ctx: OrgContext,
  opts: ReplyOptions = {}
): Promise<string> {
  const history = opts.history ?? [];
  const isFirstContact = opts.isFirstContact ?? history.length === 0;

  const faqBlock = ctx.faqs.length
    ? ctx.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
    : "None provided.";

  // A warm, short welcome on first contact (or after a long gap) instead of
  // dumping every detail. If they already asked something specific, Claude
  // answers it directly rather than just listing options.
  const firstContactGuidance = isFirstContact
    ? `

THIS IS A FRESH CONVERSATION (the member's first message, or first after a long
gap). Open with a brief, warm greeting and a short menu of what you can help
with — for example: what's new this week, hours or times, location, contact
details, and leaving a message or request. Keep it to 2-4 friendly sentences.
If they already asked a specific question, answer that directly and warmly
instead of just listing options.`
    : "";

  // Scoped to ONE purpose: answering members and customers about THIS
  // organization's info. This keeps the bot a task-specific assistant,
  // per Meta's 2026 rules.
  const system = `You are the WhatsApp assistant for ${ctx.orgName}.
Answer members and customers using ONLY the information below. This is a strict
rule: NEVER invent, guess, or assume any fact — times, prices, names, dates,
policies — that is not written below. Do not fill gaps with general knowledge.
If the answer isn't in the information, say so honestly (e.g. "I don't have that
detail") and offer to take a message for the team or point them to the contact
details below — never make something up.
Be warm, brief (2-5 sentences), and clear. Do not discuss anything unrelated to
this organization. The recent messages give you context — use them so follow-up
questions make sense.${firstContactGuidance}

${ctx.label ?? "LATEST UPDATE"}:
${ctx.body ?? "No update posted yet."}

KEY DETAILS:
${ctx.keyDetails ?? "Not provided."}

CONTACT:
${ctx.contact ?? "Not provided."}

FREQUENTLY ASKED:
${faqBlock}`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user", content: memberMessage },
  ];

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system,
    messages,
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text || "Welcome! Ask me about this organization's latest update or details.";
}
