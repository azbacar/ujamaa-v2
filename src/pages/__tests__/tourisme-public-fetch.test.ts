/**
 * Diagnostic: la page Tourisme doit pouvoir lire `gastronomy_items`
 * publiés AVEC la clé anon (visiteur non connecté), sans dépendre de
 * la table `users` (verrouillée pour anon).
 *
 * Vérifie aussi que la vue publique `users_pro_status` est lisible
 * pour enrichir le statut Pro de l'auteur.
 */
import { describe, it, expect } from "vitest";

const SUPABASE_URL = "https://vpibvgdpeiicczelbynf.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaWJ2Z2RwZWlpY2N6ZWxieW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTQ2NDAsImV4cCI6MjA2Nzc5MDY0MH0.BMSjW20JV-khx-_JOHAIsonKci5pqXnt2cr8p_HWIwk";

async function anonGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  const body = await res.json();
  return { status: res.status, body };
}

describe("TourismePage public data access (anon)", () => {
  it("retourne au moins 1 ligne publiée depuis gastronomy_items sans join users", async () => {
    const { status, body } = await anonGet(
      "gastronomy_items?select=id,type,title,status,author_id&status=eq.published",
    );
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("REGRESSION: le join users:author_id(...) DOIT échouer pour anon (table users verrouillée)", async () => {
    const { status, body } = await anonGet(
      "gastronomy_items?select=id,users:author_id(username)&status=eq.published",
    );
    // Garde-fou : si ce test commence à passer (200), c'est qu'on a relâché
    // les permissions sur public.users — à investiguer immédiatement.
    expect(status).toBe(403);
    expect(body?.code).toBe("42501");
  });

  it("la vue users_pro_status est lisible par anon (pour enrichir l'auteur)", async () => {
    const { status, body } = await anonGet(
      "users_pro_status?select=id,username,is_pro&limit=1",
    );
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});
