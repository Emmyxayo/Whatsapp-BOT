// Organizations log in with a username + password. Supabase Auth works on
// emails, so we map each username to a hidden internal email. This is
// never shown to anyone and never receives mail — it's just the key
// Supabase stores the (securely hashed) password against.
const INTERNAL_DOMAIN = "org.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${INTERNAL_DOMAIN}`;
}
