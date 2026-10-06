import { createFileRoute, Link } from "@tanstack/react-router";
import { AvaliacoesAdmin } from "@/components/AvaliacoesAdmin";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { fotosKey, premiosKey, usePremioFotos, usePremios } from "@/components/Roleta";
import { useAuth } from "@/lib/auth";
import { HomeAdmin } from "@/components/HomeAdmin";
import { ShippingAdmin } from "@/components/ShippingAdmin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsKey, resolveImage, useProducts, type Product, type ProductColor, type ProductSpec } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — Rainha do Lar" },
      { name: "description", content: "Gerencie produtos, preços e pedidos." },
      { property: "og:title", content: "Painel — Rainha do Lar" },
      { property: "og:description", content: "Área do administrador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const STATUS = ["Aguardando pagamento", "Pago", "Em separação", "Saiu para entrega", "Entregue", "Cancelado"];
type Item = { title: string; qty: number; price: number };

const empty = { id: "", title: "", category: "", description: "", image: "", image2: "", image3: "", image4: "", image5: "", old_price: "", price: "", badge: "", stock: "0", dim_w: "0", dim_h: "0", dim_d: "0", active: true, best_seller: false, sold: "0", colors: [] as ProductColor[], specs: [] as ProductSpec[] };
type Form = typeof empty;
const PRODUCT_CATEGORIES = ["Sofás", "Guarda-roupas", "Camas", "Colchões", "Mesas", "Cadeiras", "Poltronas", "Racks e painéis", "Cômodas", "Armários de cozinha", "Sala de estar", "Sala de jantar", "Quarto", "Cozinha", "Eletrodomésticos", "Eletrônicos", "Decoração", "Geral"];

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"produtos" | "pedidos" | "roleta" | "banners" | "avaliações" | "frete">("produtos");
  if (loading) return <main className="p-10 text-center">Carregando...</main>;
  if (!isAdmin) return <main className="p-10 text-center">Acesso restrito ao administrador. <Link to="/conta" className="text-link underline">Minha conta</Link></main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">Painel do administrador</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["produtos", "pedidos", "roleta", "banners", "avaliações", "frete"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="capitalize">{t}</Button>
        ))}
      </div>
      {tab === "produtos" ? <Produtos /> : tab === "pedidos" ? <Pedidos /> : tab === "roleta" ? <RoletaAdmin /> : tab === "banners" ? <HomeAdmin /> : tab === "frete" ? <ShippingAdmin /> : <AvaliacoesAdmin />}
    </main>
  );
}

