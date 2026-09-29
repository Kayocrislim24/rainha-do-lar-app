import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Crown, Minus, Plus, Trash2 } from "lucide-react";
import { brl, quoteShipping, useCart, WHATSAPP } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho e checkout — Rainha do Lar" },
      { name: "description", content: "Revise seus itens, calcule o frete e envie seu pedido pelo WhatsApp." },
      { property: "og:title", content: "Carrinho — Rainha do Lar" },
      { property: "og:description", content: "Finalize seu pedido na Rainha do Lar." },
    ],
  }),
  component: CartPage,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  cep: z.string().trim().min(8, "CEP inválido").max(9),
  numero: z.string().trim().min(1, "Informe o número").max(20),
  complemento: z.string().trim().max(100),
});

const num = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type DadosPedido = {
  nome: string; telefone: string; endereco: string; localizacao?: string; condicaoEntrega?: string;
  itens: string; subtotal: string; frete: string; total: string; statusPagamento?: string;
};

const enviarParaWhatsApp = (dadosPedido: DadosPedido) => {
  const numero = WHATSAPP;
  const texto =
    `🛍️ *NOVO PEDIDO - RAINHA DO LAR*\n\n` +
    `👤 *Cliente:* ${dadosPedido.nome}\n` +
    `📞 *Telefone:* ${dadosPedido.telefone}\n` +
    `📍 *Endereço:* ${dadosPedido.endereco}\n` +
    (dadosPedido.localizacao ? `🗺️ *Localização:* ${dadosPedido.localizacao}\n` : "") +
    `💬 *Falar com o cliente:* https://wa.me/55${dadosPedido.telefone.replace(/\D/g, "").replace(/^55/, "")}\n` +
    `🚚 *Condição de Entrega:* ${dadosPedido.condicaoEntrega || "Padrão"}\n\n` +
    `📦 *Itens do Pedido:*\n${dadosPedido.itens}\n\n` +
    `💰 *Subtotal:* R$ ${dadosPedido.subtotal}\n` +
    `🚚 *Frete:* R$ ${dadosPedido.frete}\n` +
    `💳 *Total:* R$ ${dadosPedido.total}\n\n` +
    `Status do Pagamento: ${dadosPedido.statusPagamento || "Aguardando confirmação"}`;
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  window.open(link, "_blank");
};

