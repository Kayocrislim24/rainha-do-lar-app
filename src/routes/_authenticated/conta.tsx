import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Timeline } from "@/routes/rastreio";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Rainha do Lar" },
      { name: "description", content: "Seus pedidos na Rainha do Lar." },
      { property: "og:title", content: "Minha conta — Rainha do Lar" },
      { property: "og:description", content: "Acompanhe seus pedidos." },
    ],
  }),
  component: Conta,
});

type Item = { title: string; qty: number; price: number };

function Conta() {
  const { user } = Route.useRouteContext();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sair = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-navy">Minha conta</h1><p className="text-sm text-muted-foreground">{user.email}</p></div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/admin" className="rounded-md bg-navy px-4 py-2 font-semibold text-primary-foreground">Painel do administrador</Link>}
          <button onClick={sair} className="rounded-md border px-4 py-2">Sair</button>
        </div>
      </div>
      <h2 className="mt-8 text-lg font-bold text-navy">Meus pedidos</h2>
      {isLoading ? <p className="mt-2 text-sm">Carregando...</p> : !orders.length ? (
        <p className="mt-2 text-sm text-muted-foreground">Você ainda não fez pedidos. <Link to="/" className="text-link underline">Ver produtos</Link></p>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border p-4">
              <div className="flex justify-between text-sm"><span>#{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleString("pt-BR")}</span><span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-navy">{o.status}</span></div>
              <ul className="mt-2 text-sm">{(o.itens as Item[]).map((i, k) => <li key={k}>{i.qty}x {i.title}</li>)}</ul>
              <p className="mt-2 font-bold text-price-new">Total: {brl(Number(o.total))}</p>
              <Timeline status={o.status} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
