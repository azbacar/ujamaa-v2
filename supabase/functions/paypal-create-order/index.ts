// PayPal Sandbox - Create Order
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const id = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const auth = btoa(`${id}:${secret}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { amount, currency, description, purpose, metadata } = await req.json();

    if (!amount || !currency) {
      return new Response(JSON.stringify({ error: 'amount and currency required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['EUR', 'USD'].includes(currency)) {
      return new Response(JSON.stringify({ error: 'currency must be EUR or USD' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await getAccessToken();
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: currency, value: Number(amount).toFixed(2) },
          description: description?.slice(0, 127) || 'Ujamaan payment',
          custom_id: JSON.stringify({ purpose, ...(metadata || {}) }).slice(0, 127),
        }],
        application_context: {
          brand_name: 'Ujamaan',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error('PayPal order error', order);
      return new Response(JSON.stringify({ error: 'PayPal order failed', details: order }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ id: order.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
