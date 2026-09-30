import type { ProductColor } from "@/lib/products";

export function Swatches({ colors, current, onPick, big }: { colors: ProductColor[]; current: string; onPick: (img: string) => void; big?: boolean }) {
  if (!colors.length) return null;
  const size = big ? "size-9" : "size-6";
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {colors.map((c, i) => {
        const on = !!c.image && c.image === current;
        return (
          <button
            key={i}
            type="button"
            title={c.name}
            aria-label={`Cor ${c.name}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (c.image) onPick(c.image); }}
            className={`${size} rounded-full border-2 ring-offset-2 ring-offset-card transition ${on ? "border-gold ring-2 ring-gold" : "border-border hover:border-navy"}`}
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </div>
  );
}
