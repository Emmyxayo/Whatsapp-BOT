"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  MessagesSquare,
  Info,
  MessageCircleQuestion,
  Share2,
  BarChart3,
  LogOut,
  Check,
  Plus,
  Pencil,
  Trash2,
  Copy,
  X,
  CalendarDays,
  Infinity as InfinityIcon,
  LifeBuoy,
  User,
  Clock,
  MapPin,
  Megaphone,
  Phone,
  HandCoins,
  FileText,
  Sparkles,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  saveOrgUpdate,
  createFaq,
  updateFaq,
  deleteFaq,
  resolveEscalation,
  type ActionState,
} from "./actions";
import { ORG_TEMPLATES, type OrgKnowledge } from "@/lib/templates";
import styles from "./dashboard.module.css";

type Faq = { id: string; question: string; answer: string };
type Escalation = {
  id: string;
  memberWaId: string;
  message: string;
  reason: string;
  time: string;
};
type Counted = { label: string; count: number };
type AttentionItem = {
  kind: "escalated" | "unanswered";
  memberWaId: string | null;
  message: string;
  note: string | null;
  time: string;
};
type Analytics = {
  thisMonth: number;
  allTime: number;
  busiestDay: Counted | null;
  busiestHour: Counted | null;
  topTopics: Counted[];
  needsAttention: AttentionItem[];
};
type OrgInfo = OrgKnowledge;
type Tab = "info" | "faqs" | "handoffs" | "share" | "analytics";

const EMPTY: ActionState = { ok: false };

