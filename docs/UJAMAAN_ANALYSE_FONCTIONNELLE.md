# 🔍 Ujamaan — Analyse Fonctionnelle Complète

> Plateforme communautaire des Comores — version 2026
> Domaine : **ujamaan.com** | App mobile Capacitor : **ujamaa-v2**
> Stack : React 18 + Vite + Tailwind + shadcn/ui + Supabase (Postgres, RLS, Realtime, Storage, Edge Functions)

---

## 📑 Table des matières
1. Vision & périmètre
2. Acteurs & profils utilisateurs
3. Cartographie fonctionnelle (modules)
4. Modèle de données (entités principales)
5. Règles métier transverses
6. Flux utilisateur clés
7. Sécurité & permissions
8. Intégrations externes
9. Infrastructure technique
10. Matrice des fonctionnalités par rôle
11. Indicateurs & métriques
12. Forces, limites & recommandations

---

## 1. 🎯 Vision & périmètre

**Mission** : Centraliser l'information économique, sociale et pratique des Comores (4 îles : Grande Comore, Anjouan, Mohéli, Mayotte) au sein d'une plateforme unifiée mobile-first, accessible aux résidents et à la diaspora.

**Périmètre fonctionnel** :
- 📊 **Information** : prix marchés, alertes, événements, services publics
- 💼 **Économie** : annonces, freelance, entreprises, appels d'offres OHADA
- 🌍 **Diaspora** : projets d'investissement participatif
- 🍽️ **Tourisme** : hébergement, restauration, gastronomie
- 🤖 **IA conversationnelle** : assistant Gemini-3-Flash
- 💬 **Social** : messagerie, commentaires, favoris, notifications

---

## 2. 👥 Acteurs & profils utilisateurs

### 2.1 Visiteur anonyme
- Lecture libre des contenus publiés (prix, annonces, événements, etc.)
- Coordonnées masquées (cadenas 🔒)
- Accès à l'IA et à la recherche plein écran
- CTA permanents : connexion / Pro

### 2.2 Utilisateur authentifié (rôle `user`)
- Avatar, profil, favoris, commentaires
- Soumission de prix (modération)
- Messagerie interne (avec filtrage auto des contacts)
- Notifications push et in-app
- **Ne voit pas** les contacts (sauf si auteur Pro)

### 2.3 Annonceur (rôle `annonceur`)
- Demande via `pending_modifications` → validation admin
- Dashboard `/annonceur` : création prix, annonces, événements, missions, tenders
- Statistiques (vues, CTR, leads)
- Édition via "suggestions" si non-admin

### 2.4 Modérateur (rôle `moderator`)
- Modération contenus, commentaires
- Validation des prix soumis
- Accès `/admin` (sections limitées)

### 2.5 Administrateur (rôle `admin`)
- Accès total : 25+ sections d'admin
- Gestion utilisateurs, rôles, vérifications, paiements, IA, SEO

### 2.6 Statuts transverses (indépendants du rôle)
| Statut | Acquisition | Bénéfice |
|---|---|---|
| **Pro** (5 000 FC/mois) | Abonnement Stripe / Mvola / virement / cash | Voir TOUS les contacts + rendre ses contacts publics + géoloc + stats avancées + badge or |
| **Vérifié** | Formulaire KYC gratuit (annonceur/freelancer/entreprise uniquement) | Géolocalisation publique + badge bleu de confiance |

> ⚠️ **Pro = global** : un seul abonnement débloque tous les bénéfices peu importe le rôle (helper SQL `is_pro_user`, hook `useProStatus`).

---

## 3. 🧩 Cartographie fonctionnelle (modules)

### M1 — Page d'accueil & navigation
- Hero search avec événement DOM `openFullScreenSearch`
- Alertes urgentes en temps réel (`global_announcements` via Realtime)
- Stats live (`LiveStatsBar`)
- 6 cartes services (Prix, Événements, Tenders, Investissement, Infos pratiques, Services)
- Sélecteur d'îles, sections personnalisables (`homepage_sections`)
- Header minimaliste, footer avec liens informationnels

