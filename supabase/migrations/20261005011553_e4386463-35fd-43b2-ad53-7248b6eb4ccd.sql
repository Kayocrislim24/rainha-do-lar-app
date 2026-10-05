ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS edit_token uuid;
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, user_id, nome, nota, comentario, fotos, avatar, created_at) ON public.reviews TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_review(_id uuid, _token uuid, _nome text, _nota int, _comentario text, _fotos jsonb, _avatar text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF _token IS NULL OR length(trim(_nome)) < 1 OR length(_nome) > 80 OR _nota < 1 OR _nota > 5
     OR length(trim(_comentario)) < 3 OR length(_comentario) > 1000
     OR jsonb_typeof(_fotos) <> 'array' OR jsonb_array_length(_fotos) > 3 THEN RETURN false; END IF;
  UPDATE reviews SET nome = trim(_nome), nota = _nota, comentario = trim(_comentario), fotos = _fotos, avatar = coalesce(_avatar, '')
   WHERE id = _id AND edit_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.delete_review(_id uuid, _token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF _token IS NULL THEN RETURN false; END IF;
  DELETE FROM reviews WHERE id = _id AND edit_token = _token;
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n > 0;
END $$;

GRANT EXECUTE ON FUNCTION public.update_review(uuid, uuid, text, int, text, jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_review(uuid, uuid) TO anon, authenticated;