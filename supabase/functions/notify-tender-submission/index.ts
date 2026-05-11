import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  author_email?: string | null;
  author_phone?: string | null;
  tender_title: string;
  tender_id: string;
  company_name?: string | null;
  contact_name?: string | null;
  proposed_amount?: number | null;
  currency?: string | null;
  submissions_count: number;
  link: string;
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

async function sendEmail(p: Payload) {
  if (!p.author_email || !LOVABLE_API_KEY || !RESEND_API_KEY) return null;
  const amount = p.proposed_amount ? `${Number(p.proposed_amount).toLocaleString('fr-FR')} ${p.currency || 'KMF'}` : 'Non précisé';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9fafb">
      <div style="background:linear-gradient(135deg,#10b981,#0284c7);padding:24px;border-radius:12px 12px 0 0;color:white">
        <h1 style="margin:0;font-size:22px">📬 Nouvelle soumission reçue</h1>
        <p style="margin:8px 0 0;opacity:.9">Appel d'offres : <strong>${p.tender_title}</strong></p>
      </div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <p>Une nouvelle proposition vient d'être déposée sur votre appel d'offres.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Entreprise</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.company_name || '—'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Contact</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.contact_name || '—'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Montant proposé</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${amount}</td></tr>
          <tr><td style="padding:8px"><strong>Total offres reçues</strong></td><td style="padding:8px"><span style="background:#10b981;color:white;padding:4px 12px;border-radius:999px;font-weight:bold">${p.submissions_count}</span></td></tr>
        </table>
        <a href="${p.link}" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Voir les soumissions →</a>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Ujamaan — Plateforme officielle des Comores</p>
      </div>
    </div>`;

  try {
    const r = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Ujamaan <onboarding@resend.dev>',
        to: [p.author_email],
        subject: `📬 Nouvelle soumission – ${p.tender_title}`,
        html,
      }),
    });
    return await r.json();
  } catch (e) {
    console.error('email error', e);
    return { error: String(e) };
  }
}

async function sendWhatsApp(p: Payload) {
  if (!p.author_phone || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return null;
  const phone = p.author_phone.replace(/[^\d]/g, '');
  const text = `📬 *Nouvelle soumission*\n\nAO : ${p.tender_title}\nEntreprise : ${p.company_name || '—'}\nMontant : ${p.proposed_amount ? Number(p.proposed_amount).toLocaleString('fr-FR') + ' ' + (p.currency || 'KMF') : 'Non précisé'}\nTotal offres : *${p.submissions_count}*\n\n${p.link}`;

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });
    return await r.json();
  } catch (e) {
    console.error('whatsapp error', e);
    return { error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json() as Payload;
    if (!payload.tender_id || !payload.tender_title) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [email, whatsapp] = await Promise.all([sendEmail(payload), sendWhatsApp(payload)]);

    return new Response(JSON.stringify({ ok: true, email, whatsapp }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-tender-submission error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
