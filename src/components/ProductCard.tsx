import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Swatches } from "@/components/Swatches";
import { SoldBadge } from "@/components/SoldBadge";
import type { Product } from "@/lib/products";
import { brl } from "@/lib/store";
import { toggleFav, useFavs } from "@/lib/favorites";

export function ProductCard({ p, glass = false }: { p: Product; glass?: boolean }) {
  const [img, setImg] = useState(p.image);
  const fav = useFavs().includes(p.id);
  const off = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <Link to="/produto/$id" params={{ id: p.id }} className={`group flex flex-col rounded-lg border p-3 transition hover:-translate-y-1 hover:shadow-lg ${glass ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground shadow-xl backdrop-blur-md" : "bg-card"}`}>
      <div className="relative overflow-hidden">
        <SoldBadge sold={p.sold} />
        <img src={img} alt={p.title} width={1024} height={1024} loading="lazy" className={`aspect-square w-full object-contain ${glass ? "rounded-md bg-background" : ""} transition group-hover:scale-105`} />
        <button type="button" aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-background/90 text-navy shadow transition hover:scale-110">
          <Heart className={`size-5 ${fav ? "fill-gold text-gold" : ""}`} />
        </button>
      </div>
      <Swatches colors={p.colors} current={img} onPick={setImg} />
      <p className={`mt-2 line-clamp-2 min-h-10 text-sm ${glass ? "group-hover:text-gold" : "group-hover:text-link"}`}>{p.title}</p>
      <div className="mt-auto pt-2">
        <p className={`text-xs line-through ${glass ? "text-primary-foreground/70" : "text-price-old"}`}>{brl(p.oldPrice)}</p>
        <p className={`text-xl font-bold ${glass ? "text-gold" : "text-price-new"}`}>{brl(p.price)}</p>
        <p className={`text-xs ${glass ? "text-primary-foreground/80" : "text-muted-foreground"}`}>ou 12x de {brl(p.price / 12)}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><span className="btn-comprar flex w-full sm:flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm">Comprar</span>{p.oldPrice > p.price && <span className={`rounded-full border-2 border-gold bg-gold/15 px-2 py-1 text-center text-[11px] sm:shrink-0 font-bold leading-tight ${glass ? "text-gold" : "text-navy"}`}>{brl(p.oldPrice - p.price)}<br />de cashback</span>}</div>
      </div>
    </Link>
  );
}
