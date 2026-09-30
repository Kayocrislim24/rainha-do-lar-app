import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import guardaRoupa from "@/assets/guarda-roupa.jpg";
import sofa from "@/assets/sofa.jpg";
import cama from "@/assets/cama.jpg";
import mesa from "@/assets/mesa.jpg";
import guardaRoupaBranco from "@/assets/guarda-roupa-branco.jpg";
import sofaAzul from "@/assets/sofa-azul.jpg";
import camaEscura from "@/assets/cama-escura.jpg";
import mesaPreta from "@/assets/mesa-preta.jpg";

const local: Record<string, string> = { "local:guarda-roupa": guardaRoupa, "local:sofa": sofa, "local:cama": cama, "local:mesa": mesa, "local:guarda-roupa-branco": guardaRoupaBranco, "local:sofa-azul": sofaAzul, "local:cama-escura": camaEscura, "local:mesa-preta": mesaPreta };
export const resolveImage = (s: string) => local[s] ?? s;

export type Product = {
  id: string; title: string; category: string; description: string; image: string; imageRaw: string; image2: string; image2Raw: string;
  oldPrice: number; price: number; badge?: string | undefined; stock: number; active: boolean;
  dims: { w: number; h: number; d: number };
  colors: ProductColor[];
};
export type ProductColor = { name: string; hex: string; image: string };

type Row = {
  id: string; title: string; category: string; description: string; image: string; image2: string; old_price: number; price: number;
  badge: string | null; stock: number; dim_w: number; dim_h: number; dim_d: number; active: boolean; colors?: ProductColor[] | null;
};

const map = (r: Row): Product => ({
  id: r.id, title: r.title, category: r.category, description: r.description, image: resolveImage(r.image), imageRaw: r.image, image2: resolveImage(r.image2 ?? ""), image2Raw: r.image2 ?? "",
  oldPrice: Number(r.old_price), price: Number(r.price), badge: r.badge ?? undefined, stock: r.stock, active: r.active,
  dims: { w: r.dim_w, h: r.dim_h, d: r.dim_d },
  colors: Array.isArray(r.colors) ? r.colors.map((c) => ({ ...c, image: resolveImage(c.image ?? "") })) : [],
});

export const productsKey = ["products"];
export function useProducts() {
  return useQuery({
    queryKey: productsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at");
      if (error) throw error;
      return (data as Row[]).map(map);
    },
  });
}
