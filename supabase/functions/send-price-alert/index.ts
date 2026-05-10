// Edge function: envoie un email (Resend) + WhatsApp (Meta Cloud API) pour une alerte prix.
// Appelée par le trigger DB notify_price_change pour chaque alerte utilisateur déclenchée.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface Payload {
  email?: string | null;
  whatsapp?: string | null;
  product: string;
  old_price: number;
  new_price: number;
  currency: string;
  island?: string | null;
  pct: number;
  direction: "hausse" | "baisse";
  link: string;
}

function buildEmailHtml(p: Payload) {
  const arrow = p.direction === "hausse" ? "📈" : "📉";
  const color = p.direction === "hausse" ? "#dc2626" : "#16a34a";
  return `
<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f9fc;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb">
    <h1 style="margin:0 0 8px;color:#0f766e;font-size:20px">Ujamaan — Alerte prix ${arrow}</h1>
    <p style="color:#374151;font-size:15px;line-height:1.5">
      <strong>${p.product}</strong> ${p.island ? `à <strong>${p.island}</strong>` : ""} :
      <span style="color:${color};font-weight:bold">${p.direction} de ${Math.abs(p.pct)}%</span>.
    </p>
    <p style="font-size:18px;color:#111;margin:16px 0">
      <s style="color:#9ca3af">${p.old_price} ${p.currency}</s> &nbsp;→&nbsp;
      <strong>${p.new_price} ${p.currency}</strong>
    </p>
    <p><a href="${p.link}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Voir le détail</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="color:#6b7280;font-size:12px">Vous recevez cet email car vous avez activé une alerte prix sur Ujamaan.<br/>Désactivez-la dans <em>Mon compte → Alertes</em>.</p>
  </div>
</body></html>`;
}

function buildWhatsAppText(p: Payload) {
  const arrow = p.direction === "hausse" ? "📈" : "📉";
  return `*Ujamaan — Alerte prix ${arrow}*\n\n${p.product}${p.island ? ` à ${p.island}` : ""} : *${p.direction} de ${Math.abs(p.pct)}%*\n${p.old_price} → *${p.new_price} ${p.currency}*\n\n${p.link}`;
}

async function sendEmail(p: Payload, to: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableKey || !resendKey) throw new Error("Missing Resend keys");

  const arrow = p.direction === "hausse" ? "📈" : "📉";
  const r = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: "Ujamaan <onboarding@resend.dev>",
      to: [to],
      subject: `${arrow} ${p.product} : ${p.direction} de ${Math.abs(p.pct)}%`,
      html: buildEmailHtml(p),
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

async function sendWhatsApp(p: Payload, to: string) {
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!phoneId || !token) throw new Error("Missing WhatsApp credentials");

  // Normalisation : retirer espaces, +, garder chiffres
  const normalized = to.replace(/[^\d]/g, "");
  const r = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: buildWhatsAppText(p) },
      }),
    },
  );
  const data = await r.json();
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const p = (await req.json()) as Payload;
    if (!p?.product || p.old_price == null || p.new_price == null) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, unknown> = {};
    if (p.email) {
      try {
        results.email = await sendEmail(p, p.email);
      } catch (e) {
        results.email_error = (e as Error).message;
        console.error("Email error:", e);
      }
    }
    if (p.whatsapp) {
      try {
        results.whatsapp = await sendWhatsApp(p, p.whatsapp);
      } catch (e) {
        results.whatsapp_error = (e as Error).message;
        console.error("WhatsApp error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-price-alert error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
