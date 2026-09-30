import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

const search = z.object({ q: z.string().optional(), cat: z.string().optional() });

export const Route = createFileRoute("/busca")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Produtos e ambientes — Rainha do Lar" },
      { name: "description", content: "Encontre sofás, guarda-roupas, camas e mesas com filtros por ambiente, preço e ofertas." },
      { property: "og:title", content: "Produtos e ambientes — Rainha do Lar" },
      { property: "og:description", content: "Filtre móveis por ambiente e preço, com entrega própria no DF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Busca,
});

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const faixas = [
  { l: "Até R$ 500", min: 0, max: 500 },
  { l: "R$ 500 a R$ 1.000", min: 500, max: 1000 },
  { l: "R$ 1.000 a R$ 2.000", min: 1000, max: 2000 },
  { l: "Acima de R$ 2.000", min: 2000, max: Infinity },
];

function Busca() {
  const { q = "", cat = "" } = Route.useSearch();
  const { data: products = [], isLoading } = useProducts();
  const [faixa, setFaixa] = useState<number | null>(null);
  const [ofertas, setOfertas] = useState(false);
  const [ordem, setOrdem] = useState("relevancia");

  const categorias = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const lista = useMemo(() => {
    let l = products.filter((p) => p.active !== false);
    if (cat) l = l.filter((p) => norm(p.category).includes(norm(cat)) || norm(cat).includes(norm(p.category)));
    if (q) l = l.filter((p) => norm(`${p.title} ${p.category} ${p.description}`).includes(norm(q)));
    if (faixa !== null) { const f = faixas[faixa]!; l = l.filter((p) => p.price >= f.min && p.price < f.max); }
    if (ofertas) l = l.filter((p) => p.oldPrice > p.price);
    if (ordem === "menor") l = [...l].sort((a, b) => a.price - b.price);
    if (ordem === "maior") l = [...l].sort((a, b) => b.price - a.price);
    if (ordem === "desconto") l = [...l].sort((a, b) => b.price / b.oldPrice < a.price / a.oldPrice ? 1 : -1);
    return l;
  }, [products, q, cat, faixa, ofertas, ordem]);

  const titulo = q ? `Resultados para "${q}"` : cat || "Todos os produtos";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <nav className="text-xs text-muted-foreground"><Link to="/" className="hover:text-navy">Início</Link> / <span>{titulo}</span></nav>
      <h1 className="mt-2 text-2xl font-bold text-navy">{titulo}</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6 text-sm">
          <div>
            <p className="font-bold text-navy">Ambientes</p>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/busca" search={{}} className={!cat ? "font-bold text-navy" : "hover:text-navy"}>Todos</Link></li>
              {categorias.map((c) => (
                <li key={c}><Link to="/busca" search={{ cat: c }} className={cat === c ? "font-bold text-navy" : "hover:text-navy"}>{c}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-navy">Preço</p>
            <ul className="mt-2 space-y-1.5">
              {faixas.map((f, i) => (
                <li key={f.l}><label className="flex cursor-pointer items-center gap-2"><input type="radio" name="faixa" checked={faixa === i} onChange={() => setFaixa(i)} className="accent-navy" />{f.l}</label></li>
              ))}
              {faixa !== null && <li><button onClick={() => setFaixa(null)} className="text-xs underline">Limpar preço</button></li>}
            </ul>
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-semibold"><input type="checkbox" checked={ofertas} onChange={(e) => setOfertas(e.target.checked)} className="accent-navy" />Só ofertas</label>
        </aside>
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
            <span className="text-muted-foreground">{lista.length} produto(s)</span>
            <label className="flex items-center gap-2">Ordenar por
              <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="rounded-md border bg-background px-2 py-1.5">
                <option value="relevancia">Mais relevantes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="desconto">Maior desconto</option>
              </select>
            </label>
          </div>
          {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando produtos...</p>}
          {!isLoading && lista.length === 0 && <p className="mt-8 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {lista.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
