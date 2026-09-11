# Confluxo — handoff completo para um novo chat

> Atualizado em 10/09/2026. Estado documentado: versão web 240, branch `main`.

## Texto curto para iniciar um novo chat

Copie o bloco abaixo para o novo chat e anexe esta documentação quando possível:

> Você continuará o desenvolvimento do Confluxo, um jogo tático de cartas web da Glacial Moon Games. O repositório local está em `C:\Users\Daniel\Documents\Codex\2026-08-10\referenced-chatgpt-conversation-this-is-an\outputs\xadria-site`, o remoto é `https://github.com/glacialmoongames/confluxo.git` e o site publicado é `https://glacialmoongames.github.io/confluxo/`. A documentação de design canônica está no vault da Área de Trabalho, principalmente em `C:\Users\Daniel\Desktop\Codex-Tarefa-Isolada-2026-08-10\Obsidiam\Jogo de carta\Cartas.md` e `Regras atuais.md`. Leia este `HANDOFF-NOVO-CHAT.md` inteiro, confira `git status`, leia os arquivos envolvidos e só então altere o projeto. Preserve exatamente nomes, efeitos e alcances descritos no `Cartas.md`. Não faça push: crie commit local e peça ao usuário para usar **Push origin** no GitHub Desktop. Toda mudança de jogo/site deve atualizar a versão visível e os cache-busters dos arquivos alterados, além de passar por todos os testes `*.test.js`.

## 1. Identidade do projeto

- **Nome:** Confluxo.
- **Empresa:** Glacial Moon Games.
- **Tipo:** jogo de cartas tático para navegador, com tabuleiro e dois polos.
- **Tecnologia:** HTML, CSS e JavaScript puros; não há framework, bundler, npm ou etapa de compilação.
- **Site do jogo:** <https://glacialmoongames.github.io/confluxo/>.
- **Repositório GitHub:** <https://github.com/glacialmoongames/confluxo>.
- **Branch de publicação:** `main`, raiz do repositório via GitHub Pages.
- **Pasta local atual:** `C:\Users\Daniel\Documents\Codex\2026-08-10\referenced-chatgpt-conversation-this-is-an\outputs\xadria-site`.
- **Versão atual exibida:** 240, em `index.html`.
- **Idioma:** português do Brasil por padrão e inglês automático fora do Brasil ou quando escolhido manualmente.

O símbolo do Confluxo é o ícone `flower-twirl`. O projeto usa principalmente ícones transparentes do Game-icons.net sob CC BY 3.0. Não gerar imagens por IA para as cartas: o usuário pediu expressamente imagens existentes e de uso livre.

## 2. Fontes de verdade e prioridade

Há documentação antiga dentro do repositório que contém trechos obsoletos. Use esta ordem:

1. **Pedido mais recente do usuário.**
2. **`Cartas.md` do Obsidian da Área de Trabalho** para nomes, atributos, tipos, efeitos, materiais, ícones e tabelas de alcance.
3. **`Regras atuais.md` do mesmo vault** para regras gerais.
4. **Código e testes atuais** para entender o comportamento já implementado.
5. `CATALOGO.md` para a API técnica do catálogo.
6. `README.md` e `LEIA-ME.md` apenas como visão histórica; ambos possuem partes antigas.

Vault canônico:

- `C:\Users\Daniel\Desktop\Codex-Tarefa-Isolada-2026-08-10\Obsidiam\Jogo de carta\Cartas.md`
- `C:\Users\Daniel\Desktop\Codex-Tarefa-Isolada-2026-08-10\Obsidiam\Jogo de carta\Regras atuais.md`
- `C:\Users\Daniel\Desktop\Codex-Tarefa-Isolada-2026-08-10\Obsidiam\Jogo de carta\Glossário.md`
- Artes de referência: `C:\Users\Daniel\Desktop\Codex-Tarefa-Isolada-2026-08-10\Obsidiam\Jogo de carta\Artes`

Existe outro vault em `C:\Users\Daniel\Documents\Codex\2026-08-10\obsidian`, mas ele é antigo. O usuário determinou que a versão da **Área de Trabalho** é a fonte canônica. Não trocar de vault por conveniência.

### Regra importante sobre divergências

Não “melhorar”, reinterpretar ou renomear efeitos por conta própria. Em especial:

