

## Plan: Implementation of Role-Based Features

This is a large feature set spanning 4 user roles. Here is the structured plan broken into phases.

---

### Phase 1: Database Schema (Migration)

Create the following new tables:

**`homepage_sections`** - Admin-controlled homepage layout
- `id`, `section_key` (text, unique: hero, categories, announcements, islands, etc.), `title`, `is_visible` (bool, default true), `sort_order` (int), `config` (jsonb), `updated_at`, `updated_by`
- RLS: public SELECT, admin-only UPDATE/INSERT

**`content_comments`** - User comments on content
- `id` (uuid), `user_id` (uuid), `content_type` (text: announcement, event, price), `content_id` (uuid), `body` (text), `created_at`, `updated_at`
- RLS: public SELECT, authenticated INSERT (own), owner UPDATE/DELETE

**`favorites`** - User bookmarks
- `id` (uuid), `user_id` (uuid), `content_type` (text), `content_id` (uuid), `created_at`
- Unique constraint on (user_id, content_type, content_id)
- RLS: owner-only CRUD

**`reports`** - Content flagging
- `id` (uuid), `user_id` (uuid), `content_type` (text), `content_id` (uuid), `reason` (text), `details` (text), `status` (text: pending/reviewed/dismissed), `reviewed_by` (uuid), `created_at`
- RLS: authenticated INSERT (own), owner SELECT (own), moderator/admin SELECT all + UPDATE

**`announcer_privileges`** - Advertiser privilege tracking
- `id` (uuid), `user_id` (uuid), `privilege` (text: pro, verified, boost_ia, contact_direct), `is_active` (bool), `granted_by` (uuid), `expires_at` (timestamptz), `created_at`
- RLS: owner SELECT, admin ALL

**Update `content_items` RLS** - Add policy allowing annonceurs to INSERT their own content (status defaults to 'draft', requiring moderation).

**Seed `homepage_sections`** with entries for each current Index.tsx section (hero, islands, announcements, categories, quick_actions, ai_assistant, ads) with default sort order.

---

### Phase 2: Admin - Full Homepage Customization

**Files to modify:**
- `src/pages/Index.tsx` - Fetch `homepage_sections` and render sections dynamically based on `is_visible` and `sort_order`
- `src/components/admin/HomepageManagementSection.tsx` - Add a "Mise en Page" tab that actually reads/writes `homepage_sections` (currently it's static). Allow drag-to-reorder and toggle visibility for each section.

---

### Phase 3: Moderator - Content Creation + Moderation Queue

**New files:**
- `src/components/admin/ModerationQueueSection.tsx` - List all reports, pending content from annonceurs, with approve/reject actions
- Update `src/components/admin/ContentManagementSection.tsx` - Add "Créer une annonce" form for moderators to publish directly (status = 'published')

**Sidebar update:** Add "File d'attente modération" menu item for moderators.

---

### Phase 4: Annonceur - Dashboard & Privileges

**New files:**
- `src/pages/AnnouncerDashboard.tsx` - Dedicated dashboard for annonceurs with:
  - My announcements list (CRUD on own content_items)
  - Create new announcement form (submits as 'draft')
  - Privilege badges display (Pro, Verified, Boost IA, Contact Direct)
  - Stats on own content (views, etc.)
  - Upgrade/downgrade section linking to `/pro`

**Route:** Add `/annonceur` route in App.tsx, protected for annonceur+ roles.

**Profile page update:** Add "Mes privilèges" card showing active privileges and upgrade CTA for annonceurs.

---

### Phase 5: User (Visitor) - Social Interactions

**New components:**
- `src/components/CommentSection.tsx` - Reusable comment list + form, used on AnnouncementDetail, EventDetail
- `src/components/FavoriteButton.tsx` - Toggle heart button, usable on any content card
- `src/components/ReportButton.tsx` - Flag content button opening a reason dialog

**Profile page updates:**
- Add "Favoris" tab showing saved content
- Add "Historique" showing recent viewed/commented items
- Add "Signalements" tab showing user's own reports and their status

**Integration points:**
- `src/pages/AnnouncementDetail.tsx` - Add CommentSection, FavoriteButton, ReportButton
- `src/pages/EventDetail.tsx` - Same additions
- `src/pages/AnnouncementsPage.tsx` - Add FavoriteButton on cards

---

### Phase 6: Annonceur Privilege Management (Admin Side)

**Update `src/components/admin/UserManagementSection.tsx`:**
- Add section to manage announcer privileges (grant/revoke Pro, Verified, Boost IA, Contact Direct)
- Show privilege badges next to user names

**Stripe integration** (deferred): The Stripe payment flow for self-service upgrades can be enabled later via the Stripe tool. For now, admin manual assignment + the existing `/pro` page.

---

### Technical Notes

- The `app_role` enum already includes `annonceur` -- no enum change needed.
- The existing `has_role()` security definer function will be reused in all new RLS policies.
- `content_items` already has a `status` field with draft/published -- annonceur submissions will use 'draft' by default.
- Homepage sections will be rendered via a mapping object in Index.tsx that maps `section_key` to React components.
- All new tables use UUID primary keys and proper RLS with `has_role()` to avoid recursion.

---

### Implementation Order

1. Database migration (all new tables + RLS + seed data)
2. Homepage dynamic rendering + admin management
3. Comment, Favorite, Report components + user profile tabs
4. Annonceur dashboard + content creation
5. Moderator queue + content approval workflow
6. Admin privilege management for annonceurs

