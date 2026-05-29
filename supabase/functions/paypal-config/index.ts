// Returns the PayPal client ID + mode (sandbox|live) for the browser SDK.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const mode = (Deno.env.get('PAYPAL_MODE') || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  return new Response(
    JSON.stringify({
      client_id: Deno.env.get('PAYPAL_CLIENT_ID') || '',
      mode,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
