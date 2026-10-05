ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, user_id, nome, nota, comentario, fotos, videos, avatar, created_at) ON public.reviews TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_review(
  _id uuid,
  _token uuid,
  _nome text,
  _nota integer,
  _comentario text,
  _fotos jsonb,
  _videos jsonb,
  _avatar text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE n int;
BEGIN
  IF _token IS NULL OR length(trim(_nome)) < 1 OR length(_nome) > 80 OR _nota < 1 OR _nota > 5
     OR length(trim(_comentario)) < 3 OR length(_comentario) > 1000
     OR jsonb_typeof(_fotos) <> 'array' OR jsonb_array_length(_fotos) > 3
     OR jsonb_typeof(_videos) <> 'array' OR jsonb_array_length(_videos) > 1 THEN RETURN false; END IF;
  UPDATE reviews
     SET nome = trim(_nome), nota = _nota, comentario = trim(_comentario), fotos = _fotos,
         videos = _videos, avatar = coalesce(_avatar, '')
   WHERE id = _id AND edit_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $function$;

GRANT EXECUTE ON FUNCTION public.update_review(uuid, uuid, text, integer, text, jsonb, jsonb, text) TO anon, authenticated;

DROP POLICY IF EXISTS "review media public read" ON storage.objects;
CREATE POLICY "review media public read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "review media upload" ON storage.objects;
CREATE POLICY "review media upload"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'review-media'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov')
);

DROP POLICY IF EXISTS "review media admin delete" ON storage.objects;
CREATE POLICY "review media admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));
