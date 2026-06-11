"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { supabase as db } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ActionState = { ok: boolean; error?: string; ts?: number };

// Authenticates the logged-in user (anon-key SSR client reads the session
// cookie) and resolves their organization. Writes use the service-role `db`
// client so they bypass RLS — but every query below is explicitly scoped to
// this organizationId, so an org can only ever touch its own rows.
async function requireOrg() {
  const authClient = createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const organizationId = user?.user_metadata?.organization_id as string | undefined;
  return { db, organizationId };
}

// ---- Info: the content the assistant reads back to members ----
export async function saveOrgUpdate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, organizationId } = await requireOrg();
  if (!organizationId) return { ok: false, error: "No organization on this account." };

  const { error } = await db.from("org_updates").insert({
    organization_id: organizationId,
    label: String(formData.get("label") ?? ""),
    body: String(formData.get("body") ?? ""),
    key_details: String(formData.get("key_details") ?? ""),
    contact: String(formData.get("contact") ?? ""),
  });

  if (error) return { ok: false, error: "Couldn't save. Please try again." };

  revalidatePath("/dashboard");
  return { ok: true, ts: Date.now() };
}

// ---- FAQs ----
export async function createFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, organizationId } = await requireOrg();
  if (!organizationId) return { ok: false, error: "No organization on this account." };

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return { ok: false, error: "Both question and answer are required." };

  const { error } = await db.from("faqs").insert({
    organization_id: organizationId,
    question,
    answer,
  });

  if (error) return { ok: false, error: "Couldn't add FAQ. Please try again." };

  revalidatePath("/dashboard");
  return { ok: true, ts: Date.now() };
}

export async function updateFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, organizationId } = await requireOrg();
  if (!organizationId) return { ok: false, error: "No organization on this account." };

  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id) return { ok: false, error: "Missing FAQ id." };
  if (!question || !answer) return { ok: false, error: "Both question and answer are required." };

  const { error } = await db
    .from("faqs")
    .update({ question, answer })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return { ok: false, error: "Couldn't update FAQ. Please try again." };

  revalidatePath("/dashboard");
  return { ok: true, ts: Date.now() };
}

export async function deleteFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { db, organizationId } = await requireOrg();
  if (!organizationId) return { ok: false, error: "No organization on this account." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing FAQ id." };

  const { error } = await db
    .from("faqs")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return { ok: false, error: "Couldn't delete FAQ. Please try again." };

  revalidatePath("/dashboard");
  return { ok: true, ts: Date.now() };
}
