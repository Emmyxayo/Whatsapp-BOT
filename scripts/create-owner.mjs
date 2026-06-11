// Creates (or updates) the superadmin OWNER login for /admin.
// Owner is cross-org: it is NOT tied to any organization, and gets
// user_metadata.is_superadmin = true so middleware lets it into /admin.
//
//   node --env-file=.env.local scripts/create-owner.mjs <username> <password>
//
// Idempotent: if the login already exists, its password is reset and the
// superadmin flag is (re)applied.

import { createClient } from "@supabase/supabase-js";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-owner.mjs <username> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const email = `${username.trim().toLowerCase()}@org.local`;

// Find an existing login with this email (paginate the admin list).
let existing = null;
let page = 1;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Could not list users:", error.message);
    process.exit(1);
  }
  existing = data.users.find((u) => u.email === email);
  if (existing || data.users.length < 200) break;
  page++;
}

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: { ...existing.user_metadata, username, is_superadmin: true },
  });
  if (error) {
    console.error("Could not update owner:", error.message);
    process.exit(1);
  }
  console.log(`Updated owner "${username}" (${email}) — password reset, superadmin confirmed.`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no real inbox, so confirm immediately
    user_metadata: { username, is_superadmin: true },
  });
  if (error) {
    console.error("Could not create owner:", error.message);
    process.exit(1);
  }
  console.log(`Created owner "${username}" (${email}). Sign in at /login, then open /admin.`);
}
