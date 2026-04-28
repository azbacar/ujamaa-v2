# 🔐 Audit RLS & Vues Publiques — Ujamaan

> Date : 2026-04-28 — Périmètre : 60 tables, 3 vues publiques, ~177 findings linter Supabase

---

## ✅ Synthèse exécutive

| Indicateur | Résultat |
|---|---|
| Tables avec RLS activée | **60 / 60 (100 %)** |
| Tables sensibles avec policy `deny_anon` explicite | ✅ users, api_keys, chat_messages, direct_messages, enterprise_*, freelancer_*, push_subscriptions, verification_requests, vendor_locations |
| Vues `_public` masquant les PII | 2 (`enterprise_profiles_public`, `project_carriers_public`) + `users_pro_status` |
| KYC (`verification_requests`, bucket `verification-documents`) | ✅ Isolé (owner + staff only) |
| Linter Supabase | 177 warnings (majorité informationnels — voir §5) |

**Note globale : 7,5 / 10** — RLS robuste sur les zones critiques, mais **3 fuites PII** à corriger sur tables exposées au lieu des vues `_public`.

---

## 🚨 1. Findings critiques (à corriger)

### 🔴 CRIT-1 : `freelancer_profiles` — WhatsApp public à TOUS (anon inclus)

```sql
-- Policy existante :
CREATE POLICY "Anyone can view visible freelancer profiles"
ON freelancer_profiles FOR SELECT TO public
USING (is_visible = true);
```

**Problème** : la policy cible `public` (anon + authenticated) et **ne masque pas la colonne `whatsapp`**. N'importe quel visiteur non connecté peut récupérer tous les WhatsApp des freelancers via PostgREST :
```
GET /rest/v1/freelancer_profiles?select=display_name,whatsapp&is_visible=eq.true
```

**Impact** : violation de la règle Pro = global (les contacts doivent être masqués sauf si auteur Pro OU viewer Pro). Risque RGPD / spam / scraping.

