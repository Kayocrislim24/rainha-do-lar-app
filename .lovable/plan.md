# Enviar avaliação em mudo

## Objetivo
Permitir que o cliente escolha enviar o vídeo da avaliação sem áudio, garantindo que nenhuma fala seja publicada.

## Implementação
- Adicionar ao vídeo selecionado a opção clara “Enviar sem áudio”.
- Ao marcar a opção, gerar no próprio aparelho uma nova cópia do vídeo sem faixa de áudio antes do envio.
- Mostrar o vídeo de confirmação em mudo e informar quando a remoção do áudio estiver sendo processada.
- Manter a opção atual de enviar com áudio quando o cliente não marcar o modo mudo.
- Preservar edição, exclusão, limite de 20 MB e reprodução pública das avaliações.

## Verificação
- Testar um vídeo com áudio enviado no modo mudo e confirmar que o arquivo publicado não reproduz som.
- Testar o envio normal com áudio.
- Conferir o formulário em celular e computador.
