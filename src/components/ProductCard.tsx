import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Swatches } from "@/components/Swatches";
import type { Product } from "@/lib/products";
import { brl } from "@/lib/store";
import { toggleFav, useFavs } from "@/lib/favorites";

export function ProductCard({ p }: { p: Product }) {
  const [img, setImg] = useState(p.image);
  const fav = useFavs().includes(p.id);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <Link to="/produto/$id" params={{ id: p.id }} className="group flex flex-col rounded-lg border bg-card p-3 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative overflow-hidden">
        <img src={img} alt={p.title} width={1024} height={1024} loading="lazy" className="aspect-square w-full object-contain transition group-hover:scale-105" />
        <button type="button" aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-background/90 text-navy shadow transition hover:scale-110">
          <Heart className={`size-5 ${fav ? "fill-gold text-gold" : ""}`} />
        </button>
      </div>
      <Swatches colors={p.colors} current={img} onPick={setImg} />
      <p className="mt-2 line-clamp-2 min-h-10 text-sm group-hover:text-link">{p.title}</p>
      <div className="mt-auto pt-2">
        <p className="text-xs text-price-old line-through">{brl(p.oldPrice)}</p>
        <p className="text-xl font-bold text-price-new">{brl(p.price)}</p>
        <p className="text-xs text-muted-foreground">ou 12x de {brl(p.price / 12)}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><span className="btn-comprar flex w-full sm:flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm">Comprar</span>{p.oldPrice > p.price && <span className="rounded-full border-2 border-gold bg-gold/15 px-2 py-1 text-center text-[11px] sm:shrink-0 font-bold leading-tight text-navy">{brl(p.oldPrice - p.price)}<br />de cashback</span>}</div>
      </div>
    </Link>
  );
}
