import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift } from "lucide-react";

export const ROLETA_MIN = 2000;
export const PREMIOS = ["Frete grátis", "5% de desconto", "Jogo de cama", "Kit de toalhas", "10% de desconto", "Brinde surpresa", "Almofadas decorativas", "R$ 100 de desconto"];
export const premiosKey = ["roleta-premios"];
export function usePremios() {
  const q = useQuery({
    queryKey: premiosKey,
    queryFn: async () => {
      const { data } = await supabase.from("settings" as never).select("value").eq("key", "roleta_premios").maybeSingle();
      const v = (data as { value?: unknown } | null)?.value;
      return Array.isArray(v) && v.length ? (v as string[]) : PREMIOS;
    },
  });
  return q.data ?? PREMIOS;
}
export const sortearPremio = (lista: string[] = PREMIOS) => lista[Math.floor(Math.random() * lista.length)]!;

export function Roleta({ premio, premios = PREMIOS }: { premio: string; premios?: string[] }) {
  const PREMIOS_ = premios;
  const [rot, setRot] = useState(0);
  const [fim, setFim] = useState(false);
  const n = PREMIOS_.length, seg = 360 / n, idx = Math.max(0, PREMIOS_.indexOf(premio));
  const girar = () => { if (rot) return; setRot(360 * 6 + (360 - idx * seg - seg / 2)); setTimeout(() => setFim(true), 4200); };
  const bg = `conic-gradient(${PREMIOS_.map((_, i) => `var(--${i % 2 ? "gold" : "navy"}) ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;
  return (
    <div className="mt-8 rounded-xl border-2 border-gold bg-secondary p-5">
      <p className="flex items-center justify-center gap-2 text-lg font-bold text-navy"><Gift className="size-5 text-gold" />Roleta da Sorte</p>
      <p className="text-sm text-muted-foreground">Sua compra passou de R$ 2.000! Gire e ganhe um prêmio.</p>
      <div className="relative mx-auto mt-4 size-64">
        <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-destructive" />
        <div className="size-full rounded-full border-4 border-gold shadow-lg" style={{ background: bg, transform: `rotate(${rot}deg)`, transition: "transform 4s cubic-bezier(.17,.67,.2,1)" }}>
          {PREMIOS_.map((p, i) => (
            <span key={p + i} className={`absolute left-1/2 top-1/2 w-24 origin-left text-[10px] font-bold ${i % 2 ? "text-navy" : "text-gold"}`} style={{ transform: `rotate(${i * seg + seg / 2 - 90}deg) translateX(18px)` }}>{p}</span>
          ))}
        </div>
        <div className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-gold bg-background text-xl">👑</div>
      </div>
      {fim ? (
        <p className="mt-4 text-xl font-bold text-navy">🎉 Você ganhou: <span className="text-gold">{premio}</span>!<br /><span className="text-sm font-normal text-muted-foreground">O vendedor vai confirmar seu prêmio no WhatsApp.</span></p>
      ) : (
        <button onClick={girar} disabled={!!rot} className="btn-comprar mt-4 rounded-md px-8 py-3 font-bold disabled:opacity-70">{rot ? "Girando..." : "Girar a roleta"}</button>
      )}
    </div>
  );
}
