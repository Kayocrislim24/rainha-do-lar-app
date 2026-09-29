create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, nome text, telefone text, created_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile write" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, nome) values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name'));
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  end if;
  insert into public.user_roles(user_id, role) values (new.id,'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (
  id text primary key, title text not null, category text not null default 'Geral', description text not null default '',
  image text not null default '', old_price numeric(10,2) not null default 0, price numeric(10,2) not null,
  badge text, stock int not null default 0, dim_w int not null default 0, dim_h int not null default 0, dim_d int not null default 0,
  active boolean not null default true, created_at timestamptz not null default now());
grant select on public.products to anon, authenticated; grant insert, update, delete on public.products to authenticated; grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.products (id,title,category,description,image,old_price,price,badge,stock,dim_w,dim_h,dim_d) values
('guarda-roupa-lucca','Guarda-Roupa Casal 6 Portas Lucca - Naturalle','Guarda-roupa','Guarda-roupa casal em MDP com acabamento amadeirado, 6 portas, cabideiros e prateleiras internas. Ideal para quartos amplos.','local:guarda-roupa',3408.90,2184.91,'35% OFF',40,240,220,55),
('sofa-oslo','Sofá 3 Lugares Oslo Linho Cinza','Sala de estar','Sofá retrátil com tecido linho, pés em madeira maciça e almofadas soltas. Conforto para toda a família.','local:sofa',1899,1399,'Mais vendido',15,210,90,95),
('cama-box-aurora','Cama Box Queen com Cabeceira Aurora','Quarto','Conjunto box queen com colchão de molas ensacadas e cabeceira estofada em linho branco.','local:cama',2599,1899,'Oferta',12,160,120,200),
('mesa-jantar-bella','Mesa de Jantar Bella com 6 Cadeiras','Sala de jantar','Mesa em madeira maciça com 6 cadeiras estofadas. Perfeita para reunir quem você ama.','local:mesa',899,699,'Novo',8,160,78,90);

create table public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, telefone text not null, endereco text not null, condicao text,
  itens jsonb not null default '[]', subtotal numeric(10,2) not null, frete numeric(10,2) not null, total numeric(10,2) not null,
  status text not null default 'Aguardando pagamento', created_at timestamptz not null default now());
grant select, insert, update on public.orders to authenticated; grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "fotos publicas" on storage.objects for select using (bucket_id='produtos');
create policy "admin envia fotos" on storage.objects for insert to authenticated with check (bucket_id='produtos' and public.has_role(auth.uid(),'admin'));
create policy "admin apaga fotos" on storage.objects for delete to authenticated using (bucket_id='produtos' and public.has_role(auth.uid(),'admin'));