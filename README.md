# Confluxo — jogo de cartas tático

Protótipo web de um jogo tático para dois duelistas, com tabuleiro 6 × 8, turnos, combate, efeitos, arenas, Peões Combinados e modo online via WebRTC.

A partida também termina automaticamente quando somente um dos duelistas fica sem nenhum Peão normal disponível no campo, na mão ou na pilha. No modo contra o bot, ele evita voluntariamente casas ocupadas pelo Poço sem Fundo.

Não existe limite total de Peões em campo; cada duelista ainda pode colocar somente um novo Peão por turno, quando houver uma casa válida em seu polo.

## Jogar

Abra `index.html` ou acesse o endereço do projeto no GitHub Pages.

- **Local:** os dois jogadores utilizam o mesmo dispositivo, com passagem protegida de turno.
- **Online:** os jogadores digitam o mesmo código de 10 letras; o PeerJS aproxima os navegadores e a partida segue por uma conexão WebRTC.

As instruções completas e as regras implementadas estão em [`LEIA-ME.md`](LEIA-ME.md).

## Publicar no GitHub Pages

Depois de publicar este repositório no GitHub:

1. Abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/(root)**.
4. Clique em **Save**.

O site será atualizado automaticamente sempre que novos commits forem enviados para a branch `main`.

## Estrutura

- `index.html`: interface principal.
- `styles.css`: identidade visual e layout responsivo.
- `confluxo-game.js`: regras e estado da partida.
- `network.js`: conexão WebRTC entre os jogadores.
- `soldado.png`: arte utilizada nas cartas compatíveis.