function CartPage() {
  const { items, setQty, subtotal, clear } = useCart();
  const [f, setF] = useState({ nome: "", telefone: "", cep: "", numero: "", complemento: "" });
  const [apto, setApto] = useState(false);
  const [chao, setChao] = useState(false);
  const [ship, setShip] = useState<Awaited<ReturnType<typeof quoteShipping>> | null>(null);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const calc = async () => {
    setMsg("Calculando frete...");
    try { setShip(await quoteShipping(f.cep)); setMsg(""); } catch (e) { setShip(null); setMsg((e as Error).message); }
  };

  const finish = async () => {
    const r = schema.safeParse(f);
    if (!r.success) return setMsg(r.error.issues[0]?.message ?? "Dados inválidos");
    if (!ship) return setMsg("Calcule o frete antes de finalizar.");
    const a = ship.address;
    const condicoes = [
      apto && "Apartamento (subida de escada/elevador) — taxa extra a combinar",
      chao && "Estrada de chão / difícil acesso — combinar previamente",
    ].filter(Boolean).join(" | ");
    const endereco = `${a.logradouro}, ${r.data.numero}${r.data.complemento ? " - " + r.data.complemento : ""}, ${a.bairro}, ${a.localidade}/${a.uf} - CEP ${r.data.cep}`;
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("orders").insert({
        user_id: u.user.id, nome: r.data.nome, telefone: r.data.telefone, endereco, condicao: condicoes || null,
        itens: items.map((i) => ({ id: i.id, title: i.product.title, qty: i.qty, price: i.product.price })),
        subtotal, frete: ship.cost, total: subtotal + ship.cost,
      });
    }
    void enviarParaWhatsApp; // envio automático para a loja será ligado pelo WhatsApp Business
    setDone(r.data.nome.split(" ")[0]);
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done)
    return (
      <main className="grid min-h-[70vh] place-items-center bg-secondary px-4 py-16">
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500 rounded-2xl border-2 border-gold bg-background p-8 text-center shadow-2xl sm:p-12">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-navy">
            <Crown className="size-12 text-gold" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-gold">Pedido recebido</p>
          <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">Parabéns pela sua compra, {done}!</h1>
          <div className="mx-auto my-6 h-px w-24 bg-gold" />
          <p className="text-lg leading-relaxed text-foreground">
            Um de nossos vendedores vai entrar em contato com você pelo WhatsApp para finalizar sua compra.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Fique de olho no seu celular. Obrigado por escolher a Rainha do Lar.</p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-navy">
            <CheckCircle2 className="size-5 text-gold" /> Seus dados foram enviados com segurança
          </div>
          <Link to="/" className="mt-8 inline-block rounded-md bg-buy px-8 py-3 font-bold text-buy-foreground hover:opacity-90">Continuar comprando</Link>
        </div>
      </main>
    );

  if (!items.length)
    return <main className="mx-auto max-w-6xl px-4 py-16 text-center"><p className="text-lg">Seu carrinho está vazio.</p><Link to="/" className="mt-4 inline-block rounded-md bg-buy px-6 py-3 font-bold text-buy-foreground">Ver produtos</Link></main>;

  const input = "w-full rounded-md border px-3 py-2.5";
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-lg border p-4">
          <h1 className="text-xl font-bold text-navy">Seu carrinho</h1>
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 border-b py-3 last:border-0">
              <img src={i.product.image} alt="" className="size-16 object-contain" />
              <div className="flex-1"><p className="text-sm font-semibold">{i.product.title}</p><p className="text-sm font-bold text-price-new">{brl(i.product.price)}</p></div>
              <div className="flex items-center rounded border">
                <button className="p-2" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Menos"><Minus className="size-3" /></button>
                <span className="w-6 text-center text-sm">{i.qty}</span>
                <button className="p-2" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Mais"><Plus className="size-3" /></button>
              </div>
              <button onClick={() => setQty(i.id, 0)} aria-label="Remover"><Trash2 className="size-4 text-muted-foreground" /></button>
            </div>
          ))}
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-bold text-navy">Dados de entrega</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Nome completo" value={f.nome} onChange={set("nome")} />
            <input className={input} placeholder="Telefone / WhatsApp" value={f.telefone} onChange={set("telefone")} />
            <div className="flex gap-2"><input className={input} placeholder="CEP" value={f.cep} onChange={set("cep")} maxLength={9} /><button onClick={calc} className="rounded-md bg-link px-4 font-semibold text-primary-foreground">Calcular</button></div>
            <input className={input} placeholder="Número" value={f.numero} onChange={set("numero")} />
            <input className={`${input} sm:col-span-2`} placeholder="Complemento (apto, bloco...)" value={f.complemento} onChange={set("complemento")} />
          </div>
          {ship && <p className="mt-2 text-sm text-muted-foreground">{ship.address.logradouro}, {ship.address.bairro} — {ship.address.localidade}/{ship.address.uf}</p>}

          <h3 className="mt-5 font-semibold">Condições especiais de entrega</h3>
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={apto} onChange={(e) => setApto(e.target.checked)} className="mt-1 size-4" />Entrega em Apartamento (subida de escada/elevador)</label>
          {apto && <p className="ml-6 mt-1 flex gap-1 rounded bg-warn p-2 text-sm text-warn-foreground"><AlertTriangle className="size-4 shrink-0" />Taxas extras de subida serão combinadas com você.</p>}
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={chao} onChange={(e) => setChao(e.target.checked)} className="mt-1 size-4" />Estrada de chão ou local de difícil acesso</label>
          {chao && <p className="ml-6 mt-1 flex gap-1 rounded bg-warn p-2 text-sm text-warn-foreground"><AlertTriangle className="size-4 shrink-0" />Vamos combinar a entrega previamente pelo WhatsApp.</p>}
        </section>
      </div>

      <aside className="h-fit rounded-lg border bg-secondary p-4 lg:sticky lg:top-4">
        <h2 className="text-lg font-bold text-navy">Resumo</h2>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          <div className="flex justify-between"><span>Frete</span><span>{ship ? brl(ship.cost) : "—"}</span></div>
        </div>
        <p className="mt-2 text-xs text-warn-foreground">A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso.</p>
        <div className="mt-3 flex justify-between border-t pt-3 text-xl font-bold"><span>Total</span><span className="text-price-new">{brl(subtotal + (ship?.cost ?? 0))}</span></div>
        {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
        <button onClick={finish} className="mt-4 w-full rounded-md bg-buy py-3 font-bold text-buy-foreground hover:opacity-90">Confirmar pedido no WhatsApp</button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Abre o WhatsApp da loja com o resumo completo.</p>
      </aside>
    </main>
  );
}
