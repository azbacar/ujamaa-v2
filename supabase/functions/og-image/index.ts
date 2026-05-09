// Génère une image Open Graph dynamique (SVG, 1200x630) pour partage social.
// Usage: /functions/v1/og-image?title=...&subtitle=...&category=...&lang=fr
import { corsHeaders } from "@supabase/supabase-js/cors";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]!));
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxChars - 1) + "…";
  }
  return lines;
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const title = (url.searchParams.get("title") || "Ujamaan").slice(0, 140);
  const subtitle = (url.searchParams.get("subtitle") || "Centre d'Information des Comores").slice(0, 160);
  const category = (url.searchParams.get("category") || "").slice(0, 40);
  const lang = url.searchParams.get("lang") || "fr";

  const titleLines = wrap(title, 32, 3);
  const subtitleLines = wrap(subtitle, 60, 2);

  const langLabel = ({ fr: "Français", ar: "العربية", sw: "Kiswahili", en: "English" } as const)[lang as "fr"] || "Français";

  // Palette : ocean → emerald gradient, conforme au design system
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c4a6e"/>
      <stop offset="55%" stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offset"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Décor : cercles flous -->
  <circle cx="1050" cy="120" r="180" fill="rgba(255,255,255,0.08)"/>
  <circle cx="100" cy="560" r="220" fill="rgba(16,185,129,0.18)"/>

  <!-- Carte centrale -->
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="url(#card)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>

  <!-- Logo / brand -->
  <g transform="translate(110, 130)" filter="url(#shadow)">
    <circle cx="32" cy="32" r="32" fill="#10b981"/>
    <text x="32" y="44" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="32" font-weight="800" text-anchor="middle" fill="white">U</text>
  </g>
  <text x="195" y="155" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="36" font-weight="800" fill="white">Ujamaan</text>
  <text x="195" y="185" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="18" font-weight="500" fill="rgba(255,255,255,0.75)">ujamaan.com · Comores</text>

  ${category ? `<g transform="translate(110, 230)">
    <rect width="${Math.max(80, category.length * 13 + 28)}" height="38" rx="19" fill="rgba(16,185,129,0.85)"/>
    <text x="14" y="25" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="white">${escapeXml(category.toUpperCase())}</text>
  </g>` : ""}

  <!-- Titre -->
  ${titleLines.map((l, i) => `<text x="110" y="${320 + i * 70}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="60" font-weight="800" fill="white">${escapeXml(l)}</text>`).join("\n  ")}

  <!-- Sous-titre -->
  ${subtitleLines.map((l, i) => `<text x="110" y="${320 + titleLines.length * 70 + 20 + i * 32}" font-family="system-ui,sans-serif" font-size="24" font-weight="400" fill="rgba(255,255,255,0.85)">${escapeXml(l)}</text>`).join("\n  ")}

  <!-- Footer -->
  <line x1="110" y1="540" x2="1090" y2="540" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <text x="110" y="572" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.95)">🇰🇲 Grande Comore · Anjouan · Mohéli · Mayotte</text>
  <text x="1090" y="572" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.95)" text-anchor="end">${escapeXml(langLabel)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
});
