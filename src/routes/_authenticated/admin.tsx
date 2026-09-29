import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { productsKey, resolveImage, useProducts, type Product } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — Rainha do Lar" },
      { name: "description", content: "Gerencie produtos, preços e pedidos." },
      { property: "og:title", content: "Painel — Rainha do Lar" },
      { property: "og:description", content: "Área do administrador." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const STATUS = ["Aguardando pagamento", "Pago", "Em separação", "Saiu para entrega", "Entregue", "Cancelado"];
type Item = { title: string; qty: number; price: number };

const empty = { id: "", title: "", category: "", description: "", image: "", image2: "", old_price: "", price: "", badge: "", stock: "0", dim_w: "0", dim_h: "0", dim_d: "0", active: true };
type Form = typeof empty;

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"produtos" | "pedidos">("produtos");
  if (loading) return <main className="p-10 text-center">Carregando...</main>;
  if (!isAdmin) return <main className="p-10 text-center">Acesso restrito ao administrador. <Link to="/conta" className="text-link underline">Minha conta</Link></main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">Painel do administrador</h1>
      <div className="mt-4 flex gap-2">
        {(["produtos", "pedidos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-2 font-semibold capitalize ${tab === t ? "bg-navy text-primary-foreground" : "border"}`}>{t}</button>
        ))}
      </div>
      {tab === "produtos" ? <Produtos /> : <Pedidos />}
    </main>
  );
}

function Produtos() {
  const { data: products = [] } = useProducts();
  const qc = useQueryClient();
  const [f, setF] = useState<Form | null>(null);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");

  const edit = (p: Product) => {
    setEditing(true);
    setF({ id: p.id, title: p.title, category: p.category, description: p.description, image: p.imageRaw, image2: p.image2Raw, old_price: String(p.oldPrice), price: String(p.price), badge: p.badge ?? "", stock: String(p.stock), dim_w: String(p.dims.w), dim_h: String(p.dims.h), dim_d: String(p.dims.d), active: p.active });
  };

  const save = async () => {
    if (!f) return;
    if (!f.title || !f.price) return setMsg("Preencha nome e preço.");
    const n = (s: string) => Number(s.replace(",", ".")) || 0;
    const id = f.id || f.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const row = { id, title: f.title, category: f.category || "Geral", description: f.description, image: f.image, image2: f.image2, old_price: n(f.old_price), price: n(f.price), badge: f.badge || null, stock: n(f.stock), dim_w: n(f.dim_w), dim_h: n(f.dim_h), dim_d: n(f.dim_d), active: f.active };
    const { error } = editing ? await supabase.from("products").update(row).eq("id", f.id) : await supabase.from("products").insert(row);
    if (error) return setMsg(error.message);
    setMsg("Salvo!"); setF(null); qc.invalidateQueries({ queryKey: productsKey });
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: productsKey });
  };

  const input = "w-full rounded-md border px-3 py-2";
  const fld = (k: keyof Form, label: string, type = "text") => (
    <label className="text-sm">{label}<input type={type} className={input} value={String(f?.[k] ?? "")} onChange={(e) => f && setF({ ...f, [k]: e.target.value })} /></label>
  );

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">Produtos ({products.length})</h2>
        <button onClick={() => { setEditing(false); setF({ ...empty }); setMsg(""); }} className="rounded-md bg-buy px-4 py-2 font-bold text-buy-foreground">+ Novo produto</button>
      </div>
      {msg && <p className="mt-2 text-sm text-navy">{msg}</p>}

      {f && (
        <div className="mt-4 grid gap-3 rounded-lg border bg-secondary p-4 sm:grid-cols-2">
          {fld("title", "Nome do produto")}
          {fld("category", "Categoria")}
          {fld("old_price", "Preço antigo (riscado)")}
          {fld("price", "Preço de venda")}
          {fld("badge", "Selo (ex: 35% OFF)")}
          {fld("stock", "Estoque", "number")}
          <Foto label="Foto 1 (principal)" value={f.image} onChange={(v) => setF({ ...f, image: v })} />
          <Foto label="Foto 2" value={f.image2} onChange={(v) => setF({ ...f, image2: v })} />
          <div className="grid grid-cols-3 gap-2">{fld("dim_w", "Largura cm")}{fld("dim_h", "Altura cm")}{fld("dim_d", "Prof. cm")}</div>
          <label className="text-sm sm:col-span-2">Descrição<textarea className={input} rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Visível na loja</label>
          <div className="flex gap-2 sm:col-span-2">
            <button onClick={save} className="rounded-md bg-buy px-5 py-2 font-bold text-buy-foreground">Salvar</button>
            <button onClick={() => setF(null)} className="rounded-md border px-5 py-2">Cancelar</button>
          </div>
        </div>
      )}

      <div className="mt-4 divide-y rounded-lg border">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3">
            <img src={p.image} alt="" className="size-14 object-contain" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{p.title} {!p.active && <span className="text-xs text-muted-foreground">(oculto)</span>}</p>
              <p className="text-sm"><span className="text-price-old line-through">{brl(p.oldPrice)}</span> <span className="font-bold text-price-new">{brl(p.price)}</span> · estoque {p.stock}</p>
            </div>
            <button onClick={() => edit(p)} className="rounded-md border px-3 py-1.5 text-sm">Editar</button>
            <button onClick={() => remove(p.id)} className="rounded-md border px-3 py-1.5 text-sm text-destructive">Apagar</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pedidos() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-orders"] });
  };
  if (isLoading) return <p className="mt-6">Carregando...</p>;
  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-lg font-bold text-navy">Pedidos ({orders.length})</h2>
      {!orders.length && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">{o.nome} · {o.telefone}</p>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-md border px-2 py-1">
              {STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")} · {o.endereco}</p>
          {o.condicao && <p className="text-warn-foreground">{o.condicao}</p>}
          <ul className="mt-1">{(o.itens as Item[]).map((i, k) => <li key={k}>{i.qty}x {i.title} — {brl(i.price * i.qty)}</li>)}</ul>
          <p className="mt-1">Frete {brl(Number(o.frete))} · <b className="text-price-new">Total {brl(Number(o.total))}</b></p>
        </div>
      ))}
    </section>
  );
}

/** Lê a foto do computador/celular, reduz para até 1000px e guarda como imagem JPEG. */
function toImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => rej(new Error("Arquivo de imagem inválido"));
    img.src = URL.createObjectURL(file);
  });
}

function Foto({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const src = resolveImage(value);
  return (
    <div className="text-sm">
      <p>{label}</p>
      <div className="mt-1 flex items-center gap-3 rounded-md border bg-background p-2">
        {src ? <img src={src} alt="" className="size-16 rounded object-contain" /> : <div className="grid size-16 place-items-center rounded bg-muted text-xs text-muted-foreground">sem foto</div>}
        <label className="cursor-pointer rounded-md bg-navy px-3 py-2 font-semibold text-primary-foreground">
          Escolher arquivo
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) onChange(await toImage(file)); e.target.value = ""; }} />
        </label>
        {value && <button type="button" onClick={() => onChange("")} className="text-destructive">Remover</button>}
      </div>
    </div>
  );
}