const NAV: { id: Tab; label: string; icon: typeof Info }[] = [
  { id: "info", label: "Info", icon: Info },
  { id: "faqs", label: "FAQs", icon: MessageCircleQuestion },
  { id: "handoffs", label: "Handoffs", icon: LifeBuoy },
  { id: "share", label: "Share", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

// Friendly label for why a handoff was raised.
const REASON_LABEL: Record<string, string> = {
  explicit: "Asked for a person",
  frustration: "Sounded frustrated",
  repeated: "Repeated question",
};

export default function DashboardClient({
  orgName,
  whatsappNumber,
  info,
  faqs,
  escalations,
  analytics,
}: {
  orgName: string;
  whatsappNumber: string | null;
  info: OrgInfo;
  faqs: Faq[];
  escalations: Escalation[];
  analytics: Analytics;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      {/* ---- Top bar ---- */}
      <header className={styles.topbar}>
        <span className={styles.brand}>
          <span className={styles.brandMark}>
            <MessagesSquare size={18} strokeWidth={2.25} />
          </span>
          Relay
        </span>
        <span className={styles.orgName} title={orgName}>
          {orgName}
        </span>
        <button className={styles.signout} onClick={signOut} disabled={signingOut}>
          <LogOut size={16} strokeWidth={2.25} />
          <span className={styles.signoutLabel}>{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      </header>

      <div className={styles.body}>
        {/* ---- Sidebar (desktop) / bottom nav (mobile) ---- */}
        <nav className={styles.nav} aria-label="Dashboard sections">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${tab === id ? styles.navItemActive : ""}`}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={2.1} />
              <span>{label}</span>
              {id === "handoffs" && escalations.length > 0 && (
                <span className={styles.navBadge}>{escalations.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ---- Content ---- */}
        <main className={styles.content}>
          {tab === "info" && <InfoSection info={info} />}
          {tab === "faqs" && <FaqsSection faqs={faqs} />}
          {tab === "handoffs" && <HandoffsSection escalations={escalations} />}
          {tab === "share" && <ShareSection whatsappNumber={whatsappNumber} />}
          {tab === "analytics" && <AnalyticsSection analytics={analytics} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={styles.head}>
      <h1 className={styles.h1}>{title}</h1>
      <p className={styles.sub}>{sub}</p>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primary} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/* ---------------- Section 1: Info ---------------- */

// Each knowledge area the assistant reads from. Ordered the way an org tends to
// think about itself, with a clear label, helper text and the right input shape.
const INFO_FIELDS: {
  key: keyof OrgKnowledge;
  label: string;
  hint: string;
  icon: typeof Info;
  rows: number;
  placeholder: string;
}[] = [
  {
    key: "about",
    label: "About",
    hint: "A general intro, and anything that doesn't fit the other areas.",
    icon: FileText,
    rows: 3,
    placeholder: "Who you are, in a sentence or two…",
  },
  {
    key: "hours",
    label: "Hours & schedule",
    hint: "Opening times, service times, term dates.",
    icon: Clock,
    rows: 3,
    placeholder: "Mon–Fri 9am–5pm\nSunday service 10am",
  },
  {
    key: "location",
    label: "Location & directions",
    hint: "Address, how to find you, parking, landmarks.",
    icon: MapPin,
    rows: 3,
    placeholder: "123 Main Street, City. Near the market.",
  },
  {
    key: "announcements",
    label: "This week / announcements",
    hint: "Current news and notices. Update this often.",
    icon: Megaphone,
    rows: 4,
    placeholder: "What's new this week, special notices…",
  },
  {
    key: "contact",
    label: "Contact",
    hint: "Phone, email, who to reach.",
    icon: Phone,
    rows: 3,
    placeholder: "Phone: …\nEmail: …",
  },
  {
    key: "giving",
    label: "Giving / payments",
    hint: "Giving, donations, fees, account or payment details.",
    icon: HandCoins,
    rows: 4,
    placeholder: "Bank, account name & number, payment methods…",
  },
  {
    key: "events",
    label: "Upcoming events",
    hint: "Dates and what's coming up.",
    icon: CalendarDays,
    rows: 3,
    placeholder: "- 12 Jul — Open day\n- 20 Jul — Workshop",
  },
];

function InfoSection({ info }: { info: OrgInfo }) {
  const [state, action] = useFormState(saveOrgUpdate, EMPTY);
  const [saved, setSaved] = useState(false);

  // Controlled so the template picker can fill every field at once. Seeded from
  // the org's saved values.
  const [values, setValues] = useState<OrgKnowledge>(info);
  const setField = (key: keyof OrgKnowledge, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  useEffect(() => {
    if (state.ok && state.ts) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3200);
      return () => clearTimeout(t);
    }
  }, [state.ok, state.ts]);

  return (
    <section>
      <SectionHead
        title="Your information"
        sub="This is what members get back when they text your assistant. Each area is answered separately — keep them current."
      />

      <TemplatePicker onApply={(fields) => setValues(fields)} hasContent={Object.values(values).some((v) => v.trim())} />

      <form action={action} className={styles.card}>
        {INFO_FIELDS.map(({ key, label, hint, icon: Icon, rows, placeholder }) => (
          <div className={styles.field} key={key}>
            <label className={styles.fieldLabel} htmlFor={key}>
              <span className={styles.fieldIcon}>
                <Icon size={15} strokeWidth={2.25} />
              </span>
              {label}
            </label>
            <p className={styles.fieldHint}>{hint}</p>
            <textarea
              id={key}
              name={key}
              className={styles.textarea}
              value={values[key]}
              onChange={(e) => setField(key, e.target.value)}
              rows={rows}
              placeholder={placeholder}
            />
          </div>
        ))}

        {state.error && <p className={styles.formError}>{state.error}</p>}

        <div className={styles.formFooter}>
          <SubmitButton label="Save" pendingLabel="Saving…" />
          {saved && (
            <span className={styles.savedNote} role="status">
              <Check size={15} strokeWidth={2.5} />
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// Pre-built starting points per vertical. Applying one fills the form fields
// (which the admin then edits) so a new org is useful fast. Confirms first when
// there's already content, so a click never wipes real data by surprise.
function TemplatePicker({
  onApply,
  hasContent,
}: {
  onApply: (fields: OrgKnowledge) => void;
  hasContent: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);

  function choose(templateId: string) {
    const template = ORG_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    if (hasContent && pending !== templateId) {
      setPending(templateId); // ask for a second click to confirm overwrite
      return;
    }
    onApply(template.fields);
    setPending(null);
  }

  return (
    <div className={styles.templateBar}>
      <span className={styles.templateLead}>
        <Sparkles size={15} strokeWidth={2.25} />
        Start from a template
      </span>
      <div className={styles.templateRow}>
        {ORG_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.templateBtn} ${pending === t.id ? styles.templateBtnConfirm : ""}`}
            onClick={() => choose(t.id)}
            title={t.blurb}
          >
            {pending === t.id ? "Replace current?" : t.label}
          </button>
        ))}
      </div>
      {pending && (
        <button type="button" className={styles.templateCancel} onClick={() => setPending(null)}>
          Cancel
        </button>
      )}
    </div>
  );
}

