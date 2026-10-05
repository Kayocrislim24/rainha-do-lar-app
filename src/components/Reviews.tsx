import { useEffect, useRef, useState } from "react";
import { Camera, Star, Video, Volume2, VolumeX, X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Review = { id: string; nome: string; nota: number; comentario: string; fotos: string[]; videos: { path: string; url: string }[]; avatar?: string; created_at: string };
type VideoDraft = { path?: string; url: string; file?: File; removeAudio: boolean };

const VIDEO_PREFIX = "review-video:";
const VIDEO_LIMIT = 20 * 1024 * 1024;

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
        const context = c.getContext("2d");
        if (!context) { rej(new Error("Não foi possível preparar a foto.")); return; }
        context.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = rej;
      img.src = r.result as string;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function withoutAudio(file: File): Promise<File> {
  const [{ FFmpeg }, { fetchFile }, { default: coreURL }, { default: wasmURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
    import("@ffmpeg/core?url"),
    import("@ffmpeg/core/wasm?url"),
  ]);
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({ coreURL, wasmURL });
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const input = `entrada.${extension}`;
  const output = `video-sem-audio.${extension}`;
  await ffmpeg.writeFile(input, await fetchFile(file));
  const result = await ffmpeg.exec(["-i", input, "-map", "0:v:0", "-c:v", "copy", "-an", output]);
  if (result !== 0) throw new Error("Não foi possível remover o áudio deste vídeo.");
  const data = await ffmpeg.readFile(output);
  ffmpeg.terminate();
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new File([bytes], `video-sem-audio.${extension}`, { type: file.type, lastModified: Date.now() });
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

const EMOJIS = ["😍", "🥰", "😊", "👍", "👏", "💛", "⭐", "🔥", "🏠", "🛋️", "🛏️", "📦", "🚚", "💯", "😕", "👎"];
const TK = "rdl-reviews";
const getTokens = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(TK) || "{}"); } catch { return {}; } };
const setToken = (id: string, t: string | null) => { const m = getTokens(); if (t) m[id] = t; else delete m[id]; localStorage.setItem(TK, JSON.stringify(m)); };

