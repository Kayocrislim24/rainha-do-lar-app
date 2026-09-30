import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useProducts } from "@/lib/products";
import { brl } from "@/lib/store";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function LiveSearch({ className, placeholder, big }: { className: string; placeholder: string; big?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const t = norm(q.trim());
  const hits = t ? products.filter((p) => p.active && norm(`${p.title} ${p.category}`).includes(t)).slice(0, 6) : [];

  return (
    <form
      className={`relative ${className}`}
      onSubmit={(e) => { e.preventDefault(); setOpen(false); navigate({ to: "/busca", search: q.trim() ? { q: q.trim() } : {} }); }}
    >
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-full border-2 border-border bg-muted text-sm outline-none focus:border-navy ${big ? "px-5 py-3 pr-12" : "px-4 py-2.5 pr-12"}`}
      />
      <button aria-label="Buscar" className={`absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full bg-navy text-primary-foreground ${big ? "right-2 size-9" : "right-1.5 size-8"}`}><Search className="size-4" /></button>
      {open && t && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-background shadow-xl">
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          ) : (
            <>
              {hits.map((p) => (
                <Link key={p.id} to="/produto/$id" params={{ id: p.id }} onClick={() => { setOpen(false); setQ(""); }} className="flex items-center gap-3 border-b p-2.5 hover:bg-muted">
                  <img src={p.image} alt={p.title} className="size-12 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <div className="text-right">
                    {p.oldPrice > p.price && <p className="text-[11px] text-muted-foreground line-through">{brl(p.oldPrice)}</p>}
                    <p className="text-sm font-bold text-navy">{brl(p.price)}</p>
                  </div>
                </Link>
              ))}
              <button type="submit" className="w-full p-3 text-sm font-bold text-navy hover:bg-muted">Ver todos os resultados para "{q.trim()}"</button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