/* ---------------- Section 2: FAQs ---------------- */

function FaqsSection({ faqs }: { faqs: Faq[] }) {
  const [editing, setEditing] = useState<Faq | "new" | null>(null);

  return (
    <section>
      <div className={styles.headRow}>
        <SectionHead
          title="FAQs"
          sub="Question-and-answer pairs your assistant uses to reply accurately."
        />
        <button className={styles.primary} onClick={() => setEditing("new")}>
          <Plus size={17} strokeWidth={2.5} />
          Add FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <MessageCircleQuestion size={26} strokeWidth={2} />
          </span>
          <h3 className={styles.emptyTitle}>No FAQs yet</h3>
          <p className={styles.emptyText}>
            Add your first question and answer so your assistant can reply instantly.
          </p>
          <button className={styles.primary} onClick={() => setEditing("new")}>
            <Plus size={17} strokeWidth={2.5} />
            Add your first FAQ
          </button>
        </div>
      ) : (
        <div className={styles.faqGrid}>
          {faqs.map((faq) => (
            <FaqCard key={faq.id} faq={faq} onEdit={() => setEditing(faq)} />
          ))}
        </div>
      )}

      {editing && (
        <FaqModal
          faq={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function FaqCard({ faq, onEdit }: { faq: Faq; onEdit: () => void }) {
  const [state, action] = useFormState(deleteFaq, EMPTY);
  const [confirming, setConfirming] = useState(false);

  return (
    <article className={styles.faqCard}>
      <h3 className={styles.faqQuestion}>{faq.question}</h3>
      <p className={styles.faqAnswer}>{faq.answer}</p>

      {state.error && <p className={styles.formError}>{state.error}</p>}

      <div className={styles.faqActions}>
        {confirming ? (
          <form action={action} className={styles.confirmRow}>
            <input type="hidden" name="id" value={faq.id} />
            <span className={styles.confirmText}>Delete this FAQ?</span>
            <ConfirmDeleteButton />
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <button className={styles.iconBtn} onClick={onEdit}>
              <Pencil size={15} strokeWidth={2.25} />
              Edit
            </button>
            <button
              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={15} strokeWidth={2.25} />
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.dangerBtn} disabled={pending}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function FaqModal({ faq, onClose }: { faq: Faq | null; onClose: () => void }) {
  const isEdit = faq !== null;
  const [state, action] = useFormState(isEdit ? updateFaq : createFaq, EMPTY);
  const lastTs = useRef<number | undefined>(undefined);

  // Close once the action reports a fresh success.
  useEffect(() => {
    if (state.ok && state.ts && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      onClose();
    }
  }, [state.ok, state.ts, onClose]);

  // Escape to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit FAQ" : "Add FAQ"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{isEdit ? "Edit FAQ" : "Add FAQ"}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <form action={action} className={styles.modalForm}>
          {isEdit && <input type="hidden" name="id" value={faq.id} />}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="faq-q">
              Question
            </label>
            <input
              id="faq-q"
              name="question"
              className={styles.input}
              defaultValue={faq?.question ?? ""}
              placeholder="What time do you open?"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="faq-a">
              Answer
            </label>
            <textarea
              id="faq-a"
              name="answer"
              className={styles.textarea}
              defaultValue={faq?.answer ?? ""}
              rows={4}
              placeholder="We're open Monday to Friday, 9am to 5pm."
              required
            />
          </div>

          {state.error && <p className={styles.formError}>{state.error}</p>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.ghostBtn} onClick={onClose}>
              Cancel
            </button>
            <SubmitButton
              label={isEdit ? "Save changes" : "Add FAQ"}
              pendingLabel="Saving…"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Section 3: Handoffs ---------------- */

function HandoffsSection({ escalations }: { escalations: Escalation[] }) {
  return (
    <section>
      <SectionHead
        title="Handoffs"
        sub="People your assistant flagged for a human. The member's been told you'll follow up — reply to them on WhatsApp, then mark it resolved."
      />

      {escalations.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <LifeBuoy size={26} strokeWidth={2} />
          </span>
          <h3 className={styles.emptyTitle}>No one’s waiting</h3>
          <p className={styles.emptyText}>
            When a member asks for a person, sounds stuck, or repeats a question, it’ll show up
            here so you can step in.
          </p>
        </div>
      ) : (
        <div className={styles.faqGrid}>
          {escalations.map((esc) => (
            <EscalationCard key={esc.id} esc={esc} />
          ))}
        </div>
      )}
    </section>
  );
}

function EscalationCard({ esc }: { esc: Escalation }) {
  const [state, action] = useFormState(resolveEscalation, EMPTY);
  const waLink = `https://wa.me/${esc.memberWaId.replace(/\D/g, "")}`;

  return (
    <article className={styles.faqCard}>
      <div className={styles.escMeta}>
        <span className={styles.escWho}>
          <User size={15} strokeWidth={2.25} />
          <a className={styles.escNumber} href={waLink} target="_blank" rel="noreferrer">
            {esc.memberWaId}
          </a>
        </span>
        {esc.reason && (
          <span className={styles.escReason}>{REASON_LABEL[esc.reason] ?? esc.reason}</span>
        )}
      </div>

      <p className={styles.faqAnswer}>{esc.message || "(no message captured)"}</p>

      <div className={styles.faqActions}>
        <span className={styles.escTime}>
          <Clock size={14} strokeWidth={2.25} />
          {esc.time}
        </span>
        {state.error && <span className={styles.formError}>{state.error}</span>}
        <form action={action} className={styles.escResolveForm}>
          <input type="hidden" name="id" value={esc.id} />
          <ResolveButton />
        </form>
      </div>
    </article>
  );
}

function ResolveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.iconBtn} disabled={pending}>
      <Check size={15} strokeWidth={2.5} />
      {pending ? "Resolving…" : "Mark resolved"}
    </button>
  );
}

/* ---------------- Section 4: Share ---------------- */

function ShareSection({ whatsappNumber }: { whatsappNumber: string | null }) {
  const digits = (whatsappNumber ?? "").replace(/\D/g, "");
  const isPlaceholder = digits.length === 0;
  const number = isPlaceholder ? "0000000000" : digits;
  const link = `https://wa.me/${number}?text=hi`;

  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section>
      <SectionHead
        title="Share your assistant"
        sub="Print this or share it so members can reach your assistant on WhatsApp."
      />

      <div className={styles.shareGrid}>
        <div className={styles.card}>
          <span className={styles.label}>Click-to-chat link</span>
          <div className={styles.linkRow}>
            <code className={styles.link}>{link}</code>
            <button className={styles.copyBtn} onClick={copy}>
              {copied ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={15} strokeWidth={2.25} />
                  Copy
                </>
              )}
            </button>
          </div>
          {isPlaceholder && (
            <p className={styles.hint}>
              This is a placeholder number — your real WhatsApp number will appear here once it&apos;s
              set up.
            </p>
          )}
        </div>

        <div className={`${styles.card} ${styles.qrCard}`}>
          <div className={styles.qrFrame}>
            <QRCodeSVG value={link} size={168} level="M" fgColor="#0f1b2d" bgColor="#ffffff" />
          </div>
          <p className={styles.qrCaption}>Scan to start a chat</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Section 5: Analytics ---------------- */

const ATTENTION_REASON: Record<string, string> = REASON_LABEL;

function AnalyticsSection({ analytics }: { analytics: Analytics }) {
  const fmt = new Intl.NumberFormat();
  const maxTopic = Math.max(1, ...analytics.topTopics.map((t) => t.count));

  return (
    <section>
      <SectionHead
        title="Analytics"
        sub="How members are using your assistant, and what to improve. Some figures fill in as you get more messages."
      />

      {/* Headline figures */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <CalendarDays size={20} strokeWidth={2.1} />
          </span>
          <span className={styles.statValue}>{fmt.format(analytics.thisMonth)}</span>
          <span className={styles.statLabel}>Conversations this month</span>
        </div>

        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statIconCoral}`}>
            <InfinityIcon size={20} strokeWidth={2.1} />
          </span>
          <span className={styles.statValue}>{fmt.format(analytics.allTime)}</span>
          <span className={styles.statLabel}>Conversations all-time</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <CalendarClock size={20} strokeWidth={2.1} />
          </span>
          <span className={styles.statValue}>{analytics.busiestDay?.label ?? "—"}</span>
          <span className={styles.statLabel}>
            {analytics.busiestDay
              ? `Busiest day (${fmt.format(analytics.busiestDay.count)})`
              : "Busiest day"}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.statIconCoral}`}>
            <Clock size={20} strokeWidth={2.1} />
          </span>
          <span className={styles.statValue}>{analytics.busiestHour?.label ?? "—"}</span>
          <span className={styles.statLabel}>
            {analytics.busiestHour
              ? `Busiest time (${fmt.format(analytics.busiestHour.count)})`
              : "Busiest time"}
          </span>
        </div>
      </div>

      {/* What members ask about */}
      <div className={styles.analyticsBlock}>
        <h2 className={styles.blockTitle}>
          <TrendingUp size={17} strokeWidth={2.25} />
          What members ask about
        </h2>
        {analytics.topTopics.length === 0 ? (
          <p className={styles.blockEmpty}>
            No clear topics yet — this fills in as members ask about hours, location, giving and
            more.
          </p>
        ) : (
          <div className={styles.card}>
            {analytics.topTopics.map((t) => (
              <div className={styles.topicRow} key={t.label}>
                <span className={styles.topicLabel}>{t.label}</span>
                <span className={styles.topicBarTrack}>
                  <span
                    className={styles.topicBarFill}
                    style={{ width: `${Math.round((t.count / maxTopic) * 100)}%` }}
                  />
                </span>
                <span className={styles.topicCount}>{fmt.format(t.count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Needs attention: unanswered + escalated */}
      <div className={styles.analyticsBlock}>
        <h2 className={styles.blockTitle}>
          <AlertTriangle size={17} strokeWidth={2.25} />
          Needs attention
        </h2>
        {analytics.needsAttention.length === 0 ? (
          <p className={styles.blockEmpty}>
            Nothing flagged. Questions the assistant couldn’t answer, and anyone it handed off,
            will appear here so you know what to improve.
          </p>
        ) : (
          <div className={styles.attentionList}>
            {analytics.needsAttention.map((item, i) => (
              <article className={styles.attentionItem} key={i}>
                <span
                  className={`${styles.attentionTag} ${
                    item.kind === "escalated" ? styles.tagEscalated : styles.tagUnanswered
                  }`}
                >
                  {item.kind === "escalated" ? (
                    <LifeBuoy size={13} strokeWidth={2.25} />
                  ) : (
                    <HelpCircle size={13} strokeWidth={2.25} />
                  )}
                  {item.kind === "escalated"
                    ? ATTENTION_REASON[item.note ?? ""] ?? "Handed off"
                    : "Couldn’t answer"}
                </span>
                <p className={styles.attentionMsg}>{item.message}</p>
                <span className={styles.attentionMeta}>
                  {item.memberWaId && <span className={styles.attentionWho}>{item.memberWaId}</span>}
                  <span className={styles.escTime}>
                    <Clock size={13} strokeWidth={2.25} />
                    {item.time}
                  </span>
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
