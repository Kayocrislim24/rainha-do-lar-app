import { useEffect, useState } from "react";
import { X } from "lucide-react";
import cupomImg from "@/assets/popup-cupom.png.asset.json";

const CUPOM = "PRIMEIRACOMPRARAINHA";

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("rdl-welcome-v2")) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);
  const close = () => { sessionStorage.setItem("rdl-welcome-v2", "1"); setOpen(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(CUPOM); } catch { /* ignore */ }
    close();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-navy-deep/70 p-4 animate-in fade-in duration-300" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="relative animate-in zoom-in-95 duration-300">
        <button aria-label="Fechar" onClick={close} className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full bg-navy text-primary-foreground shadow-lg hover:text-gold"><X className="size-5" /></button>
        <button onClick={copy} aria-label={`Copiar cupom ${CUPOM}`} className="block">
          <img src={cupomImg.url} alt={`Cupom ${CUPOM} — desconto na primeira compra`} className="max-h-[85vh] w-auto max-w-[90vw] drop-shadow-2xl" />
        </button>
      </div>
    </div>
  );
}
