import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/trocas")({
  head: () => ({ meta: [
    { title: "Trocas e devoluções — Rainha do Lar" },
    { name: "description", content: "Saiba como trocar ou devolver um produto comprado na Rainha do Lar." },
    { property: "og:title", content: "Trocas e devoluções — Rainha do Lar" },
    { property: "og:description", content: "Prazo de 7 dias para arrependimento e garantia dos produtos." },
  ] }),
  component: () => <InfoPage title="Trocas e devoluções" items={[
    { q: "Arrependimento", a: "Você tem até 7 dias após o recebimento para desistir da compra, conforme o Código de Defesa do Consumidor." },
    { q: "Produto com defeito", a: "Fale conosco pelo WhatsApp com fotos do produto e o código do pedido. Vamos resolver o mais rápido possível." },
    { q: "Garantia", a: "Cada produto tem a garantia do fabricante informada na ficha técnica." },
  ]} />,
});
