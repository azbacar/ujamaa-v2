

## Plan : Chat annonceur Pro + Formulaire de vérification + Diagnostic plateforme

### Contexte

Actuellement, le bouton "Contacter" sur les freelancers redirige vers `/messages/:userId`, mais il n'y a pas de bouton de chat intégré sur les pages de détail des annonces. Les annonceurs Pro affichent leur téléphone/WhatsApp mais pas de bouton de messagerie interne. Il n'existe aucun système de vérification pour les freelancers et annonceurs de projets.

---

### 1. Bouton "Contacter par chat" sur les annonces Pro

**Fichier** : `src/pages/AnnouncementDetail.tsx`

- Ajouter un bouton "Envoyer un message" dans le bloc Contact (sidebar) visible uniquement si l'auteur est Pro (`isAuthorPro`)
- Au clic : redirige vers `/messages/{author_id}` (messagerie interne existante)
- Utilisateurs non connectes : redirige vers `/auth`

**Fichier** : `src/pages/EventDetail.tsx`
- Meme logique : bouton chat interne si l'organisateur est Pro

**Fichier** : `src/pages/DiasporaProjectDetail.tsx`
- Bouton chat interne vers le porteur de projet Pro

---

### 2. Formulaire de demande de vérification

**Migration SQL** : Nouvelle table `verification_requests`

```text
verification_requests
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── type ('freelancer' | 'announcer' | 'project_carrier')
├── business_name (text)
├── document_type (text) - CIN, passeport, registre commerce
├── document_url (text) - fichier uploadé
├── additional_info (text)
├── status ('pending' | 'approved' | 'rejected')
├── reviewed_by (uuid)
├── reviewed_at (timestamptz)
├── review_notes (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

- Bucket storage `verification-documents` (privé, accès authentifié uniquement)
- RLS : utilisateurs insèrent/voient les leurs ; admins/modérateurs voient et mettent à jour tout

**Fichier** : `src/components/VerificationRequestForm.tsx` (nouveau)
- Formulaire : type de profil, nom, type de document, upload du document, informations complémentaires
- Accessible depuis la page profil et le dashboard freelancer/annonceur
- Affiche le statut de la demande existante si déjà soumise

**Fichier** : `src/pages/ProfilePage.tsx`
- Ajouter un onglet/section "Vérification" avec badge de statut et accès au formulaire

**Fichier** : `src/components/admin/VerificationManagementSection.tsx` (nouveau)
- Liste des demandes pendantes avec aperçu du document
- Boutons approuver/rejeter avec notes
- L'approbation met à jour `announcer_privileges` (privilege='verified') ou un badge sur le profil freelancer

**Fichier** : `src/pages/AdminDashboard.tsx`
- Ajouter l'entrée "Vérifications" dans le sidebar admin

---

### 3. Diagnostic complet de la plateforme

Bugs et incohérences identifiés à corriger :

| Problème | Fichier | Correction |
|----------|---------|------------|
| Warning `Missing Description` sur DialogContent | Multiples dialogs | Ajouter `DialogDescription` ou `aria-describedby` |
| `AnnouncementDetail` : pas de bouton chat malgré messagerie existante | `AnnouncementDetail.tsx` | Ajouter bouton (point 1) |
| `legacyAnnouncements` hardcodé inutile | `AnnouncementDetail.tsx` | Nettoyer le code legacy |
| `useRole` retourne le premier rôle alphabétiquement (`limit(1)` + `order('role')`) ce qui peut donner 'admin' au lieu de 'user' si multiple rôles | `useRole.tsx` | Aligner avec `get_user_role()` qui a la bonne hiérarchie |
| `EventDetail` : `dangerouslySetInnerHTML` sans DOMPurify potentiel | `EventDetail.tsx` | Vérifier sanitization |
| Messages page : pas de responsive mobile (conversation list toujours visible) | `MessagesPage.tsx` | Cacher la liste quand un partnerId est sélectionné sur mobile |

---

### 4. Ordre d'implémentation

1. Migration SQL (table `verification_requests` + bucket storage)
2. Composant `VerificationRequestForm` + intégration profil
3. Section admin `VerificationManagementSection`
4. Boutons chat Pro sur les pages de détail (annonces, événements, projets)
5. Corrections des bugs identifiés (DialogDescription, responsive messages, etc.)

---

### Détails techniques

- La messagerie interne (`direct_messages` + `useMessages.ts`) est déjà fonctionnelle -- on réutilise simplement les routes existantes
- Le statut "vérifié" sera matérialisé par une entrée dans `announcer_privileges` avec `privilege = 'verified'`
- Les documents de vérification seront stockés dans un bucket privé (pas public) avec RLS pour protéger les données sensibles

