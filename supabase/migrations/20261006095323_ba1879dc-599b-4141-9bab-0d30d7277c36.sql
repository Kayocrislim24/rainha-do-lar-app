CREATE OR REPLACE FUNCTION public.apply_city_shipping()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE city_price numeric;
BEGIN
  SELECT price INTO city_price FROM public.shipping_cities WHERE id = NEW.shipping_city_id;
  IF city_price IS NULL THEN RAISE EXCEPTION 'Selecione uma cidade de entrega cadastrada.'; END IF;
  NEW.frete := CASE WHEN NEW.subtotal > 1299.90 THEN 0 ELSE city_price END;
  NEW.total := NEW.subtotal - NEW.desconto + NEW.frete;
  RETURN NEW;
END;
$$;