import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import bannerPadrao from "@/assets/banner-mes-economia.jpg.asset.json";

export type Slide = { k: string; t: string; d: string; img: string };
export const MAX_BANNERS = 10;
export const bannersKey = ["home-banners"];
export const slidesKey = ["home-slides"];
export const BANNERS_PADRAO = [bannerPadrao.url];
export const SLIDES_PADRAO: Slide[] = [
  { k: "Semana do Sofá", t: "Sofás com até 30% OFF", d: "Conforto para a sala inteira, em até 12x.", img: "local:sofa" },
  { k: "Quarto dos sonhos", t: "Guarda-roupas a partir de 12x", d: "Mais espaço e organização com entrega própria no DF.", img: "local:guarda-roupa" },
  { k: "Noites melhores", t: "Camas e cabeceiras em oferta", d: "Modelos casal e queen com preço especial.", img: "local:cama" },
];

async function ler(key: string) {
  const { data } = await supabase.from("settings" as never).select("value").eq("key", key).maybeSingle();
  return (data as { value?: unknown } | null)?.value;
}

export function useBanners() {
  const q = useQuery({ queryKey: bannersKey, queryFn: async () => { const v = await ler("home_banners"); return Array.isArray(v) ? (v as string[]) : BANNERS_PADRAO; } });
  return q.data ?? BANNERS_PADRAO;
}
export function useSlides() {
  const q = useQuery({ queryKey: slidesKey, queryFn: async () => { const v = await ler("home_slides"); return Array.isArray(v) && v.length ? (v as Slide[]) : SLIDES_PADRAO; } });
  return q.data ?? SLIDES_PADRAO;
}

/** Reduz a imagem para o tamanho máximo dado e devolve JPEG. */
export function fileToJpeg(file: File, max: number): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => rej(new Error("Arquivo de imagem inválido"));
    img.src = URL.createObjectURL(file);
  });
}
