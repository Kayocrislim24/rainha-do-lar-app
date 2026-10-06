DROP POLICY IF EXISTS "reviews public read" ON public.reviews;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = reviews.product_id AND p.active) OR user_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'));
REVOKE SELECT ON public.reviews FROM anon, authenticated;
REVOKE SELECT (edit_token) ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, user_id, nome, nota, comentario, fotos, avatar, created_at) ON public.reviews TO anon, authenticated;
DROP POLICY IF EXISTS "review media public read" ON storage.objects;
CREATE POLICY "review media public read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'review-media' AND (owner_id = (SELECT auth.uid()::text) OR public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "review media upload" ON storage.objects;
CREATE POLICY "review media upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-media' AND owner_id = (SELECT auth.uid()::text) AND (storage.foldername(name))[1] = (SELECT auth.uid()::text) AND lower(storage.extension(name)) = ANY(ARRAY['mp4','webm','mov']));