- preservar os nomes das cartas abissais;
- preservar acentos, capitalização temática e nomes próprios;
- usar o alcance desenhado na tabela de cada peão, não inferir alcance pelo nome;
- se documentação e jogo divergirem, relatar a divergência antes de mudar quando o usuário pedir apenas uma conferência;
- quando o usuário disser que a versão do jogo está correta, não forçar a documentação antiga sobre ela.

## 3. Mecânicas gerais atuais

### Arena e orientação

- O tabuleiro possui **6 colunas × 8 linhas**.
- Coordenadas: colunas `A–F` e linhas `1–8`.
- Cada jogador ocupa um polo; as duas linhas mais próximas são a zona inicial normal.
- Na tela de cada jogador, seu próprio lado fica sempre embaixo.
- As casas da Arena devem permanecer perfeitamente quadradas e alinhadas com os peões.
- Peões ocupam visualmente o slot inteiro, têm borda da identidade do jogador e fundo do arquétipo.
- Obstáculos, frutas, poços e elementos de Arena só nascem em casas livres, salvo exceção expressa.

### Preparação

- Cada jogador escolhe um arquétipo.
- A meta de pontos é escolhida antes da partida; aceita de 1 a 99.
- Cada jogador recebe 3 Efeitos aleatórios.
- Cada jogador recebe 3 peões **normais** aleatórios e escolhe onde colocá-los no próprio polo.
- Peões Combinados não podem ser sorteados como peões iniciais.
- O Devoto Abissal inicial ainda cria o Poço sem Fundo normalmente.
- Na primeira rodada, nenhum dos dois jogadores compra carta.

### Turno e compra

- A partir da segunda rodada, o jogador precisa escolher entre comprar 1 Peão ou 1 Efeito.
- O baralho de Peões e o baralho de Efeitos são embaralhados.
- Se todas as combinações únicas do arquétipo já estiverem possuídas, a compra da pilha de Peões prioriza um peão normal disponível.
- Normalmente o jogador pode colocar 1 peão normal por turno.
- Não há limite total de peões em campo.
- Não existe mais ação geral de virar/desvirar peões. Código e textos antigos sobre essa ação devem ser ignorados ou removidos quando encontrados.

### Movimento

- Cada peão usa sua própria matriz `movement`.
- Normalmente há uma ação global de movimento por turno.
- Exceções do texto da carta prevalecem.
- A Ave Eterna move uma vez por turno sem gastar a ação normal, independentemente de ser o primeiro movimento do turno.
- Gavião pode se mover duas vezes conforme sua habilidade.
- Um peão não pode terminar em casa ocupada; efeitos de empurrão/recuo devem resolver poços ou obstáculos corretamente.
- Clicar em qualquer peão mostra seu alcance. Em peão próprio e no próprio turno, casas realmente utilizáveis também mostram a bolinha de movimento.
- Clicar fora da Arena ou numa casa vazia limpa o alcance selecionado, mas pode manter os detalhes da carta abertos.

### Combate

- Cada peão pode **iniciar** normalmente um ataque por turno.
- Outros peões ainda podem atacar no mesmo turno.
- Maior ATK vence; o derrotado é destruído.
- No empate, todos os participantes são destruídos, salvo proteções individuais.
- Se uma proteção salva parte dos participantes do empate, a crônica deve listar corretamente sobreviventes, destruídos e pontos reais.
- Peões impedidos de atacar não atacam nem apoiam ataque conjunto.
- O Arqueiro e efeitos equivalentes podem atacar à distância dentro do próprio raio quando a carta disser isso.
- A Torre Preta/Babel e o Arco só afetam alvos realmente dentro do raio correspondente.

### Ataque conjunto

- O atacante escolhido pode receber apoio dos peões aliados em contato ortogonal com o defensor.
- Os ATKs participantes são somados.
- Somente o atacante escolhido gasta seu ataque.
- Os apoiadores não gastam o ataque próprio e podem iniciar outro ataque depois.
- A habilidade da Infantaria só funciona em ataque conjunto.
- Em empate entre o total dos atacantes e o defensor, todos os atacantes participantes e o defensor são destruídos, salvo efeitos de proteção.

### Pontuação e vitória

