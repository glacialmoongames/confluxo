# Confluxo — Jogo de Cartas Tático

Abra `index.html` em um navegador moderno. O duelo local continua funcionando sem instalação nem internet. O modo online usa uma conexão direta WebRTC entre dois navegadores.

## Partida online entre dois jogadores

1. Os dois jogadores abrem a mesma versão do site e escolhem **Online · WebRTC**.
2. Um dos jogadores escolhe ou gera um código de exatamente 10 letras e envia somente esse código ao adversário.
3. O Duelista 1 digita o código e escolhe **Criar sala**.
4. O Duelista 2 digita o mesmo código e escolhe **Entrar na sala**.
5. Quando o indicador ficar verde, o anfitrião inicia a partida.

Cada navegador mostra somente a mão do seu jogador e libera comandos apenas no turno correspondente. O anfitrião cria o estado inicial; depois, cada jogada é sincronizada pelo canal WebRTC ordenado. O PeerJS Cloud é usado para os navegadores se encontrarem pelo código; os dados da partida continuam sendo enviados diretamente entre eles. Algumas redes com CGNAT ou firewall restritivo ainda podem impedir uma conexão direta.

Oscilações do serviço de salas não interrompem um duelo cujo canal direto ainda esteja funcionando. Cada mudança de estado — especialmente a passagem de turno — exige confirmação do outro navegador e é reenviada automaticamente enquanto não for recebida. Em uma queda real, o jogo conserva a jogada mais recente, tenta reconectar e compara as revisões dos dois aparelhos antes de retomar a partida.

O tabuleiro é apresentado pela perspectiva de cada duelista: o próprio polo e a própria faixa ficam sempre embaixo. No modo local, a perspectiva muda depois da tela de passagem de turno. O botão de bandeira no topo permite desistir; no modo online, o resultado é enviado imediatamente ao adversário.

## Como jogar

1. O Duelista 1 começa.
2. Na primeira rodada, nenhum dos jogadores compra. A partir da rodada 2, escolha obrigatoriamente entre comprar um Peão ou um Efeito.
3. Clique em um peão no campo para abrir diretamente seu movimento. As casas possíveis aparecem destacadas.
4. Clique em um peão comum da mão para abrir diretamente as casas onde ele pode entrar.
5. Selecione um peão para mover ou atacar diretamente no tabuleiro; os botões ficam apenas para virar e ativar habilidades.
6. Clique numa Carta de Efeito para ler seu efeito no painel e depois use **Jogar carta**.
7. Encerre o turno e entregue o dispositivo; a tela de passagem esconde a mão do próximo jogador.
8. O primeiro Duelista com 10 pontos vence — ou vence quando o adversário desistir.

## Conteúdo implementado das notas

- Tabuleiro com 6 colunas × 8 linhas, duelistas nos polos, sem limite total de Peões em campo e preparação com 3 Peões/3 Efeitos.
- Antes do primeiro turno, cada jogador escolhe individualmente as casas dos seus três peões iniciais.
- Movimento, virar cartas, revelação que cancela combate, ataque conjunto, empate e pontuação.
- Peões Combinados Babel, Justiça Alva, Serpente Selvagem e Golem Selvagem.
- Cartas Fusão são compradas na mesma pilha dos peões comuns e permanecem na mão de Peões.
- As cartas de Peões Combinados mostram os materiais necessários e destacam no campo os peões válidos para a combinação.
- Para fundir, é obrigatório possuir a Carta Fusão correspondente e manter todos os materiais exigidos em contato.
- Infantaria, Torre, Bobo, Arqueiro, Ave Eterna, Cavalo, Coelho, Montador e Gavião com seus alcances e habilidades; o Gavião pode se mover duas vezes por turno.
- Recuar, Rocar Torre, Espada Maldita, Queimar Pertences, Poço sem Fundo, Empurrão, Campo das Rosas Pálidas, Selva Selvagem, Camuflar-se e Arco Selvagem.
- O Poço sem Fundo permanece na Arena depois de destruir um Peão e concede os pontos ao adversário do Peão destruído; Empurrão permite escolher quantas casas para trás o alvo será movido. Se Recuar! devolver um Peão para uma casa com Poço, o movimento acontece e o Peão é destruído.
- Ao selecionar um peão próprio, os adversários ao alcance recebem o ícone de ataque diretamente no tabuleiro.
- Clicar fora da Arena cancela uma combinação ou carta que ainda esteja aguardando alvo.
- Obstáculos NATURAL e passagem por peões do mesmo tipo.
- Seleção independente dos decks Xadria e Selvagem para cada duelista.
- Xadria combina cartas Luz e Trevas; não representa um dos lados do tabuleiro.
- A Selva Selvagem cria obstáculos ou frutas no começo dos turnos; qualquer peão que entre numa fruta a coleta com animação e recebe 100 ATK, sem sobreposição visual.
- Obstáculos e frutas criados pela Selva desaparecem quando essa Arena é substituída, sem remover obstáculos criados por outras cartas.
- Um único Slot de Arena afeta os dois lados e pode ser substituído por qualquer duelista.
- No Campo das Rosas Pálidas, cada ponto conquistado compra uma carta de uma pilha escolhida aleatoriamente entre Peões e Efeitos.
- Uma Arena repetida não é gasta nem retirada da mão enquanto a mesma Arena já estiver ativa.
- Clicar no Slot de Arena mostra seu efeito no mesmo painel usado pelos Peões.
- Clicar em um peão comum na mão abre imediatamente as casas válidas de colocação.
- Quando o portador da Espada Maldita é destruído, seu dono escolhe visualmente o próximo peão equipado, seja no campo ou na mão.
- O Montador Selvagem possui um botão de habilidade destacado; peões montados exibem marcador, bônus de ATK e regra de proteção no painel.
- Cartas que possuem um arquivo de arte usam a própria imagem como miniatura no campo, na mão e nas telas de escolha.
- No celular, placares, Arena, tabuleiro, ações e ambas as mãos cabem em uma única tela; detalhes de cartas abrem em um painel sobreposto que pode ser fechado.
- No celular, tocar novamente no ícone da carta, peão ou Arena já selecionado alterna entre mostrar e esconder seus detalhes.

## Decisões para regras ainda abertas

- Movimento é ortogonal; nesta versão de teste todos os peões movem 3 casas, o mesmo valor do Soldado.
- Cada duelista possui uma zona inicial de duas linhas em seu polo.
- A habilidade da Justiça Alva foi interpretada como +100 ATK por aliado perdido no último turno.
- Peões devem estar conectados por adjacência ortogonal para realizar fusão.
- O Bobo escolhe qualquer peão em campo, mantém o efeito copiado até o fim da partida e recebe um marcador visível com a habilidade ativa.

Esses valores ficam concentrados no início de `game.js` para facilitar ajustes futuros.
