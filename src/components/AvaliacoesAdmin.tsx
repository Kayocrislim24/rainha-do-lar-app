import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/lib/products";

type R = { id: string; product_id: string; nome: string; nota: number; comentario: string; fotos: string[]; avatar: string; created_at: string };

export function AvaliacoesAdmin() {
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as R[];
    },
  });
  const apagar = async (id: string) => {
    if (!confirm("Apagar esta avaliação?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };
  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Carregando avaliações...</p>;
  if (!data.length) return <p className="mt-6 text-muted-foreground">Nenhuma avaliação recebida ainda.</p>;
  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-lg font-bold text-navy">Avaliações recebidas ({data.length})</h2>
      {data.map((r) => (
        <div key={r.id} className="rounded-lg border p-4">
          <div className="flex min-w-0 items-start gap-3">
            {r.avatar ? <img src={r.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <div className="grid size-12 shrink-0 place-items-center rounded-full bg-navy font-bold text-primary-foreground">{r.nome.charAt(0).toUpperCase()}</div>}
            <div className="min-w-0 flex-1">
              <p className="break-words font-bold text-navy">{r.nome}</p>
              <p className="break-words text-xs text-muted-foreground">{products.find((p) => p.id === r.product_id)?.title ?? r.product_id} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
              <div className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= r.nota ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}</div>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-line break-words">{r.comentario}</p>
          {Array.isArray(r.fotos) && r.fotos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{r.fotos.map((f, i) => <a key={i} href={f} target="_blank" rel="noreferrer"><img src={f} alt="" className="size-20 rounded object-cover" /></a>)}</div>}
          <button onClick={() => apagar(r.id)} className="mt-3 rounded-md border px-3 py-1.5 text-sm text-destructive">Apagar</button>
        </div>
      ))}
    </div>
  );
}
