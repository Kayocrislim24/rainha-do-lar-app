export function SoldBadge({ sold, inline = false }: { sold: number; inline?: boolean }) {
  if (sold <= 0) return null;
  const label = `${sold.toLocaleString("pt-BR")} ${sold === 1 ? "vendido" : "vendidos"}`;
  if (inline) return <p aria-label={label} className="mb-2 font-sans text-base font-semibold leading-snug text-navy">{label}</p>;
  return (
    <span aria-label={label} className="sold-gold absolute left-2 top-2 z-10 inline-flex max-w-[calc(100%-3.5rem)] flex-col items-start rounded-md px-3 py-2 font-sans">
      <b className="text-xl font-bold tabular-nums leading-none">{sold.toLocaleString("pt-BR")}</b>
      <span className="mt-1 text-xs font-bold leading-tight">{sold === 1 ? "vendido" : "vendidos"}</span>
    </span>
  );
}