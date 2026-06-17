// Per-org analytics, computed from the conversations + escalations tables.
// Pure functions so the dashboard page can aggregate a bounded set of rows
// server-side. Everything degrades gracefully when data is sparse (early days).

import { classifyTopic } from "./intent";

// The app is Nigeria-focused, so bucket times in West Africa Time rather than
// the server's UTC — "busiest day/hour" should mean local time to the org.
const TZ = "Africa/Lagos";

export type ConversationRow = {
  member_wa_id: string | null;
  message_in: string | null;
  message_out: string | null;
  created_at: string;
};

export type EscalationRow = {
  member_wa_id: string;
  message: string | null;
  reason: string | null;
  created_at: string;
};

export type Counted = { label: string; count: number };

export type AttentionItem = {
  kind: "escalated" | "unanswered";
  memberWaId: string | null;
  message: string;
  // For escalations: why it was raised. For unanswered: omitted.
  note: string | null;
  time: string;
};

export type Analytics = {
  busiestDay: Counted | null;
  busiestHour: Counted | null;
  topTopics: Counted[];
  needsAttention: AttentionItem[];
};

// A bot reply that signals it couldn't answer from the org's info. English-only
// by design (the honest fallbacks are usually English); non-English misses are
// acceptable for an early signal.
const UNANSWERED =
  /\b(i (don'?t|do not) (have|know)|don'?t have that|couldn'?t find|i'?m not sure|no information|not able to (help|find)|don'?t have any)\b/i;

const DAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: TZ });
const HOUR_FMT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ });
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

// "14" -> "2pm", "0" -> "12am". Returns a one-hour range label.
function hourRange(hour: number): string {
  const fmt = (h: number) => {
    const am = h < 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${am ? "am" : "pm"}`;
  };
  return `${fmt(hour)}–${fmt((hour + 1) % 24)}`;
}

function topOf(map: Map<string, number>): Counted | null {
  let best: Counted | null = null;
  for (const [label, count] of map) {
    if (!best || count > best.count) best = { label, count };
  }
  return best;
}

export function computeAnalytics(
  conversations: ConversationRow[],
  escalations: EscalationRow[]
): Analytics {
  const byDay = new Map<string, number>();
  const byHour = new Map<number, number>();
  const byTopic = new Map<string, number>();
  const unanswered: (AttentionItem & { ts: number })[] = [];

  for (const c of conversations) {
    const when = new Date(c.created_at);

    byDay.set(DAY_FMT.format(when), (byDay.get(DAY_FMT.format(when)) ?? 0) + 1);
    const hour = Number(HOUR_FMT.format(when));
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);

    if (c.message_in) {
      const topic = classifyTopic(c.message_in);
      // Greetings and unclassifiable chatter aren't actionable "questions".
      if (topic !== "Greeting" && topic !== "Other") {
        byTopic.set(topic, (byTopic.get(topic) ?? 0) + 1);
      }
    }

    if (c.message_in && c.message_out && UNANSWERED.test(c.message_out)) {
      unanswered.push({
        kind: "unanswered",
        memberWaId: c.member_wa_id,
        message: c.message_in,
        note: null,
        time: TIME_FMT.format(when),
        ts: when.getTime(),
      });
    }
  }

  const escalated: (AttentionItem & { ts: number })[] = escalations.map((e) => ({
    kind: "escalated",
    memberWaId: e.member_wa_id,
    message: e.message ?? "(no message captured)",
    note: e.reason,
    time: TIME_FMT.format(new Date(e.created_at)),
    ts: new Date(e.created_at).getTime(),
  }));

  const busiestHour = (() => {
    const top = topOf(new Map([...byHour].map(([h, n]) => [String(h), n])));
    return top ? { label: hourRange(Number(top.label)), count: top.count } : null;
  })();

  const topTopics = [...byTopic]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Newest-first across both escalations and unanswered questions, by real
  // timestamp. Capped so the list stays scannable.
  const needsAttention: AttentionItem[] = [...escalated, ...unanswered]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20)
    .map(({ ts: _ts, ...rest }) => rest);

  return {
    busiestDay: topOf(byDay),
    busiestHour,
    topTopics,
    needsAttention,
  };
}
