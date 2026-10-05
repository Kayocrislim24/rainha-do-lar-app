import { ChevronLeft, ChevronRight, } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/lib/products";
import sofa from "@/assets/sofa.jpg";
import guarda from "@/assets/guarda-roupa.jpg";
import cama from "@/assets/cama.jpg";
import mesa from "@/assets/mesa.jpg";
import { useBanners } from "@/lib/home";

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



const cats = [
  { n: "Sala de estar", img: sofa },
  { n: "Quarto", img: cama },
  { n: "Guarda-roupas", img: guarda },
  { n: "Sala de jantar", img: mesa },
  { n: "Sofás", img: sofa },
  { n: "Mesas", img: mesa },
];


function Banners() {
  const list = useBanners();
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);
  const n = list.length;
  useEffect(() => { if (n < 2) return; const id = setInterval(() => { setAnim(true); setI((x) => x + 1); }, 5000); return () => clearInterval(id); }, [n]);
  useEffect(() => { if (i >= n && n > 0) { const t = setTimeout(() => { setAnim(false); setI(0); }, 700); return () => clearTimeout(t); } return undefined; }, [i, n]);
  if (!n) return null;
  const track = n > 1 ? [...list, list[0]!] : list;
  return (
    <div className="mt-6">
      <div className="relative overflow-hidden">
        <div className={`flex ${anim ? "transition-transform duration-700 ease-in-out" : ""}`} style={{ transform: `translateX(-${i * 100}%)` }}>
          {track.map((src, k) => <img key={k} src={src} alt={`Banner ${(k % n) + 1}`} className="w-full shrink-0" />)}
        </div>
        {n > 1 && <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">{list.map((_, k) => <button key={k} aria-label={`Banner ${k + 1}`} onClick={() => { setAnim(true); setI(k); }} className={`h-2 rounded-full transition-all ${k === i % n ? "w-8 bg-gold" : "w-2 bg-background/70"}`} />)}</div>}
      </div>
    </div>
  );
}

function MaisVendidos({ items }: { items: Parameters<typeof Card>[0]["p"][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const pausedUntil = useRef(0);
  const hover = useRef(false);
  // Repete a lista para sempre haver produtos suficientes e duplica para o loop infinito
  const reps = Math.max(1, Math.ceil(10 / Math.max(1, items.length)));
  const set = Array.from({ length: reps }, () => items).flat();
  const track = [...set, ...set];

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0; let last = performance.now();
    const speed = 40; // px por segundo
    const tick = (t: number) => {
      const dt = Math.min(64, t - last); last = t;
      const half = el.scrollWidth / 2;
      if (hover.current || t < pausedUntil.current) {
        pos.current = el.scrollLeft;
      } else {
        pos.current += (speed * dt) / 1000;
      }
      if (half > 0) {
        if (pos.current >= half) pos.current -= half;
        if (pos.current < 0) pos.current += half;
      }
      if (Math.abs(el.scrollLeft - pos.current) > 0.5 || !(hover.current || t < pausedUntil.current)) el.scrollLeft = pos.current;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  const go = (dir: 1 | -1) => {
    const el = ref.current; if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 260) + 12;
    const half = el.scrollWidth / 2;
    let target = el.scrollLeft + dir * step;
    if (target < 0) { el.scrollLeft += half; target += half; }
    if (target >= half) { el.scrollLeft -= half; target -= half; }
    pausedUntil.current = performance.now() + 2500;
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <section className="mt-10 rounded-lg bg-navy p-4 text-primary-foreground sm:p-6" onMouseEnter={() => { hover.current = true; }} onMouseLeave={() => { hover.current = false; }} onTouchStart={() => { pausedUntil.current = performance.now() + 4000; }} onTouchMove={() => { pausedUntil.current = performance.now() + 4000; }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase tracking-wide text-gold">Mais vendidos</h2><p className="hidden flex-1 text-center text-sm font-semibold uppercase md:block">Aproveite nossas ofertas com preços imperdíveis!</p>
        <div className="flex gap-2">
          <button aria-label="Anterior" onClick={() => go(-1)} className="grid size-9 place-items-center rounded-full bg-gold text-navy transition hover:scale-110"><ChevronLeft className="size-5" /></button>
          <button aria-label="Próximo" onClick={() => go(1)} className="grid size-9 place-items-center rounded-full bg-gold text-navy transition hover:scale-110"><ChevronRight className="size-5" /></button>
        </div>
      </div>
      <div ref={ref} className="mt-4 flex gap-3 overflow-x-auto pb-2 text-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {track.map((p, n) => (
          <div key={`${p.id}-${n}`} aria-hidden={n >= set.length || undefined} className="w-[72%] min-w-0 shrink-0 min-[420px]:w-[46%] sm:w-[31%] lg:w-[23.5%]"><Card p={p} /></div>
        ))}
      </div>
    </section>
  );
}

