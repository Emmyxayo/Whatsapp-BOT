import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as db } from "@/lib/supabase";
import { computeAnalytics } from "@/lib/analytics";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Authenticate the logged-in user with the anon-key SSR client (reads the
  // session cookie), then resolve which organization they belong to.
  const authClient = createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const organizationId = user?.user_metadata?.organization_id as string | undefined;

  // Data reads use the service-role client so they bypass RLS. SECURITY: every
  // query is explicitly scoped to the authenticated user's organizationId, so
  // we never expose another tenant's data.
  const { data: organization } = await db
    .from("organizations")
    .select("name, whatsapp_display_number")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: latest } = await db
    .from("org_updates")
    .select("about, hours, location, announcements, contact, giving, events")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: faqs } = await db
    .from("faqs")
    .select("id, question, answer")
    .eq("organization_id", organizationId)
    .order("question", { ascending: true });

  // Usage — counts only, no rows pulled. Safe to show 0 before any data exists.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: totalAllTime } = await db
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: totalThisMonth } = await db
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", monthStart.toISOString());

  // Open human-handoff requests, newest first. Times are formatted here on the
  // server so the client renders a stable string (no hydration mismatch).
  const { data: escalationRows } = await db
    .from("escalations")
    .select("id, member_wa_id, message, reason, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const fmtTime = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const escalations = (escalationRows ?? []).map((e) => ({
    id: e.id as string,
    memberWaId: e.member_wa_id as string,
    message: (e.message ?? "") as string,
    reason: (e.reason ?? "") as string,
    time: fmtTime.format(new Date(e.created_at as string)),
  }));

  // Analytics — pull a bounded recent slice of rows (last 90 days, capped) and
  // aggregate in memory. Bounded so the dashboard stays fast as data grows.
  const analyticsSince = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: convRows }, { data: escRows }] = await Promise.all([
    db
      .from("conversations")
      .select("member_wa_id, message_in, message_out, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", analyticsSince)
      .order("created_at", { ascending: false })
      .limit(3000),
    db
      .from("escalations")
      .select("member_wa_id, message, reason, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", analyticsSince)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const analytics = computeAnalytics(convRows ?? [], escRows ?? []);

  return (
    <DashboardClient
      orgName={organization?.name ?? "Your organization"}
      whatsappNumber={organization?.whatsapp_display_number ?? null}
      info={{
        about: latest?.about ?? "",
        hours: latest?.hours ?? "",
        location: latest?.location ?? "",
        announcements: latest?.announcements ?? "",
        contact: latest?.contact ?? "",
        giving: latest?.giving ?? "",
        events: latest?.events ?? "",
      }}
      faqs={faqs ?? []}
      escalations={escalations}
      analytics={{
        thisMonth: totalThisMonth ?? 0,
        allTime: totalAllTime ?? 0,
        ...analytics,
      }}
    />
  );
}
