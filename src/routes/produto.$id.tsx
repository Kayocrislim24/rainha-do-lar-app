import { Swatches } from "@/components/Swatches";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, Minus, Plus, Ruler, Truck } from "lucide-react";
import { brl, FREE_SHIPPING_MIN, useCart } from "@/lib/store";
import { useShippingCities } from "@/lib/shipping";
import { useProducts, type Product } from "@/lib/products";
import { Price } from "@/components/SiteHeader";
import { Reviews } from "@/components/Reviews";
import { ProductCard } from "@/components/ProductCard";
import { SoldBadge } from "@/components/SoldBadge";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Rainha do Lar" },
      { name: "description", content: "Detalhes, medidas e preço do móvel na Rainha do Lar." },
      { property: "og:title", content: "Produto — Rainha do Lar" },
      { property: "og:description", content: "Confira detalhes e ofertas deste móvel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const rel = (data ?? []).filter((x) => x.id !== p.id).sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, 8);
  return (
    <>
      <ProductPage key={p.id} p={p} />
      {rel.length > 0 && <DragRow items={rel} />}
    </>
  );
}

function DragRow({ items }: { items: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const st = useRef({ down: false, x: 0, left: 0, moved: false });
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div
        ref={ref}
        className="flex cursor-grab snap-x gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseDown={(e) => { const el = ref.current!; st.current = { down: true, x: e.pageX, left: el.scrollLeft, moved: false }; }}
        onMouseMove={(e) => { if (!st.current.down) return; const dx = e.pageX - st.current.x; if (Math.abs(dx) > 5) st.current.moved = true; ref.current!.scrollLeft = st.current.left - dx; }}
        onMouseUp={() => { st.current.down = false; }}
        onMouseLeave={() => { st.current.down = false; }}
        onClickCapture={(e) => { if (st.current.moved) { e.preventDefault(); e.stopPropagation(); st.current.moved = false; } }}
        onDragStart={(e) => e.preventDefault()}
      >
        {items.map((r) => (
          <div key={r.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"><ProductCard p={r} /></div>
        ))}
      </div>
    </section>
  );
}

function ProductPage({ p }: { p: Product }) {
  const { add } = useCart();
  const nav = useNavigate();
  const [qty, setQty] = useState(1);
  const { data: cities = [], isLoading: citiesLoading, isError: citiesError } = useShippingCities();
  const [cityId, setCityId] = useState("");
  const city = cities.find((c) => c.id === cityId);
  const [wall, setWall] = useState("");
  const [foto, setFoto] = useState(p.image);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  const wallCm = parseFloat(wall.replace(",", ".")) * 100;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-sm text-muted-foreground"><Link to="/" className="text-link underline">Início</Link> › {p.category}</p>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative rounded-lg border p-4"><SoldBadge sold={p.sold} /><img src={foto} alt={p.title} width={1024} height={1024} className="aspect-square w-full object-contain" /></div>
          {p.colors.length > 0 && <div className="mt-3"><p className="text-sm font-semibold">Cor: {p.colors.find((c) => c.image === foto)?.name ?? "Escolha"}</p><Swatches colors={p.colors} current={foto} onPick={setFoto} big /></div>}
          {p.gallery.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {p.gallery.map((s, i) => (
                <button key={i} onClick={() => setFoto(s)} aria-label={`Foto ${i + 1}`} className={`size-20 rounded-md border-2 p-1 ${foto === s ? "border-gold" : "border-border"}`}><img src={s} alt="" className="size-full object-contain" /></button>
              ))}
            </div>
          )}
        </div>
        <div>
          <SoldBadge sold={p.sold} inline />
          <p className="text-xs font-bold uppercase tracking-wide text-gold">{p.category}</p>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{p.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Cód. {p.id.slice(0, 8).toUpperCase()} · Vendido e entregue por Rainha do Lar</p>
          <div className="mt-4"><Price old={p.oldPrice} price={p.price} big /></div>
          <p className="text-sm text-muted-foreground">ou em até 12x de {brl(p.price / 12)} no cartão</p>
          <ul className="mt-3 grid gap-1 rounded-lg border bg-secondary p-3 text-sm text-navy"><li>✔ Entrega própria em todo o DF</li><li>✔ Frete grátis acima de R$ 1.500</li><li>✔ Compra 100% segura</li></ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><button onClick={() => { add(p.id, qty); nav({ to: "/carrinho" }); }} className="btn-comprar flex flex-1 items-center justify-center gap-3 rounded-full py-4 text-xl">Comprar</button>{p.oldPrice > p.price && <span className="shrink-0 rounded-full border-2 border-price-new bg-price-new/10 px-4 py-2 text-center text-sm font-bold leading-tight text-price-new">{brl(p.oldPrice - p.price)}<br />de cashback</span>}</div>
          <button onClick={() => { localStorage.setItem("rdl-cupom", "PRIMEIRACOMPRARAINHA"); add(p.id, qty); nav({ to: "/carrinho" }); }} className="mt-3 w-full rounded-full border-2 border-dashed border-gold bg-navy px-4 py-3 text-center text-primary-foreground transition hover:brightness-110">
            <span className="block text-base font-bold uppercase tracking-wide">Comprar com cupom <span className="text-gold">10% OFF</span> · {brl(p.price * 0.9)}</span>
            <span className="block text-xs text-primary-foreground/80">Cupom <b className="text-gold">PRIMEIRACOMPRARAINHA</b> · válido 1 vez por CPF, na primeira compra</span>
          </button>
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
            <label htmlFor="product-city" className="flex items-center gap-2 font-semibold text-navy"><Truck className="size-5" />Entrega por cidade</label>
            <select id="product-city" value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={citiesLoading || citiesError} className="mt-2 w-full min-w-0 rounded-md border bg-background px-3 py-2.5">
              <option value="">{citiesLoading ? "Carregando cidades..." : "Selecione sua cidade"}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}/{c.state}</option>)}
            </select>
            {city && <p className="mt-2 text-sm font-semibold text-navy">{city.name}/{city.state} · {p.price * qty >= FREE_SHIPPING_MIN ? "Frete grátis" : brl(city.price)}</p>}
            {citiesError && <p className="mt-2 text-sm text-destructive">Não foi possível carregar as cidades.</p>}
            {!citiesLoading && !citiesError && !cities.length && <p className="mt-2 text-sm text-muted-foreground">Consulte a loja sobre as cidades de entrega.</p>}
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
        
        {p.specs.length > 0 && (
          <table className="mt-3 w-full overflow-hidden rounded-lg border text-sm">
            <tbody>
              {p.specs.map((x, i) => (
                <tr key={i} className={i % 2 ? "bg-background" : "bg-secondary"}>
                  <th className="w-1/2 px-3 py-2 text-left font-semibold text-navy">{x.k}</th>
                  <td className="px-3 py-2">{x.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.description}</p>
      </section>
      <Reviews productId={p.id} />
    </main>
  );
}
