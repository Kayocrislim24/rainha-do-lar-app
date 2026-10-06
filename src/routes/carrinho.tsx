import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Copy, CreditCard, Minus, Plus, QrCode, Trash2 } from "lucide-react";
import logo from "@/assets/logo-r.png.asset.json";
import { brl, FREE_SHIPPING_MIN, useCart, WHATSAPP } from "@/lib/store";
import { useShippingCities } from "@/lib/shipping";
import { Roleta, ROLETA_MIN, sortearPremio, usePremios } from "@/components/Roleta";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho e checkout — Rainha do Lar" },
      { name: "description", content: "Revise seus itens e finalize seu pedido com entrega de valor fixo por cidade." },
      { property: "og:title", content: "Carrinho — Rainha do Lar" },
      { property: "og:description", content: "Finalize seu pedido na Rainha do Lar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  cep: z.string().trim().min(8, "CEP inválido").max(9),
  rua: z.string().trim().min(2, "Informe a rua ou endereço").max(200),
  bairro: z.string().trim().min(2, "Informe o bairro").max(100),
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
  const [f, setF] = useState({ nome: "", telefone: "", cep: "", rua: "", bairro: "", numero: "", complemento: "" });
  const [cepStatus, setCepStatus] = useState("");
  useEffect(() => {
    const cep = f.cep.replace(/\D/g, "");
    setCepStatus("");
    if (cep.length !== 8) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setCepStatus("Buscando endereço...");
    void (async () => {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
        if (!response.ok) throw new Error("CEP indisponível");
        const address = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string };
        if (!active) return;
        if (address.erro) {
          setCepStatus("CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.");
          return;
        }
        setF((current) => current.cep.replace(/\D/g, "") === cep ? {
          ...current,
          rua: address.logradouro || "",
          bairro: address.bairro || "",
        } : current);
        setCepStatus(address.logradouro && address.bairro
          ? "Endereço encontrado."
          : "CEP encontrado. Complete a rua e o bairro que não foram informados.");
      } catch {
        if (active) setCepStatus("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [f.cep]);
  const [apto, setApto] = useState(false);
  const [chao, setChao] = useState(false);
  const { data: cities = [], isLoading: citiesLoading, isError: citiesError } = useShippingCities();
  const [cityId, setCityId] = useState("");
  const city = cities.find((c) => c.id === cityId);
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
  const [pedido, setPedido] = useState<{ id: string; tel: string } | null>(null);
  const [pago, setPago] = useState(false);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("rdl-pendente") || "null") as { id: string; tel: string; nome: string; premio: string | null } | null;
      if (p?.id) { setPedido({ id: p.id, tel: p.tel }); setPremio(p.premio); setDone(p.nome); }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!pedido || pago) return;
    const PAGOS = ["Pago", "Em separação", "Saiu para entrega", "Entregue"];
    const check = async () => {
      const { data } = await supabase.rpc("track_order" as never, { _code: pedido.id, _phone: pedido.tel } as never);
      const st = (data as { status?: string }[] | null)?.[0]?.status;
      if (st && PAGOS.includes(st)) { setPago(true); localStorage.removeItem("rdl-pendente"); }
      if (st === "Cancelado") localStorage.removeItem("rdl-pendente");
    };
    void check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [pedido, pago]);
  const desconto = cupomOn ? Math.round(subtotal * CUPOM_PCT * 100) / 100 : 0;
  const frete = subtotal >= FREE_SHIPPING_MIN ? 0 : (city?.price ?? 0);
  const aplicarCupom = () => { const ok = cupomTxt.trim().toUpperCase() === CUPOM; setCupomOn(ok); if (ok) localStorage.setItem("rdl-cupom", CUPOM); setMsg(ok ? "" : "Cupom inválido."); };
  const tirarCupom = () => { setCupomOn(false); setCupomTxt(""); localStorage.removeItem("rdl-cupom"); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setF((current) => ({ ...current, [k]: value }));
  };

  const go = (n: number) => { setMsg(""); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = async () => {
    if (step === 1) {
      if (f.nome.trim().length < 2) return setMsg("Informe seu nome");
      if (f.telefone.replace(/\D/g, "").length < 10) return setMsg("Telefone inválido");
      if (cupomOn && !cpfValido(cpf)) return setMsg("Informe um CPF válido para usar o cupom.");
    }
    if (step === 2) {
      if (!city) return setMsg("Selecione sua cidade de entrega.");
      const valid = schema.safeParse(f);
      if (!valid.success) return setMsg(valid.error.issues[0]?.message ?? "Confira o endereço.");
    }
    go(step + 1);
  };
  const copiarPix = async () => { try { await navigator.clipboard.writeText(PIX_CHAVE.replace(/\D/g, "")); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { setMsg("Não foi possível copiar. Selecione a chave PIX e copie manualmente."); } };

  const finish = async () => {
    if (!pag) return setMsg("Escolha a forma de pagamento.");
    const r = schema.safeParse(f);
    if (!r.success) return setMsg(r.error.issues[0]?.message ?? "Dados inválidos");
    if (!city) return setMsg("Selecione sua cidade de entrega.");
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cupomOn) {
      if (!cpfValido(cpfLimpo)) return setMsg("Informe um CPF válido para usar o cupom.");
      const { data: livre } = await supabase.rpc("cupom_disponivel" as never, { _cpf: cpfLimpo, _cupom: CUPOM } as never);
      if (livre === false) return setMsg("Este CPF já usou o cupom PRIMEIRACOMPRARAINHA. Remova o cupom para continuar.");
    }
    const condicoes = [
      apto && "Apartamento (subida de escada/elevador) — taxa extra a combinar",
      chao && "Estrada de chão / difícil acesso — combinar previamente",
    ].filter(Boolean);
    const sorteado = subtotal >= ROLETA_MIN ? sortearPremio(premios) : null;
    condicoes.unshift(`💳 Pagamento: ${pag}${pag === "PIX" ? " (cliente informou que fez o PIX)" : " (enviar link de pagamento)"}`);
    if (cupomOn) condicoes.push(`🏷️ Cupom ${CUPOM} (-10%): -R$ ${num(desconto)} · CPF ${fmtCpf(cpfLimpo)}`);
    if (sorteado) condicoes.push(`🎁 Prêmio da roleta: ${sorteado}`);
    const endereco = `${r.data.rua}, ${r.data.numero}${r.data.complemento ? " - " + r.data.complemento : ""}, ${r.data.bairro}, ${city.name}/${city.state} - CEP ${r.data.cep}`;
    const { data: u } = await supabase.auth.getUser();
    setMsg("Enviando pedido...");
    const orderId = crypto.randomUUID();
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      shipping_city_id: city.id,
      user_id: u.user?.id ?? null, nome: r.data.nome, telefone: r.data.telefone, endereco, condicao: condicoes.join(" | ") || null,
      itens: items.map((i) => ({ id: i.id, title: i.product.title, qty: i.qty, price: i.product.price })),
      subtotal, frete, total: subtotal - desconto + frete,
      ...(cupomOn ? { cpf: cpfLimpo, cupom: CUPOM, desconto } : {}),
    } as never);
    if (error) return setMsg(error.code === "23505" ? "Este CPF já usou o cupom PRIMEIRACOMPRARAINHA." : "Não foi possível enviar o pedido. Tente novamente.");
    localStorage.removeItem("rdl-cupom");
    setMsg("");
    void enviarParaWhatsApp; // envio automático para a loja será ligado pelo WhatsApp Business
    const nomeCurto = r.data.nome.split(" ")[0] ?? r.data.nome;
    try { localStorage.setItem("rdl-pendente", JSON.stringify({ id: orderId, tel: r.data.telefone, nome: nomeCurto, premio: sorteado })); } catch { /* ignore */ }
    setPremio(sorteado);
    setPedido({ id: orderId, tel: r.data.telefone });
    setPago(false);
    setCodigo(orderId.slice(0, 8).toUpperCase());
    setDone(nomeCurto);
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done)
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 py-16">
        <div className="w-full max-w-xl text-center" aria-live="polite">
          <div className="mx-auto grid size-24 place-items-center rounded-full bg-navy">
            <img src={logo.url} alt="Rainha do Lar" className="size-16 object-contain" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase text-navy">{pago ? "Pagamento confirmado" : "Pedido recebido · pagamento em conferência"}</p>
          <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{pago ? `Parabéns pela sua compra, ${done}!` : `Obrigado por escolher a gente, ${done}.`}</h1>
          <div className="mx-auto my-6 h-px w-24 bg-gold" />
          <p className="text-lg leading-relaxed text-foreground">
            {pago ? "Seu pagamento foi confirmado. Agora nossa equipe vai cuidar de cada detalhe e combinar a entrega pelo WhatsApp." : "Seu pedido já está com nossa equipe. Vamos conferir o pagamento e entrar em contato pelo WhatsApp para combinar os próximos passos."}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{pago ? "Que essa compra faça parte de bons momentos no seu lar." : "A confirmação aparece aqui assim que nossa equipe conferir o recebimento. Não é necessário pagar novamente."}</p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-navy">
            <CheckCircle2 className="size-5 text-navy" /> {pago ? "Tudo certo com seu pagamento" : "Pedido registrado na Rainha do Lar"}
          </div>
          {premio && !pago && (
            <div className="mt-8 border-y py-5">
              <p className="text-lg font-bold text-navy">Seu presente está reservado</p>
              <p className="mt-1 text-sm text-muted-foreground">A Roleta da Sorte será liberada nesta tela após a confirmação do pagamento.</p>
            </div>
          )}
          {premio && pago && <Roleta premio={premio} premios={premios} />}
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
            <label className="text-sm sm:col-span-2">CEP
              <input aria-label="CEP" autoComplete="postal-code" inputMode="numeric" className={`${input} mt-1`} placeholder="00000-000" value={f.cep} onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                setF((current) => ({ ...current, cep: digits.replace(/(\d{5})(\d)/, "$1-$2") }));
              }} maxLength={9} />
              <span role="status" aria-live="polite" className="mt-1 block text-sm text-muted-foreground">{cepStatus}</span>
            </label>
            <label className="text-sm sm:col-span-2">Cidade de entrega<select aria-label="Cidade de entrega" className={`${input} mt-1 bg-background`} value={cityId} onChange={(e) => { setCityId(e.target.value); setMsg(""); }} disabled={citiesLoading || citiesError}>
              <option value="">{citiesLoading ? "Carregando cidades..." : "Selecione sua cidade"}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}/{c.state} — {subtotal >= FREE_SHIPPING_MIN ? "Frete grátis" : brl(c.price)}</option>)}
            </select></label>
            <input aria-label="Rua / endereço" autoComplete="address-line1" className={`${input} sm:col-span-2`} placeholder="Rua / endereço" value={f.rua} onChange={set("rua")} maxLength={200} />
            <input aria-label="Bairro" className={input} placeholder="Bairro" value={f.bairro} onChange={set("bairro")} maxLength={100} />
            <input className={input} placeholder="Número" value={f.numero} onChange={set("numero")} />
            <input className={`${input} sm:col-span-2`} placeholder="Complemento (apto, bloco...)" value={f.complemento} onChange={set("complemento")} />
          </div>
          {citiesError && <p className="mt-2 text-sm text-destructive">Não foi possível carregar as cidades. Tente novamente mais tarde.</p>}
          {!citiesLoading && !citiesError && !cities.length && <p className="mt-2 text-sm text-muted-foreground">As cidades de entrega ainda não foram cadastradas. Entre em contato com a loja.</p>}
          {city && <p className="mt-2 text-sm font-semibold text-navy">Entrega em {city.name}/{city.state}: {subtotal >= FREE_SHIPPING_MIN ? "Frete grátis" : brl(city.price)}</p>}

          <h3 className="mt-5 font-semibold">Condições especiais de entrega</h3>
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={apto} onChange={(e) => setApto(e.target.checked)} className="mt-1 size-4" />Entrega em Apartamento (subida de escada/elevador)</label>
          {apto && <p className="ml-6 mt-1 flex gap-1 rounded bg-warn p-2 text-sm text-warn-foreground"><AlertTriangle className="size-4 shrink-0" />Taxas extras de subida serão combinadas com você.</p>}
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={chao} onChange={(e) => setChao(e.target.checked)} className="mt-1 size-4" />Estrada de chão ou local de difícil acesso</label>
          {chao && <p className="ml-6 mt-1 flex gap-1 rounded bg-warn p-2 text-sm text-warn-foreground"><AlertTriangle className="size-4 shrink-0" />Vamos combinar a entrega previamente pelo WhatsApp.</p>}
        </section>}

        {step === 3 && <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b bg-navy px-5 py-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gold">Pagamento</h2>
            <p className="text-sm text-primary-foreground/80">Confira o valor e os dados do recebedor antes de pagar.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {([["PIX", QrCode, "Conferido pela nossa equipe"], ["Cartão de crédito", CreditCard, "Parcele em até 12x"]] as const).map(([k, I, d]) => (
              <button key={k} type="button" onClick={() => setPag(k)} className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition ${pag === k ? "border-gold bg-secondary shadow-md" : "border-border hover:-translate-y-0.5 hover:border-gold hover:shadow"}`}>
                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${pag === k ? "bg-navy" : "bg-secondary"}`}><I className="size-6 text-gold" /></span>
                <span><b className="block text-base text-navy">{k}</b><span className="text-sm text-muted-foreground">{d}</span></span>
                {pag === k && <CheckCircle2 className="absolute right-3 top-3 size-5 text-gold" />}
              </button>
            ))}
          </div>
          {pag === "PIX" && (
            <div className="mx-5 mb-5 border-t">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-5">
                <span className="text-sm font-semibold text-muted-foreground">Total no PIX</span>
                <span className="text-3xl font-bold text-navy">{brl(subtotal - desconto + frete)}</span>
              </div>
              <div className="border-y bg-muted/40 px-3 py-6 text-center sm:px-5">
                <p className="text-xs font-bold uppercase text-muted-foreground">Chave PIX · CNPJ</p>
                <p className="mt-3 break-all text-xl font-bold text-navy sm:text-2xl">{PIX_CHAVE}</p>
                <p className="mt-2 text-sm text-navy">Favorecido: <b>Kayo Crisostomo Lima</b></p>
                <Button type="button" onClick={copiarPix} className="mt-5 gap-2">{copiado ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}{copiado ? "Chave copiada" : "Copiar chave PIX"}</Button>
                <ol className="mx-auto mt-6 grid max-w-md gap-4 text-left text-sm text-navy">
                  {["No aplicativo do seu banco, escolha PIX e cole a chave.", "Confira Kayo Crisostomo Lima como recebedor e o valor acima.", "Depois de pagar, registre seu pedido no botão abaixo. Nossa equipe conferirá o recebimento."].map((t, i) => (
                    <li key={t} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-gold">{i + 1}</span>{t}</li>
                  ))}
                </ol>
                <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">A confirmação é feita pela equipe da loja. Clicar em “Registrar pedido” não confirma nem realiza o pagamento.</p>
              </div>
            </div>
          )}
          {pag === "Cartão de crédito" && <p className="mx-5 mb-5 rounded-xl border-2 border-gold bg-secondary p-5 text-sm text-navy">Ao finalizar, um de nossos vendedores envia pelo WhatsApp o link seguro para pagar no cartão em até 12x.</p>}
        </section>}
      </div>

      <aside className="h-fit rounded-lg border bg-secondary p-4 lg:sticky lg:top-4">
        <h2 className="text-lg font-bold text-navy">Resumo</h2>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          <div className="flex justify-between"><span>Frete</span><span>{subtotal >= FREE_SHIPPING_MIN ? <b className="text-gold">Grátis</b> : city ? brl(city.price) : "Selecione a cidade"}</span></div>
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
          : <Button onClick={finish} className="mt-4 h-auto w-full whitespace-normal py-3 font-bold">{pag === "PIX" ? "Registrar pedido após o PIX" : "Finalizar compra"}</Button>}
        {step > 0 && <button onClick={() => go(step - 1)} className="mt-2 w-full text-center text-sm font-semibold text-navy underline">← Voltar</button>}
      </aside>
    </main>
    </>
  );
}