- Peão normal vale 1 ponto.
- Peão Combinado vale a quantidade **real de cartas usadas** para criá-lo.
- Transformar Infantaria em Rainha via Coroa da Herdeira mantém valor de 1 ponto; transformação não é combinação.
- Pontos são dados ao adversário do dono do peão destruído quando a destruição é causada por terreno ou por um efeito que mata o próprio aliado, salvo regra específica.
- Vitória por pontos tem prioridade quando pontuação e esgotamento acontecem na mesma ação.
- Há vitória automática se exatamente um jogador ficar sem peões normais válidos no campo, mão e pilha.
- Desistência encerra imediatamente.
- Em partida online, mais de 90 segundos realmente desconectado causa derrota após confirmação pelo Supabase.
- Algumas cartas têm vitória especial, como Tragédia Âmbar. O deck Objeto Celeste/SOL foi removido da seleção atual, embora ainda exista código legado.

### Peões Combinados

- Termos oficiais de UI: **Peão Combinado**, **combinar**, **materiais**. Não usar “fusão” para o jogador.
- Para combinar é necessário possuir a carta correspondente na mão de Peões.
- Os materiais exigidos precisam estar em campo e conectados conforme a regra da carta.
- Os materiais são consumidos e o combinado entra no lugar determinado pela rotina.
- Materiais podem exigir chaves específicas, tipos, arquétipo, normal/combinado ou condições do turno.
- Evitar usar Peões Combinados como material, a menos que a carta permita e isso seja estritamente necessário; o bot segue essa cautela.
- Na versão mobile, tocar na carta combinada abre detalhes; o botão **Combinar/Criar** inicia a seleção. A Amálgama possui tratamento próprio de confirmação.

### Cartas de Efeito

- **Equipamento:** pode ser equipado em qualquer peão, aliado ou adversário, salvo restrição explícita (`equipOnly` ou efeito documentado).
- **Arena:** existe um único slot global compartilhado.
- **Utilidade:** resolve seu efeito e normalmente é consumida.
- Jogar a mesma Arena já ativa não gasta a cópia; quando a regra específica determina anulação, duas Arenas iguais voltam ao campo nulo.
- Clicar em cartas, equipamentos, Arena e obstáculos abre o mesmo painel de detalhes.
- A seleção manual do usuário não deve ser trocada por animações ou ações do adversário.
- No celular, depois de jogar um Efeito, os detalhes somem para liberar a visão da Arena.
- Clicar fora da Arena cancela uma carta ou combinação que ainda espera alvo.

### Elementos de campo

- **Poço sem Fundo:** destrói quem cai; normalmente permanece. Armadura de Ouro destrói a armadura e o poço ao evitar a queda.
- **Obstáculo NATURAL:** bloqueia; algumas cartas podem destruí-lo.
- **Fruta:** ao ser coletada, desaparece, concede 100 ATK e toca animação.
- **Túnel, Buraco Negro, Templo das Chamas, lixo nuclear:** possuem inspeção e regras próprias.
- Lixo radioativo/nuclear mostra contador e desaparece depois de 2 turnos.

## 4. Arquétipos atualmente selecionáveis

### Xadria (`xadria`)

Arquétipo roxo que usa Luz e Trevas em conjunto; não representa “lado branco contra lado preto”. Peões normais atuais: Infantaria, Torre Branca, Bobo, Arqueiro, Ave Eterna e Cavalo. Combinados: Babel, Justiça Alva, Diviníssimo, Terror Umbra, Atra e Impoluto. Temas principais: ataque conjunto, controle de raio, sacrifício/proteção, cópia, roque e convergência das Arenas de rosas no Reino de Xadria.

Todos os peões Xadria usam o mesmo fundo roxo-base da Infantaria. A diferenciação Casa Branca/Casa Preta ocorre na arte/contraste/borda conforme o padrão já implementado, não por fundos inconsistentes.

### Selvagem (`wild`)

Arquétipo verde. Normais: Coelho, Montador, Gavião, Macaco e Onça. Combinados: Serpente, Golem e Crocodilo. Temas: mobilidade, montaria, obstáculos, frutas, destruição de terreno, ataques encadeados e controle da Selva/Jaula. A Onça ganha 100 ATK para si ao matar um oponente.

### Terror Abissal (`abyss`)

Arquétipo escuro/abissal. Normais: Criatura Abissal, Devoto Abissal e Corvo. Combinados: Amálgama, Repugnium e Anssiedium. Temas: Poços, Buracos Negros, cópia de cartas do oponente, contenção e sacrifício. O Corvo só copia cartas usadas pelo oponente e apenas uma vez por turno. “Eu Vejo os Olhos” deve ser preferencialmente colocado em inimigos; destrói ao final do turno somente se o alvo podia se mover e não se moveu.

