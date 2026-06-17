import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type OrgContext = {
  orgName: string;
  // Structured knowledge areas. Any of these may be empty for a given org.
  about?: string | null;
  hours?: string | null;
  location?: string | null;
  announcements?: string | null;
  contact?: string | null;
  giving?: string | null;
  events?: string | null;
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

  // Build the knowledge block from only the areas this org has filled in. Each
  // section is clearly headed so Claude can pull from the right one and name the
  // area in its reply. Empty areas are omitted entirely — combined with the
  // strict "only answer from what's below" rule, that means the bot honestly
  // says it doesn't have anything the org hasn't provided.
  const sections: [string, string | null | undefined][] = [
    ["ABOUT", ctx.about],
    ["HOURS & SCHEDULE", ctx.hours],
    ["LOCATION & DIRECTIONS", ctx.location],
    ["THIS WEEK / ANNOUNCEMENTS", ctx.announcements],
    ["CONTACT", ctx.contact],
    ["GIVING / PAYMENTS", ctx.giving],
    ["UPCOMING EVENTS", ctx.events],
  ];
  const knowledgeBlock = sections
    .filter(([, value]) => value && value.trim())
    .map(([heading, value]) => `${heading}:\n${value!.trim()}`)
    .join("\n\n");

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
The information is grouped into areas (hours, location, announcements, contact,
giving/payments, upcoming events, about). Pull your answer from the area that
fits the question, and lightly signal which area it relates to so the member has
context (e.g. "Our hours are…", "For giving, you can…", "Coming up…").
LANGUAGE: Detect the language and style the member is writing in — English,
Nigerian Pidgin, Yoruba, Hausa, Igbo, or any other — and write your ENTIRE reply
in that same language. The information below is often stored in a different
language (usually English); translate the relevant facts naturally into the
member's language without changing their meaning. Do NOT translate or alter
names, numbers, addresses, account numbers, dates, or times — keep those exactly
as written. If you genuinely can't tell which language they're using, reply in
English. This does NOT relax any rule above: still answer ONLY from the
information, and if the answer isn't there, give the honest "I don't have that"
in the member's own language — never invent anything to fill the gap.
Be warm, brief (2-5 sentences), and clear. Do not discuss anything unrelated to
this organization. The recent messages give you context — use them so follow-up
questions make sense.${firstContactGuidance}

INFORMATION ABOUT ${ctx.orgName.toUpperCase()}:
${knowledgeBlock || "No information has been added yet."}

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
