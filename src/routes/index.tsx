import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, CreditCard, MessageCircle } from "lucide-react";
import { useProducts } from "@/lib/products";
import { brl } from "@/lib/store";
import sofa from "@/assets/sofa.jpg";
import guarda from "@/assets/guarda-roupa.jpg";
import cama from "@/assets/cama.jpg";
import mesa from "@/assets/mesa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rainha do Lar — Móveis para sua casa no DF" },
      { name: "description", content: "Guarda-roupas, sofás, camas e mesas com ofertas, entrega própria no DF e atendimento pelo WhatsApp." },
      { property: "og:title", content: "Rainha do Lar — Móveis para sua casa no DF" },
      { property: "og:description", content: "Ofertas em móveis com entrega própria no DF e atendimento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const cats = [
  { n: "Guarda-roupas", img: guarda },
  { n: "Sofás", img: sofa },
  { n: "Camas", img: cama },
  { n: "Mesas", img: mesa },
];

function Index() {
  const { data: products = [], isLoading } = useProducts();
  return (
    <main>
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 md:grid-cols-2 md:py-10">
          <div>
            <p className="text-sm font-semibold text-link">Ofertas da semana</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-navy sm:text-4xl">Sofás e estofados com até 30% de desconto</h1>
            <p className="mt-3 text-muted-foreground">Parcele em até 12x sem juros ou pague no PIX. Entrega própria em todo o Distrito Federal.</p>
            <a href="#produtos" className="mt-5 inline-block rounded-md bg-buy px-6 py-3 font-bold text-buy-foreground hover:opacity-90">Ver ofertas</a>
          </div>
          <img src={sofa} alt="Sofá em oferta" width={1024} height={1024} className="mx-auto max-h-72 w-auto object-contain mix-blend-multiply" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="grid grid-cols-2 gap-px overflow-hidden border-b py-5 text-sm sm:grid-cols-4">
          {[
            { i: Truck, t: "Entrega própria", d: "Em todo o DF" },
            { i: CreditCard, t: "Até 12x sem juros", d: "No cartão de crédito" },
            { i: ShieldCheck, t: "Compra segura", d: "Seus dados protegidos" },
            { i: MessageCircle, t: "Atendimento", d: "Pelo WhatsApp" },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="flex items-center gap-3 py-2">
              <I className="size-6 shrink-0 text-navy" />
              <div><p className="font-semibold text-foreground">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </section>

        <h2 className="mt-8 text-lg font-bold text-foreground">Compre por categoria</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cats.map((c) => (
            <a key={c.n} href="#produtos" className="flex flex-col items-center rounded-md border bg-card p-3 hover:border-navy">
              <img src={c.img} alt={c.n} width={1024} height={1024} loading="lazy" className="aspect-square w-24 object-contain" />
              <span className="mt-2 text-sm font-semibold">{c.n}</span>
            </a>
          ))}
        </div>

        <h2 id="produtos" className="mt-10 text-lg font-bold text-foreground">Mais vendidos</h2>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando produtos...</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p) => {
            const off = Math.round((1 - p.price / p.oldPrice) * 100);
            return (
              <Link key={p.id} to="/produto/$id" params={{ id: p.id }} className="group flex flex-col rounded-md border bg-card p-3 hover:border-navy">
                <div className="relative">
                  <img src={p.image} alt={p.title} width={1024} height={1024} loading="lazy" className="aspect-square w-full object-contain" />
                  {off > 0 && <span className="absolute left-0 top-0 rounded-sm bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-destructive-foreground">-{off}%</span>}
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm group-hover:text-link">{p.title}</p>
                <div className="mt-auto pt-2">
                  <p className="text-xs text-price-old line-through">{brl(p.oldPrice)}</p>
                  <p className="text-xl font-bold text-price-new">{brl(p.price)}</p>
                  <p className="text-xs text-muted-foreground">ou 12x de {brl(p.price / 12)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
