// PayPal - Capture Order and record payment in DB (sandbox or live based on PAYPAL_MODE)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const auth = btoa(`${id}:${secret}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
    if (claimErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub;

    const { order_id, purpose, metadata } = await req.json();
    if (!order_id || !purpose) {
      return new Response(JSON.stringify({ error: 'order_id and purpose required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Capture order
    const ppToken = await getAccessToken();
    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ppToken}`, 'Content-Type': 'application/json' },
    });
    const capture = await capRes.json();
    if (!capRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed', capture);
      return new Response(JSON.stringify({ error: 'PayPal capture failed', details: capture }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unit = capture.purchase_units?.[0];
    const captureRecord = unit?.payments?.captures?.[0];
    const amount = Number(captureRecord?.amount?.value || 0);
    const currency = captureRecord?.amount?.currency_code || 'EUR';
    const captureId = captureRecord?.id || order_id;

    // Admin client for DB writes that bypass RLS where needed
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Record by purpose
    if (purpose === 'pro_subscription') {
      const { plan, amount_kmf } = metadata || {};
      const { error } = await admin.from('pro_subscription_requests').insert({
        user_id: userId,
        plan: plan || 'pro',
        payment_method: 'paypal',
        payment_reference: `PAYPAL:${captureId}`,
        amount: amount_kmf || amount,
        final_amount: amount_kmf || amount,
        currency: amount_kmf ? 'KMF' : currency,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        review_notes: `Paiement PayPal ${PAYPAL_MODE === 'live' ? 'LIVE' : 'Sandbox'} confirmé : ${amount} ${currency} (capture ${captureId})`,
      });
      if (error) throw error;
    } else if (purpose === 'investment') {
      const { project_id, message, amount_native, currency_native } = metadata || {};
      if (!project_id) throw new Error('project_id required for investment');
      const { error } = await admin.from('project_investments').insert({
        project_id,
        investor_id: userId,
        amount: amount_native || amount,
        currency: currency_native || currency,
        status: 'confirmed',
        payment_method: 'paypal',
        payment_reference: `PAYPAL:${captureId}`,
        message: message || null,
      });
      if (error) throw error;
    } else if (purpose === 'event') {
      const { registration_id } = metadata || {};
      if (registration_id) {
        await admin.from('event_registrations').update({
          payment_status: 'paid',
          additional_info: { payment_method: 'paypal', payment_reference: `PAYPAL:${captureId}`, amount, currency },
        }).eq('id', registration_id);
      }
    }

    return new Response(JSON.stringify({ success: true, capture_id: captureId, amount, currency }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
