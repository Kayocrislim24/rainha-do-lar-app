# Fotos e vídeos nas avaliações

## Objetivo
Permitir que clientes anexem fotos e vídeos ao avaliar um produto, com reprodução pública em celular e computador.

## Implementação
- Criar armazenamento público dedicado às mídias das avaliações e limitar os formatos e tamanhos aceitos.
- Salvar referências de vídeos separadamente das fotos, preservando o áudio original quando o arquivo tiver áudio.
- Atualizar criação, edição e exclusão de avaliações para manter as mídias corretas.
- Exibir fotos e vídeos na galeria pública de avaliações e no painel administrativo.
- Mostrar progresso, limites e mensagens de erro claras durante o envio.

## Limites
- Até 3 fotos e 1 vídeo por avaliação.
- Vídeo em formato aceito pelo navegador, com até 20 MB.
- O áudio é opcional: vídeos sem áudio funcionam normalmente; vídeos com áudio mantêm o som e iniciam pausados.

## Verificação
- Conferir envio, edição, reprodução e remoção de mídia.
- Validar a página do produto em celular e computador.
