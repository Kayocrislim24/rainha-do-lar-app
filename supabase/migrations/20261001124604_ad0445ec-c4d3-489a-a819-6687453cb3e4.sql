ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cpf text, ADD COLUMN IF NOT EXISTS cupom text, ADD COLUMN IF NOT EXISTS desconto numeric NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS orders_cupom_cpf_uniq ON public.orders (cpf, cupom) WHERE cupom IS NOT NULL;
CREATE OR REPLACE FUNCTION public.cupom_disponivel(_cpf text, _cupom text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.orders WHERE cpf = regexp_replace(_cpf,'\D','','g') AND upper(cupom) = upper(_cupom));
$$;
GRANT EXECUTE ON FUNCTION public.cupom_disponivel(text, text) TO anon, authenticated;