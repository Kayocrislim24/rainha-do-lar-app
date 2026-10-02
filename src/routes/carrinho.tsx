import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Copy, CreditCard, Crown, Minus, Plus, QrCode, Trash2 } from "lucide-react";
import { brl, FREE_SHIPPING_MIN, quoteShipping, useCart, WHATSAPP } from "@/lib/store";
import { Roleta, ROLETA_MIN, sortearPremio, usePremios } from "@/components/Roleta";
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

const PIX_CHAVE = "59.924.049/0001-83";
const CUPOM = "PRIMEIRACOMPRARAINHA";
const CUPOM_PCT = 0.1;
function cpfValido(v: string) {
  const c = v.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const dig = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dig(9) === Number(c[9]) && dig(10) === Number(c[10]);
}
const fmtCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

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
  const [codigo, setCodigo] = useState("");
  const [premio, setPremio] = useState<string | null>(null);
  const premios = usePremios();
  const [cupomOn, setCupomOn] = useState(false);
  const [cupomTxt, setCupomTxt] = useState("");
  const [cpf, setCpf] = useState("");
  const [step, setStep] = useState(0);
  const [pag, setPag] = useState<"PIX" | "Cartão de crédito" | "">("");
  const [copiado, setCopiado] = useState(false);
  useEffect(() => { const c = localStorage.getItem("rdl-cupom"); if (c) { setCupomTxt(c); setCupomOn(c.toUpperCase() === CUPOM); } }, []);
  const desconto = cupomOn ? Math.round(subtotal * CUPOM_PCT * 100) / 100 : 0;
  const frete = subtotal >= FREE_SHIPPING_MIN ? 0 : (ship?.cost ?? 0);
  const aplicarCupom = () => { const ok = cupomTxt.trim().toUpperCase() === CUPOM; setCupomOn(ok); if (ok) localStorage.setItem("rdl-cupom", CUPOM); setMsg(ok ? "" : "Cupom inválido."); };
  const tirarCupom = () => { setCupomOn(false); setCupomTxt(""); localStorage.removeItem("rdl-cupom"); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const calc = async () => {
    setMsg("Calculando frete...");
    try { setShip(await quoteShipping(f.cep)); setMsg(""); } catch (e) { setShip(null); setMsg((e as Error).message); }
  };

  const go = (n: number) => { setMsg(""); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = async () => {
    if (step === 1) {
      if (f.nome.trim().length < 2) return setMsg("Informe seu nome");
      if (f.telefone.replace(/\D/g, "").length < 10) return setMsg("Telefone inválido");
      if (cupomOn && !cpfValido(cpf)) return setMsg("Informe um CPF válido para usar o cupom.");
    }
    if (step === 2) {
      if (!ship) return setMsg("Calcule o frete pelo CEP para continuar.");
      if (!f.numero.trim()) return setMsg("Informe o número");
    }
    go(step + 1);
  };
  const copiarPix = async () => { try { await navigator.clipboard.writeText(PIX_CHAVE.replace(/\D/g, "")); } catch { /* ignore */ } setCopiado(true); setTimeout(() => setCopiado(false), 2500); };

  const finish = async () => {
    if (!pag) return setMsg("Escolha a forma de pagamento.");
    const r = schema.safeParse(f);
    if (!r.success) return setMsg(r.error.issues[0]?.message ?? "Dados inválidos");
    if (!ship) return setMsg("Calcule o frete antes de finalizar.");
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cupomOn) {
      if (!cpfValido(cpfLimpo)) return setMsg("Informe um CPF válido para usar o cupom.");
      const { data: livre } = await supabase.rpc("cupom_disponivel" as never, { _cpf: cpfLimpo, _cupom: CUPOM } as never);
      if (livre === false) return setMsg("Este CPF já usou o cupom PRIMEIRACOMPRARAINHA. Remova o cupom para continuar.");
    }
    const a = ship.address;
    const condicoes = [
      apto && "Apartamento (subida de escada/elevador) — taxa extra a combinar",
      chao && "Estrada de chão / difícil acesso — combinar previamente",
    ].filter(Boolean);
    const sorteado = subtotal >= ROLETA_MIN ? sortearPremio(premios) : null;
    condicoes.unshift(`💳 Pagamento: ${pag}${pag === "PIX" ? " (cliente informou que fez o PIX)" : " (enviar link de pagamento)"}`);
    if (cupomOn) condicoes.push(`🏷️ Cupom ${CUPOM} (-10%): -R$ ${num(desconto)} · CPF ${fmtCpf(cpfLimpo)}`);
    if (sorteado) condicoes.push(`🎁 Prêmio da roleta: ${sorteado}`);
    const endereco = `${a.logradouro}, ${r.data.numero}${r.data.complemento ? " - " + r.data.complemento : ""}, ${a.bairro}, ${a.localidade}/${a.uf} - CEP ${r.data.cep}`;
    const { data: u } = await supabase.auth.getUser();
    setMsg("Enviando pedido...");
    const orderId = crypto.randomUUID();
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      user_id: u.user?.id ?? null, nome: r.data.nome, telefone: r.data.telefone, endereco, condicao: condicoes.join(" | ") || null,
      itens: items.map((i) => ({ id: i.id, title: i.product.title, qty: i.qty, price: i.product.price })),
      subtotal, frete, total: subtotal - desconto + frete,
      ...(cupomOn ? { cpf: cpfLimpo, cupom: CUPOM, desconto } : {}),
    } as never);
    if (error) return setMsg(error.code === "23505" ? "Este CPF já usou o cupom PRIMEIRACOMPRARAINHA." : "Não foi possível enviar o pedido. Tente novamente.");
    localStorage.removeItem("rdl-cupom");
    setMsg("");
    void enviarParaWhatsApp; // envio automático para a loja será ligado pelo WhatsApp Business
    setPremio(sorteado);
    setCodigo(orderId.slice(0, 8).toUpperCase());
    setDone(r.data.nome.split(" ")[0] ?? r.data.nome);
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
          {premio && <Roleta premio={premio} premios={premios} />}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-block rounded-md bg-buy px-6 py-3 font-bold text-buy-foreground hover:opacity-90">Continuar comprando</Link>
          </div>
        </div>
      </main>
    );

  if (!items.length)
    return <main className="mx-auto max-w-6xl px-4 py-16 text-center"><p className="text-lg">Seu carrinho está vazio.</p><Link to="/" className="mt-4 inline-block rounded-md bg-buy px-6 py-3 font-bold text-buy-foreground">Ver produtos</Link></main>;

  const input = "w-full rounded-md border px-3 py-2.5";
  return (
    <>
    <ol className="mx-auto mt-6 flex max-w-6xl items-center gap-2 overflow-x-auto px-4 text-xs font-bold uppercase whitespace-nowrap sm:text-sm">
      {["Carrinho", "Identificação", "Entrega", "Pagamento"].map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-2">
          <button type="button" disabled={i > step} onClick={() => go(i)} className="flex items-center gap-2 disabled:opacity-50">
            <span className={`grid size-8 place-items-center rounded-full transition ${i < step ? "bg-gold text-navy" : i === step ? "bg-navy text-primary-foreground ring-4 ring-gold/40" : "border-2 border-gold text-navy"}`}>{i < step ? "✓" : i + 1}</span>
            <span className={i === step ? "text-navy underline decoration-gold decoration-2 underline-offset-4" : "text-navy"}>{s}</span>
          </button>{i < 3 && <span className="mx-1 h-0.5 w-6 bg-gold sm:w-12" />}
        </li>
      ))}
    </ol>
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {step === 0 && <section className="rounded-lg border p-4">
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
        </section>}

        {step === 1 && <section className="rounded-lg border p-4">
          <h2 className="text-lg font-bold text-navy">Identificação</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Nome completo" value={f.nome} onChange={set("nome")} />
            <input className={input} placeholder="Telefone / WhatsApp" value={f.telefone} onChange={set("telefone")} />
            {cupomOn && <input className={`${input} sm:col-span-2`} placeholder="CPF (obrigatório para o cupom)" inputMode="numeric" value={fmtCpf(cpf)} onChange={(e) => setCpf(e.target.value)} />}
          </div>
        </section>}

        {step === 2 && <section className="rounded-lg border p-4">
          <h2 className="text-lg font-bold text-navy">Entrega</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
        </section>}

        {step === 3 && <section className="rounded-lg border p-4">
          <h2 className="text-lg font-bold text-navy">Pagamento</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([["PIX", QrCode, "Aprovação na hora"], ["Cartão de crédito", CreditCard, "Parcele em até 12x"]] as const).map(([k, I, d]) => (
              <button key={k} type="button" onClick={() => setPag(k)} className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition ${pag === k ? "border-gold bg-secondary" : "border-border hover:border-gold"}`}>
                <I className="size-8 text-gold" /><span><b className="block text-navy">{k}</b><span className="text-sm text-muted-foreground">{d}</span></span>
              </button>
            ))}
          </div>
          {pag === "PIX" && (
            <div className="mt-4 rounded-lg border-2 border-dashed border-gold bg-secondary p-4 text-center">
              <p className="text-sm font-semibold text-navy">Pague {brl(subtotal - desconto + frete)} com a chave PIX (CNPJ):</p>
              <p className="mt-2 text-2xl font-extrabold tracking-wider text-navy">{PIX_CHAVE}</p>
              <p className="text-xs text-muted-foreground">Rainha do Lar</p>
              <button type="button" onClick={copiarPix} className="mt-3 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-bold text-primary-foreground"><Copy className="size-4" />{copiado ? "Chave copiada!" : "Copiar chave PIX"}</button>
              <p className="mt-3 text-xs text-muted-foreground">Depois de pagar, clique em "Já fiz o PIX" para finalizar.</p>
            </div>
          )}
          {pag === "Cartão de crédito" && <p className="mt-4 rounded-lg bg-secondary p-4 text-sm text-navy">Ao finalizar, um de nossos vendedores envia pelo WhatsApp o link seguro para pagar no cartão em até 12x.</p>}
        </section>}
      </div>

      <aside className="h-fit rounded-lg border bg-secondary p-4 lg:sticky lg:top-4">
        <h2 className="text-lg font-bold text-navy">Resumo</h2>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          <div className="flex justify-between"><span>Frete</span><span>{subtotal >= FREE_SHIPPING_MIN ? <b className="text-gold">Grátis</b> : ship ? brl(ship.cost) : "—"}</span></div>
        </div>
        <div className="mt-3 rounded-md border-2 border-dashed border-gold bg-background p-3">
          <p className="text-sm font-bold text-navy">Cupom de desconto</p>
          {cupomOn ? (
            <>
              <p className="mt-1 flex items-center justify-between text-sm"><span className="font-bold text-navy">{CUPOM} · 10% OFF</span><button onClick={tirarCupom} className="text-xs underline text-muted-foreground">remover</button></p>
              <p className="mt-1 text-xs text-muted-foreground">Desconto válido 1 vez por CPF, na primeira compra.</p>
            </>
          ) : (
            <div className="mt-2 flex gap-2"><input className="w-full rounded-md border px-3 py-2 text-sm uppercase" placeholder="Digite o cupom" value={cupomTxt} onChange={(e) => setCupomTxt(e.target.value)} /><button onClick={aplicarCupom} className="rounded-md bg-navy px-3 text-sm font-bold text-primary-foreground">Aplicar</button></div>
          )}
        </div>
        {desconto > 0 && <div className="mt-2 flex justify-between text-sm font-bold text-navy"><span>Desconto cupom</span><span>- {brl(desconto)}</span></div>}
        <p className="mt-2 text-xs text-warn-foreground">A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso.</p>
        <div className="mt-3 flex justify-between border-t pt-3 text-xl font-bold"><span>Total</span><span className="text-price-new">{brl(subtotal - desconto + frete)}</span></div>
        <p className="mt-3 rounded-md bg-background p-2 text-center text-sm font-semibold text-navy">🎁 {subtotal >= ROLETA_MIN ? "Você vai girar a Roleta da Sorte ao finalizar!" : `Faltam ${brl(ROLETA_MIN - subtotal)} para girar a Roleta da Sorte`}</p>
        {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}
        {step < 3
          ? <button onClick={next} className="btn-comprar mt-4 w-full rounded-md py-3 font-bold">Continuar para {["Identificação", "Entrega", "Pagamento"][step]} →</button>
          : <button onClick={finish} className="btn-comprar mt-4 w-full rounded-md py-3 font-bold">{pag === "PIX" ? "Já fiz o PIX — Finalizar" : "Finalizar compra"}</button>}
        {step > 0 && <button onClick={() => go(step - 1)} className="mt-2 w-full text-center text-sm font-semibold text-navy underline">← Voltar</button>}
      </aside>
    </main>
    </>
  );
}
