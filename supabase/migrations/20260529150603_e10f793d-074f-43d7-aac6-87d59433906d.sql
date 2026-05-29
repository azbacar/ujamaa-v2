CREATE OR REPLACE FUNCTION public.increment_content_view(_type text, _id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  CASE _type
    WHEN 'content_item' THEN
      UPDATE public.content_items SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'event' THEN
      UPDATE public.events SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'invest', 'investment', 'diaspora_project' THEN
      UPDATE public.investments SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'freelance_job' THEN
      UPDATE public.freelance_jobs SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'freelancer', 'freelancer_profile' THEN
      UPDATE public.freelancer_profiles SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'gastronomy', 'gastronomy_item', 'tourism' THEN
      UPDATE public.gastronomy_items SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    WHEN 'price' THEN
      UPDATE public.prices SET views = COALESCE(views, 0) + 1 WHERE id = _id;
    ELSE
      RAISE NOTICE 'Unknown content type: %', _type;
  END CASE;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.increment_content_view(text, uuid) TO anon, authenticated;