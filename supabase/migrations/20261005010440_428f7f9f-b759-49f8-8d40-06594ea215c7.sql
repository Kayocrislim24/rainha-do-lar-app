DROP POLICY IF EXISTS "reviews read" ON public.reviews;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.reviews TO anon, authenticated;