// Lightweight intent detection that runs BEFORE the Claude call.
// For the most common, unambiguous questions (hours, location, contact) we can
// answer instantly and consistently straight from the org's stored fields —
// cheaper and faster than a model call, and never invents anything.
//
// Anything that doesn't clearly match falls through to Claude, which reasons
// over the full context and history.

export type IntentFields = {
  // Where the org keeps hours / schedule / service times.
  keyDetails?: string | null;
  // Catch-all for address + contact details in the current schema.
  contact?: string | null;
};

type Intent = {
  name: string;
  // A tight pattern: matching the wrong intent is worse than falling through
  // to Claude, so these err on the side of precision.
  test: RegExp;
  // Which stored field answers this intent.
  field: (f: IntentFields) => string | null | undefined;
};

const INTENTS: Intent[] = [
  {
    name: "hours",
    test: /(what time|how late|opening hours?|are you open|when (are|do|does) you|service times?|\bhours?\b|\bschedule\b|closing time)/i,
    field: (f) => f.keyDetails,
  },
  {
    name: "location",
    test: /(where (are|is|can|do)|your location|\baddress\b|directions?|how (do|can) i (get|find)|find you)/i,
    field: (f) => f.contact,
  },
  {
    name: "contact",
    test: /(contact (you|us|number|details)?|phone number|\bphone\b|\bemail\b|call you|reach you|get in touch)/i,
    field: (f) => f.contact,
  },
];

// Returns a ready-to-send reply when a clear intent matches AND the org has
// that field filled in. Returns null to defer to Claude (no match, message too
// long to be a simple question, or the org hasn't provided that detail — in
// which case Claude gives the honest "I don't have that" answer).
export function detectIntentReply(message: string, fields: IntentFields): string | null {
  const text = message.trim();
  if (!text || text.length > 120) return null;

  for (const intent of INTENTS) {
    if (intent.test.test(text)) {
      const value = intent.field(fields)?.trim();
      return value ? value : null;
    }
  }
  return null;
}
