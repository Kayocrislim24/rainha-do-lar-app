CREATE OR REPLACE FUNCTION public.track_order(_code text, _phone text)
RETURNS TABLE(id uuid, status text, created_at timestamptz, itens jsonb, total numeric, nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select o.id, o.status, o.created_at, o.itens, o.total, split_part(o.nome,' ',1)
  from public.orders o
  where length(regexp_replace(_code,'[^0-9a-fA-F]','','g')) >= 8
    and o.id::text ilike lower(regexp_replace(_code,'[^0-9a-fA-F-]','','g')) || '%'
    and right(regexp_replace(o.telefone,'\D','','g'),8) = right(regexp_replace(_phone,'\D','','g'),8)
    and length(regexp_replace(_phone,'\D','','g')) >= 8
  limit 1
$$;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;