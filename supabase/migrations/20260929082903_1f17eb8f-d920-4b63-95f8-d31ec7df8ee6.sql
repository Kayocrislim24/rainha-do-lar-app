ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
GRANT INSERT ON public.orders TO anon;
DROP POLICY IF EXISTS "orders insert" ON public.orders;
CREATE POLICY "orders insert" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;