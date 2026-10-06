export function SoldBadge({ sold, inline = false }: { sold: number; inline?: boolean }) {
  if (sold <= 0) return null;
  return (
    <span aria-label={`${sold.toLocaleString("pt-BR")} ${sold === 1 ? "vendido" : "vendidos"}`} className={`sold-glass inline-flex rounded-md ${inline ? "mb-3 max-w-full items-center gap-3 px-4 py-2.5" : "absolute left-2 top-2 z-10 max-w-[calc(100%-3.5rem)] flex-col items-start px-3 py-2"}`}>
      <b className={`font-bold tabular-nums leading-none ${inline ? "text-2xl" : "text-lg sm:text-xl"}`}>{sold.toLocaleString("pt-BR")}</b>
      <span className={`font-semibold leading-tight ${inline ? "border-l border-navy/15 pl-3 text-sm" : "mt-1 text-[10px] sm:text-xs"}`}>{sold === 1 ? "vendido" : "vendidos"}</span>
    </span>
  );
}