// Envoie une facture PDF par email via Resend
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { to, subject, message, pdf_base64, filename, from_name } = await req.json();
    if (!to || !pdf_base64 || !filename) {
      return new Response(JSON.stringify({ error: 'to, pdf_base64 et filename requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Resend non configuré' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const fromName = (from_name || 'Ujamaan').replace(/[<>]/g, '');

    const result = await resend.emails.send({
      from: `${fromName} <noreply@ujamaan.com>`,
      to: [to],
      subject: subject || `Document ${filename}`,
      html: `<div style="font-family:Arial,sans-serif;color:#222">
        <p>${(message || 'Veuillez trouver votre document en pièce jointe.').replace(/\n/g, '<br>')}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#6b7280;font-size:12px">Envoyé via <a href="https://ujamaan.com" style="color:#107a57">Ujamaan</a></p>
      </div>`,
      attachments: [{ filename, content: pdf_base64 }],
    });

    if ((result as any).error) {
      console.error('Resend error', (result as any).error);
      return new Response(JSON.stringify({ error: (result as any).error.message || 'Erreur Resend' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: (result as any).data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
