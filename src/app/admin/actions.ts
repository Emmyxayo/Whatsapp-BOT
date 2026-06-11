"use server";

import { randomUUID } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as db } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ActionState = { ok: boolean; error?: string; ts?: number };

const SUBSCRIPTION_STATUSES = ["trial", "active", "past_due", "cancelled"] as const;

// Re-checks the caller on EVERY action — never trust the page alone. Returns the
// service-role client (this panel spans all orgs) only when the caller is a
// superadmin; otherwise isSuper is false and the action must refuse.
async function requireSuperadmin() {
  const authClient = createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const isSuper = user?.user_metadata?.is_superadmin === true;
  return { db, isSuper };
}

// Find-or-create a region by name. Empty name -> no region.
async function resolveRegionId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing } = await db
    .from("regions")
    .select("id")
    .eq("name", trimmed)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await db
    .from("regions")
    .insert({ name: trimmed })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id as string;
}

// ---- Onboard a new organization (org row + auth login, atomic in effect) ----
export async function onboardOrg(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, isSuper } = await requireSuperadmin();
  if (!isSuper) return { ok: false, error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  let phoneNumberId = String(formData.get("whatsapp_phone_number_id") ?? "").trim();

  if (!name) return { ok: false, error: "Organization name is required." };
  if (!username) return { ok: false, error: "Username is required." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  // phone_number_id is UNIQUE NOT NULL — allow a placeholder until the real one exists.
  if (!phoneNumberId) phoneNumberId = `placeholder-${randomUUID()}`;

  const regionId = await resolveRegionId(region);

  // (b) insert the organization row.
  const { data: org, error: orgError } = await db
    .from("organizations")
    .insert({ name, region_id: regionId, whatsapp_phone_number_id: phoneNumberId })
    .select("id")
    .single();
  if (orgError || !org) {
    return { ok: false, error: "Couldn't create the organization. Please try again." };
  }

  // (c) create the Supabase Auth login — same logic as scripts/create-org-admin.mjs.
  const email = `${username}@org.local`;
  const { data: created, error: userError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no real inbox, so confirm immediately
    user_metadata: { organization_id: org.id, username },
  });

  // Rollback: if the login can't be created, don't leave an orphan org.
  if (userError || !created?.user) {
    await db.from("organizations").delete().eq("id", org.id);
    const taken = /already|registered|exists/i.test(userError?.message ?? "");
    return {
      ok: false,
      error: taken ? "That username is already taken." : "Couldn't create the login.",
    };
  }

  // (d) link the org to its login.
  await db.from("organizations").update({ auth_user_id: created.user.id }).eq("id", org.id);

  revalidatePath("/admin");
  return { ok: true, ts: Date.now() };
}

// ---- Edit an organization ----
export async function updateOrg(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, isSuper } = await requireSuperadmin();
  if (!isSuper) return { ok: false, error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "");
  const phoneNumberId = String(formData.get("whatsapp_phone_number_id") ?? "").trim();
  const subscriptionStatus = String(formData.get("subscription_status") ?? "");

  if (!id) return { ok: false, error: "Missing organization id." };
  if (!name) return { ok: false, error: "Organization name is required." };
  if (!phoneNumberId) return { ok: false, error: "WhatsApp phone number ID is required." };
  if (!SUBSCRIPTION_STATUSES.includes(subscriptionStatus as (typeof SUBSCRIPTION_STATUSES)[number])) {
    return { ok: false, error: "Invalid subscription status." };
  }

  const regionId = await resolveRegionId(region);

  const { error } = await db
    .from("organizations")
    .update({
      name,
      region_id: regionId,
      whatsapp_phone_number_id: phoneNumberId,
      subscription_status: subscriptionStatus,
    })
    .eq("id", id);

  if (error) {
    const taken = /duplicate|unique/i.test(error.message);
    return {
      ok: false,
      error: taken
        ? "That WhatsApp phone number ID is already used by another organization."
        : "Couldn't save changes. Please try again.",
    };
  }

  revalidatePath("/admin");
  return { ok: true, ts: Date.now() };
}

// ---- Delete an organization (login + all its data) ----
export async function deleteOrg(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, isSuper } = await requireSuperadmin();
  if (!isSuper) return { ok: false, error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing organization id." };

  const { data: org } = await db
    .from("organizations")
    .select("auth_user_id")
    .eq("id", id)
    .maybeSingle();

  // conversations.organization_id is ON DELETE SET NULL, so remove them
  // explicitly. org_updates and faqs cascade with the org row.
  await db.from("conversations").delete().eq("organization_id", id);

  const { error: delError } = await db.from("organizations").delete().eq("id", id);
  if (delError) return { ok: false, error: "Couldn't delete the organization. Please try again." };

  // Remove the auth login last (DB rows are already gone).
  const authUserId = org?.auth_user_id as string | undefined;
  if (authUserId) {
    await db.auth.admin.deleteUser(authUserId);
  }

  revalidatePath("/admin");
  return { ok: true, ts: Date.now() };
}