export function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [list, setList] = useState<Review[]>([]);
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [video, setVideo] = useState<VideoDraft | null>(null);
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [mine, setMine] = useState<Record<string, string>>({});
  useEffect(() => { setMine(getTokens()); }, []);
  const formRef = useRef<HTMLFormElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const addEmoji = (e: string) => {
    const ta = taRef.current; const a = ta?.selectionStart ?? comentario.length; const b = ta?.selectionEnd ?? comentario.length;
    const v = (comentario.slice(0, a) + e + comentario.slice(b)).slice(0, 1000); setComentario(v);
    requestAnimationFrame(() => { ta?.focus(); ta?.setSelectionRange(a + e.length, a + e.length); });
  };
  const editar = (r: Review) => { setEditId(r.id); setNome(r.nome); setNota(r.nota); setComentario(r.comentario); setFotos(r.fotos); setVideo(r.videos[0] ? { ...r.videos[0], removeAudio: false } : null); setAvatar(r.avatar ?? ""); setMsg(null); formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const clearVideo = () => { if (video?.file) URL.revokeObjectURL(video.url); setVideo(null); setVideoStatus(null); };
  const cancelar = () => { setEditId(null); setNome(""); setNota(0); setComentario(""); setFotos([]); clearVideo(); setAvatar(""); };
  const apagar = async (r: Review) => {
    if (!confirm("Apagar sua avaliação?")) return;
    const { data } = await supabase.rpc("delete_review" as never, { _id: r.id, _token: mine[r.id] } as never);
    if (data) { setToken(r.id, null); setMine(getTokens()); if (editId === r.id) cancelar(); load(); } else setMsg("Não foi possível apagar.");
  };

  const load = async () => {
    const { data } = await supabase.from("reviews").select("id, product_id, user_id, nome, nota, comentario, fotos, avatar, created_at").eq("product_id", productId).order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as Omit<Review, "videos">[];
    const mapped = await Promise.all(rows.map(async (r) => {
      const media = Array.isArray(r.fotos) ? r.fotos.filter((f) => typeof f === "string") : [];
      const paths = media.filter((f) => f.startsWith(VIDEO_PREFIX)).map((f) => f.slice(VIDEO_PREFIX.length));
      const videos = await Promise.all(paths.map(async (path) => {
        const { data: signed } = await supabase.storage.from("review-media").createSignedUrl(path, 3600);
        return signed?.signedUrl ? { path, url: signed.signedUrl } : null;
      }));
      return {
        ...r,
        fotos: media.filter((f) => !f.startsWith(VIDEO_PREFIX) && f.length > 30),
        videos: videos.filter((v): v is { path: string; url: string } => v !== null),
      };
    }));
    setList(mapped);
  };
  useEffect(() => { load(); }, [productId]);

  const addFotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(Array.from(files).slice(0, 3 - fotos.length).map((f) => toImage(f, 1000)));
    setFotos((f) => [...f, ...arr].slice(0, 3));
  };

  const addVideo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setMsg("Escolha um arquivo de vídeo."); return; }
    if (file.size > VIDEO_LIMIT) { setMsg("O vídeo deve ter no máximo 20 MB."); return; }
    clearVideo();
    setVideo({ file, url: URL.createObjectURL(file), removeAudio: false });
    setMsg(null);
  };

  const uploadVideo = async (reviewId: string) => {
    if (!video?.file) return video?.path ?? null;
    let uploadFile = video.file;
    if (video.removeAudio) {
      setVideoStatus("Removendo o áudio do vídeo...");
      uploadFile = await withoutAudio(video.file);
      setVideoStatus("Áudio removido. Enviando vídeo...");
    } else {
      setVideoStatus("Enviando vídeo...");
    }
    const extension = uploadFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const path = `${reviewId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("review-media").upload(path, uploadFile, { contentType: uploadFile.type, upsert: false });
    if (error) throw new Error("Não foi possível enviar o vídeo. Tente novamente.");
    setVideoStatus(null);
    return path;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = schema.safeParse({ nome, comentario, nota });
    if (!v.success) { setMsg(v.error.issues[0]?.message ?? "Confira os dados da avaliação."); return; }
    setBusy(true);
    try {
      const id = editId ?? crypto.randomUUID();
      const videoPath = await uploadVideo(id);
      const media = videoPath ? [...fotos, `${VIDEO_PREFIX}${videoPath}`] : fotos;
      if (editId) {
      const { data } = await supabase.rpc("update_review" as never, { _id: editId, _token: mine[editId], _nome: v.data.nome, _nota: v.data.nota, _comentario: v.data.comentario, _fotos: media, _avatar: avatar } as never);
      setBusy(false);
      if (!data) { setMsg("Não foi possível salvar. Tente novamente."); return; }
      cancelar(); setMsg("Avaliação atualizada!");
    } else {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("reviews").insert({ id, edit_token: token, product_id: productId, user_id: user?.id ?? null, ...v.data, fotos: media, avatar } as never);
      setBusy(false);
      if (error) { setMsg("Não foi possível enviar. Tente novamente."); return; }
      setToken(id, token); setMine(getTokens());
      cancelar(); setMsg("Obrigado pela sua avaliação! 💛");
    }
      load();
    } catch (error) {
      setBusy(false);
      setVideoStatus(null);
      setMsg(error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.");
    }
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
               {list.some((r) => r.fotos.length || r.videos.length) && <p className="mt-1 text-xs text-primary-foreground/70">Fotos e vídeos reais de clientes</p>}
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
                {mine[r.id] && <div className="mt-2 flex gap-2 text-sm"><button type="button" onClick={() => editar(r)} className="rounded-full border border-navy px-4 py-1.5 font-semibold text-navy">Editar</button><button type="button" onClick={() => apagar(r)} className="rounded-full border px-4 py-1.5 font-semibold text-destructive">Apagar</button></div>}
                <p className="mt-2 whitespace-pre-line break-words text-base">{r.comentario}</p>
                {Array.isArray(r.fotos) && r.fotos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">{r.fotos.map((f, i) => <button key={i} type="button" onClick={() => setZoom(f)}><img src={f} alt="" className="size-28 rounded-lg border object-cover transition hover:scale-105" /></button>)}</div>
                )}
                {r.videos.map((v) => <video key={v.path} src={v.url} controls playsInline preload="metadata" className="mt-3 aspect-video w-full max-w-xl rounded-lg border bg-foreground object-contain" />)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto mt-8 max-w-xl">
          <form ref={formRef} onSubmit={send} className="space-y-4 rounded-xl border bg-secondary p-5">
            <p className="text-2xl font-bold text-navy">{editId ? "Editar sua avaliação" : "Avalie este produto"}</p>
            <Stars n={nota} onPick={setNota} size="size-9" />
            <div className="flex items-center gap-3">
              <label className="relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-gold bg-background text-navy" aria-label="Sua foto de perfil">
                {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <Camera className="size-6" />}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await toImage(f, 200)); }} />
              </label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="Seu nome" className="w-full rounded-md border bg-background px-4 py-3 text-base" />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">Toque no círculo para colocar sua foto de perfil (opcional)</p>
            <textarea ref={taRef} value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} rows={5} placeholder="Conte o que achou: qualidade, entrega, montagem..." className="w-full rounded-md border bg-background px-4 py-3 text-base" />
            <div className="flex flex-wrap gap-1 rounded-md border bg-background p-2">{EMOJIS.map((e) => <button key={e} type="button" onClick={() => addEmoji(e)} aria-label={`Inserir ${e}`} className="grid size-9 place-items-center rounded-md text-xl transition hover:scale-110 hover:bg-muted">{e}</button>)}</div>
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
            <div className="rounded-md border bg-background p-3">
              {video ? (
                <div className="relative overflow-hidden rounded-md border">
                  <video src={video.url} controls playsInline preload="metadata" muted={video.removeAudio} className="aspect-video w-full bg-foreground object-contain" />
                  <button type="button" onClick={clearVideo} className="absolute right-2 top-2 rounded-full bg-navy p-1.5 text-primary-foreground" aria-label="Remover vídeo"><X className="size-4" /></button>
                </div>
              ) : (
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gold text-sm font-semibold text-navy">
                  <Video className="mb-1 size-7" />Adicionar vídeo
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { addVideo(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
              {video?.file && (
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border border-gold bg-secondary p-3 text-navy">
                  <input
                    type="checkbox"
                    checked={video.removeAudio}
                    disabled={busy}
                    onChange={(e) => setVideo((current) => current ? { ...current, removeAudio: e.target.checked } : current)}
                    className="mt-0.5 size-5 shrink-0 accent-[var(--navy)]"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-bold"><VolumeX className="size-5 shrink-0" />Enviar sem áudio</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Remove toda a fala e qualquer som antes de publicar.</span>
                  </span>
                </label>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Volume2 className="size-3.5" />1 vídeo de até 20 MB. Você escolhe enviar com áudio ou em mudo.</p>
              {videoStatus && <p role="status" className="mt-2 text-sm font-bold text-navy">{videoStatus}</p>}
            </div>
            <button disabled={busy} className="btn-comprar w-full rounded-full px-6 py-3.5 text-base">{busy ? "Enviando..." : editId ? "Salvar alterações" : "Enviar avaliação"}</button>
            {editId && <button type="button" onClick={cancelar} className="w-full rounded-full border px-6 py-3 font-semibold text-navy">Cancelar edição</button>}
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