### M2 — Authentification & comptes
- Email/password (Supabase Auth)
- Trigger `auto_assign_default_role` → rôle `user` auto
- Reset password sécurisé (`/reset-password`)
- Gestion sécurité (changement password avec vérification)
- Suppression compte sur demande (`/supprimer-compte`)

### M3 — Module Prix & Marchés
- Granularité : pays > île > ville > village/marché
- Soumission utilisateur avec photos, GPS, marchand fixe vs ambulant
- Trigger `trg_record_price_change` → archive dans `price_history`
- Modal détail (carte, historique graphique, partage social)
- Alertes prix (`price_alerts`) avec notifications

### M4 — Annonces & événements
- `content_items` polymorphe (filtrage OBLIGATOIRE par `type`)
- `events` séparé : 5 images max (5 Mo), inscriptions, paiements
- Événements passés masqués mais conservés (archives + IA)
- Workflow : draft → published (modération admin)

### M5 — Tourisme & gastronomie
- Hébergements avec tarifs min/max/fixe
- `restaurant_menu_items` (menus digitaux)
- `gastronomy_items` + `recipe_ingredients` (recettes traditionnelles)
- Contacts gated (Pro uniquement)

### M6 — Diaspora & investissement
- `diaspora_projects` : levée de fonds participative
- `project_carriers` : profils porteurs (ou rôle `annonceur`)
- `project_investments` : suivi investisseurs
- `project_updates` : actualités projet
- Badge "Vérifié" (admin) ou Pro

### M7 — Freelance
- `freelancer_profiles` (annuaire `/freelance/annuaire`)
- `freelance_jobs` + `freelance_proposals`
- `freelance_reviews` 1-5★
- **CRM Freelancer** : `freelancer_clients`, `freelancer_invoices`, `freelancer_transactions`
- Notification client à la création de facture (`notify_freelancer_invoice`)

### M8 — Entreprises (CRM)
- `enterprise_profiles` multi-profils par user (NIF, RCCM)
- Vue publique `enterprise_profiles_public` (PII masqués)
- `enterprise_members` (équipe)
- CRM complet : `enterprise_clients`, `enterprise_invoices`, `enterprise_transactions`
- Tenders OHADA conformes

### M9 — Appels d'offres
- `tender_submissions` (publics ou privés)
- Conformité OHADA
- Soumissions par freelancers/entreprises

### M10 — Géolocalisation vendeurs (`vendor_locations`)
- **Mode Ambulant** : `watchPosition` live (icône verte pulsante)
- **Mode Fixe** : adresse statique (icône bleue maison)
- Accès : Pro OU Vérifié (helper `can_share_public_location`)
- Carte publique `/vendeurs/carte` avec lien Google Maps Itinéraire

