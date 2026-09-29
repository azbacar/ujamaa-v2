import { createClient } from 'npm:@supabase/supabase-js@2';

let cached: string | null = null;

// Vérifie l'en-tête x-internal-secret contre la clé stockée en base (privée).
export async function isValidInternalSecret(provided: string | null): Promise<boolean> {
  if (!provided) return false;
  if (!cached) {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await sb.rpc('get_internal_secret');
    cached = (data as string) || null;
  }
  return !!cached && provided === cached;
}
