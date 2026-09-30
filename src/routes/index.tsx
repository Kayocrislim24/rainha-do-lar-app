import { ShoppingBag, ChevronLeft, ChevronRight, Truck, CreditCard, ShieldCheck, MessageCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Swatches } from "@/components/Swatches";
import type { Product } from "@/lib/products";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/lib/products";
import { brl } from "@/lib/store";
import sofa from "@/assets/sofa.jpg";
import guarda from "@/assets/guarda-roupa.jpg";
import cama from "@/assets/cama.jpg";
import mesa from "@/assets/mesa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rainha do Lar — Móveis e decoração para sua casa no DF" },
      { name: "description", content: "Sofás, guarda-roupas, camas e mesas com ofertas, parcelamento em 12x e entrega própria no DF." },
      { property: "og:title", content: "Rainha do Lar — Móveis e decoração para sua casa" },
      { property: "og:description", content: "Ofertas em móveis com entrega própria no DF e atendimento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const slides = [
  { k: "Semana do Sofá", t: "Sofás com até 30% OFF", d: "Conforto para a sala inteira, em até 12x sem juros.", img: sofa },
  { k: "Quarto dos sonhos", t: "Guarda-roupas a partir de 12x", d: "Mais espaço e organização com entrega própria no DF.", img: guarda },
  { k: "Noites melhores", t: "Camas e cabeceiras em oferta", d: "Modelos casal e queen com preço especial.", img: cama },
];

const cats = [
  { n: "Sala de estar", img: sofa },
  { n: "Quarto", img: cama },
  { n: "Guarda-roupas", img: guarda },
  { n: "Sala de jantar", img: mesa },
  { n: "Sofás", img: sofa },
  { n: "Mesas", img: mesa },
];

function useCountdown() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => { const n = new Date(); const end = new Date(n); end.setHours(23, 59, 59, 999); setS(Math.max(0, Math.floor((+end - +n) / 1000))); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  const p = (x: number) => String(x).padStart(2, "0");
  return [p(Math.floor(s / 3600)), p(Math.floor((s % 3600) / 60)), p(s % 60)];
}

