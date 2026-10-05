DROP POLICY IF EXISTS "settings read" ON public.settings;
CREATE POLICY "settings read" ON public.settings FOR SELECT TO anon, authenticated
USING (key IN ('roleta_premios','roleta_fotos','home_banners','home_destaques') OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "reviews read" ON public.reviews;
CREATE POLICY "reviews read" ON public.reviews FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "fotos publicas" ON storage.objects;
CREATE POLICY "fotos publicas" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'produtos' AND public.has_role(auth.uid(),'admin'::app_role));