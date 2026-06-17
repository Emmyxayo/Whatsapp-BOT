import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as db } from "@/lib/supabase";
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
    .select("label, body, key_details, contact")
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

  return (
    <DashboardClient
      orgName={organization?.name ?? "Your organization"}
      whatsappNumber={organization?.whatsapp_display_number ?? null}
      info={{
        label: latest?.label ?? "",
        body: latest?.body ?? "",
        key_details: latest?.key_details ?? "",
        contact: latest?.contact ?? "",
      }}
      faqs={faqs ?? []}
      escalations={escalations}
      usage={{ thisMonth: totalThisMonth ?? 0, allTime: totalAllTime ?? 0 }}
    />
  );
}
