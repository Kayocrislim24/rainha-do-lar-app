import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Circle, Package, Truck, Home, CreditCard, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";

export const Route = createFileRoute("/rastreio")({
  validateSearch: (s) => z.object({ codigo: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Rastrear pedido — Rainha do Lar" },
      { name: "description", content: "Acompanhe a entrega do seu pedido na Rainha do Lar." },
      { property: "og:title", content: "Rastrear pedido — Rainha do Lar" },
      { property: "og:description", content: "Veja em que etapa está a entrega do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rastreio,
});

type Pedido = { id: string; status: string; created_at: string; itens: { title: string; qty: number }[]; total: number; nome: string };

export const ETAPAS = [
  { s: "Aguardando pagamento", label: "Pedido recebido", icon: Package },
  { s: "Pago", label: "Pagamento confirmado", icon: CreditCard },
  { s: "Em separação", label: "Em separação", icon: Package },
  { s: "Saiu para entrega", label: "Saiu para entrega", icon: Truck },
  { s: "Entregue", label: "Entregue", icon: Home },
];

export function Timeline({ status }: { status: string }) {
  if (status === "Cancelado")
    return <p className="mt-4 flex items-center gap-2 font-semibold text-destructive"><XCircle className="size-5" /> Pedido cancelado</p>;
  const atual = Math.max(0, ETAPAS.findIndex((e) => e.s === status));
  return (
    <ol className="mt-5 space-y-0">
      {ETAPAS.map((e, i) => {
        const feito = i <= atual;
        const Icon = e.icon;
        return (
          <li key={e.s} className="relative flex gap-3 pb-6 last:pb-0">
            {i < ETAPAS.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${i < atual ? "bg-gold" : "bg-border"}`} />}
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${feito ? "bg-navy text-gold" : "border bg-background text-muted-foreground"} ${i === atual ? "ring-4 ring-gold/40" : ""}`}>
              <Icon className="size-4" />
            </span>
            <div className="pt-1">
              <p className={`font-semibold ${feito ? "text-navy" : "text-muted-foreground"}`}>{e.label}</p>
              {i === atual && <p className="text-xs font-bold uppercase tracking-wider text-gold">Etapa atual</p>}
            </div>
            {feito && i !== atual && <CheckCircle2 className="ml-auto mt-1 size-5 text-gold" />}
            {!feito && <Circle className="ml-auto mt-1 size-5 text-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Rastreio() {
  const { codigo = "" } = Route.useSearch();
  const [code, setCode] = useState(codigo);
  const [tel, setTel] = useState("");
  const [msg, setMsg] = useState("");
  const [p, setP] = useState<Pedido | null>(null);

  const buscar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setMsg("Buscando..."); setP(null);
    const { data, error } = await (supabase.rpc as unknown as (f: string, a: object) => Promise<{ data: Pedido[] | null; error: unknown }>)("track_order", { _code: code.trim(), _phone: tel });
    if (error || !data?.length) return setMsg("Pedido não encontrado. Confira o código e o telefone usado na compra.");
    setMsg(""); setP(data[0] ?? null);
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="text-center">
        <Truck className="mx-auto size-10 text-gold" />
        <h1 className="mt-2 text-3xl font-bold text-navy">Rastrear pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe cada etapa da sua entrega.</p>
      </div>
      <form onSubmit={buscar} className="mt-6 space-y-3 rounded-xl border-2 border-gold/40 bg-background p-5 shadow-sm">
        <label className="block text-sm font-semibold text-navy">Código do pedido
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: 3F9A1C2B" className="mt-1 w-full rounded-md border px-3 py-2 uppercase" required />
        </label>
        <label className="block text-sm font-semibold text-navy">Telefone usado na compra
          <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(61) 99999-9999" inputMode="tel" className="mt-1 w-full rounded-md border px-3 py-2" required />
        </label>
        <button className="w-full rounded-md bg-navy py-3 font-bold text-primary-foreground hover:opacity-90">Rastrear</button>
        {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
      </form>
      {p && (
        <section className="mt-6 rounded-xl border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-navy">Olá, {p.nome}!</p>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-navy">#{p.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pedido feito em {new Date(p.created_at).toLocaleString("pt-BR")}</p>
          <Timeline status={p.status} />
          <ul className="mt-5 border-t pt-3 text-sm">{p.itens.map((i, k) => <li key={k}>{i.qty}x {i.title}</li>)}</ul>
          <p className="mt-2 font-bold text-navy">Total: {brl(Number(p.total))}</p>
        </section>
      )}
    </main>
  );
}
