import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/products";
import { useFavs } from "@/lib/favorites";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos — Rainha do Lar" },
      { name: "description", content: "Os móveis que você marcou com coração na Rainha do Lar." },
      { property: "og:title", content: "Meus favoritos — Rainha do Lar" },
      { property: "og:description", content: "Seus móveis favoritos salvos em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const favs = useFavs();
  const { data: products = [] } = useProducts();
  const list = products.filter((p) => favs.includes(p.id));
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-navy"><Heart className="size-6 fill-gold text-gold" />Meus favoritos</h1>
      {list.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Você ainda não marcou nenhum produto. <Link to="/" className="font-bold text-navy underline">Ver produtos</Link></p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </main>
  );
}
