import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { brl, FREE_SHIPPING_MIN } from "@/lib/store";

export const Route = createFileRoute("/entrega")({
  head: () => ({ meta: [
    { title: "Política de entrega — Rainha do Lar" },
    { name: "description", content: "Como funciona a entrega própria da Rainha do Lar no DF e o frete grátis." },
    { property: "og:title", content: "Política de entrega — Rainha do Lar" },
    { property: "og:description", content: `Entrega própria no DF e frete grátis acima de ${brl(FREE_SHIPPING_MIN)}.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <InfoPage title="Política de entrega" items={[
    { q: "Onde entregamos?", a: "Entregamos em todo o Distrito Federal com equipe própria." },
    { q: "Frete grátis", a: `Compras acima de ${brl(FREE_SHIPPING_MIN)} têm frete grátis.` },
    { q: "Qual é o valor do frete?", a: "Cada cidade possui um valor fixo de entrega. Selecione sua cidade na página do produto ou no carrinho e informe seu endereço completo na compra." },
    { q: "Apartamento ou estrada de chão", a: "A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso." },
  ]} />,
});