function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % slides.length), 5000); return () => clearInterval(id); }, []);
  const s = slides[i] ?? slides[0]!;
  return (
    <section className="relative mx-auto mt-4 max-w-7xl px-4">
      <div className="grid items-center gap-6 overflow-hidden rounded-2xl bg-navy px-6 py-8 text-primary-foreground md:grid-cols-2 md:px-12 md:py-14">
        <div key={i} className="animate-in fade-in slide-in-from-left-4 duration-500">
          <p className="text-sm font-bold uppercase tracking-widest text-gold">{s.k}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">{s.t}</h1>
          <p className="mt-3 text-primary-foreground/80">{s.d}</p>
          <a href="#produtos" className="btn-comprar mt-6 inline-flex rounded-full px-8 py-3 text-sm">Aproveitar</a>
        </div>
        <div className="rounded-xl bg-background p-4 shadow-2xl">
          <img key={s.img + i} src={s.img} alt={s.t} width={1024} height={1024} className="mx-auto max-h-72 w-auto object-contain animate-in fade-in zoom-in-95 duration-500" />
        </div>
      </div>
      <button aria-label="Anterior" onClick={() => setI((i + slides.length - 1) % slides.length)} className="absolute left-6 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/90 p-2 text-navy md:block"><ChevronLeft /></button>
      <button aria-label="Próximo" onClick={() => setI((i + 1) % slides.length)} className="absolute right-6 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/90 p-2 text-navy md:block"><ChevronRight /></button>
      <div className="flex justify-center gap-2 py-3">
        {slides.map((_, n) => <button key={n} aria-label={`Banner ${n + 1}`} onClick={() => setI(n)} className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-gold" : "w-2 bg-navy/30"}`} />)}
      </div>
    </section>
  );
}

function Index() {
  const { data: products = [], isLoading } = useProducts();
  const [h, m, s] = useCountdown();
  const ofertas = [...products].sort((a, b) => b.oldPrice - b.price - (a.oldPrice - a.price)).slice(0, 4);
  return (
    <main>
      <Hero />
      <div className="mx-auto max-w-7xl px-4">
        <section className="grid grid-cols-2 gap-3 border-b py-5 text-sm sm:grid-cols-4">
          {[
            { i: Truck, t: "Entrega própria", d: "Em todo o DF" },
            { i: CreditCard, t: "Até 12x sem juros", d: "No cartão de crédito" },
            { i: ShieldCheck, t: "Compra segura", d: "Seus dados protegidos" },
            { i: MessageCircle, t: "Atendimento", d: "Pelo WhatsApp" },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="flex items-center gap-3">
              <I className="size-6 shrink-0 text-gold" />
              <div><p className="font-semibold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </section>

        <h2 className="mt-8 text-xl font-bold text-navy">Navegue por ambientes</h2>
        <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
          {cats.map((c) => (
            <Link key={c.n} to="/busca" search={{ q: ({"Sala de estar":"Sof","Quarto":"Cama","Guarda-roupas":"Guarda","Sala de jantar":"Mesa","Sofás":"Sof","Mesas":"Mesa"} as Record<string,string>)[c.n] }} className="group flex w-24 shrink-0 flex-col items-center text-center">
              <span className="grid size-24 place-items-center overflow-hidden rounded-full border-2 border-border bg-secondary transition group-hover:border-gold">
                <img src={c.img} alt={c.n} loading="lazy" className="size-20 object-contain transition group-hover:scale-110" />
              </span>
              <span className="mt-2 text-sm font-semibold">{c.n}</span>
            </Link>
          ))}
        </div>

        {ofertas.length > 0 && (
          <section className="mt-10 rounded-lg bg-navy p-4 text-primary-foreground sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold"><Zap className="size-6 fill-gold text-gold" />Ofertas relâmpago</h2>
              <div className="flex items-center gap-1 text-sm">
                <span className="mr-1 opacity-80">Termina em</span>
                {[h, m, s].map((v, n) => <span key={n} className="rounded bg-gold px-2 py-1 font-bold tabular-nums text-accent-foreground">{v}</span>)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-foreground lg:grid-cols-4">
              {ofertas.map((p) => <Card key={p.id} p={p} />)}
            </div>
          </section>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[{ t: "Quarto completo", d: "Camas, guarda-roupas e mais", img: cama }, { t: "Sala de jantar", d: "Mesas para receber bem", img: mesa }].map((b) => (
            <a key={b.t} href="#produtos" className="flex items-center justify-between gap-4 overflow-hidden rounded-lg bg-secondary p-6 hover:ring-2 hover:ring-gold">
              <div><p className="text-2xl font-bold text-navy">{b.t}</p><p className="text-sm text-muted-foreground">{b.d}</p><span className="mt-3 inline-block text-sm font-bold text-navy underline">Ver produtos</span></div>
              <img src={b.img} alt={b.t} loading="lazy" className="size-32 object-contain mix-blend-multiply" />
            </a>
          ))}
        </div>

        <h2 id="produtos" className="mt-10 text-xl font-bold text-navy">Mais vendidos</h2>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando produtos...</p>}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p) => <Card key={p.id} p={p} />)}
        </div>
      </div>
    </main>
  );
}

function Card({ p }: { p: Product }) {
  const [img, setImg] = useState(p.image);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <Link to="/produto/$id" params={{ id: p.id }} className="group flex flex-col rounded-lg border bg-card p-3 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden">
        <img src={img} alt={p.title} width={1024} height={1024} loading="lazy" className="aspect-square w-full object-contain transition group-hover:scale-105" />
        {off > 0 && <span className="absolute left-0 top-0 rounded-sm bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-destructive-foreground">-{off}%</span>}
      </div>
      <Swatches colors={p.colors} current={img} onPick={setImg} />
      <p className="mt-2 line-clamp-2 min-h-10 text-sm group-hover:text-link">{p.title}</p>
      <div className="mt-auto pt-2">
        <p className="text-xs text-price-old line-through">{brl(p.oldPrice)}</p>
        <p className="text-xl font-bold text-price-new">{brl(p.price)}</p>
        <p className="text-xs text-muted-foreground">ou 12x de {brl(p.price / 12)}</p>
        <div className="mt-3 flex items-center gap-2"><span className="btn-comprar flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm"><ShoppingBag className="size-4" />Comprar</span>{p.oldPrice > p.price && <span className="shrink-0 rounded-full border-2 border-price-new bg-price-new/10 px-2 py-1 text-center text-[11px] font-bold leading-tight text-price-new">{brl(p.oldPrice - p.price)}<br />de cashback</span>}</div>
      </div>
    </Link>
  );
}
