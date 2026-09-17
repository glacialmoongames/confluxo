# Confluxo — direção visual, versão 244

Jogo de cartas sobre uma mesa escura, não uma landing page tecnológica.
Georgia nos títulos preserva a identidade do jogo; Segoe UI/Arial dá clareza aos
controles e textos de regras. As cores vivas são tintas dos arquétipos sobre
superfícies sólidas. Marfim é reservado à leitura de cartas; vinho à ação principal.

## Manutenção

- `styles-identity.css`, carregado depois das folhas históricas, centraliza a nova
  paleta e os componentes visuais. Variáveis `--arc-*` controlam os arquétipos.
- Não alterar geometria do tabuleiro, zonas táticas, orientação ou ações por CSS.
- Não aplicar filtros de clareamento a imagens com fundo: o filtro transforma
  também o fundo em branco. Ícones da seleção têm fundo transparente explicitamente.
- Brilho e animação devem indicar estados de jogo, não decorar todos os controles.
- Manter cores de categoria no log, acompanhadas de rótulos legíveis.
- O log conserva cada evento original, sem deduplicar pontuação ou inferir causas.
  Resumos de pontos ficam separados; mensagens de chat são escapadas e não recebem
  interpretação de eventos. Desktop mantém ordem cronológica; celular, recente primeiro.
- Detalhes importantes não dependem apenas da cor. Foco de teclado tem contorno.
- Testar menu, partida, PT/EN e larguras móveis antes de publicar. Nunca fazer push
  sem novo pedido do usuário. Atualizar versão e cache-busters ao editar.

## Pesquisa que orientou a revisão

- [Creative Bloq — Everything looks the same. Now what?](https://www.creativebloq.com/ai/everything-looks-the-same-now-what): identidade própria em vez de repetição de convenções visuais.
- [InterfaceKit — Why AI-generated websites all look the same](https://blog.interfacekit.io/why-ai-generated-websites-all-look-the-same): o problema é a composição genérica, não a presença de roxo.
- [Joshua Snoddy — Why Do AI-Generated Websites All Look the Same?](https://www.joshuasnoddy.com/blog/why-ai-websites-look-the-same/): padrões repetidos de gradientes, cartões e tipografia.

A aplicação ao Confluxo é uma decisão de design: preservar a marca e reforçar as
escolhas de deck, a arena e a leitura de eventos, em vez de trocar um template por outro.
