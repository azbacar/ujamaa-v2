# 📱 Guide « Données réelles prêtes » — App mobile Capacitor `ujamaa-v2`

> Ce document liste **toutes les tables Supabase déjà peuplées en production**
> et explique **comment l'app Capacitor les affiche** via l'edge function
> `mobile-api`. Aucune donnée fictive — tout ce qui est listé ici est
> immédiatement consommable depuis l'app.
>
> **Base API** : `https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api`
> **Headers obligatoires** : `x-api-key: <clé app>` + (si user connecté)
> `Authorization: Bearer <access_token>`

---

## ✅ État au 29/04/2026 — Tables peuplées en production

| Table | Lignes | Endpoint mobile | Écran app suggéré |
|---|---:|---|---|
| `prices` | **32** | `GET /public/prices` | Onglet **Prix** (home + recherche) |
| `users` | **32** | `GET /auth/me` (perso) | Profil |
| `notifications` | **14** | `GET /my-notifications` | Cloche en-tête |
| `homepage_sections` | **12** | (lecture directe Supabase JS) | Ordre des sections home |
| `vendor_locations` | **6** | `GET /public/vendor-locations` * | **Carte temps réel** |
| `content_items` | **6** | `GET /public/content` | Articles / annonces |
| `ai_knowledge_sources` | **6** | (utilisé par `/ai-chat`) | Assistant IA |
| `freelancer_profiles` | **3** | `GET /public/freelancers` | Annuaire freelancers |
| `freelance_jobs` | **2** | `GET /public/freelance-jobs` | Missions freelance |
| `gastronomy_items` | **1** | `GET /public/gastronomy` | Tourisme & menus |
| `enterprise_profiles` | **1** | `GET /public/enterprises` | Entreprises B2B |
| `events` | **1** | `GET /public/events` | Agenda |
| `partner_accounts` | 0 | `GET /public/partners` | Concessionnaires (carte) |
| `diaspora_projects` | 0 | `GET /public/diaspora` | Investissement diaspora |
| `global_announcements` | 0 | Realtime Supabase | Bannière alertes urgentes |

\* L'endpoint `vendor-locations` utilise la table `vendor_locations` filtrée
côté serveur (statut actif + Pro vérifié).

> Les tables à **0 lignes** sont fonctionnelles et leurs endpoints répondent
> normalement avec `{ data: [], total: 0 }`. Elles se rempliront dès qu'un
> utilisateur publiera (admin, annonceur, porteur de projet…).

---

## 🚀 Démarrage rapide côté Capacitor

### 1. Installation
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm install @supabase/supabase-js @capacitor/preferences @capacitor/geolocation
npx cap init   # appId: app.lovable.6a4ec9a8833648608df77fb9baac66f6
               # appName: ujamaa-v2
```

### 2. Client API minimal (`src/lib/ujamaaApi.ts`)
```typescript
import { Preferences } from '@capacitor/preferences';

const API_BASE = 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api';
const API_KEY  = import.meta.env.VITE_UJAMAA_API_KEY; // créé dans /admin

export async function api(path: string, init: RequestInit = {}) {
  const { value: token } = await Preferences.get({ key: 'access_token' });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/${path}`, { ...init, headers });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}
```

### 3. Exemples de consommation par écran

#### 🏷️ Écran « Prix » (32 lignes en prod)
```typescript
const { data, total } = await api('public/prices?limit=50&offset=0');
// data[i] = { id, product, price, currency, island, market, updated_at, ... }
```

#### 📅 Écran « Agenda »
```typescript
const { data } = await api('public/events?limit=20');
// Astuce : filtrer côté app  → data.filter(e => new Date(e.event_date) >= new Date())
// (les événements passés sont déjà masqués côté serveur)
```

#### 🗺️ Écran « Carte annonceurs en direct »
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

// Position initiale
const { data } = await api('public/vendor-locations');

// Realtime : se met à jour quand un annonceur ambulant bouge
supabase.channel('vendor-live')
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vendor_locations' },
      (payload) => updateMarker(payload.new))
  .subscribe();
```

#### 💬 Messagerie temps réel
```typescript
const { data: convos } = await api('messages');               // listes
const { data: msgs }   = await api(`messages/${conversationId}`);

supabase.channel(`conv-${conversationId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}` },
      (p) => appendMessage(p.new))
  .subscribe();