### Mortos Doces (`candy`)

Arquétipo rosa. Normais: Zumbi Bombom, Esqueleto Chocolate, Fantasma Chiclete e Bruxa Jujuba. Combinados: Conde Quindim, Demônio Biscoito e Lobisomem Sorvete. Temas: conversão para DOCE/ZUMBI, reconstrução, geração de Esqueletos, valor crescente e expansão de zona pelo Mausoléu. O efeito do Lobisomem precisa reagir em tempo real a conversões. O Demônio Biscoito exige 4 peões DOCE; pontos das vítimas vão ao adversário de cada vítima.

### Era Dourada (`gold`)

Arquétipo dourado. Normais: Adorador, Goblin e Sacerdote. Combinados: Ferreiro, Golem de Ouro e Dragão Ramon. Temas: tipo OURO, transferência e multiplicação de ATK, equipamentos defensivos e contabilização de derrotas ocorridas depois que o Ferreiro entrou. O Sacerdote só pulsa/brilha quando o efeito de jogo realmente ativa e dobra o ataque resultante do peão afetado conforme a regra atual.

### Chamas Egípcias (`egyptian`)

Arquétipo laranja. Normais: Escaravelho em Chamas, Escravo das Chamas, Príncipe das Chamas e Múmia Cinzenta (esta pode ser transformação). Combinados: Ammit, Anúbis e Rá. Temas: FOGO, cinzas, sacrifícios, transformação, Templo e Areias. Rá aplica sua habilidade somente a aliados.

### Insetos Calamitosos (`insects`)

Na seleção de deck usa cinza escuro; as cartas e peões continuam com fundos claros/temáticos. Normais: Tragédia Âmbar, Joaninha, Barata, Lagarta, Formiga e Centopeia Funestas. As formas calamitosas são transformações ligadas aos equipamentos Calamidade e não devem mostrar materiais de combinação. Cada forma invoca uma Arena própria não comprável. Temas: contadores de Tragédia, transformação/reversão, Erupção, inverno/lixo nuclear, Tufão, Oceano e Terra Trêmula.

As Arenas calamitosas possuem `undrawable:true`: entram somente por habilidade, nunca na pilha normal. O fundo do ícone da forma calamitosa segue a cor da Arena que ela invoca. Tragédia Âmbar recebe contador apenas quando uma Arena inédita do arquétipo entra em campo e toca a animação de explosão total antes da vitória.

### Conteúdo legado: Objeto Celeste

`engine-core.js` e `engine-celestial.js` ainda contêm definições e regras de planetas/SOL, e o banco ainda aceita a chave `celestial` por compatibilidade. Porém `engine-expansion.js` executa `delete archetypes.celestial`, e o deck não aparece na seleção. Não reativar sem pedido explícito e revisão completa.

## 5. Modos de jogo

- **Mesmo dispositivo:** dois humanos alternam a tela; a tela de passagem protege a mão.
- **Contra o bot:** J1 humano e J2 controlado automaticamente.
- **Bot contra bot:** ambos automáticos; o espectador alterna a perspectiva e fixa detalhes de cartas para leitura.
- **Sala online:** anfitrião cria código de 1 a 12 caracteres; segundo usuário entra como J2.
- **Partida Rápida:** Supabase emparelha dois usuários, gera código com `Q` + 11 caracteres e a partida começa automaticamente.
- **Espectador:** ao entrar numa sala que já tem dois jogadores, é promovido a espectador. Pode alternar as duas perspectivas e ver mãos/estado, mas não agir. Vários espectadores são aceitos; o limite prático depende do navegador/rede do anfitrião.

O código aparece no cabeçalho como `#CODIGO`, mas clicar copia somente `CODIGO`. O botão Confluxo é separado e ocupa somente logo/texto.

## 6. Multiplayer e sincronização

### PeerJS/WebRTC

`network.js` usa PeerJS 1.5.4 para sinalização e DataChannel WebRTC para a partida.

