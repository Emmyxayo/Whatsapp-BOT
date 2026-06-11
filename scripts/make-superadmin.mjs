// Grants superadmin (owner) access to an existing login, so they can use /admin.
//
//   node scripts/make-superadmin.mjs <username>
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your env.

import { createClient } from "@supabase/supabase-js";

const [, , username] = process.argv;
if (!username) {
  console.error("Usage: node scripts/make-superadmin.mjs <username>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const email = `${username.trim().toLowerCase()}@org.local`;

// Find the user by email (paginate through the admin list).
let target = null;
let page = 1;
while (!target) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Could not list users:", error.message);
    process.exit(1);
  }
  target = data.users.find((u) => u.email === email);
  if (target || data.users.length < 200) break;
  page++;
}

if (!target) {
  console.error(`No login found for "${username}" (${email}).`);
  process.exit(1);
}

// Preserve existing metadata (e.g. organization_id), just add the flag.
const { error } = await supabase.auth.admin.updateUserById(target.id, {
  user_metadata: { ...target.user_metadata, is_superadmin: true },
});

if (error) {
  console.error("Could not grant superadmin:", error.message);
  process.exit(1);
}

console.log(`"${username}" is now a superadmin. They can access /admin.`);
