import { createFileRoute, Link } from "@tanstack/react-router";
import { Ruler, Gift, HeartHandshake } from "lucide-react";
import { products } from "@/lib/store";
import { Price } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rainha do Lar — Móveis com preço de rainha" },
      { name: "description", content: "Guarda-roupas, sofás, camas e mesas com ofertas, frete por km a partir de Taguatinga-DF e pedido direto no WhatsApp." },
      { property: "og:title", content: "Rainha do Lar — Móveis com preço de rainha" },
      { property: "og:description", content: "Ofertas em móveis com frete transparente e atendimento no WhatsApp." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-xl bg-navy p-8 text-primary-foreground sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">Ofertas da semana</p>
        <h1 className="mt-2 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">Sua casa merece ser tratada como realeza.</h1>
        <p className="mt-3 max-w-lg opacity-80">Frete a R$ 3,00 por km saindo de Taguatinga-DF. Pague no PIX ou cartão e acompanhe tudo pelo WhatsApp.</p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Ruler, t: "Cabe no meu espaço?", d: "Informe a medida da sua parede e a gente te diz na hora se o móvel cabe." },
          { icon: Gift, t: "Mimo da Rainha", d: "Todo pedido chega com um presentinho surpresa e cartão escrito à mão." },
          { icon: HeartHandshake, t: "Atendente só sua", d: "Uma pessoa real acompanha seu pedido do pagamento até a montagem." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="flex gap-3 rounded-lg border bg-secondary p-4">
            <I className="size-8 shrink-0 text-navy" />
            <div><p className="font-bold text-navy">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
          </div>
        ))}
      </section>

      <h2 className="mt-10 text-2xl font-bold text-navy">Destaques</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} to="/produto/$id" params={{ id: p.id }} className="group flex flex-col rounded-lg border bg-card p-3 transition hover:shadow-lg">
            <div className="relative">
              <img src={p.image} alt={p.title} width={1024} height={1024} loading="lazy" className="aspect-square w-full object-contain transition group-hover:scale-105" />
              {p.badge && <span className="absolute left-1 top-1 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">{p.badge}</span>}
            </div>
            <p className="mt-2 text-xs uppercase text-muted-foreground">{p.category}</p>
            <p className="line-clamp-2 text-sm font-semibold">{p.title}</p>
            <div className="mt-auto pt-2"><Price old={p.oldPrice} price={p.price} /></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