- ID do anfitrião: `confluxo-` + código em minúsculas.
- O estado da partida é serializado e enviado diretamente entre navegadores.
- Há sequência, revisão, confirmação (`state-ack`), reenvio e pedido de sincronização.
- Estados acima de 8.000 caracteres são divididos em chunks.
- Heartbeat a cada 5 segundos; canal sem resposta é reconstruído.
- Ao voltar para a aba, o cliente pede ressincronização e reabre fases pendentes, inclusive compra.
- Animações possuem pacotes visuais; ações não devem reiniciar animações já concluídas.
- O anfitrião retransmite estado e chat aos espectadores.
- Códigos rápidos recebem tentativas adicionais enquanto o peer anfitrião ainda está sendo registrado.

### Supabase

Supabase não hospeda o estado do tabuleiro. Ele cuida de:

- contas;
- perfis públicos;
- ícone e cor do perfil;
- renomear usuário;
- ranking global e histórico;
- fila de Partida Rápida;
- presença durante a partida;
- confirmação de desconexão;
- resultados, vitórias/derrotas e Flux.

Projeto atual: `mkejgvanknxfnqtbldhv`. Configuração pública em `supabase-config.js`. A publishable key é própria para o navegador; nunca adicionar service-role ou credenciais privadas.

As contas parecem “nome + senha”, mas internamente `account.js` cria um e-mail técnico determinístico para usar Supabase Auth. Não há recuperação automática de senha por e-mail.

Flux começa em 1000. Vitória/derrota online varia de 27 a 33 pontos conforme a função SQL atual. O histórico mostra as últimas 10 partidas e a taxa recente. Partidas contra convidado também podem alterar Flux da conta autenticada pela função própria.

### Migrações SQL

- Instalação nova: executar `supabase/schema.sql`.
- Projeto existente: aplicar migrações novas em ordem.
- Migrações devem ser idempotentes sempre que possível.
- Ao atualizar allowlists de decks, alterar constraints **e recriar explicitamente as funções**. Não depender de `pg_get_functiondef()` + substituição textual: isso falhou na versão 222 e deixou `join_quick_match` rejeitando decks novos.
- A correção explícita está em `supabase/migration-239-insects-quick-match.sql` e já foi aplicada no projeto online.
- Manter RLS e privilégios mínimos. Não liberar escrita direta em estatísticas.

## 7. Mapa de arquivos do repositório

### Entrada, visual e assets

| Arquivo/pasta | Responsabilidade |
| --- | --- |
| `index.html` | Toda a estrutura do menu, lobby, partida, diálogos, regras e ordem dos scripts. Também contém versão e cache-busters. |
| `styles-core.css` | Tokens, estilos base e estrutura histórica do jogo. |
| `styles-game.css` | Regras visuais intermediárias, animações e ajustes amplos de partida. |
| `styles-responsive.css` | Camada mais recente de layout desktop/mobile, cores de arquétipo, tabuleiro, perfis e correções responsivas. Por estar carregado por último, frequentemente prevalece. |
| `assets/cards/` | Artes/ícones usados por cartas e peões. |
| `assets/icons/` | Ícones de interface, arquétipos, perfil e decoração. Devem ser SVGs transparentes sem retângulo branco incorporado. |
| `assets/planets/` | Fotografias legadas dos planetas. |
| `CREDITOS.md` | Atribuições das imagens. Atualizar ao adicionar arte externa. |

### Catálogo e motor

| Arquivo | Responsabilidade |
| --- | --- |
| `game-catalog.js` | Registros `defs`, `effects`, `archetypes`; API de cadastro/atualização e validação. Carrega antes do motor. |
| `engine-core.js` | Constantes 8×6, cartas base, estado global, criação da partida, baralhos, preparação, utilitários de tabuleiro e regras nucleares. |
| `engine-expansion.js` | Grande parte das cartas atuais, atualizações do catálogo, arquétipos adicionais, cores/ícones e helpers de combinações. Remove o arquétipo Celestial da seleção. |
| `engine-celestial.js` | Código legado/específico de Objeto Celeste, ainda referenciado por helpers. |
| `engine-gold.js` | Regras específicas da Era Dourada. |
| `engine-egypt.js` | Regras específicas das Chamas Egípcias. |
| `engine-insects.js` | Regras de Calamidades, Arenas invocadas, transformações, contadores, lixo nuclear, Tufão e Tragédia Âmbar. Também possui alguns overrides finais. |
| `engine-actions-a.js` | Seleção, detalhes, render do cabeçalho/tabuleiro/mãos/log, alcance, ações de cartas e parte da interação. |
| `engine-actions-b.js` | Movimento, colocação, combinação, destruição, pontuação e resolução de combate. |
| `engine-expansion-runtime.js` | Efeitos contínuos/reativos adicionais, transformações e integrações entre sistemas. |
| `engine-ui.js` | Compra, inicialização de UI, bot, heurísticas, animações, fim de turno, vitória e handlers DOM. |

