import { useEffect, useState } from "react";
import { Camera, Star, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Review = { id: string; nome: string; nota: number; comentario: string; fotos: string[]; avatar?: string; created_at: string };

const schema = z.object({
  nome: z.string().trim().min(1, "Digite seu nome").max(80),
  comentario: z.string().trim().min(3, "Escreva sua opinião").max(1000),
  nota: z.number().min(1, "Escolha as estrelas").max(5),
});

function toImage(file: File, max = 800): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
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
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    setList(((data ?? []) as unknown as Review[]).map((r) => ({ ...r, fotos: (Array.isArray(r.fotos) ? r.fotos : []).filter((f) => typeof f === "string" && f.length > 30) })));
  };
  useEffect(() => { load(); }, [productId]);

  const addFotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(Array.from(files).slice(0, 3 - fotos.length).map((f) => toImage(f, 1000)));
    setFotos((f) => [...f, ...arr].slice(0, 3));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = schema.safeParse({ nome, comentario, nota });
    if (!v.success) { setMsg(v.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({ product_id: productId, user_id: user?.id ?? null, ...v.data, fotos, avatar } as never);
    setBusy(false);
    if (error) { setMsg("Não foi possível enviar. Tente novamente."); return; }
    setNome(""); setNota(0); setComentario(""); setFotos([]); setAvatar("");
    setMsg("Obrigado pela sua avaliação! 💛");
    load();
  };

  const media = list.length ? list.reduce((s, r) => s + r.nota, 0) / list.length : 0;

  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, c: list.filter((r) => r.nota === s).length }));

  return (
    <section className="mt-12 border-t pt-8">
      {list.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-navy">Avaliações dos clientes</h2>
          <div className="mt-4 flex flex-col gap-6 overflow-hidden rounded-2xl border-2 border-gold bg-navy p-6 text-primary-foreground shadow-xl sm:flex-row sm:items-center">
            <div className="text-center sm:w-56 sm:shrink-0 sm:border-r sm:border-gold/40 sm:pr-6">
              <p className="text-6xl font-extrabold text-gold">{media.toFixed(1)}</p>
              <div className="mt-2 flex justify-center"><Stars n={Math.round(media)} size="size-7" /></div>
              <p className="mt-2 text-sm font-semibold">{list.length} {list.length === 1 ? "avaliação" : "avaliações"}</p>
              {list.some((r) => r.fotos.length) && <p className="mt-1 text-xs text-primary-foreground/70">{list.reduce((t, r) => t + r.fotos.length, 0)} fotos de clientes</p>}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {dist.map(({ s, c }) => (
                <div key={s} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-4 shrink-0 text-right">{s}</span><Star className="size-4 shrink-0 fill-gold text-gold" />
                  <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${(c / list.length) * 100}%` }} /></div>
                  <span className="w-6 shrink-0 text-right">{c}</span>
                </div>
              ))}
            </div>
          </div>
          {list.some((r) => r.fotos.length) && (
            <div className="mt-4">
              <p className="text-sm font-bold uppercase text-navy">Fotos dos clientes</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">{list.flatMap((r) => r.fotos).map((f, i) => <button key={i} type="button" onClick={() => setZoom(f)} className="shrink-0"><img src={f} alt="Foto de cliente" className="size-24 rounded-lg border-2 border-gold object-cover transition hover:scale-105 sm:size-28" /></button>)}</div>
            </div>
          )}
          <div className="mt-4 space-y-4">
            {list.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  {r.avatar ? <img src={r.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <div className="grid size-12 shrink-0 place-items-center rounded-full bg-navy text-lg font-bold text-primary-foreground">{r.nome.charAt(0).toUpperCase()}</div>}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="mt-2"><Stars n={r.nota} /></div>
                <p className="mt-2 whitespace-pre-line break-words text-base">{r.comentario}</p>
                {Array.isArray(r.fotos) && r.fotos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">{r.fotos.map((f, i) => <button key={i} type="button" onClick={() => setZoom(f)}><img src={f} alt="" className="size-28 rounded-lg border object-cover transition hover:scale-105" /></button>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto mt-8 max-w-xl">
          <form onSubmit={send} className="space-y-4 rounded-xl border bg-secondary p-5">
            <p className="text-2xl font-bold text-navy">Avalie este produto</p>
            <Stars n={nota} onPick={setNota} size="size-9" />
            <div className="flex items-center gap-3">
              <label className="relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-gold bg-background text-navy" aria-label="Sua foto de perfil">
                {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <Camera className="size-6" />}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await toImage(f, 200)); }} />
              </label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Seu nome" className="w-full rounded-md border bg-background px-4 py-3 text-base" />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">Toque no círculo para colocar sua foto de perfil (opcional)</p>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} rows={5} placeholder="Conte o que achou: qualidade, entrega, montagem..." className="w-full rounded-md border bg-background px-4 py-3 text-base" />
            <div className="flex flex-wrap items-center gap-2">
              {fotos.map((f, i) => (
                <div key={i} className="relative size-20"><img src={f} alt="" className="size-full rounded-md object-cover" />
                  <button type="button" onClick={() => setFotos(fotos.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-navy p-0.5 text-primary-foreground" aria-label="Remover foto"><X className="size-3" /></button>
                </div>
              ))}
              {fotos.length < 3 && (
                <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gold text-xs text-navy">
                  <Camera className="size-6" />Foto
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFotos(e.target.files)} />
                </label>
              )}
              <span className="text-xs text-muted-foreground">Até 3 fotos</span>
            </div>
            <button disabled={busy} className="btn-comprar w-full rounded-full px-6 py-3.5 text-base">{busy ? "Enviando..." : "Enviar avaliação"}</button>
            {msg && <p className="text-sm font-semibold text-navy">{msg}</p>}
          </form>
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-h-[90vh] max-w-full rounded-lg" />
        </div>
      )}
    </section>
  );
}