```

#### 🔔 Notifications + Push
```typescript
// 1. Liste in-app
const { data } = await api('my-notifications');

// 2. Enregistrer le device pour les push (Web Push VAPID)
await api('push', {
  method: 'POST',
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys,
    user_agent: navigator.userAgent,
  }),
});
```

#### 🤖 Assistant IA (cascade Gemini → Kimi → Lovable)
```typescript
const reply = await api('ai-chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Quel est le prix du riz à Moroni ?',
    sessionId: crypto.randomUUID(),
    clientHistory: [], // ou les 20 derniers messages
  }),
});
// reply.response = markdown formaté avec liens internes mappés
```

#### 👥 Freelancers / Missions / Tourisme / Entreprises
```typescript
await api('public/freelancers?limit=20');   // 3 profils en prod
await api('public/freelance-jobs');         // 2 missions en prod
await api('public/gastronomy');             // 1 menu en prod
await api('public/enterprises');            // 1 entreprise B2B
```

---

## 🔐 Authentification utilisateur

```typescript
// Inscription
await api('auth/register', { method: 'POST',
  body: JSON.stringify({ email, password, username }) });

// Connexion
const { access_token, refresh_token, user } = await api('auth/login', {
  method: 'POST', body: JSON.stringify({ email, password }) });
await Preferences.set({ key: 'access_token',  value: access_token });
await Preferences.set({ key: 'refresh_token', value: refresh_token });

// Refresh automatique (à appeler ~50 min après login)
const r = await api('auth/refresh', { method: 'POST',
  body: JSON.stringify({ refresh_token }) });
```

---

## 🖼️ Storage : images publiques utilisables tel quel

Les buckets ci-dessous sont **publics** — affichables avec `<img src>` directement :

| Bucket | Usage | Exemple URL |
|---|---|---|
| `avatars` | Photos profil utilisateurs | `…/storage/v1/object/public/avatars/{user_id}/{file}` |
| `event-images` | Affiches événements (5 max/event) | `…/storage/v1/object/public/event-images/{event_id}/{file}` |
| `freelancer-avatars` | Photos freelancers | idem |
| `menu-images` | Plats restaurants/menus | idem |
| `island-images` | Photos îles (header) | idem |
| `Logo & icon` | Logos partenaires | idem |

Bucket privé (`verification-documents`, `chat-attachments`) : utiliser
`supabase.storage.from(...).createSignedUrl(path, 3600)` côté app après
`getBearerUser()`.

---

## 📡 Realtime — Tables exposées

À abonner via `@supabase/supabase-js` (clé anon, pas via mobile-api) :

| Table | Événements utiles |
|---|---|
| `vendor_locations` | `UPDATE` → suivi annonceur ambulant en direct |
| `messages` | `INSERT` filtré par `conversation_id` |
| `notifications` | `INSERT` filtré par `user_id` |
| `global_announcements` | `INSERT` → bannière alerte urgente |
| `prices` | `UPDATE` → mise à jour live des prix |

---

## 📋 Spec OpenAPI complète

```bash
curl https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api/openapi.json \
  -H "x-api-key: <clé>"
```

Importer ensuite dans **Postman / Insomnia / Swagger UI** pour explorer les
~40 endpoints disponibles (auth, profil, favoris, messages, push, IA,
contenus publics, géoloc, paiements Mvola, abonnements Pro…).

---

## ✅ Checklist avant publication App Store / Play Store

- [ ] Clé API mobile générée dans `/admin/api-keys` (permission `login`)
- [ ] `VITE_UJAMAA_API_KEY` ajoutée à l'env Capacitor
- [ ] Whitelister `capacitor://localhost` dans Supabase Auth → Redirect URLs
- [ ] Lancer `bash scripts/supabase-auth-harden.sh` (HIBP + OTP 10 min)
- [ ] Tester refresh token + déconnexion
- [ ] Tester realtime sur device physique (pas qu'en émulateur)
- [ ] Déclarer permissions iOS : `NSLocationWhenInUseUsageDescription`,
      `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- [ ] Icônes & splash via `@capacitor/assets`
- [ ] `npx cap sync` après chaque `git pull`

---

*Dernière mise à jour : 29/04/2026 — données vérifiées en prod.*
