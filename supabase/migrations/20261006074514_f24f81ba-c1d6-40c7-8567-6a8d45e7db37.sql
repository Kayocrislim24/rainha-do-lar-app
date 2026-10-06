CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _user_id AND r.role = _role
      AND (_role <> 'admin' OR EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = r.user_id AND lower(u.email) = 'kayocrislim@gmail.com'
      ))
  );
$$;
CREATE TABLE public.shipping_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  state text NOT NULL DEFAULT 'DF' CHECK (state ~ '^[A-Z]{2}$'),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipping_cities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_cities TO authenticated;
GRANT ALL ON public.shipping_cities TO service_role;
ALTER TABLE public.shipping_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping cities public read" ON public.shipping_cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "shipping cities admin manage" ON public.shipping_cities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX shipping_cities_name_state_unique ON public.shipping_cities (lower(trim(name)), state);
CREATE FUNCTION public.touch_shipping_city() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_shipping_city BEFORE UPDATE ON public.shipping_cities FOR EACH ROW EXECUTE FUNCTION public.touch_shipping_city();
ALTER TABLE public.orders ADD COLUMN shipping_city_id uuid REFERENCES public.shipping_cities(id) ON DELETE SET NULL;
CREATE FUNCTION public.apply_city_shipping() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE city_price numeric;
BEGIN
  SELECT price INTO city_price FROM public.shipping_cities WHERE id = NEW.shipping_city_id;
  IF city_price IS NULL THEN RAISE EXCEPTION 'Selecione uma cidade de entrega cadastrada.'; END IF;
  NEW.frete := CASE WHEN NEW.subtotal >= 1500 THEN 0 ELSE city_price END;
  NEW.total := NEW.subtotal - NEW.desconto + NEW.frete;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apply_city_shipping BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.apply_city_shipping();