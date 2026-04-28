# 📘 Ujamaan — Guide Produit Complet

> Plateforme communautaire des Comores : prix, annonces, événements, tourisme, freelances, entreprises, diaspora.
> Domaine : **ujamaan.com** — App mobile : **Ujamaan** (Capacitor).

---

## 1. 🌍 Expérience Visiteur (non connecté)

Le visiteur peut **explorer librement** sans compte :

| Section | Accès | Limites |
|---|---|---|
| Page d'accueil (Hero, catégories, alertes) | ✅ Total | — |
| Prix (liste, détail, historique, carte) | ✅ Lecture | Pas de signalement, pas de favoris |
| Annonces / Événements / Tourisme / Diaspora / Freelances | ✅ Lecture | **Coordonnées masquées** (cadenas 🔒) |
| Recherche IA + plein écran | ✅ | Historique non sauvegardé |
| Carte des vendeurs (`/vendeurs/carte`) | ✅ | — |
| Guide interactif (`/guide`), Page Pro (`/pro`) | ✅ | — |

**CTA permanents** : « Se connecter » / « Devenir Pro » sur les contacts masqués.

---

## 2. 👤 Utilisateur Free vs Pro

### Compte Free (par défaut à l'inscription)
- Rôle DB : `user` (auto-assigné via trigger `auto_assign_default_role`)
- Avatar, bio, favoris, commentaires, signalements de prix
- **Messagerie interne** activée (filtrage auto des n° tel / emails / liens : `🔒 [n° masqué]`)
- Notifications push & in-app
- Soumission de prix (avec modération)
- **NE VOIT PAS** les coordonnées des autres annonceurs (sauf si l'auteur est Pro)

### Compte Pro (5 000 FC/mois — Stripe, Mvola USSD, virement, cash via partenaire)
✅ **Pro = GLOBAL** : un seul abonnement débloque TOUS les bénéfices, peu importe le rôle.

| Bénéfice | Détail |
|---|---|
| 👁️ Voir tous les contacts | Téléphone, email, WhatsApp de **tous** les contenus (même auteurs Free) |
| 📢 Publier avec contacts visibles | Toutes ses publications (prix, annonces, tourisme, projets, missions) affichent ses coordonnées **à tout le monde** |
| 💬 Messagerie sans filtrage | Partage de n° / liens autorisé |
| 📍 Géolocalisation publique | Mode **Ambulant** (live GPS) ou **Fixe** sur la carte vendeurs |
| 📊 Stats avancées | Vues, CTR, leads sur ses publications |
| 🏷️ Badge Pro | Visible partout |
| 🎟️ Promo codes | Réductions sur l'abonnement |

### Compte Vérifié (gratuit, sur formulaire KYC)
- Indépendant du Pro. Réservé aux **annonceurs / freelancers / entreprises**.
- Débloque **uniquement** la géolocalisation publique (carte) + badge bleu de confiance.
- Helper : `can_share_public_location(uid)`.

---

## 3. 📢 Flux Annonceur

1. **Demande de rôle** depuis `/profil` → table `pending_modifications` → admin valide.
2. Accès à **`/annonceur`** (dashboard dédié) :
   - Création : prix, annonces, événements (5 images max, 5 Mo), missions freelance, tenders OHADA
   - Stats : vues, CTR, leads
   - Gestion de ses publications (édition via "suggestions" si non-admin)
3. **Si Pro** : ses contacts sont publics sur toutes ses publications.
4. **Si Vérifié** : peut activer la géoloc publique (Ambulant/Fixe).

---

## 4. 💼 Flux Freelance

1. Création du profil sur `/freelance` → `freelancer_profiles` (compétences, tarif min/max, dispo).
2. Visible dans l'annuaire `/freelance/annuaire` (filtres compétence + île).
3. **Contacts cachés** sauf si freelancer Pro OU visiteur Pro.
4. **CRM Freelancer** : clients, factures (notification auto au client lié `notify_freelancer_invoice`), paiements.
5. Reviews 1-5 étoiles (validation trigger).
6. Si Vérifié → géoloc publique possible.

---

## 5. 🏢 Comptes Entreprise

- Multi-profils par utilisateur (`enterprise_profiles` : NIF, RCCM).
- Vue publique masquée via `enterprise_profiles_public` (PII protégés).
- **CRM** : clients, factures, comptabilité (`/entreprise`).
- **Tenders OHADA** : appels d'offres conformes.
- SLA 99.9 %, support « Sur devis ».
- Si Pro → contacts publics. Si Vérifié → géoloc publique + badge.

---

## 6. 📱 UX Mobile complète

### App native (Capacitor `ujamaa-v2`)
- Partage la même infra Supabase + edge function **`mobile-api`** (JWT user).
- Endpoints publics : `/auth/login`, `/auth/refresh`, `/auth/me`, `/public/{prices|events|content|...}`, `/ai-chat`.
- Auth via `x-api-key` (clé app) + JWT Supabase utilisateur en `Authorization: Bearer`.

### PWA (web mobile)
- Installable depuis `/install`
- Service Worker : NetworkFirst (API) + CacheFirst (assets), cache 5 Mo
- Push notifications Web Push (table `push_subscriptions`)

### UI mobile-first
- Header minimaliste (hamburger drawer)
- Chatbox flottante en plein écran sur mobile
- Pas de scroll horizontal — composants Drawer pour menus longs
- Boutons tactiles ≥ 44px

---

## 7. 🤖 IA Assistant (Gemini-3-Flash)

- **Double rôle** : données temps réel (prix, événements) + guide plateforme (Mvola, CRM, PWA, Pro).
- Format markdown, pas d'URL brutes → boutons dynamiques en bas de réponse.
- Contexte 20 messages, fenêtre prix : 200, temp 0.3.
- Scope : 4 îles des Comores (Grande Comore, Anjouan, Mohéli, Mayotte) — **aucune distinction politique**.
- Synchronisation chat flottant ↔ recherche plein écran via localStorage.
- Logs admin avec export CSV (séparateur `;`).

---

## 8. 🔐 Sécurité & Permissions

- **Rôles** (`app_role`) : `admin`, `moderator`, `annonceur`, `user` — table dédiée `user_roles` (jamais sur `users`).
- Accès via `has_role()` + `get_user_role()` (anti N+1).
- **RLS** : `deny-anon` sur tables sensibles ; vues `_public` masquent NIF, RCCM, téléphones.
- Buckets storage : `auth.uid()/...` (utilisateur ne peut accéder qu'à son dossier).
- Vérification KYC : bucket `verification-documents` (privé).

---

## 9. 💸 Paiements

| Méthode | Détail |
|---|---|
| Stripe | CB internationale |
| Mvola USSD | Lien `tel:` mobile + QR code dynamique desktop |
| Virement bancaire | RIB affiché |
| Cash via partenaire | Encaissement → trigger `partner_collect_to_pro_request` crée la demande Pro auto-approuvée |

Promo codes : flat ou %, gérés admin.

---

## 10. 🎛️ Admin

- `/admin` : 25+ sections (modération, prix, ads, IA, tourisme, partenaires, vérifications…)
- Tous les changements de statut → notification auto à l'utilisateur (système de feedback admin).
- Layout homepage personnalisable (`homepage_sections`).
- Sources de connaissance IA gérées (`ai_knowledge_sources`).

---

## 11. ⚠️ Note produit importante

Le système est **puissant mais complexe**. Recommandations UX :

1. **Cacher la complexité technique** — l'utilisateur ne doit jamais voir « RLS », « JWT », « slugs ».
2. **Communiquer clairement les bénéfices Pro** :
   - Sur chaque contact masqué : « Devenez Pro pour voir tous les contacts »
   - Sur chaque publication Free : « Devenez Pro pour rendre vos contacts visibles à tous »
3. **Onboarding contextuel** : `WelcomeDialog` + `UpgradePrompt` selon le rôle.
4. **Différencier visuellement** : badge Pro (or), badge Vérifié (bleu), badge Entreprise.

---

## 12. 🗺️ Architecture en bref

```
Frontend (React 18 + Vite + Tailwind + shadcn)
   │
   ├─ Hooks centraux : useProStatus, useAuthorProStatus, useRole, useVendorLocation
   ├─ Gates UI : <ContactDisplay>, <ProFeaturesGate>, <UpgradePrompt>
   │
Supabase (Postgres + RLS + Realtime + Storage + Edge Functions)
   │
   ├─ Helpers SQL : is_pro_user, is_verified_user, can_share_public_location, has_role
   ├─ Triggers : auto_assign_default_role, sync_pro_subscription_approval, record_price_change
   └─ Edge Functions : ai-chat, send-push, notify-broadcast, mobile-api
```

---

**Fin du document — Ujamaan v2 — 2026**
