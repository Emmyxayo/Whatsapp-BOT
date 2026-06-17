// Lightweight intent detection that runs BEFORE the Claude call.
// For the most common, unambiguous questions (hours, location, contact, giving,
// events) we can answer instantly and consistently straight from the org's
// structured fields — cheaper and faster than a model call, and never invents
// anything.
//
// Anything that doesn't clearly match falls through to Claude, which reasons
// over the full context and history.

export type IntentFields = {
  hours?: string | null;       // hours / schedule / service times
  location?: string | null;    // address / directions
  contact?: string | null;     // phone / email / who to reach
  giving?: string | null;      // giving / payment / donations / fees
  events?: string | null;      // upcoming events
};

type Intent = {
  name: string;
  // A tight pattern: matching the wrong intent is worse than falling through
  // to Claude, so these err on the side of precision.
  test: RegExp;
  // Which stored field answers this intent.
  field: (f: IntentFields) => string | null | undefined;
  // A short lead-in so the reply names the area it relates to. Kept natural.
  prefix: string;
};

const INTENTS: Intent[] = [
  {
    name: "hours",
    test: /(what time|how late|opening hours?|are you open|when (are|do|does) you|service times?|\bhours?\b|\bschedule\b|closing time)/i,
    field: (f) => f.hours,
    prefix: "Our hours:",
  },
  {
    name: "location",
    test: /(where (are|is|can|do)|your location|\baddress\b|directions?|how (do|can) i (get|find)|find you)/i,
    field: (f) => f.location,
    prefix: "Here's where to find us:",
  },
  {
    name: "giving",
    test: /(how (do|can) i (give|pay|donate)|\b(giving|donate|donation|tithe|offering)\b|account (number|details)|bank (details|transfer)|payment (details|method)|how much (is|are|does)|\bfees?\b|\bprice\b)/i,
    field: (f) => f.giving,
    prefix: "For giving/payment:",
  },
  {
    name: "events",
    test: /(upcoming events?|any events?|what'?s (happening|coming up|on)|programme|program|next (event|service|meeting))/i,
    field: (f) => f.events,
    prefix: "Coming up:",
  },
  {
    name: "contact",
    test: /(contact (you|us|number|details)?|phone number|\bphone\b|\bemail\b|call you|reach you|get in touch)/i,
    field: (f) => f.contact,
    prefix: "Here's how to reach us:",
  },
];

// The fast-path replies in English (org info is usually stored in English, and
// the lead-ins above are English). When the member is clearly NOT writing in
// plain English, we skip it and let Claude handle the message — Claude detects
// the language and translates the org's info into it. Triggers on any non-ASCII
// letter (Yoruba/Igbo diacritics) or distinctive Pidgin/Yoruba/Hausa/Igbo words.
const NON_ENGLISH_DIACRITICS = /[^\x00-\x7F]/;
const NON_ENGLISH_WORDS =
  /\b(abeg|wetin|una|dey|sabi|wahala|abi|oga|comot|nawa|haba|biko|kedu|ndewo|ndo|gini|nnoo|sannu|yaya|nawao|jowo|bawo|ekaaro|ekaasan|barka|kana|ina)\b/i;

function looksNonEnglish(text: string): boolean {
  return NON_ENGLISH_DIACRITICS.test(text) || NON_ENGLISH_WORDS.test(text);
}

// Returns a ready-to-send reply when a clear intent matches AND the org has
// that field filled in. The reply names the area it relates to (e.g. "Our
// hours:") so members get context, consistent with how Claude replies.
// Returns null to defer to Claude (no match, message too long to be a simple
// question, the message isn't plain English, or the org hasn't provided that
// detail — in which case Claude gives the honest "I don't have that" answer).
export function detectIntentReply(message: string, fields: IntentFields): string | null {
  const text = message.trim();
  if (!text || text.length > 120) return null;
  if (looksNonEnglish(text)) return null;

  for (const intent of INTENTS) {
    if (intent.test.test(text)) {
      const value = intent.field(fields)?.trim();
      return value ? `${intent.prefix}\n${value}` : null;
    }
  }
  return null;
}
