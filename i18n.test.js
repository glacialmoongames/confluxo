const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const page = fs.readFileSync('index.html', 'utf8');
const source = fs.readFileSync('i18n.js', 'utf8');
const context = {};
vm.createContext(context);
const core = fs.readFileSync('engine-core.js', 'utf8').split('let selectedDecks')[0];
const expansion = fs.readFileSync('engine-expansion.js', 'utf8').split('function archetypeVisual')[0];
vm.runInContext(`${fs.readFileSync('game-catalog.js', 'utf8')}\n${core}\n${expansion}\nthis.catalog={defs,effects,archetypes};`, context);

assert.match(page, /i18n\.js\?v=1/);
assert.match(page, /id="language-toggle"/);
assert.match(source, /navigator\.language\?\.toLowerCase\(\)==='pt-br'\?'pt-BR':'en'/, 'somente pt-BR deve abrir em português por padrão');
assert.match(source, /function translateRules\(/, 'o guia de regras deve possuir tradução própria');
assert.match(source, /MutationObserver/, 'conteúdo criado durante a partida também deve ser traduzido');
for (const key of Object.keys(context.catalog.defs)) assert.match(source, new RegExp(`\\b${key}:\\[`), `tradução ausente para o peão ${key}`);
for (const key of Object.keys(context.catalog.effects)) assert.match(source, new RegExp(`\\b${key}:\\[`), `tradução ausente para o efeito ${key}`);
for (const key of Object.keys(context.catalog.archetypes)) assert.match(source, new RegExp(`\\b${key}:'`), `tradução ausente para o arquétipo ${key}`);
assert.match(source, /If the total ties the target’s ATK, every participant and the defender are destroyed\./, 'a regra inglesa de ataque conjunto deve preservar o empate coletivo');
assert.match(source, /a Combined Pawn is worth the number of cards used to create it\./, 'a regra inglesa de pontuação deve preservar o valor dos materiais');
console.log('English localization tests passed');