### M11 — IA Assistant (Gemini-3-Flash)
- Edge function `ai-chat` (verify_jwt = false)
- Double rôle : données temps réel + guide plateforme
- Format markdown + boutons dynamiques (jamais d'URL brute)
- Contexte 20 messages, fenêtre prix 200, temp 0.3
- Sources externes : `ai_knowledge_sources`
- Logs : `ai_conversations` + export CSV admin
- Sync chat flottant ↔ recherche plein écran via localStorage

### M12 — Messagerie & social
- `direct_messages` + `chat_attachments`
- Filtrage auto contacts pour non-Pro (`🔒 [n° masqué]`)
- Realtime via `useRealtimeMessages`
- `content_comments` polymorphe
- `favorites` (tous types)

### M13 — Notifications
- `notifications` (in-app) + Web Push (`push_subscriptions`)
- Edge functions `send-push` & `notify-broadcast`
- Triggers DB : factures, validations, modifications
- UI unifiée alertes globales + notifications privées

### M14 — Vérifications & KYC
- `verification_requests` (KYC documents)
- Bucket privé `verification-documents`
- Validation admin → privilege `verified` + badge bleu
- Débloque géoloc publique

### M15 — Paiements & abonnements Pro
- `pro_subscription_requests` (Stripe, Mvola USSD, virement, cash partenaire)
- `promo_codes` (flat ou %)
- `partner_accounts` + `partner_transactions` (encaissement cash)
- Trigger `partner_collect_to_pro_request` → demande Pro auto-approuvée
- `announcer_privileges` (history des privilèges accordés)

### M16 — Infos pratiques
- `taxi_fares` (tarifs taxis par route)
- `pharmacy_guards` (pharmacies de garde)
- Géré par admin

### M17 — Administration
- `/admin` : 25+ sections (modération, prix, ads, IA, tourisme, partenaires, vérifications, SEO, sécurité, etc.)
- `admin_actions` (audit log)
- `pending_modifications` (workflow de validation)
- `homepage_sections` & `homepage_categories` (personnalisation)
- `static_pages` (CMS pages statiques)
- `site_settings` & `site_analytics`

### M18 — Publicité
- `ads` avec position, taille, dates, click_count, impression_count
- Lazy loading + tracking CTR
- Stats admin

### M19 — API Mobile
- Edge function `mobile-api` (auth `x-api-key` + JWT user)
- Endpoints : `/auth/{login,refresh,me}`, `/public/*`, `/ai-chat`
- Table `api_keys` (clés app hashées)

### M20 — PWA
- Service Worker (NetworkFirst API + CacheFirst assets, 5 Mo)
- Page `/install` intelligente
- Web Push integration

---

## 4. 🗄️ Modèle de données (60+ tables)

**Identité & rôles** : `users`, `user_roles`, `announcer_privileges`, `verification_requests`
**Contenu** : `content_items`, `events`, `prices`, `price_history`, `diaspora_projects`, `freelance_jobs`
**Profils** : `freelancer_profiles`, `enterprise_profiles`, `project_carriers`
**CRM** : `*_clients`, `*_invoices`, `*_transactions` (freelancer + enterprise)
**Social** : `direct_messages`, `chat_attachments`, `content_comments`, `favorites`, `notifications`
**Géoloc** : `vendor_locations` (avec `is_mobile`, `address`)
**Paiement** : `pro_subscription_requests`, `promo_codes`, `partner_*`
**Tourisme** : `gastronomy_items`, `recipe_ingredients`, `restaurant_menu_items`
**Pratique** : `taxi_fares`, `pharmacy_guards`
**IA** : `ai_conversations`, `ai_knowledge_sources`, `chat_messages`
**Admin** : `admin_actions`, `pending_modifications`, `homepage_sections`, `static_pages`, `site_settings`, `ads`, `api_keys`, `global_announcements`

---

## 5. ⚙️ Règles métier transverses

### R1 — Visibilité des contacts
**Gate `<ContactDisplay />`** : `viewerIsPro || authorIsPro` → coordonnées affichées, sinon CTA Pro/login.

### R2 — Pro global
Un abonnement Pro débloque tout, partout. Hook unique `useProStatus()`. `is_pro_annonceur` = alias deprecated.

### R3 — Vérifié ≠ Pro
Vérifié est gratuit, indépendant, et débloque uniquement la géoloc publique. Réservé aux annonceurs/freelancers/entreprises.

### R4 — Filtrage polymorphe
`content_items` MUST be filtered by `type` (annonce, tourisme, etc.) — sinon contamination croisée.

### R5 — Événements passés
Cachés au public, conservés pour archives + IA.

### R6 — Filtrage messagerie
Chat masque automatiquement n° tél / emails / liens pour non-Pro.

### R7 — Modération
Contenus annonceurs en `draft` → admin valide → `published`. Notification automatique à l'auteur.

### R8 — Anti N+1
Toujours utiliser `get_user_role()` RPC plutôt que requêtes répétées.

### R9 — RLS deny-anon
Tables sensibles bloquées aux anons. Vues `_public` masquent NIF/RCCM/téléphone.

### R10 — Storage isolation
Bucket folders = `auth.uid()/...` — utilisateur ne peut accéder qu'à son dossier.

---

## 6. 🔄 Flux utilisateur clés

### F1 — Inscription → contribution
1. Sign up email/password → trigger assigne rôle `user`
2. WelcomeDialog onboarding
3. Soumission de prix → modération → publication
4. Notification de publication

### F2 — Devenir Annonceur
1. Demande sur `/profil` → `pending_modifications`
2. Admin valide → rôle `annonceur` + accès `/annonceur`
3. UpgradePrompt contextuel pour Pro

### F3 — Devenir Pro
1. CTA sur `/pro` → choix méthode paiement
2. Stripe direct OU Mvola USSD (`tel:`) OU virement OU cash partenaire
3. Validation admin (sauf cash partenaire = auto)
4. `is_pro_user` = true → tous les gates s'ouvrent

### F4 — Recherche IA
1. Hero search → événement DOM → modal plein écran
2. Promise.allSettled sur tables avec wildcard `*`
3. IA Gemini formate la réponse + boutons dynamiques
4. Sync historique localStorage avec chat flottant

### F5 — Géolocalisation vendeur
1. Vendeur Pro/Vérifié active partage sur `/profil`
2. Choix mode (Ambulant/Fixe) + durée
3. Si Ambulant : `watchPosition` met à jour live
4. Visible sur `/vendeurs/carte` (icônes différenciées)

### F6 — Facturation freelancer
1. Création client dans CRM
2. Émission facture
3. Trigger `notify_freelancer_invoice` → notification au client lié
4. Suivi paiement + transaction

---

## 7. 🔐 Sécurité & permissions

- **Auth** : Supabase Auth, JWT, refresh rotation
- **Rôles** : table dédiée `user_roles` (jamais sur users), enum `app_role`
- **Helpers SQL** : `has_role()`, `get_user_role()`, `is_pro_user()`, `is_verified_user()`, `can_share_public_location()`, `is_project_carrier()`
- **RLS** : activée sur 100% des tables, `deny-anon` sur sensibles
- **Vues publiques** : `_public` masquent PII (NIF, RCCM, téléphones)
- **Storage** : isolation par `auth.uid()`, bucket privé pour KYC
- **CSP** : configuré pour GA4
- **HIBP** : protection mots de passe compromis (Supabase config)
- **OTP** : durée réduite

---

## 8. 🔌 Intégrations externes

| Service | Usage |
|---|---|
| Stripe | Paiements CB internationaux |
| Mvola | USSD mobile (Madagascar/Comores) + QR desktop |
| Lovable AI Gateway | Gemini-3-Flash (IA) |
| Web Push API | Notifications navigateur |
| Capacitor | App mobile native |
| Google Maps | Liens itinéraires |
| Google Analytics 4 | Tracking |
| Leaflet | Carte vendeurs |

---

## 9. 🏗️ Infrastructure technique

```
┌─ FRONTEND ────────────────────────────────┐
│ React 18 + Vite + TypeScript              │
│ Tailwind + shadcn/ui + Radix              │
│ TanStack Query (cache + invalidation)     │
│ React Router (SPA, <Link>)                │
│ Capacitor (mobile native)                 │
└────────────────┬──────────────────────────┘
                 │
┌─ SUPABASE ─────▼──────────────────────────┐
│ Postgres + RLS                            │
│ Realtime (alertes, messages, vendeurs)    │
│ Storage (avatars, events, KYC)            │
│ Auth (email, JWT)                         │
│ Edge Functions :                          │
│   • ai-chat (Gemini, public)              │
│   • mobile-api (JWT user, public)         │
│   • send-push (Web Push)                  │
│   • notify-broadcast (alertes globales)   │
└───────────────────────────────────────────┘
```

**Performance** :
- Lazy loading composants (Suspense + skeletons)
- TanStack Query staleTime + Realtime selective invalidation
- Service Worker (PWA, 5 Mo cache)
- Images : CacheFirst, API : NetworkFirst
- Debounce search 120ms

---

## 10. 📊 Matrice des fonctionnalités par rôle

| Fonctionnalité | Visiteur | User Free | User Pro | Annonceur | Annonceur Pro | Modérateur | Admin |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Lire prix/annonces/événements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir contacts auteur Free | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Voir contacts auteur Pro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soumettre un prix | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favoris / commentaires | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Messagerie | ❌ | ✅ filtrée | ✅ libre | ✅ filtrée | ✅ libre | ✅ | ✅ |
| Publier annonce/événement | ❌ | ❌ | ❌ | ✅ draft | ✅ direct | ✅ | ✅ |
| Contacts publics sur publications | — | — | ✅ | ❌ | ✅ | ✅ | ✅ |
| Géoloc publique (Pro OU Vérifié) | ❌ | ❌ | ✅ | si Vérifié | ✅ | ✅ | ✅ |
| CRM (freelance/entreprise) | ❌ | ❌ | ✅ si profil | ✅ si profil | ✅ | — | ✅ |
| Stats avancées | ❌ | ❌ | ✅ | partielles | ✅ | ✅ | ✅ |
| Modération contenus | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Admin (utilisateurs, paiements, IA) | ❌ | ❌ | ❌ | ❌ | ❌ | partiel | ✅ |

---

## 11. 📈 Indicateurs & métriques

**Côté utilisateur** :
- Vues par contenu (`views`, incrément après fetch)
- CTR pubs (`click_count` / `impression_count`)
- Leads (clics contacts)
- Reviews freelancer (1-5★)

**Côté admin** :
- `site_analytics` : trafic global
- `admin_actions` : audit log
- IA : nb conversations, export CSV
- Pro : nb abonnements actifs, MRR
- Modération : queue, temps moyen de validation

---

## 12. ✅ Forces, ⚠️ limites & 💡 recommandations

### Forces
1. **Architecture cohérente** : RLS partout, helpers SQL centralisés, vues publiques sécurisées
2. **Modèle Pro global** simple à comprendre et à monétiser
3. **Mobile-first** réel (Capacitor + PWA + Web Push)
4. **IA contextuelle** intégrée à la donnée temps réel
5. **CRM intégré** différenciant (freelance + entreprise)
6. **Multi-paiement** adapté au contexte local (Mvola, cash partenaire)

### Limites actuelles
1. **Complexité produit** élevée — risque de friction onboarding
2. **Polymorphisme `content_items`** fragile (oubli de filtre `type` = bug critique)
3. **Pas de versioning** des publications validées
4. **Pas de système de litiges** sur freelance/missions
5. **Recherche géo** non spatiale (pas de PostGIS)
6. **Pas de file d'attente** pour notifications massives

### Recommandations prioritaires
| Priorité | Action | Impact |
|:-:|---|---|
| 🔴 Haute | Onboarding interactif différencié par rôle | Adoption |
| 🔴 Haute | Tableau de bord unifié "Pro" (avantages débloqués) | Conversion |
| 🟠 Moyenne | Migration `content_items` → tables typées | Maintenabilité |
| 🟠 Moyenne | PostGIS pour géoloc (recherche par rayon) | UX vendeurs |
| 🟢 Basse | Système de litiges + escrow freelance | Confiance |
| 🟢 Basse | API publique documentée (Swagger) | Écosystème |

---

## 📌 Synthèse exécutive

**Ujamaan est une super-app communautaire** combinant 4 verticales (information, économie, social, services) avec un modèle freemium clair (**Pro global = 5 000 FC/mois**) et une infrastructure technique solide (Supabase + React + Capacitor).

**Le principal levier de croissance** est la **conversion Free → Pro**, déclenchée par la valeur immédiate (voir tous les contacts) et l'effet réseau (publier avec contacts visibles à tous). Le modèle de paiement multi-canal (Mvola, cash partenaire) lève les freins du contexte local.

**Les principaux risques** sont liés à la **complexité produit** (UX à simplifier) et à la **fragilité du modèle polymorphe** (à long terme, migration vers tables typées recommandée).

---

**Document généré le 28 avril 2026 — Ujamaan v2**
