DROP FUNCTION IF EXISTS public.update_review(uuid, uuid, text, integer, text, jsonb, jsonb, text);

CREATE OR REPLACE FUNCTION public.update_review(
  _id uuid,
  _token uuid,
  _nome text,
  _nota integer,
  _comentario text,
  _fotos jsonb,
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
     OR jsonb_typeof(_fotos) <> 'array' OR jsonb_array_length(_fotos) > 4 THEN RETURN false; END IF;
  UPDATE reviews
     SET nome = trim(_nome), nota = _nota, comentario = trim(_comentario), fotos = _fotos,
         avatar = coalesce(_avatar, '')
   WHERE id = _id AND edit_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $function$;

GRANT EXECUTE ON FUNCTION public.update_review(uuid, uuid, text, integer, text, jsonb, text) TO anon, authenticated;

DROP POLICY IF EXISTS "reviews insert" ON public.reviews;
CREATE POLICY "reviews insert" ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  (((auth.uid() IS NULL) AND (user_id IS NULL)) OR (user_id = auth.uid()))
  AND jsonb_typeof(fotos) = 'array'
  AND jsonb_array_length(fotos) <= 4
);

ALTER TABLE public.reviews DROP COLUMN IF EXISTS videos;

REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, user_id, nome, nota, comentario, fotos, avatar, created_at) ON public.reviews TO anon, authenticated;
