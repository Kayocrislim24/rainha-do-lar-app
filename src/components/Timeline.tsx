import { CheckCircle2, Circle, Package, Truck, Home, CreditCard, XCircle } from "lucide-react";

export const ETAPAS = [
  { s: "Aguardando pagamento", label: "Pedido recebido", icon: Package },
  { s: "Pago", label: "Pagamento confirmado", icon: CreditCard },
  { s: "Em separação", label: "Em separação", icon: Package },
  { s: "Saiu para entrega", label: "Saiu para entrega", icon: Truck },
  { s: "Entregue", label: "Entregue", icon: Home },
];

export function Timeline({ status }: { status: string }) {
  if (status === "Cancelado")
    return <p className="mt-4 flex items-center gap-2 font-semibold text-destructive"><XCircle className="size-5" /> Pedido cancelado</p>;
  const atual = Math.max(0, ETAPAS.findIndex((e) => e.s === status));
  return (
    <ol className="mt-5 space-y-0">
      {ETAPAS.map((e, i) => {
        const feito = i <= atual;
        const Icon = e.icon;
        return (
          <li key={e.s} className="relative flex gap-3 pb-6 last:pb-0">
            {i < ETAPAS.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${i < atual ? "bg-gold" : "bg-border"}`} />}
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${feito ? "bg-navy text-gold" : "border bg-background text-muted-foreground"} ${i === atual ? "ring-4 ring-gold/40" : ""}`}>
              <Icon className="size-4" />
            </span>
            <div className="pt-1">
              <p className={`font-semibold ${feito ? "text-navy" : "text-muted-foreground"}`}>{e.label}</p>
              {i === atual && <p className="text-xs font-bold uppercase tracking-wider text-gold">Etapa atual</p>}
            </div>
            {feito && i !== atual && <CheckCircle2 className="ml-auto mt-1 size-5 text-gold" />}
            {!feito && <Circle className="ml-auto mt-1 size-5 text-border" />}
          </li>
        );
      })}
    </ol>
  );
}

