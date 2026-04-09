import { createClient } from "@supabase/supabase-js";

// Cliente con service role — bypasea RLS.
// SOLO usar en endpoints de servidor protegidos. NUNCA exponer al cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
