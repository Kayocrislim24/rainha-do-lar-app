import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/products";
import { MAX_BANNERS, bannersKey, fileToJpeg, slidesKey, useBanners, useSlides, type Slide } from "@/lib/home";

async function salvarChave(key: string, value: unknown) {
  const { error } = await supabase.from("settings" as never).upsert([{ key, value, updated_at: new Date().toISOString() }] as never);
  return !error;
}

export function HomeAdmin() {
  const qc = useQueryClient();
  const atuaisB = useBanners();
  const atuaisS = useSlides();
  const [banners, setBanners] = useState<string[] | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [msg, setMsg] = useState("");
  const b = banners ?? atuaisB;
  const s = slides ?? atuaisS;
  const salvarB = async () => { setMsg((await salvarChave("home_banners", b)) ? "Banners salvos!" : "Não foi possível salvar."); qc.invalidateQueries({ queryKey: bannersKey }); };
  const salvarS = async () => { setMsg((await salvarChave("home_slides", s)) ? "Destaques salvos!" : "Não foi possível salvar."); qc.invalidateQueries({ queryKey: slidesKey }); };
  const setSl = (i: number, p: Partial<Slide>) => setSlides(s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="mt-6 space-y-6">
      {msg && <p className="font-semibold text-navy">{msg}</p>}
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-bold text-navy">Banners do topo ({b.length}/{MAX_BANNERS})</h2>
        <p className="text-sm text-muted-foreground">Os banners passam sozinhos, um depois do outro, sem parar. Tamanho ideal: 1920 x 580.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {b.map((src, i) => (
            <div key={i} className="rounded-md border p-2">
              <img src={src} alt="" className="aspect-[1920/580] w-full rounded object-cover" />
              <div className="mt-2 flex gap-2 text-sm">
                <button disabled={i === 0} onClick={() => { const n = [...b]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; setBanners(n); }} className="rounded border px-2 py-1 disabled:opacity-40">←</button>
                <button disabled={i === b.length - 1} onClick={() => { const n = [...b]; [n[i + 1], n[i]] = [n[i]!, n[i + 1]!]; setBanners(n); }} className="rounded border px-2 py-1 disabled:opacity-40">→</button>
                <button onClick={() => setBanners(b.filter((_, j) => j !== i))} className="ml-auto rounded border px-3 py-1 text-destructive">Apagar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {b.length < MAX_BANNERS && (
            <label className="cursor-pointer rounded-md border px-4 py-2 font-semibold">+ Adicionar banner
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setBanners([...b, await fileToJpeg(f, 1920)]); e.target.value = ""; }} />
            </label>
          )}
          <button onClick={salvarB} className="rounded-md bg-navy px-4 py-2 font-bold text-primary-foreground">Salvar banners</button>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-bold text-navy">Destaques (Semana do Sofá, Quarto dos sonhos...)</h2>
        <div className="mt-3 space-y-3">
          {s.map((x, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row">
              <label className="grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded border-2 border-dashed border-gold bg-background text-xs text-muted-foreground">
                {x.img ? <img src={resolveImage(x.img)} alt="" className="size-full object-contain" /> : "Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setSl(i, { img: await fileToJpeg(f, 1000) }); e.target.value = ""; }} />
              </label>
              <div className="grid flex-1 gap-2">
                <input value={x.k} onChange={(e) => setSl(i, { k: e.target.value })} placeholder="Título pequeno (ex: Semana do Sofá)" className="rounded-md border px-3 py-2" />
                <input value={x.t} onChange={(e) => setSl(i, { t: e.target.value })} placeholder="Título grande" className="rounded-md border px-3 py-2" />
                <input value={x.d} onChange={(e) => setSl(i, { d: e.target.value })} placeholder="Descrição" className="rounded-md border px-3 py-2" />
              </div>
              <button onClick={() => setSlides(s.filter((_, j) => j !== i))} className="self-start rounded-md border px-3 py-2 text-sm text-destructive">Apagar</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {s.length < 10 && <button onClick={() => setSlides([...s, { k: "", t: "", d: "", img: "" }])} className="rounded-md border px-4 py-2 font-semibold">+ Adicionar destaque</button>}
          <button onClick={salvarS} className="rounded-md bg-navy px-4 py-2 font-bold text-primary-foreground">Salvar destaques</button>
        </div>
      </section>
    </div>
  );
}
