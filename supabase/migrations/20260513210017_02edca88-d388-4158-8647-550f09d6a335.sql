
-- Hide sensitive contact columns from anonymous role on public listings.
-- Authenticated users keep full access; ContactDisplay handles Pro gating.

REVOKE SELECT (contact_phone, contact_whatsapp) ON public.content_items FROM anon;
REVOKE SELECT (contact_phone, contact_email)    ON public.events        FROM anon;
