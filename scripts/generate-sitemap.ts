// Generates public/sitemap.xml with static routes + dynamic content from Supabase.
// Runs via predev/prebuild hooks.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ujamaan.com";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://vpibvgdpeiicczelbynf.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk";

type Entry = { path: string; lastmod?: string; changefreq?: string; priority?: string };

const today = new Date().toISOString().slice(0, 10);

const staticEntries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/prix", changefreq: "daily", priority: "0.9" },
  { path: "/evenements", changefreq: "daily", priority: "0.9" },
  { path: "/annonces", changefreq: "daily", priority: "0.9" },
  { path: "/services", changefreq: "weekly", priority: "0.8" },
  { path: "/appels-offres", changefreq: "weekly", priority: "0.8" },
  { path: "/investissement", changefreq: "weekly", priority: "0.8" },
  { path: "/freelance", changefreq: "weekly", priority: "0.7" },
  { path: "/freelancers", changefreq: "weekly", priority: "0.7" },
  { path: "/carte-vendeurs", changefreq: "hourly", priority: "0.8" },
  { path: "/tourisme", changefreq: "weekly", priority: "0.7" },
  { path: "/infos-pratiques", changefreq: "weekly", priority: "0.6" },
  { path: "/pro", changefreq: "monthly", priority: "0.6" },
  { path: "/partener", changefreq: "monthly", priority: "0.6" },
  { path: "/guide", changefreq: "monthly", priority: "0.6" },
];

async function fetchRows(table: string, select: string, query = ""): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${query}`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: ${table} -> HTTP ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn(`sitemap: ${table} fetch failed`, e);
    return [];
  }
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return today;
  return iso.slice(0, 10);
}

async function buildEntries(): Promise<Entry[]> {
  const entries: Entry[] = [...staticEntries.map(e => ({ ...e, lastmod: today }))];

  const typeRoute: Record<string, string> = {
    announcement: "/annonces",
    event: "/evenements",
    service: "/services",
    tender: "/appels-offres",
    invest_project: "/investissement",
  };

  // Dynamic content_items (filter by type so /annonces/:id, etc.)
  const items = await fetchRows("content_items", "id,type,updated_at,status", "&status=eq.published");
  for (const it of items) {
    const base = typeRoute[it.type];
    if (!base) continue;
    entries.push({
      path: `${base}/${it.id}`,
      lastmod: fmt(it.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Prices
  const prices = await fetchRows("prices", "id,updated_at");
  for (const p of prices) {
    entries.push({ path: `/prix/${p.id}`, lastmod: fmt(p.updated_at), changefreq: "daily", priority: "0.6" });
  }

  // Events table (separate from content_items)
  const events = await fetchRows("events", "id,updated_at");
  for (const e of events) {
    entries.push({ path: `/evenements/${e.id}`, lastmod: fmt(e.updated_at), changefreq: "weekly", priority: "0.6" });
  }

  // Freelancer profiles
  const fls = await fetchRows("freelancer_profiles", "id,updated_at");
  for (const f of fls) {
    entries.push({ path: `/freelancer/${f.id}`, lastmod: fmt(f.updated_at), changefreq: "weekly", priority: "0.6" });
  }

  // Static pages
  const pages = await fetchRows("static_pages", "slug,updated_at");
  for (const sp of pages) {
    entries.push({ path: `/page/${sp.slug}`, lastmod: fmt(sp.updated_at), changefreq: "monthly", priority: "0.5" });
  }

  // Deduplicate by path
  const seen = new Set<string>();
  return entries.filter(e => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}

function render(entries: Entry[]): string {
  const urls = entries.map(e => [
    `  <url>`,
    `    <loc>${BASE_URL}${e.path}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ].filter(Boolean).join("\n"));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

(async () => {
  const entries = await buildEntries();
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
