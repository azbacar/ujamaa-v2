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

## 🔐 Endpoints publics vs authentifiés — Gestion des erreurs

### Matrice des permissions

| Endpoint | `x-api-key` | `Bearer` user | Code si manquant |
|---|:---:|:---:|---|
| `GET /openapi.json`, `/warmup` | ❌ | ❌ | — toujours OK |
| `POST /auth/register` · `/login` · `/refresh` · `/reset-password` | ✅ | ❌ | 401 |
| `GET /auth/me` · `POST /auth/logout` | ✅ | ✅ | **401** |
| `GET /public/*` (prices, events, content, gastronomy, freelancers, diaspora, enterprises, vendor-locations, partners) | ✅ | ❌ | 403 si clé sans `login` |
| `POST /ai-chat` | ✅ | ⚠️ optionnel (active l'historique perso) | 403 |
| `GET/PUT/DELETE /profile` | ✅ | ✅ | **401** |
| `GET/POST/DELETE /favorites` | ✅ | ✅ | **401** |
| `GET/PUT /my-notifications` | ✅ | ✅ | **401** |
| `GET/POST /messages` | ✅ | ✅ | **401** |
| `POST/DELETE /push` | ✅ | ✅ | **401** |
| `POST /price-submissions` · `/verification-requests` · `/pro-subscription-requests` | ✅ | ✅ | **401** |
| `POST /partner-collects` | ✅ | ✅ + rôle `partner` | **403** |
| `*/admin/*` | ✅ permission `admin` | ✅ rôle `admin` | **403** |

> 📌 **Règle simple** :
> - **401** = problème d'**identité** (token absent, expiré, invalide) → refresh ou re-login
> - **403** = identité OK, **droits insuffisants** → message UX, pas de retry

### Codes de réponse renvoyés par `mobile-api`

| Code | Signification | Action côté app |
|:---:|---|---|
| `200` / `201` | OK | Continuer |
| `400` | Body invalide / paramètres manquants | Toast d'erreur, ne PAS retry |
| `401` | `x-api-key` ou Bearer absent / expiré | → tenter `auth/refresh` puis retry **1 seule fois** |
| `403` | Pas le droit (rôle, permission, ownership) | Message UX clair, masquer la fonctionnalité |
| `404` | Ressource ou route inexistante | Vérifier l'ID, fallback liste |
| `405` | Méthode HTTP non supportée | Bug app — vérifier le client |
| `500` | Erreur serveur | Retry avec backoff exponentiel (3 max) |

Toutes les erreurs renvoient un body **JSON uniforme** :
```json
{ "error": "Message lisible expliquant le problème" }
```

### Wrapper `api()` robuste avec auto-refresh

```typescript
// src/lib/ujamaaApi.ts
import { Preferences } from '@capacitor/preferences';
import { router } from '@/router';

const API_BASE = 'https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api';
const API_KEY  = import.meta.env.VITE_UJAMAA_API_KEY;

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

// Singleton : empêche plusieurs refresh simultanés
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const { value: refresh_token } = await Preferences.get({ key: 'refresh_token' });
    if (!refresh_token) return false;
    try {
      const r = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ refresh_token }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      await Preferences.set({ key: 'access_token',  value: data.access_token });
      await Preferences.set({ key: 'refresh_token', value: data.refresh_token });
      return true;
    } catch { return false; }
    finally { setTimeout(() => { refreshPromise = null; }, 0); }
  })();
  return refreshPromise;
}

async function logoutLocal() {
  await Preferences.remove({ key: 'access_token' });
  await Preferences.remove({ key: 'refresh_token' });
  router.replace('/login?reason=expired');
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
  _retried = false,
): Promise<T> {
  const { value: token } = await Preferences.get({ key: 'access_token' });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/${path}`, { ...init, headers });
  if (res.ok) return res.json() as Promise<T>;

  const body = await res.json().catch(() => ({ error: res.statusText }));
  const message = (body as { error?: string }).error || res.statusText;

  // 401 avec token → tente UN refresh puis retry
  if (res.status === 401 && !_retried && token) {
    const refreshed = await refreshSession();
    if (refreshed) return api<T>(path, init, true);
    await logoutLocal();
    throw new ApiError(401, 'Session expirée, veuillez vous reconnecter.', body);
  }

  if (res.status === 401) {
    throw new ApiError(401, 'Connexion requise pour accéder à cette ressource.', body);
  }
  if (res.status === 403) {
    throw new ApiError(403, message || "Vous n'avez pas les droits nécessaires.", body);
  }
  throw new ApiError(res.status, message, body);
}
```

### Exemple d'usage avec gestion UX

```typescript
import { api, ApiError } from '@/lib/ujamaaApi';
import { toast } from '@/components/ui/sonner';

async function loadFavorites() {
  try {
    return await api<{ data: Favorite[] }>('favorites');
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { data: [] }; // déjà redirigé vers /login
      if (e.status === 403) {
        toast.error("Fonctionnalité réservée aux comptes vérifiés.");
        return { data: [] };
      }
      if (e.status >= 500) {
        toast.error("Service momentanément indisponible. Réessayez plus tard.");
      }
    }
    throw e;
  }
}
```

### Checklist erreurs à tester sur device

- [ ] App lancée sans réseau → erreur gérée (pas de crash)
- [ ] Token expiré pendant l'utilisation → refresh transparent, pas de re-login visible
- [ ] Refresh token expiré → redirection auto vers `/login?reason=expired`
- [ ] POST `/messages` sans login → 401 propre, CTA "Se connecter"
- [ ] Accès `/admin/*` avec compte user → 403 + message clair
- [ ] `/public/prices` accessible **avant** login (mode visiteur)
- [ ] Spam de requêtes après expiration → un seul refresh effectif (singleton)

---

*Dernière mise à jour : 29/04/2026 — données vérifiées en prod.*

---

## 📍 Suivi GPS ambulant en arrière-plan (Capacitor)

Pour que le partage de position **continue même écran verrouillé / app en arrière-plan**, ajouter dans l'app Capacitor :

```bash
npm i @capacitor/geolocation @capacitor-community/background-geolocation
npx cap sync
```

Côté code, remplacer `navigator.geolocation.watchPosition` par le plugin natif quand `Capacitor.isNativePlatform()` est `true`. Update vers `vendor_locations` toutes les 15s via `supabase.from('vendor_locations').update(...)`.

**Permissions requises :**
- iOS `Info.plist` : `NSLocationAlwaysAndWhenInUseUsageDescription`, `UIBackgroundModes` → `location`
- Android : `ACCESS_BACKGROUND_LOCATION` + service foreground

**Limite web pure (PWA / navigateur) :** impossible de suivre la position quand l'onglet est fermé ou l'écran verrouillé. Solution actuelle = Wake Lock + heartbeat 15s tant que l'onglet est ouvert.
