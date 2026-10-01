import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift } from "lucide-react";

export const ROLETA_MIN = 2000;
export const PREMIOS = ["Frete grátis", "5% de desconto", "Jogo de cama", "Kit de toalhas", "10% de desconto", "Brinde surpresa", "Almofadas decorativas", "R$ 100 de desconto"];
export const premiosKey = ["roleta-premios"];
export const fotosKey = ["roleta-fotos"];
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
export function usePremioFotos() {
  const q = useQuery({
    queryKey: fotosKey,
    queryFn: async () => {
      const { data } = await supabase.from("settings" as never).select("value").eq("key", "roleta_fotos").maybeSingle();
      const v = (data as { value?: unknown } | null)?.value;
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
    },
  });
  return q.data ?? {};
}
/** Sorteio com chance igual e sem repetir: cada prêmio sai uma vez antes de qualquer um repetir. */
const rnd = (n: number) => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]! % n; } catch { return Math.floor(Math.random() * n); } };
export const sortearPremio = (lista: string[] = PREMIOS) => {
  const KEY = "rdl-roleta-saco";
  let saco: string[] = [];
  try { saco = (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).filter((p) => lista.includes(p)); } catch { /* vazio */ }
  if (!saco.length) saco = [...lista];
  const premio = saco.splice(rnd(saco.length), 1)[0]!;
  try { localStorage.setItem(KEY, JSON.stringify(saco)); } catch { /* sem armazenamento */ }
  return premio;
};

export function Roleta({ premio, premios = PREMIOS }: { premio: string; premios?: string[] }) {
  const PREMIOS_ = premios;
  const fotos = usePremioFotos();
  const [rot, setRot] = useState(0);
  const [fim, setFim] = useState(false);
  const n = PREMIOS_.length, seg = 360 / n, idx = Math.max(0, PREMIOS_.indexOf(premio));
  const girar = () => { if (rot) return; setRot(360 * 6 + (360 - idx * seg - seg / 2)); setTimeout(() => setFim(true), 4200); };
  const bg = `conic-gradient(${PREMIOS_.map((_, i) => `var(--${i % 2 ? "gold" : "navy"}) ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;
  const comFoto = PREMIOS_.filter((p) => fotos[p]);
  const [k, setK] = useState(0);
  useEffect(() => { if (fim || comFoto.length < 2) return; const t = setInterval(() => setK((x) => x + 1), rot ? 150 : 900); return () => clearInterval(t); }, [fim, rot, comFoto.length]);
  const fotoCentro = fim ? fotos[premio] : comFoto.length ? fotos[comFoto[k % comFoto.length]!] : undefined;
  return (
    <div className="mt-8 rounded-xl border-2 border-gold bg-secondary p-5">
      <p className="flex items-center justify-center gap-2 text-lg font-bold text-navy"><Gift className="size-5 text-gold" />Roleta da Sorte</p>
      <p className="text-sm text-muted-foreground">Sua compra passou de R$ 2.000! Gire e ganhe um prêmio.</p>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-[460px]">
        <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[14px] border-t-[26px] border-x-transparent border-t-destructive" />
        <div className="relative size-full rounded-full border-4 border-gold shadow-lg" style={{ background: bg, transform: `rotate(${rot}deg)`, transition: "transform 4s cubic-bezier(.17,.67,.2,1)" }}>
          {PREMIOS_.map((p, i) => (
            <div key={p + i} className="absolute left-1/2 top-1/2 flex h-0 w-1/2 origin-left items-center pl-[29%] pr-[5%]" style={{ transform: `rotate(${i * seg + seg / 2 - 90}deg)` }}>
              <span className={`w-full whitespace-normal break-normal text-center font-bold uppercase leading-[1.35] [hyphens:none] [word-break:keep-all] ${Math.max(...p.split(" ").map((w) => w.length)) > 11 ? "text-[6px] sm:text-[8px]" : p.length > 20 ? "text-[7px] sm:text-[9px]" : p.length > 12 ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-xs"} ${i % 2 ? "text-navy" : "text-gold"}`}>{p}</span>
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border-4 border-gold bg-background">
          {fotoCentro ? <img src={fotoCentro} alt={premio} className="size-full object-cover" /> : <span className="text-[10px] font-bold text-navy">GIRE</span>}
        </div>
      </div>
      {fim ? (
        <p className="mt-4 text-xl font-bold text-navy">🎉 Você ganhou: <span className="text-gold">{premio}</span>!<br /><span className="text-sm font-normal text-muted-foreground">O vendedor vai confirmar seu prêmio no WhatsApp.</span></p>
      ) : (
        <button onClick={girar} disabled={!!rot} className="btn-comprar mt-4 rounded-md px-8 py-3 font-bold disabled:opacity-70">{rot ? "Girando..." : "Girar a roleta"}</button>
      )}
    </div>
  );
}