function Index() {
  const { data: products = [], isLoading } = useProducts();
  const marcados = products.filter((p) => p.bestSeller);
  const ofertas = [...marcados, ...[...products].filter((p) => !p.bestSeller).sort((a, b) => b.oldPrice - b.price - (a.oldPrice - a.price))].slice(0, 20);
  return (
    <main>
      <Banners />
      <div className="mx-auto max-w-7xl px-4">
        {ofertas.length > 0 && <MaisVendidos items={ofertas} />}
        <div className="mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
          <div className="cats-marquee flex w-max gap-3 pr-3 hover:[animation-play-state:paused]">
            {[...cats, ...cats, ...cats, ...cats].map((c, k) => (
              <Link key={k} aria-hidden={k >= cats.length * 2 || undefined} to="/busca" search={{ q: ({"Sala de estar":"Sof","Quarto":"Cama","Guarda-roupas":"Guarda","Sala de jantar":"Mesa","Sofás":"Sof","Mesas":"Mesa"} as Record<string,string>)[c.n] }} className="group flex size-32 shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground transition hover:shadow-md sm:size-40">
                <img src={c.img} alt="" loading="lazy" className="h-16 w-auto object-contain mix-blend-multiply transition group-hover:scale-110" />
                <span>{c.n}</span>
              </Link>
            ))}
          </div>
        </div>



        {Array.from(new Map(products.map((p) => [p.category.trim().toLowerCase(), p.category.trim()])).entries()).map(([key, cat]) => {
          const list = products.filter((p) => p.category.trim().toLowerCase() === key).slice(0, 4);
          return (
            <section key={cat} className="mt-10">
              <div className="flex items-end justify-between border-b-2 border-gold pb-2">
                <h2 className="text-xl font-bold uppercase text-navy">{cat}</h2>
                <Link to="/busca" search={{ q: cat }} className="text-sm font-bold text-navy underline hover:text-gold">Ver tudo</Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{list.map((p) => <Card key={p.id} p={p} />)}</div>
            </section>
          );
        })}

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {[{ t: "Inspire-se", d: "Ideias para deixar sua sala aconchegante", img: sofa, q: "Sof" }, { t: "Quarto de rainha", d: "Conforto para noites perfeitas", img: cama, q: "Cama" }, { t: "Organize tudo", d: "Guarda-roupas que cabem na sua casa", img: guarda, q: "Guarda" }].map((b) => (
            <Link key={b.t} to="/busca" search={{ q: b.q }} className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl border-2 border-gold shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <img src={b.img} alt={b.t} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/10" />
              <div className="relative p-6 text-primary-foreground">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Rainha do Lar</span>
                <p className="mt-1 text-3xl font-extrabold uppercase leading-tight text-gold">{b.t}</p>
                <p className="mt-2 text-base font-medium">{b.d}</p>
                <span className="btn-comprar mt-5 inline-flex rounded-full px-6 py-2.5 text-sm font-extrabold uppercase">Confira agora →</span>
              </div>
            </Link>
          ))}
        </section>

        <div id="produtos" className="mt-14 flex items-center gap-4">
          <span className="h-1 flex-1 rounded bg-gold" />
          <h2 className="rounded-full bg-navy px-8 py-3 text-xl font-extrabold uppercase tracking-wide text-gold shadow-lg sm:text-2xl">👑 Todos os produtos</h2>
          <span className="h-1 flex-1 rounded bg-gold" />
        </div>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando produtos...</p>}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p) => <Card key={p.id} p={p} />)}
        </div>
      </div>
    </main>
  );
}

function Card({ p }: { p: Parameters<typeof ProductCard>[0]["p"] }) {
  return <ProductCard p={p} />;
}
