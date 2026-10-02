import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/entrega")({
  head: () => ({ meta: [
    { title: "Política de entrega — Rainha do Lar" },
    { name: "description", content: "Como funciona a entrega própria da Rainha do Lar no DF e o frete grátis." },
    { property: "og:title", content: "Política de entrega — Rainha do Lar" },
    { property: "og:description", content: "Entrega própria no DF e frete grátis acima de R$ 1.500." },
  ] }),
  component: () => <InfoPage title="Política de entrega" items={[
    { q: "Onde entregamos?", a: "Entregamos em todo o Distrito Federal com equipe própria." },
    { q: "Frete grátis", a: "Compras acima de R$ 1.500 têm frete grátis." },
    { q: "Como calcular o frete?", a: "Digite seu CEP na página do produto ou no carrinho para ver o valor da entrega." },
    { q: "Apartamento ou estrada de chão", a: "A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso." },
  ]} />,
});
