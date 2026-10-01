CREATE TABLE public.settings (key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '[]'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.settings(key, value) VALUES ('roleta_premios', '["Frete grátis","5% de desconto","Jogo de cama","Kit de toalhas","10% de desconto","Brinde surpresa","Almofadas decorativas","R$ 100 de desconto"]'::jsonb);