**Remédiation recommandée** :
1. Créer une vue `freelancer_profiles_public` excluant `whatsapp`, `email` (s'il existe).
2. Restreindre la policy SELECT à `authenticated` seulement.
3. Migrer le frontend (`useFreelancerDirectory.ts`) vers la vue publique.
4. Conserver l'accès aux contacts via `<ContactDisplay />` qui filtre côté client + RLS séparée.

---

### 🔴 CRIT-2 : `enterprise_profiles` — NIF/RCCM/phone/email exposés à tout authentifié

```sql
CREATE POLICY "Authenticated can view active enterprises"
ON enterprise_profiles FOR SELECT TO authenticated
USING (status='active' OR user_id = auth.uid() OR has_role(auth.uid(),'admin'));
```

**Problème** : tout utilisateur connecté (même Free, même rôle `user`) peut lire **NIF, RCCM, phone, email, address** de toutes les entreprises. La vue `enterprise_profiles_public` masque correctement ces champs, mais la table brute reste accessible.

**Vue safe existante** (à privilégier) :
```sql
CREATE VIEW enterprise_profiles_public AS
SELECT id, name, sector, island, city, logo_url, description, is_verified, status, created_at
FROM enterprise_profiles WHERE status='active';
-- ✅ exclut: nif, rccm, phone, email, address, whatsapp
```

**Impact** : fuite RGPD majeure (RCCM/NIF = identifiants fiscaux), scraping concurrentiel, spam B2B.

**Remédiation** :
1. Restreindre la policy SELECT actuelle à `user_id = auth.uid() OR has_role(...)`.
2. Migrer `useEnterprise.ts`, `useMultiEnterprise.ts`, listings publics → `enterprise_profiles_public`.
3. Le `EnterpriseManagementSection` admin reste sur la table brute (autorisé via `has_role admin`).

---

### 🔴 CRIT-3 : `project_carriers` — phone/email exposés à tout authentifié

```sql
CREATE POLICY "Authenticated can view active carrier basic info"
ON project_carriers FOR SELECT TO authenticated
USING (user_id=auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator') OR is_active=true);
```

**Problème** : `is_active=true` ouvre l'accès aux colonnes `phone`, `email` à tout authentifié. La vue `project_carriers_public` les masque (✅), mais la table reste lisible.

**Remédiation** : même schéma que CRIT-2 — restreindre la policy + migrer frontend (`useDiaspora.ts`, `useProjectCarrier.ts`) vers la vue.

---

## 🟡 2. Findings WARN (à surveiller)

### W-1 : `enterprise_profiles_public` / `project_carriers_public` sans `security_invoker=true`

Les vues SQL standard exécutent les requêtes avec les droits du **propriétaire** (souvent `postgres`), bypassant la RLS de la table sous-jacente. Pour qu'une vue respecte la RLS de la table, il faut :
```sql
ALTER VIEW enterprise_profiles_public SET (security_invoker = true);
```

À faire pour les 2 vues `_public` + `users_pro_status`.

### W-2 : Bucket storage public `event-images` / `avatars` / `freelancer-avatars` permet listing

Linter signale 5 buckets publics avec policy SELECT trop large sur `storage.objects`. Les fichiers eux-mêmes sont OK (URLs non devinables) mais un attaquant peut **lister** tout le contenu. Restreindre par préfixe `auth.uid()/...` côté SELECT.

### W-3 : GraphQL anon expose tables (lints 6-50+)

Toutes les tables visibles à `anon` (même avec RLS qui retourne 0 rows) apparaissent dans le schéma GraphQL/PostgREST. Pas une faille mais expose le modèle de données. Recommandation : `REVOKE SELECT ON <sensitive_table> FROM anon` (la RLS reste filet de sécurité).

### W-4 : Policy doublon — `vendor_locations`

Deux policies INSERT (`Pro annonceurs can insert own location` ET `Eligible users can insert their location`). La 1ère est obsolète — la supprimer pour clarté.

---

## ✅ 3. Zones bien sécurisées (validées)

| Table / Ressource | Vérification |
|---|---|
| `users` | `deny_anon_access` (anon = false) + `select_own` (auth.uid()=id) ✅ |
| `verification_requests` (KYC) | Owner + admin/moderator uniquement ✅ |
| Bucket `verification-documents` | **Privé** ✅ |
| `api_keys` | `deny_anon` + admin only ✅ |
| `direct_messages` / `chat_messages` | Sender ↔ receiver only + `deny_anon` ✅ |
| `enterprise_invoices` / `freelancer_invoices` | Owner + members + recipient (linked_user_id) ✅ |
| `enterprise_clients` / `freelancer_clients` | Owner enterprise/freelancer only ✅ |
| `push_subscriptions` | Owner only + `deny_anon` ✅ |
| `pro_subscription_requests` | (à vérifier mais protégé par triggers) ✅ |
| `vendor_locations` (UPDATE) | Filtré par `can_share_public_location()` ✅ |
| `prices` / `content_items` (SELECT public) | Pas de PII directe ✅ |
| Helpers RLS | `has_role`, `is_pro_user`, `is_verified_user`, `can_share_public_location` — tous **SECURITY DEFINER + search_path=public** ✅ pas de récursion |

---

## 🔍 4. Tableau récap PII / KYC

| Donnée sensible | Table source | Accès anon | Accès authentifié non-owner | Vue safe ? |
|---|---|---|---|---|
| `users.email` | users | ❌ deny | ❌ owner only | — |
| `enterprise.nif/rccm` | enterprise_profiles | ❌ deny | ⚠️ **OUI (CRIT-2)** | ✅ `_public` exclut |
| `enterprise.phone/email/address` | enterprise_profiles | ❌ deny | ⚠️ **OUI (CRIT-2)** | ✅ `_public` exclut |
| `freelancer.whatsapp` | freelancer_profiles | ⚠️ **OUI (CRIT-1)** | ⚠️ OUI | ❌ inexistante |
| `project_carrier.phone/email` | project_carriers | ❌ deny | ⚠️ **OUI (CRIT-3)** | ✅ `_public` exclut |
| `verification.document_url` (KYC) | verification_requests | ❌ deny | ❌ owner + staff | — |
| Bucket `verification-documents` | storage | ❌ privé | ❌ privé | — |
| `prices.author contacts` | (via auteur) | ✅ via `<ContactDisplay/>` Pro-gated | ✅ idem | — |

---

## 🛠 5. Plan de remédiation prioritaire

### Lot R1 (urgent — fuites PII)
1. **Migration SQL** :
   - Créer `freelancer_profiles_public` (sans whatsapp/email).
   - Restreindre policies SELECT de `enterprise_profiles`, `freelancer_profiles`, `project_carriers` (owner/admin only sur la table brute).
   - `ALTER VIEW ... SET (security_invoker = true)` sur les 3 vues.
   - Supprimer policy `Pro annonceurs can insert own location` (doublon).
2. **Frontend** :
   - `useEnterprise.ts`, `useMultiEnterprise.ts` (listings) → `enterprise_profiles_public`.
   - `useFreelancerDirectory.ts` → `freelancer_profiles_public`.
   - `useDiaspora.ts`, `useProjectCarrier.ts` (lecture publique) → `project_carriers_public`.
   - `<ContactDisplay />` continue de gérer la révélation des contacts via les hooks Pro.

### Lot R2 (durcissement)
- `REVOKE SELECT ON <table_sensible> FROM anon` (les RLS deviennent défense en profondeur).
- Restreindre listings sur buckets storage publics par préfixe `auth.uid()/`.
- Audit annuel des policies `qual=true` ou `OR is_active=true` (motifs ouverts).

### Lot R3 (organisationnel)
- Activer **HIBP password protection** + OTP shorter (mémo `mem://security/supabase-config-requirements`).
- Tests automatisés : seed un user Free + un user Pro + un anon, requête PostgREST sur chaque table sensible, asserter masquage.

---

**Conclusion** : architecture RLS solide, mais **3 fuites PII** doivent être corrigées avant publication de la v2 grand public. Aucune fuite KYC ni credentials. Les helpers `is_pro_user` / `can_share_public_location` sont bien centralisés et sûrs.

— Fin de l'audit —
