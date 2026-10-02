import { Truck } from "lucide-react";
import { brl, FREE_SHIPPING_MIN, useCart } from "@/lib/store";

export function FreeShippingBar({ boxed }: { boxed?: boolean }) {
  const { subtotal, count } = useCart();
  if (!count) return null;
  const falta = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  return (
    <div className={boxed ? "rounded-lg border-2 border-gold bg-secondary p-4" : "border-b bg-secondary px-4 py-2"}>
      <div className="mx-auto max-w-7xl">
        {falta > 0 ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-navy">
            <Truck className="size-5 text-gold" />
            <span>Faltam apenas <span className="font-bold text-gold">{brl(falta)}</span> para você ganhar <b>Frete Grátis!</b></span>
          </p>
        ) : (
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-base font-extrabold uppercase tracking-wide text-navy sm:text-lg">
            <Truck className="size-6 text-gold animate-bounce" />
            <span>Uhuul! Você ganhou</span>
            <span className="rounded-md bg-navy px-2 py-0.5 text-gold shadow-md">FRETE GRÁTIS</span>
            <span>a entrega é por nossa conta!</span>
          </p>
        )}
        <div className="mx-auto mt-1.5 h-2 max-w-md overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