### Serviços

| Arquivo | Responsabilidade |
| --- | --- |
| `network.js` | Salas, Partida Rápida, PeerJS/WebRTC, reconexão, espectador, chat, presença e sincronização. |
| `account.js` | Supabase Auth, perfil, ranking, histórico, Flux, personalização e reporte de resultado. |
| `supabase-config.js` | URL e chave pública do projeto Supabase. |
| `i18n.js` | Tradução PT-BR → inglês de UI, cartas, detalhes e crônica. Usa mapas, regex e `MutationObserver`. |
| `supabase/schema.sql` | Esquema integral para instalação nova. |
| `supabase/migration-*.sql` | Alterações incrementais do banco existente. |

### Documentação e testes

| Arquivo | Responsabilidade |
| --- | --- |
| `CATALOGO.md` | Como cadastrar cartas tecnicamente. |
| `README.md` | Introdução e publicação; contém alguns trechos históricos. |
| `LEIA-ME.md` | Regras antigas; conferir antes de confiar. |
| `HANDOFF-NOVO-CHAT.md` | Este documento, ponto inicial para novas sessões. |
| `game.test.js` | Regras gerais, regressões, UI, versão e assets carregados. |
| `network.test.js` | Sincronização, chat, espectador, reconexão e Partida Rápida. |
| `account.test.js` | Conta, persistência, ranking e resultados. |
| `catalog.test.js` | Registro e validação do catálogo. |
| `expansion.test.js` | Conteúdo compartilhado e expansões. |
| `candy.test.js`, `gold.test.js`, `egyptian.test.js`, `insects.test.js`, `celestial.test.js` | Regressões específicas por arquétipo; Celestial permanece como legado. |
| `i18n.test.js` | Cobertura da versão inglesa. |

## 8. Como adicionar ou alterar cartas

1. Leia o bloco completo da carta no `Cartas.md`, incluindo planilha atributo/valor, URL do ícone e tabela de alcance.
2. Localize a chave técnica existente com `rg` antes de criar outra.
3. Cadastre nova entrada com `registerPawns`, `registerEffects` ou `registerArchetype`.
4. Para modificar algo existente, use `updatePawn`, `updateEffect` ou `updateArchetype`; não sobrescreva registros silenciosamente.
5. Para peão, mantenha pelo menos `name`, `atk`, `movement`, `types`, `glyph`, `text` e arte/crédito quando aplicável.
6. Para combinado, configure `fusion` e `materials`/`requirements`, além de condição especial se houver.
7. Para Efeito, use exatamente um tipo: `UTILIDADE`, `EQUIPAMENTO` ou `ARENA`.
8. Marque Arenas que só surgem por habilidade com `undrawable:true`.
9. Implemente a regra no arquivo de motor apropriado; a descrição da carta não executa o efeito.
10. Adicione visual, log colorido, animação com duração compreensível e sincronização online quando o efeito muda estado.
11. Adicione tradução do nome, texto, mensagens dinâmicas e tipos em `i18n.js`.
12. Adicione o ícone à personalização de perfil sempre que o projeto ganhar um ícone novo utilizável.
13. Atualize `CREDITOS.md`.
14. Crie testes da regra real, não apenas teste de presença do texto.
15. Rode o catálogo completo e uma partida mental de ponta a ponta: compra, alvo, resolução, pontuação, log, bot, online e espectador.

### Formato de alcance

`movement` é uma lista de deslocamentos `[dr, dc]` a partir do peão. A renderização inverte apenas a perspectiva visual; não inverter manualmente a matriz por jogador. Copie a geometria do `Cartas.md` e valide nas duas perspectivas.

### Arte e cores

- Preferir a URL completa do Game-icons.net informada no `Cartas.md`.
- Usar SVG transparente; remover qualquer `<path>` que desenhe um fundo quadrado sólido.
- O ícone pode ser branco ou preto conforme contraste, e o fundo deve vir da cor do arquétipo via CSS.
- Não repetir ícones sem necessidade.
- Não inserir fundos brancos acidentais em ícones de deck, perfil, cabeçalho ou leaderboard.
- Cores de arquétipo devem ser centralizadas nas custom properties de `styles-responsive.css`, facilitando trocar/adicionar arquétipo.

