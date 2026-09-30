import { Swatches } from "@/components/Swatches";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Minus, Plus, Ruler, Truck } from "lucide-react";
import { brl, quoteShipping, useCart } from "@/lib/store";
import { useProducts, type Product } from "@/lib/products";
import { Price } from "@/components/SiteHeader";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Rainha do Lar" },
      { name: "description", content: "Detalhes, medidas e preço do móvel na Rainha do Lar." },
      { property: "og:title", content: "Produto — Rainha do Lar" },
      { property: "og:description", content: "Confira detalhes e ofertas deste móvel." },
    ],
  }),
  component: ProductRoute,
});

function ProductRoute() {
  const { id } = Route.useParams();
  const { data, isLoading } = useProducts();
  if (isLoading) return <main className="p-10 text-center">Carregando...</main>;
  const p = data?.find((x) => x.id === id);
  if (!p) return <div className="p-10 text-center">Produto não encontrado. <Link to="/" className="text-link underline">Voltar</Link></div>;
  return <ProductPage p={p} />;
}

function ProductPage({ p }: { p: Product }) {
  const { add } = useCart();
  const nav = useNavigate();
  const [qty, setQty] = useState(1);
  const [cep, setCep] = useState("");
  const [ship, setShip] = useState<string | null>(null);
  const [wall, setWall] = useState("");
  const [foto, setFoto] = useState(p.image);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  const wallCm = parseFloat(wall.replace(",", ".")) * 100;

  const calc = async () => {
    setShip("Calculando...");
    try { const r = await quoteShipping(cep); setShip(`${r.address.localidade}/${r.address.uf} · ${brl(r.cost)}`); }
    catch (e) { setShip((e as Error).message); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-sm text-muted-foreground"><Link to="/" className="text-link underline">Início</Link> › {p.category}</p>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="rounded-lg border p-4"><img src={foto} alt={p.title} width={1024} height={1024} className="aspect-square w-full object-contain" /></div>
          {p.colors.length > 0 && <div className="mt-3"><p className="text-sm font-semibold">Cor: {p.colors.find((c) => c.image === foto)?.name ?? "Escolha"}</p><Swatches colors={p.colors} current={foto} onPick={setFoto} big /></div>}
          {p.image2 && (
            <div className="mt-3 flex gap-3">
              {[p.image, p.image2].map((s, i) => (
                <button key={i} onClick={() => setFoto(s)} aria-label={`Foto ${i + 1}`} className={`size-20 rounded-md border-2 p-1 ${foto === s ? "border-gold" : "border-border"}`}><img src={s} alt="" className="size-full object-contain" /></button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{p.title}</h1>
          <span className="mt-3 inline-block rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground">{off}% OFF</span>
          <div className="mt-4"><Price old={p.oldPrice} price={p.price} big /></div>
          <p className="text-sm text-muted-foreground">ou em até 12x de {brl(p.price / 12)} sem juros</p>
          <button onClick={() => { add(p.id, qty); nav({ to: "/carrinho" }); }} className="mt-4 w-full rounded-md bg-buy py-4 text-lg font-bold text-buy-foreground hover:opacity-90">Comprar com desconto agora</button>
          <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-price-new"><CheckCircle2 className="size-4" />Estoque disponível <span className="font-normal text-muted-foreground">({p.stock} unidades)</span></p>

          <div className="mt-5 flex gap-3">
            <div className="flex items-center rounded-md border">
              <button className="p-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos"><Minus className="size-4" /></button>
              <span className="w-8 text-center">{qty}</span>
              <button className="p-3" onClick={() => setQty(qty + 1)} aria-label="Mais"><Plus className="size-4" /></button>
            </div>
            <button onClick={() => { add(p.id, qty); nav({ to: "/carrinho" }); }} className="flex-1 rounded-md bg-buy py-3 font-bold text-buy-foreground hover:opacity-90">Comprar agora</button>
          </div>
          <button onClick={() => add(p.id, qty)} className="mt-3 w-full rounded-md border-2 border-buy py-3 font-bold text-buy hover:bg-buy/5">Adicionar ao carrinho</button>

          <div className="mt-6">
            <p className="flex items-center gap-2 font-semibold text-navy"><Truck className="size-5" />Simular frete</p>
            <div className="mt-2 flex gap-2">
              <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" maxLength={9} className="flex-1 rounded-md bg-muted px-4 py-2.5" />
              <button onClick={calc} className="rounded-md bg-link px-4 font-semibold text-primary-foreground">Calcular</button>
            </div>
            {ship && <p className="mt-2 text-sm">{ship}</p>}
            <p className="mt-1 text-xs text-muted-foreground">A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso.</p>
          </div>

          <div className="mt-6 rounded-lg border bg-secondary p-4">
            <p className="flex items-center gap-2 font-semibold text-navy"><Ruler className="size-5" />Cabe no meu espaço?</p>
            <p className="text-xs text-muted-foreground">Medidas: {p.dims.w} × {p.dims.h} × {p.dims.d} cm (L × A × P)</p>
            <input value={wall} onChange={(e) => setWall(e.target.value)} placeholder="Largura da sua parede em metros (ex: 2,5)" className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            {wallCm > 0 && (
              <p className={`mt-2 text-sm font-semibold ${wallCm >= p.dims.w + 10 ? "text-price-new" : "text-price-old"}`}>
                {wallCm >= p.dims.w + 10 ? `Cabe! Sobram ${Math.round(wallCm - p.dims.w)} cm de folga.` : `Não cabe: faltam ${Math.round(p.dims.w + 10 - wallCm)} cm (contando 10 cm de folga).`}
              </p>
            )}
          </div>
        </div>
      </div>
      <section className="mt-10 max-w-3xl">
        <h2 className="text-xl font-bold text-navy">Informações do produto</h2>
        <p className="mt-2 text-muted-foreground">{p.description}</p>
      </section>
    </main>
  );
}
