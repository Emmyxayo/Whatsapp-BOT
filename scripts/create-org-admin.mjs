// Creates a username + password login for an organization and links it.
// Run during onboarding (you control this — there is no public signup):
//
//   node scripts/create-org-admin.mjs <organization_id> <username> <password>
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your env.

import { createClient } from "@supabase/supabase-js";

const [, , organizationId, username, password] = process.argv;
if (!organizationId || !username || !password) {
  console.error("Usage: node scripts/create-org-admin.mjs <organization_id> <username> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const email = `${username.trim().toLowerCase()}@org.local`;

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no real inbox, so confirm immediately
  user_metadata: { organization_id: organizationId, username },
});

if (error) {
  console.error("Could not create login:", error.message);
  process.exit(1);
}

await supabase.from("organizations").update({ auth_user_id: data.user.id }).eq("id", organizationId);

console.log(`Login created for "${username}". Give the organization this username and password.`);
