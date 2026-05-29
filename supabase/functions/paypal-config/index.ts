// Returns the PayPal sandbox client ID for the browser SDK.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      client_id: Deno.env.get('PAYPAL_CLIENT_ID') || '',
      mode: 'sandbox',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
