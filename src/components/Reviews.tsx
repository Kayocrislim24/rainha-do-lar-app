import { useEffect, useState } from "react";
import { Camera, Star, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Review = { id: string; nome: string; nota: number; comentario: string; fotos: string[]; created_at: string };

const schema = z.object({
  nome: z.string().trim().min(1, "Digite seu nome").max(80),
  comentario: z.string().trim().min(3, "Escreva sua opinião").max(1000),
  nota: z.number().min(1, "Escolha as estrelas").max(5),
});

function toImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 800 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = rej;
      img.src = r.result as string;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Stars({ n, onPick, size = "size-5" }: { n: number; onPick?: (n: number) => void; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onPick} onClick={() => onPick?.(i)} aria-label={`${i} estrelas`}>
          <Star className={`${size} ${i <= n ? "fill-gold text-gold" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [list, setList] = useState<Review[]>([]);
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    setList((data ?? []) as unknown as Review[]);
  };
  useEffect(() => { load(); }, [productId]);

  const addFotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(Array.from(files).slice(0, 3 - fotos.length).map(toImage));
    setFotos((f) => [...f, ...arr].slice(0, 3));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = schema.safeParse({ nome, comentario, nota });
    if (!v.success) { setMsg(v.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({ product_id: productId, user_id: user?.id ?? null, ...v.data, fotos });
    setBusy(false);
    if (error) { setMsg("Não foi possível enviar. Tente novamente."); return; }
    setNome(""); setNota(0); setComentario(""); setFotos([]);
    setMsg("Obrigado pela sua avaliação! 💛");
    load();
  };

  const media = list.length ? list.reduce((s, r) => s + r.nota, 0) / list.length : 0;

  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="text-xl font-bold text-navy">Avaliações dos clientes</h2>
      {list.length > 0 && (
        <div className="mt-2 flex items-center gap-2"><Stars n={Math.round(media)} /><span className="text-sm text-muted-foreground">{media.toFixed(1)} de 5 · {list.length} avaliação(ões)</span></div>
      )}

      <form onSubmit={send} className="mt-4 space-y-3 rounded-lg border bg-secondary p-4">
        <p className="font-semibold text-navy">Conte o que achou do produto</p>
        <Stars n={nota} onPick={setNota} size="size-7" />
        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Seu nome" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} rows={3} placeholder="Sua opinião sobre o produto" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <div className="flex flex-wrap items-center gap-2">
          {fotos.map((f, i) => (
            <div key={i} className="relative size-16"><img src={f} alt="" className="size-full rounded-md object-cover" />
              <button type="button" onClick={() => setFotos(fotos.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-navy p-0.5 text-primary-foreground" aria-label="Remover foto"><X className="size-3" /></button>
            </div>
          ))}
          {fotos.length < 3 && (
            <label className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gold text-[10px] text-navy">
              <Camera className="size-5" />Foto
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFotos(e.target.files)} />
            </label>
          )}
          <span className="text-xs text-muted-foreground">Até 3 fotos</span>
        </div>
        <button disabled={busy} className="btn-comprar rounded-full px-6 py-2.5 text-sm">{busy ? "Enviando..." : "Enviar avaliação"}</button>
        {msg && <p className="text-sm font-semibold text-navy">{msg}</p>}
      </form>

      <div className="mt-6 space-y-4">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar este produto.</p>}
        {list.map((r) => (
          <div key={r.id} className="border-b pb-4">
            <div className="flex items-center justify-between"><p className="font-semibold">{r.nome}</p><span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span></div>
            <Stars n={r.nota} size="size-4" />
            <p className="mt-1 text-sm">{r.comentario}</p>
            {r.fotos?.length > 0 && <div className="mt-2 flex gap-2">{r.fotos.map((f, i) => <button key={i} onClick={() => setZoom(f)}><img src={f} alt="Foto do cliente" className="size-20 rounded-md object-cover" /></button>)}</div>}
          </div>
        ))}
      </div>

      {zoom && <div onClick={() => setZoom(null)} className="fixed inset-0 z-[100] grid place-items-center bg-navy/80 p-4"><img src={zoom} alt="" className="max-h-full max-w-full rounded-lg" /></div>}
    </section>
  );
}
