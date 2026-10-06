import { BadgeCheck } from "lucide-react";

export function SoldBadge({ sold }: { sold: number }) {
  if (sold <= 0) return null;
  return (
    <span className="sold-glass absolute left-1 top-1 z-10 inline-flex max-w-[calc(100%-2.75rem)] items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-tight sm:text-xs">
      <BadgeCheck className="size-3.5 shrink-0 text-navy" aria-hidden="true" />
      <span className="min-w-0 break-words"><b className="font-bold">{sold.toLocaleString("pt-BR")}</b> {sold === 1 ? "vendido" : "vendidos"}</span>
    </span>
  );
}