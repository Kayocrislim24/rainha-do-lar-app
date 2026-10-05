# Crie uma aplicação web moderna e responsiva de e-commerce para a loja Rainha do Lar , com tema...

Crie uma aplicação web moderna e responsiva de e-commerce para a loja "Rainha do Lar", com tema visual acolhedor, limpo e profissional, otimizada para dispositivos móveis e desktop.

1. Identidade e Estrutura Geral:
- Nome da marca: Rainha do Lar.
- Catálogo de produtos com fotos em alta resolução, título, descrição, categoria e crachás de destaque.
- Formatação de Preços: Exibir acima o preço original/anterior tachado e em vermelho (ex: R$ 899,00) e, logo abaixo, o preço promocional final em destaque e na cor verde (ex: R$ 699,00).

2. Sistema de Frete e Localização:
- Cálculo base de frete a R$ 3,00 por quilômetro (km) a partir do CEP/endereço da loja ou origem.
- Caixa de seleção (checkbox/condicional) obrigatória no checkout para condições especiais de entrega:
  * "Entrega em Apartamento (subida de escada/elevador)" -> adiciona aviso de combinar taxas extras.
  * "Estrada de chão ou local de difícil acesso" -> alerta de combinação prévia via WhatsApp.
- Indicação clara no resumo do frete: "A combinar caso seja apartamento ou acesso por estrada de chão/difícil acesso".

3. Autenticação e Perfis (Separado Cliente e Administrador):
- Área do Cliente: Cadastro/login com email e senha, histórico de pedidos, status da compra e gestão de endereço de entrega.
- Painel do Administrador (/admin):
  * Gestão completa de produtos (CRUD: criar, editar preços normais e promocionais, fotos, estoque).
  * Painel de pedidos com status em tempo real (Pendente, Pago, Em Transporte, Entregue).
  * Notificação/sinalizador visual claro quando o pagamento for confirmado no gateway.

4. Checkout, Pagamento e Integração com WhatsApp:
- Integração de pagamento nativo no site (ex: Mercado Pago / Asaas / Stripe para PIX e Cartão de Crédito).
- Webhook/atualização automática: assim que o pagamento for aprovado no checkout do site, o status do pedido muda automaticamente para "Pago / Aprovado", gerando confirmação instantânea para o painel do ADM.
- Disparo do Carrinho para WhatsApp: Ao finalizar o checkout (ou clicar em confirmar pedido), gerar e abrir automaticamente uma mensagem estruturada no WhatsApp da loja com o resumo completo:
  * Nome do cliente, telefone e endereço completo.
  * Itens selecionados com quantidades e valores.
  * Valor do frete calculado (com observação se marcou apartamento ou estrada de chão).
  * Valor total e status do pagamento realizado no site.
faz algo que nenhuma loja online tem aquele negócio de dar uma experiencia maravilhosa pros clientes

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/80944a74-596c-45cb-a545-970748b7ee05).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
