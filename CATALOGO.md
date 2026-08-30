# Catálogo de cartas

O jogo usa um registro único fornecido por `game-catalog.js`. Ele separa o cadastro das cartas das regras do motor e impede sobrescritas silenciosas.

## Operações disponíveis

```js
registerPawns({
  key: {
    name: 'Nome visível',
    atk: 200,
    movement: [[-1, 0], [1, 0]],
    types: ['NATURAL'],
    glyph: '◆',
    text: 'Efeito da carta.'
  }
});

registerEffects({
  key: {
    name: 'Nome visível',
    type: 'UTILIDADE', // UTILIDADE, EQUIPAMENTO ou ARENA
    icon: '✦',
    text: 'Efeito da carta.'
  }
});

registerArchetype('key', {
  name: 'Nome do deck',
  pawns: ['peaoNormal'],
  fusions: ['peaoCombinado'],
  effects: ['cartaDeEfeito']
});
```

Para alterar uma definição já registrada, use `updatePawn`, `updateEffect` ou `updateArchetype`. Não use `Object.assign` diretamente nos registros.

## Onde cadastrar

- O catálogo base está no início de `engine-core.js`.
- Cartas adicionadas após a primeira versão estão agrupadas no início de `engine-expansion.js`.
- Regras reutilizáveis pertencem aos arquivos `engine-*.js`, não à definição visual da carta.
- Ícones e créditos são aplicados em `engine-expansion.js`.

## Campos de peão

| Campo | Obrigatório | Uso |
| --- | --- | --- |
| `name` | sim | nome exibido |
| `atk` | sim | ATK inicial |
| `movement` | sim | coordenadas relativas do alcance |
| `types` | sim | LUZ, TREVAS, NATURAL etc. |
| `glyph` | sim | reserva visual quando não há arte |
| `text` | sim | efeito mostrado nos detalhes |
| `fusion` | combinados | quantidade mínima de materiais |
| `materials` | combinados | tipos, chaves ou arquétipo aceitos |
| `activated` | habilidades manuais | mostra botão nos detalhes |
| `abilityLabel` | habilidades manuais | texto do botão |
| `condition` | condicional | condição especial para combinar |

## Campos de Efeito

| Campo | Obrigatório | Uso |
| --- | --- | --- |
| `name` | sim | nome exibido |
| `type` | sim | UTILIDADE, EQUIPAMENTO ou ARENA |
| `text` | sim | regra completa |
| `equipOnly` | não | restringe o alvo a uma chave de peão |
| `undrawable` | não | impede inclusão normal no deck |

## Validação

`validateGameCatalog()` verifica:

- chaves duplicadas;
- peões sem nome, ATK, alcance ou tipos;
- Efeitos sem nome ou com tipo inválido;
- referências inexistentes em `pawns`, `fusions`, `effects` e `pawnComposition`.

Depois de cadastrar uma carta, acrescente um teste de efeito e execute:

```text
node game.test.js
node catalog.test.js
node expansion.test.js
node celestial.test.js
node network.test.js
```
