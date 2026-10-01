import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";

const CUPOM = "PRIMEIRACOMPRARAINHA";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("rdl-welcome")) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);
  const close = () => { sessionStorage.setItem("rdl-welcome", "1"); setOpen(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(CUPOM); } catch { /* ignore */ }
    setCopied(true);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-navy-deep/70 p-4 animate-in fade-in duration-300" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-gold bg-navy p-7 text-center text-primary-foreground shadow-2xl animate-in zoom-in-95 duration-300">
        <button aria-label="Fechar" onClick={close} className="absolute right-3 top-3 rounded-full p-1 text-primary-foreground/70 hover:text-gold"><X className="size-5" /></button>
        <p className="text-sm font-bold uppercase tracking-widest text-gold">👑 Espere!</p>
        <h2 className="mt-2 text-3xl font-bold leading-tight">Leve <span className="text-gold">5% de desconto</span> na sua primeira compra</h2>
        <p className="mt-3 text-sm text-primary-foreground/80">Use o cupom abaixo agora:</p>
        <button onClick={copy} className="mx-auto mt-4 flex items-center gap-2 rounded-lg border-2 border-dashed border-gold bg-background/10 px-4 py-3 font-mono text-lg font-bold tracking-wider text-gold">
          {CUPOM} {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
        </button>
        <p className="mt-1 h-4 text-xs text-gold">{copied ? "Cupom copiado!" : ""}</p>
        <button onClick={close} className="btn-comprar mt-4 w-full rounded-full px-8 py-3 text-sm">Quero meu desconto</button>
        <button onClick={close} className="mt-3 text-xs text-primary-foreground/60 underline">Não, obrigado</button>
      </div>
    </div>
  );
}
