import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Ein gemeinsamer Browser-Client (teilt die Anmeldung mit Login/Registrierung). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase-Umgebungsvariablen fehlen.");
    client = createClient(url, key);
  }
  return client;
}