## 9. Regras de UI e experiência

- Desktop e mobile compartilham HTML; alterações mobile devem ficar em media queries e não degradar desktop.
- A partida deve manter Arena, placares, mãos e controles essenciais numa tela. No celular, o log pode ficar abaixo e ser rolável.
- A crônica no desktop segue sua ordem atual; no mobile, o evento mais novo fica em cima.
- Ao rolar manualmente para ler mensagens antigas, o log não deve forçar retorno ao evento mais novo. Auto-scroll só quando já estava no fim apropriado.
- Textos precisam permanecer legíveis; evitar comprimir nomes, contadores ou ícones.
- Detalhes de carta ficam à esquerda; crônica à direita; Arena central e maximizada sem sobreposição.
- As mãos de Efeito ficam à esquerda da Arena e a mão de Peões à direita, aproximadas da borda sem encostar nela.
- Efeitos: equipamento azul, Arena laranja, utilidade verde.
- Peões normais não possuem glow/degradê; combinados mantêm cor do arquétipo e recebem glow/degradê.
- Bordas diferenciam J1/J2 mesmo com decks iguais, mas J2 não usa tracejado.
- A zona de colocação é uma sobreposição com cerca de 30% de opacidade e cor saturada do arquétipo, inclusive sem Arena especial.
- Mausoléu deixa o chão rosa-claro, mas a zona de colocação continua sendo overlay da cor de cada arquétipo e pode se expandir.
- O botão de encerrar turno fica desabilitado/cinza fora do turno ou durante animação, compra, preparação ou escolha obrigatória.
- Voltar pelo logo Confluxo durante partida pede confirmação. No fim da partida, voltar ao menu não pede confirmação.
- O usuário pode fixar detalhes para leitura; ações do bot/oponente não devem substituir a carta escolhida.

## 10. Bot

O bot está em `engine-ui.js` e usa heurísticas, não busca minimax completa.

Fluxo aproximado:

1. comprar com probabilidade influenciada pela quantidade de peões;
2. tentar combinações;
3. usar até dois Efeitos adequados;
4. colocar peão avaliando risco, ataque, suporte, material e posição;
5. usar habilidades/montaria;
6. decidir atacar antes de mover ou mover antes de atacar;
7. repetir ataques válidos com outros peões;
8. encerrar o turno.

Heurísticas importantes:

- evita Poço e lixo nuclear quando mortal;
- ignora ATK 0 da Ave Eterna como fraqueza e a usa como bloqueador imortal;
- prefere ataque conjunto quando está defensivo;
- avalia possíveis movimentos/ataques do adversário;
- avança para controle de campo, mas evita chegar cedo demais à zona de nascimento inimiga;
- penaliza repetição e voltar à casa anterior;
- usa montaria, cartas de Efeito, Poço, roque e combinações;
- evita combinar usando combinados, salvo vitória necessária;
- não ataca a Ave Eterna por combate;
- evita equipar “Eu Vejo os Olhos” nos próprios peões;
- possui watchdog de 6 segundos que recupera turnos travados.

Ao corrigir bot, não simplificar removendo fases. Adicionar teste reproduzindo o tabuleiro que travou ou a decisão errada.

## 11. Tradução inglesa

`i18n.js` traduz o DOM e mensagens criadas depois do carregamento.

Ao adicionar conteúdo:

- adicionar nome e efeito no mapa correspondente (`pawnEn`, `effectEn`, `archetypeEn`);
- traduzir badges/tipos novos;
- adicionar regex para cada log dinâmico novo;
- traduzir títulos, `aria-label`, placeholder e texto de botões;
- verificar menu, conta, lobby, detalhes, regras, crônica e tela de vitória;
- garantir que a tradução descreva o comportamento implementado, sem divergir da carta.

Não traduzir somente o nome e deixar o efeito em português. O teste `i18n.test.js` é obrigatório, mas uma inspeção textual com `rg` ainda é necessária porque a tradução é dinâmica.

## 12. Versionamento, testes e publicação

### Antes de editar

```powershell
git status --short --branch
git log -5 --oneline
```

Preserve alterações do usuário e não use `git reset --hard`, `git checkout --` ou comandos destrutivos.

### Ao alterar jogo ou site

