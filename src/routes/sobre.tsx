import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/sobre")({
  head: () => ({ meta: [
    { title: "Sobre nós — Rainha do Lar" },
    { name: "description", content: "Conheça a Rainha do Lar, loja de móveis e eletrodomésticos em Taguatinga-DF." },
    { property: "og:title", content: "Sobre a Rainha do Lar" },
    { property: "og:description", content: "Móveis e eletrodomésticos com entrega própria no DF." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <InfoPage title="Sobre a Rainha do Lar" items={[
    { q: "Quem somos", a: "A Rainha do Lar é uma loja de móveis e eletrodomésticos de Taguatinga-DF. Nosso objetivo é deixar a sua casa digna de uma rainha, com qualidade e preço justo." },
    { q: "Nossa entrega", a: "Temos entrega própria em todo o Distrito Federal, feita pela nossa equipe." },
    { q: "Atendimento", a: "Atendemos pelo WhatsApp (61) 98180-4734, de segunda a sábado." },
  ]} />,
});