function Produtos() {
  const { data: products = [] } = useProducts();
  const qc = useQueryClient();
  const [f, setF] = useState<Form | null>(null);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const categories = Array.from(new Map([...PRODUCT_CATEGORIES, ...products.map((p) => p.category), f?.category ?? ""].filter((c) => c.trim()).map((c) => [c.trim().toLocaleLowerCase("pt-BR"), c.trim()])).values()).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const edit = (p: Product) => {
    setEditing(true);
    setCustomCategory(false);
    setF({ id: p.id, title: p.title, category: p.category, description: p.description, image: p.imageRaw, image2: p.image2Raw, image3: p.extrasRaw[0] ?? "", image4: p.extrasRaw[1] ?? "", image5: p.extrasRaw[2] ?? "", old_price: String(p.oldPrice), price: String(p.price), badge: p.badge ?? "", stock: String(p.stock), dim_w: String(p.dims.w), dim_h: String(p.dims.h), dim_d: String(p.dims.d), active: p.active, best_seller: p.bestSeller, sold: String(p.sold), colors: p.colors.map((c, i) => ({ ...c, image: (p as any).colorsRaw?.[i] ?? c.image })), specs: p.specs.map((x) => ({ ...x })) });
  };

  const save = async () => {
    if (!f) return;
    if (!f.title || !f.price) return setMsg("Preencha nome e preço.");
    const n = (s: string) => Number(s.replace(",", ".")) || 0;
    const id = f.id || f.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const row = { id, title: f.title, category: f.category || "Geral", description: f.description, image: f.image, image2: f.image2, image3: f.image3, image4: f.image4, image5: f.image5, old_price: n(f.old_price), price: n(f.price), badge: f.badge || null, stock: n(f.stock), dim_w: n(f.dim_w), dim_h: n(f.dim_h), dim_d: n(f.dim_d), active: f.active, best_seller: f.best_seller, sold: n(f.sold), colors: f.colors.filter((c) => c.name || c.image), specs: f.specs.filter((x) => x.k.trim() || x.v.trim()) };
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
        <Button onClick={() => { setEditing(false); setCustomCategory(false); setF({ ...empty }); setMsg(""); }}>+ Novo produto</Button>
      </div>
      {msg && <p className="mt-2 text-sm text-navy">{msg}</p>}

      {f && (
        <div className="mt-4 grid gap-3 rounded-lg border bg-secondary p-4 sm:grid-cols-2">
          <label className="text-sm">Nome do produto<input className={input} value={f.title} onChange={(e) => { const title = e.target.value; const vazio = f.specs.every((x) => !x.v.trim()); setF({ ...f, title, specs: vazio ? fichaPara(title + " " + f.category).map((k) => ({ k, v: "" })) : f.specs }); }} /></label>
          <div className="min-w-0 text-sm">
            <label htmlFor="product-category">Categoria</label>
            <Select value={customCategory ? "__custom__" : f.category} onValueChange={(category) => {
              if (category === "__custom__") { setCustomCategory(true); return; }
              setCustomCategory(false);
              const vazio = f.specs.every((x) => !x.v.trim());
              setF({ ...f, category, specs: vazio ? fichaPara(f.title + " " + category).map((k) => ({ k, v: "" })) : f.specs });
            }}>
              <SelectTrigger id="product-category" className="h-10 bg-background"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                <SelectItem value="__custom__">Outra categoria</SelectItem>
              </SelectContent>
            </Select>
            {customCategory && <input aria-label="Nome da nova categoria" placeholder="Nome da nova categoria" className={`${input} mt-2 bg-background`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />}
          </div>
          {fld("old_price", "Preço antigo (riscado)")}
          {fld("price", "Preço de venda")}
          {fld("badge", "Selo (ex: 35% OFF)")}
          {fld("stock", "Estoque", "number")}
          <Foto label="Foto 1 (principal)" value={f.image} onChange={(v) => setF({ ...f, image: v })} />
          <Foto label="Foto 2" value={f.image2} onChange={(v) => setF({ ...f, image2: v })} />
          <Foto label="Foto 3" value={f.image3} onChange={(v) => setF({ ...f, image3: v })} />
          <Foto label="Foto 4" value={f.image4} onChange={(v) => setF({ ...f, image4: v })} />
          <Foto label="Foto 5" value={f.image5} onChange={(v) => setF({ ...f, image5: v })} />
          <Cores value={f.colors} onChange={(colors) => setF({ ...f, colors })} />
          <div className="grid grid-cols-3 gap-2">{fld("dim_w", "Largura cm")}{fld("dim_h", "Altura cm")}{fld("dim_d", "Prof. cm")}</div>
          <label className="text-sm sm:col-span-2">Descrição<textarea className={input} rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <Ficha value={f.specs} onChange={(specs) => setF({ ...f, specs })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Visível na loja</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.best_seller} onChange={(e) => setF({ ...f, best_seller: e.target.checked })} />Mostrar em MAIS VENDIDOS (até 20)</label>
          <label className="grid gap-1 text-sm">Quantidade já vendida<input type="number" min="0" value={f.sold} onChange={(e) => setF({ ...f, sold: e.target.value })} className="rounded-md border px-3 py-2" /></label>
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
  const [novo, setNovo] = useState<string | null>(null);
  useEffect(() => {
    const ch = supabase.channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        setNovo((p.new as { nome: string }).nome);
        qc.invalidateQueries({ queryKey: ["all-orders"] });
        try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play(); } catch { /* sem som */ }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-orders"] });
  };
  const zap = (tel: string, nome: string) => {
    const d = tel.replace(/\D/g, "").replace(/^55/, "");
    const t = `Olá ${nome.split(" ")[0]}! Aqui é da Rainha do Lar 👑 Recebemos seu pedido e vamos finalizar sua compra.`;
    return `https://wa.me/55${d}?text=${encodeURIComponent(t)}`;
  };
  const rastreio = (o: { id: string; telefone: string; nome: string; status: string }) => {
    const d = o.telefone.replace(/\D/g, "").replace(/^55/, "");
    const t = `Olá ${o.nome.split(" ")[0]}! 👑 Aqui é da Rainha do Lar.\n🚚 Seu pedido está: *${o.status}*\n\nSeu código de compra é: *${o.id.slice(0, 8).toUpperCase()}*`;
    return `https://wa.me/55${d}?text=${encodeURIComponent(t)}`;
  };
  if (isLoading) return <p className="mt-6">Carregando...</p>;
  return (
    <section className="mt-6 space-y-3">
      {novo && (
        <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-gold bg-navy p-4 text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          <p className="font-bold">🔔 Novo pedido de <span className="text-gold">{novo}</span>!</p>
          <button onClick={() => setNovo(null)} className="text-sm underline">Fechar</button>
        </div>
      )}
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
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={zap(o.telefone, o.nome)} target="_blank" rel="noreferrer" className="rounded-md bg-buy px-4 py-2 font-bold text-buy-foreground">Chamar no WhatsApp</a>
            <a href={rastreio(o)} target="_blank" rel="noreferrer" className="rounded-md bg-navy px-4 py-2 font-bold text-primary-foreground">Enviar código de compra</a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.endereco)}`} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-2 font-semibold text-navy">Ver no mapa</a>
            <button onClick={async () => { if (!confirm("Apagar este pedido?")) return; await supabase.from("orders").delete().eq("id", o.id); qc.invalidateQueries({ queryKey: ["all-orders"] }); }} className="rounded-md border px-4 py-2 font-semibold text-destructive">Apagar pedido</button>
          </div>
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

function Cores({ value, onChange }: { value: ProductColor[]; onChange: (v: ProductColor[]) => void }) {
  const set = (i: number, c: Partial<ProductColor>) => onChange(value.map((x, j) => (j === i ? { ...x, ...c } : x)));
  return (
    <div className="text-sm sm:col-span-2">
      <p className="font-semibold">Cores disponíveis (bolinhas embaixo do produto)</p>
      {value.map((c, i) => (
        <div key={i} className="mt-2 flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
          <input type="color" value={c.hex || "#8b5a2b"} onChange={(e) => set(i, { hex: e.target.value })} className="size-9 cursor-pointer rounded-full border" aria-label="Cor" />
          <input placeholder="Nome da cor (ex: Naturalle)" value={c.name} onChange={(e) => set(i, { name: e.target.value })} className="h-9 flex-1 rounded-md border px-2" />
          {c.image && <img src={resolveImage(c.image)} alt="" className="size-10 rounded object-contain" />}
          <label className="cursor-pointer rounded-md bg-navy px-3 py-2 font-semibold text-primary-foreground">
            Foto nesta cor
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set(i, { image: await toImage(file) }); e.target.value = ""; }} />
          </label>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-destructive">Remover</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: "", hex: "#8b5a2b", image: "" }])} className="mt-2 rounded-md border border-navy px-3 py-1.5 font-semibold text-navy">+ Adicionar cor</button>
    </div>
  );
}

const BASE = ["Cor", "Tonalidade", "Marca", "Altura", "Largura", "Comprimento", "Peso do produto", "Tempo de garantia"];
/** Escolhe as características certas pelo nome do produto. */
function fichaPara(nome: string): string[] {
  const t = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/guarda|roupeiro|armario|closet/.test(t)) return ["Tipo de guarda-roupa", "Quantidade de portas", "Quantidade de gavetas", ...BASE];
  if (/sofa|poltrona|recamier/.test(t)) return ["Tipo de sofá", "Lugares", "Material do revestimento", "Retrátil / reclinável", ...BASE];
  if (/cama|box|colchao|beliche/.test(t)) return ["Tipo de cama", "Tamanho (solteiro/casal/queen/king)", "Material", ...BASE];
  if (/mesa|cadeira|jantar/.test(t)) return ["Tipo de mesa", "Quantidade de lugares", "Material do tampo", "Cadeiras inclusas", ...BASE];
  if (/rack|painel|estante|tv/.test(t)) return ["Tipo", "Suporta TV até", "Quantidade de portas", "Quantidade de prateleiras", ...BASE];
  if (/comoda|criado|sapateira|cabeceira/.test(t)) return ["Tipo", "Quantidade de gavetas", "Quantidade de portas", ...BASE];
  if (/cozinha|balcao|paneleiro|aereo/.test(t)) return ["Tipo de cozinha", "Quantidade de portas", "Quantidade de gavetas", ...BASE];
  if (/geladeira|refrigerador|freezer/.test(t)) return ["Tipo", "Capacidade (litros)", "Frost free", "Voltagem", "Eficiência energética", ...BASE];
  if (/fogao|cooktop|forno/.test(t)) return ["Tipo", "Quantidade de bocas", "Voltagem", "Acendimento automático", ...BASE];
  if (/lavar|lavadora|tanquinho|secadora/.test(t)) return ["Tipo", "Capacidade (kg)", "Voltagem", "Eficiência energética", ...BASE];
  if (/micro|ventilador|ar condicionado|liquidificador|air ?fryer/.test(t)) return ["Tipo", "Potência", "Voltagem", ...BASE];
  return ["Tipo", ...BASE];
}

function Ficha({ value, onChange }: { value: ProductSpec[]; onChange: (v: ProductSpec[]) => void }) {
  const set = (i: number, c: Partial<ProductSpec>) => onChange(value.map((x, j) => (j === i ? { ...x, ...c } : x)));

  return (
    <div className="text-sm sm:col-span-2">
      <p className="font-semibold">Ficha técnica (características do produto)</p>
      {value.map((x, i) => (
        <div key={i} className="mt-2 flex flex-wrap items-center gap-2">
          <input placeholder="Característica (ex: Cor)" value={x.k} onChange={(e) => set(i, { k: e.target.value })} className="h-9 flex-1 rounded-md border bg-background px-2" />
          <input placeholder="Valor (ex: Branco)" value={x.v} onChange={(e) => set(i, { v: e.target.value })} className="h-9 flex-1 rounded-md border bg-background px-2" />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-destructive">Remover</button>
        </div>
      ))}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([...value, { k: "", v: "" }])} className="rounded-md border border-navy px-3 py-1.5 font-semibold text-navy">+ Adicionar característica</button>
        {!value.length && <button type="button" onClick={() => onChange(fichaPara("").map((k) => ({ k, v: "" })))} className="rounded-md border px-3 py-1.5 font-semibold">Usar modelo pronto</button>}
      </div>
    </div>
  );
}

function RoletaAdmin() {
  const atuais = usePremios();
  const fotosAtuais = usePremioFotos();
  const qc = useQueryClient();
  const [lista, setLista] = useState<string[] | null>(null);
  const [fotosEd, setFotosEd] = useState<string[] | null>(null);
  const [msg, setMsg] = useState("");
  const l = lista ?? atuais;
  const fs = fotosEd ?? l.map((p) => fotosAtuais[p] ?? "");
  const salvar = async () => {
    const pares = l.map((x, i) => [x.trim(), fs[i] ?? ""] as const).filter(([x]) => x).slice(0, 12);
    const limpa = pares.map(([x]) => x);
    if (limpa.length < 2) return setMsg("Coloque pelo menos 2 prêmios.");
    const mapa = Object.fromEntries(pares.filter(([, f]) => f));
    const now = new Date().toISOString();
    const { error } = await supabase.from("settings" as never).upsert([{ key: "roleta_premios", value: limpa, updated_at: now }, { key: "roleta_fotos", value: mapa, updated_at: now }] as never);
    if (error) return setMsg("Não foi possível salvar.");
    setLista(limpa); setFotosEd(pares.map(([, f]) => f)); setMsg("Prêmios salvos!");
    qc.invalidateQueries({ queryKey: premiosKey }); qc.invalidateQueries({ queryKey: fotosKey });
  };
  return (
    <section className="max-w-xl rounded-lg border p-4">
      <h2 className="text-lg font-bold text-navy">Prêmios da Roleta da Sorte</h2>
      <p className="text-sm text-muted-foreground">Compras acima de R$ 2.000 giram a roleta. De 2 a 12 prêmios. Clique no círculo para colocar a foto do prêmio.</p>
      <div className="mt-3 space-y-2">
        {l.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <label className="grid size-12 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-gold text-[10px] text-muted-foreground">
              {fs[i] ? <img src={fs[i]} alt="" className="size-full object-cover" /> : "Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const img = await toImage(file); setFotosEd(l.map((_, j) => (j === i ? img : fs[j] ?? ""))); } e.target.value = ""; }} />
            </label>
            <input value={p} maxLength={40} onChange={(e) => { setFotosEd(fs); setLista(l.map((x, j) => (j === i ? e.target.value : x))); }} className="w-full rounded-md border px-3 py-2" />
            <button onClick={() => { setFotosEd(fs.filter((_, j) => j !== i)); setLista(l.filter((_, j) => j !== i)); }} className="rounded-md border px-3 py-2 text-sm text-destructive">Apagar</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {l.length < 12 && <button onClick={() => setLista([...l, ""])} className="rounded-md border px-4 py-2 font-semibold">+ Adicionar prêmio</button>}
        <button onClick={salvar} className="rounded-md bg-navy px-4 py-2 font-bold text-primary-foreground">Salvar prêmios</button>
      </div>
      {msg && <p className="mt-2 text-sm font-semibold text-navy">{msg}</p>}
    </section>
  );
}