1. Incrementar `VERSÃO N` no rodapé de `index.html`.
2. Atualizar as asserções de versão em `game.test.js`, `expansion.test.js` e `egyptian.test.js`.
3. Incrementar `?v=N` somente dos JS/CSS/assets alterados para quebrar o cache do GitHub Pages.
4. Atualizar testes que verificam esses cache-busters.
5. Não criar parâmetro de release na URL como substituto do cache-buster.

Mudança apenas documental não exige mudar a versão do jogo.

### Verificação mínima

```powershell
node --check network.js
node --check engine-core.js
node --check engine-actions-a.js
node --check engine-actions-b.js
node --check engine-ui.js
$files = Get-ChildItem -Filter *.test.js | ForEach-Object { $_.Name }
foreach ($file in $files) {
  node $file
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
git diff --check
```

Rode todos os testes, não apenas o arquivo relacionado. O projeto possui muitas funções sobrescritas por arquivos carregados depois; uma mudança local pode quebrar outro arquétipo.

### Ordem dos scripts

A ordem em `index.html` é parte da arquitetura. Em resumo:

1. PeerJS, Supabase e configuração;
2. conta;
3. catálogo;
4. rede;
5. core e expansões;
6. ações/UI;
7. tradução;
8. Insetos por último.

Alguns arquivos intencionalmente substituem funções anteriores. Não reorganizar scripts sem testar todos os overrides.

### Commit e push

- Criar commit local com mensagem curta em português.
- **Não executar `git push`.** O usuário pediu para apenas avisar.
- Ao finalizar, informar versão, testes, hash do commit e dizer para clicar em **Push origin** no GitHub Desktop.
- GitHub Pages publica automaticamente após o push na `main`; pode levar alguns minutos. Depois usar `Ctrl+F5`.

## 13. Ferramentas utilizadas no projeto

- **Editor/arquivos:** alterações locais com patches; busca com `rg`/`rg --files`.
- **Controle de versão:** Git e GitHub Desktop.
- **Hospedagem:** GitHub Pages.
- **Banco/autenticação:** Supabase Dashboard e SQL Editor.
- **Multiplayer:** PeerJS Cloud para sinalização + WebRTC DataChannel P2P.
- **Testes:** Node.js (`node:assert`, `node:vm`), sem framework externo.
- **Documentação de design:** Obsidian.
- **Arte:** Game-icons.net; legado de planetas com NASA/instituições parceiras.
- **Navegadores:** Chrome/in-app browser para testes manuais, inclusive duas sessões/dispositivos para WebRTC.

## 14. Checklist para uma entrega segura

- [ ] Li o pedido atual e o bloco inteiro no `Cartas.md`.
- [ ] Confirmei o caminho do projeto e `git status`.
- [ ] Preservei nomes e alcance exatamente.
- [ ] Implementei regra, visual, log, bot, online e espectador quando aplicável.
- [ ] Equipamentos continuam aceitando aliados ou adversários, salvo restrição da carta.
- [ ] Não reintroduzi virar/desvirar.
- [ ] Não deixei elemento nascer sobre casa ocupada.
- [ ] Pontos foram para o jogador correto.
- [ ] Animações terminam e limpam suas flags.
- [ ] Detalhes fixados não são substituídos automaticamente.
- [ ] Tradução inglesa foi atualizada.
- [ ] Ícone é transparente, creditado e aparece na personalização de perfil.
- [ ] Versão e cache-busters foram incrementados se houve alteração do site.
- [ ] Todos os `*.test.js` passaram.
- [ ] `git diff --check` passou.
- [ ] Commit local criado.
- [ ] Não fiz push; pedi ao usuário para dar **Push origin**.

## 15. Estado conhecido no momento deste handoff

- Versão 241 corrige a confirmação de Flux/histórico com repetição segura e restaura animação e efeito do Zumbi na Terra Trêmula.
- Clicar no código copia sem `#`.
- Salas de Partida Rápida toleram atraso de registro para permitir entrada/espectador.
- A função ativa `join_quick_match` do Supabase já foi corrigida para aceitar `egyptian` e `insects`.
- Migração correspondente: `supabase/migration-239-insects-quick-match.sql`.
- No momento da criação deste documento, a branch local `main` estava alinhada com `origin/main` antes da alteração documental.

Quando uma nova sessão começar, o primeiro passo ainda deve ser executar `git status` e conferir a versão publicada, pois o usuário pode ter feito push, fetch ou merge fora do chat.
