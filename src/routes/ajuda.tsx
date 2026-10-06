import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/ajuda")({
  head: () => ({ meta: [
    { title: "Dúvidas frequentes — Rainha do Lar" },
    { name: "description", content: "Respostas sobre pedidos, pagamento, entrega e cupons na Rainha do Lar." },
    { property: "og:title", content: "Dúvidas frequentes — Rainha do Lar" },
    { property: "og:description", content: "Tire suas dúvidas sobre compras na Rainha do Lar." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <InfoPage title="Dúvidas frequentes" items={[
    { q: "Preciso ter cadastro para comprar?", a: "Não. Você pode comprar como visitante ou criar uma conta para ver seus pedidos." },
    { q: "Como acompanho meu pedido?", a: "Um de nossos vendedores entra em contato pelo WhatsApp para informar o andamento do seu pedido." },
    { q: "Quais as formas de pagamento?", a: "PIX com desconto e cartão de crédito em até 12x." },
    { q: "Como uso o cupom PRIMEIRACOMPRARAINHA?", a: "Aplique o cupom no carrinho e informe seu CPF. Ele vale uma vez por CPF, na primeira compra." },
    { q: "O que é a Roleta da Sorte?", a: "Em compras acima de R$ 2.000 você gira a roleta e ganha um prêmio." },
  ]} />,
});
