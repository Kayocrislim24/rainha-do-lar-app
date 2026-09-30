CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid,
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 80),
  nota integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text NOT NULL CHECK (char_length(comentario) BETWEEN 1 AND 1000),
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews insert" ON public.reviews FOR INSERT TO anon, authenticated
  WITH CHECK (((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid()) AND jsonb_array_length(fotos) <= 3);
CREATE POLICY "reviews admin delete" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));