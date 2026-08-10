# Véu — Jogo de Cartas Tático

Abra `index.html` em um navegador moderno. O duelo local continua funcionando sem instalação nem internet. O modo online usa uma conexão direta WebRTC entre dois navegadores.

## Partida online entre dois jogadores

1. Os dois jogadores abrem a mesma versão do site e escolhem **Online · WebRTC**.
2. Um dos jogadores escolhe ou gera um código de exatamente 10 letras e envia somente esse código ao adversário.
3. O Duelista 1 digita o código e escolhe **Criar sala**.
4. O Duelista 2 digita o mesmo código e escolhe **Entrar na sala**.
5. Quando o indicador ficar verde, o anfitrião inicia a partida.

Cada navegador mostra somente a mão do seu jogador e libera comandos apenas no turno correspondente. O anfitrião cria o estado inicial; depois, cada jogada é sincronizada pelo canal WebRTC ordenado. O PeerJS Cloud é usado para os navegadores se encontrarem pelo código; os dados da partida continuam sendo enviados diretamente entre eles. Algumas redes com CGNAT ou firewall restritivo ainda podem impedir uma conexão direta.

Oscilações do serviço de salas não interrompem um duelo cujo canal direto ainda esteja funcionando. Em uma queda real, o jogo conserva o código e o estado, tenta reconectar automaticamente e sincroniza novamente a partida quando o adversário volta.

O tabuleiro é apresentado pela perspectiva de cada duelista: o próprio polo e a própria faixa ficam sempre embaixo. No modo local, a perspectiva muda depois da tela de passagem de turno. O botão de bandeira no topo permite desistir; no modo online, o resultado é enviado imediatamente ao adversário.

## Como jogar

1. O Duelista 1 começa.
2. Na primeira rodada, nenhum dos jogadores compra. A partir da rodada 2, escolha obrigatoriamente entre comprar um Peão ou um Efeito.
3. Clique em um peão no campo para abrir diretamente seu movimento. As casas possíveis aparecem destacadas.
4. Clique em um peão comum da mão para abrir diretamente as casas onde ele pode entrar.
5. Use os botões somente para ações especiais: virar, combater, fundir e ativar habilidade.
6. Clique numa Carta de Efeito para ler seu efeito no painel e depois use **Jogar carta**.
7. Encerre o turno e entregue o dispositivo; a tela de passagem esconde a mão do próximo jogador.
8. O primeiro Duelista com 10 pontos vence — ou vence quando o adversário desistir.

## Conteúdo implementado das notas

- Tabuleiro com 7 colunas × 10 linhas, duelistas nos polos, limite de 5 peões e preparação com 3 peões/3 efeitos.
- Antes do primeiro turno, cada jogador escolhe individualmente as casas dos seus três peões iniciais.
- Movimento, virar cartas, revelação que cancela combate, ataque conjunto, empate e pontuação.
- Fusões Babel, Justiça Alva e Serpente Selvagem.
- Cartas Fusão são compradas na mesma pilha dos peões comuns e permanecem na mão de Peões.
- Para fundir, é obrigatório possuir a Carta Fusão correspondente e manter todos os materiais exigidos em contato.
- Infantaria, Torre, Bobo, Arqueiro, Pato, Coelho e Montador com suas habilidades.
- Recuar, Rocar Torre, Espada Maldita, Queimar Pertences e Campo das Rosas Pálidas.
- Obstáculos NATURAL e passagem por peões do mesmo tipo.
- Seleção independente dos decks Xadria e Selvagem para cada duelista.
- Xadria combina cartas Luz e Trevas; não representa um dos lados do tabuleiro.
- Como as notas ainda não descrevem suportes Selvagens, esse deck usa apenas as utilidades genéricas **Recuar!** e **Queimar Pertences** nesta versão.
- Um único Slot de Arena afeta os dois lados e pode ser substituído por qualquer duelista.
- Uma Arena repetida não é gasta nem retirada da mão enquanto a mesma Arena já estiver ativa.
- Clicar no Slot de Arena mostra seu efeito no mesmo painel usado pelos Peões.
- Clicar em um peão comum na mão abre imediatamente as casas válidas de colocação.
- Quando o portador da Espada Maldita é destruído, seu dono escolhe visualmente o próximo peão equipado, seja no campo ou na mão.
- O Montador Selvagem possui um botão de habilidade destacado; peões montados exibem marcador, bônus de ATK e regra de proteção no painel.
- Cartas que possuem um arquivo de arte usam a própria imagem como miniatura no campo, na mão e nas telas de escolha.

## Decisões para regras ainda abertas

- Movimento é ortogonal; nesta versão de teste todos os peões movem 3 casas, o mesmo valor do Soldado.
- Cada duelista possui uma zona inicial de duas linhas em seu polo.
- A habilidade da Justiça Alva foi interpretada como +100 ATK por aliado perdido no último turno.
- Peões devem estar conectados por adjacência ortogonal para realizar fusão.
- O Bobo copia o efeito de um peão na mesma linha ou coluna até o fim do turno.

Esses valores ficam concentrados no início de `game.js` para facilitar ajustes futuros.
