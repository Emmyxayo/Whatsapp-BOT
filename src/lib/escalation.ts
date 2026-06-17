// Human handoff detection. Runs BEFORE any reply is generated: if a member
// clearly needs a real person, we skip the bot's answer, open an escalation,
// and acknowledge them so it never feels like a dead end.
//
// Three triggers, in priority order:
//   1. "explicit"    — they directly asked for a human.
//   2. "frustration" — the message reads as upset / fed up with the bot.
//   3. "repeated"    — they're asking (roughly) the same thing again, a sign
//                      the bot's earlier answers didn't land.

export type EscalationReason = "explicit" | "frustration" | "repeated";

// Direct asks for a person. Kept reasonably broad — a false handoff is far less
// harmful here than ignoring someone who asked for help.
const EXPLICIT =
  /\b(speak|talk|chat|connect)\s+(to|with)\s+(a\s+|an\s+|the\s+)?(human|person|someone|somebody|agent|representative|rep|advisor|operator|staff|team|real\s+person)\b|\b(human|real\s+person|live\s+(agent|person|chat)|customer\s+(service|support))\b|\b(i\s+(want|need|would\s+like|wanna)\s+(to\s+(speak|talk|chat)|a\s+human|(help|to\s+talk)\s+(from|to|with)\s+(a\s+)?(human|person|someone)))/i;

// Signals of frustration with the bot.
const FRUSTRATION =
  /\b(useless|unhelpful|not\s+help(ing|ful)?|no\s+help|frustrat\w+|annoy\w+|ridiculous|terrible|awful|rubbish|nonsense|stupid\s+bot|dumb\s+bot|waste\s+of\s+(my\s+)?time|fed\s+up|sick\s+of\s+this)\b|you('?re|\s+are)\s+(not\s+)?(useless|no\s+help|not\s+help)|this\s+(is\s+)?(not\s+working|isn'?t\s+working|useless|ridiculous|pointless)|you\s+(don'?t|do\s+not)\s+understand/i;

// Normalise a message to a set of meaningful word tokens for similarity.
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

// Jaccard similarity between two token sets (intersection / union).
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

// Two messages this close are treated as "the same question asked again".
const REPEAT_SIMILARITY = 0.6;

/**
 * Decide whether this incoming message should be escalated to a human.
 *
 * @param text                  the member's current message
 * @param priorMemberMessages   that member's recent messages (any order),
 *                              used to spot a repeated, unresolved question
 * @returns the reason for escalation, or null to let the bot reply normally
 */
export function detectEscalation(
  text: string,
  priorMemberMessages: string[] = []
): EscalationReason | null {
  const t = text.trim();
  if (!t) return null;

  if (EXPLICIT.test(t)) return "explicit";
  if (FRUSTRATION.test(t)) return "frustration";

  // Repeated question: compare against earlier messages from the same member.
  // Require a couple of real words so trivial messages ("hi", "ok") don't count.
  const current = tokenize(t);
  if (current.size >= 2) {
    for (const prev of priorMemberMessages) {
      if (similarity(current, tokenize(prev)) >= REPEAT_SIMILARITY) {
        return "repeated";
      }
    }
  }

  return null;
}

// What we say back to the member when we hand off. Warm, and crucially makes
// clear a real person will follow up — so the conversation isn't a dead end.
export function escalationAcknowledgement(orgName: string): string {
  return `Thanks for reaching out — I've passed this on to the team at ${orgName}, and a real person will follow up with you right here as soon as they can. Hang tight! 🙏`;
}
