"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  MessagesSquare,
  ShieldCheck,
  LogOut,
  Building2,
  MessageSquare,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { onboardOrg, updateOrg, deleteOrg, type ActionState } from "./actions";
import styles from "./admin.module.css";

type Org = {
  id: string;
  name: string;
  regionName: string | null;
  createdAt: string;
  subscriptionStatus: string;
  whatsappPhoneNumberId: string;
  hasLogin: boolean;
  allTime: number;
  thisMonth: number;
};

const EMPTY: ActionState = { ok: false };
const STATUSES = ["trial", "active", "past_due", "cancelled"];

const fmtNum = new Intl.NumberFormat();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminClient({
  orgs,
  regionNames,
}: {
  orgs: Org[];
  regionNames: string[];
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState<Org | "new" | null>(null);

  async function signOut() {
    setSigningOut(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const totalConvos = orgs.reduce((s, o) => s + o.allTime, 0);
  const monthConvos = orgs.reduce((s, o) => s + o.thisMonth, 0);

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
        <span className={styles.ownerBadge}>
          <ShieldCheck size={14} strokeWidth={2.5} />
          Owner
        </span>
        <button className={styles.signout} onClick={signOut} disabled={signingOut}>
          <LogOut size={16} strokeWidth={2.25} />
          <span className={styles.signoutLabel}>{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      </header>

      <main className={styles.content}>
        {/* ---- Summary ---- */}
        <div className={styles.summaryGrid}>
          <SummaryCard icon={Building2} value={fmtNum.format(orgs.length)} label="Organizations" />
          <SummaryCard
            icon={CalendarDays}
            value={fmtNum.format(monthConvos)}
            label="Conversations this month"
            tone="teal"
          />
          <SummaryCard
            icon={MessageSquare}
            value={fmtNum.format(totalConvos)}
            label="Conversations all-time"
            tone="coral"
          />
        </div>

        {/* ---- Header ---- */}
        <div className={styles.headRow}>
          <div>
            <h1 className={styles.h1}>Organizations</h1>
            <p className={styles.sub}>Manage every organization on Relay.</p>
          </div>
          <button className={styles.primary} onClick={() => setEditing("new")}>
            <Plus size={17} strokeWidth={2.5} />
            Onboard organization
          </button>
        </div>

        {/* ---- List ---- */}
        {orgs.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Building2 size={26} strokeWidth={2} />
            </span>
            <h3 className={styles.emptyTitle}>No organizations yet</h3>
            <p className={styles.emptyText}>Onboard your first organization to get started.</p>
            <button className={styles.primary} onClick={() => setEditing("new")}>
              <Plus size={17} strokeWidth={2.5} />
              Onboard organization
            </button>
          </div>
        ) : (
          <div className={styles.orgGrid}>
            {orgs.map((org) => (
              <OrgCard key={org.id} org={org} onEdit={() => setEditing(org)} />
            ))}
          </div>
        )}
      </main>

      {editing && (
        <OrgModal
          org={editing === "new" ? null : editing}
          regionNames={regionNames}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ---------------- Pieces ---------------- */

function SummaryCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Building2;
  value: string;
  label: string;
  tone?: "teal" | "coral";
}) {
  return (
    <div className={styles.summaryCard}>
      <span
        className={`${styles.statIcon} ${tone === "coral" ? styles.statIconCoral : ""}`.trim()}
      >
        <Icon size={20} strokeWidth={2.1} />
      </span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active"
      ? styles.badgeActive
      : status === "past_due"
        ? styles.badgePastDue
        : status === "cancelled"
          ? styles.badgeCancelled
          : styles.badgeTrial;
  const label = status === "past_due" ? "past due" : status;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primary} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function OrgCard({ org, onEdit }: { org: Org; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className={styles.orgCard}>
      <div className={styles.orgTop}>
        <div className={styles.orgTitleWrap}>
          <h3 className={styles.orgName}>{org.name}</h3>
          <div className={styles.orgMeta}>
            <span className={styles.metaItem}>
              <MapPin size={13} strokeWidth={2.25} />
              {org.regionName ?? "No region"}
            </span>
            <span className={styles.metaItem}>
              <CalendarDays size={13} strokeWidth={2.25} />
              {fmtDate(org.createdAt)}
            </span>
          </div>
        </div>
        <StatusBadge status={org.subscriptionStatus} />
      </div>

      <div className={styles.orgStats}>
        <div className={styles.orgStat}>
          <span className={styles.orgStatValue}>{fmtNum.format(org.thisMonth)}</span>
          <span className={styles.orgStatLabel}>This month</span>
        </div>
        <div className={styles.orgStat}>
          <span className={styles.orgStatValue}>{fmtNum.format(org.allTime)}</span>
          <span className={styles.orgStatLabel}>All-time</span>
        </div>
      </div>

      <code className={styles.phoneId} title="WhatsApp phone_number_id">
        {org.whatsappPhoneNumberId || "—"}
      </code>

      {confirming ? (
        <DeleteConfirm org={org} onCancel={() => setConfirming(false)} />
      ) : (
        <div className={styles.orgActions}>
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
        </div>
      )}
    </article>
  );
}

function DeleteConfirm({ org, onCancel }: { org: Org; onCancel: () => void }) {
  const [state, action] = useFormState(deleteOrg, EMPTY);

  return (
    <form action={action} className={styles.confirmBox}>
      <input type="hidden" name="id" value={org.id} />
      <p className={styles.confirmWarn}>
        <AlertTriangle size={15} strokeWidth={2.5} />
        Permanently delete <strong>{org.name}</strong>?
      </p>
      <p className={styles.confirmDetail}>
        This deletes its login and all its data — info, FAQs, and conversations. This cannot be
        undone.
      </p>
      {state.error && <p className={styles.formError}>{state.error}</p>}
      <div className={styles.confirmActions}>
        <button type="button" className={styles.ghostBtn} onClick={onCancel}>
          Cancel
        </button>
        <DeleteButton />
      </div>
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.dangerBtn} disabled={pending}>
      {pending ? "Deleting…" : "Delete permanently"}
    </button>
  );
}

function OrgModal({
  org,
  regionNames,
  onClose,
}: {
  org: Org | null;
  regionNames: string[];
  onClose: () => void;
}) {
  const isEdit = org !== null;
  const [state, action] = useFormState(isEdit ? updateOrg : onboardOrg, EMPTY);
  const lastTs = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.ok && state.ts && state.ts !== lastTs.current) {
      lastTs.current = state.ts;
      onClose();
    }
  }, [state.ok, state.ts, onClose]);

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
        aria-label={isEdit ? "Edit organization" : "Onboard organization"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>
            {isEdit ? "Edit organization" : "Onboard organization"}
          </h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <form action={action} className={styles.modalForm}>
          {isEdit && <input type="hidden" name="id" value={org.id} />}

          <datalist id="region-options">
            {regionNames.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="org-name">
              Organization name
            </label>
            <input
              id="org-name"
              name="name"
              className={styles.input}
              defaultValue={org?.name ?? ""}
              placeholder="Acme Fitness"
              autoFocus
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="org-region">
              Region <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="org-region"
              name="region"
              className={styles.input}
              defaultValue={org?.regionName ?? ""}
              list="region-options"
              placeholder="Lagos Region 1"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="org-phone">
              WhatsApp phone number ID{" "}
              {!isEdit && <span className={styles.optional}>(placeholder ok for now)</span>}
            </label>
            <input
              id="org-phone"
              name="whatsapp_phone_number_id"
              className={styles.input}
              defaultValue={org?.whatsappPhoneNumberId ?? ""}
              placeholder="From Meta — leave blank to use a placeholder"
              required={isEdit}
            />
          </div>

          {isEdit ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="org-status">
                Subscription status
              </label>
              <select
                id="org-status"
                name="subscription_status"
                className={styles.input}
                defaultValue={org.subscriptionStatus}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "past_due" ? "Past due" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="org-username">
                    Login username
                  </label>
                  <input
                    id="org-username"
                    name="username"
                    className={styles.input}
                    autoCapitalize="none"
                    placeholder="acme-fitness"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="org-password">
                    Password
                  </label>
                  <input
                    id="org-password"
                    name="password"
                    type="text"
                    className={styles.input}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
              </div>
              <p className={styles.hint}>
                They&apos;ll sign in with this username and password. Login email is{" "}
                <code>username@org.local</code>.
              </p>
            </>
          )}

          {state.error && <p className={styles.formError}>{state.error}</p>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.ghostBtn} onClick={onClose}>
              Cancel
            </button>
            <SubmitButton
              label={isEdit ? "Save changes" : "Onboard organization"}
              pendingLabel="Saving…"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
