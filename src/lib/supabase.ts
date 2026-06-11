import { createClient } from "@supabase/supabase-js";

// Server-side client. Uses the service role key, so only ever import this
// in API routes / server code — never in a client component.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
