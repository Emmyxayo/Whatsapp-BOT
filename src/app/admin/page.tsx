import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as db } from "@/lib/supabase";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Defense in depth: middleware guards /admin, but re-check here too.
  const authClient = createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (user?.user_metadata?.is_superadmin !== true) redirect("/login");

  // Service-role client — this panel intentionally spans every organization.
  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, region_id, created_at, subscription_status, whatsapp_phone_number_id, auth_user_id")
    .order("created_at", { ascending: false });

  const { data: regions } = await db.from("regions").select("id, name");
  const regionMap = new Map((regions ?? []).map((r) => [r.id as string, r.name as string]));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();

  // Per-org conversation counts (total + this month), fetched in parallel.
  const withStats = await Promise.all(
    (orgs ?? []).map(async (o) => {
      const [{ count: allTime }, { count: thisMonth }] = await Promise.all([
        db.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", o.id),
        db
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", o.id)
          .gte("created_at", monthIso),
      ]);
      return {
        id: o.id as string,
        name: o.name as string,
        regionName: o.region_id ? regionMap.get(o.region_id as string) ?? null : null,
        createdAt: o.created_at as string,
        subscriptionStatus: (o.subscription_status as string) ?? "trial",
        whatsappPhoneNumberId: (o.whatsapp_phone_number_id as string) ?? "",
        hasLogin: Boolean(o.auth_user_id),
        allTime: allTime ?? 0,
        thisMonth: thisMonth ?? 0,
      };
    })
  );

  const regionNames = (regions ?? []).map((r) => r.name as string).sort();

  return <AdminClient orgs={withStats} regionNames={regionNames} />;
}
