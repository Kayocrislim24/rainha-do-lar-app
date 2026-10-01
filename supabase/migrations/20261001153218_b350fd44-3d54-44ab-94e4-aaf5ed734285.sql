CREATE OR REPLACE FUNCTION public.cupom_disponivel(_cpf text, _cupom text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.orders WHERE cpf = regexp_replace(_cpf,'\D','','g') AND upper(cupom) = upper(_cupom) AND status <> 'Cancelado');
$$;
DROP INDEX IF EXISTS public.orders_cupom_cpf_uniq;
CREATE UNIQUE INDEX orders_cupom_cpf_uniq ON public.orders (cpf, upper(cupom)) WHERE cupom IS NOT NULL AND status <> 'Cancelado';