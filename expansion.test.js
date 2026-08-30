const assert = require('node:assert/strict');
const fs = require('node:fs');
process.chdir(__dirname);

const expansion = fs.readFileSync('engine-expansion.js', 'utf8');
const runtime = fs.readFileSync('engine-expansion-runtime.js', 'utf8');
const ui = fs.readFileSync('engine-ui.js', 'utf8');
const actionsA = fs.readFileSync('engine-actions-a.js', 'utf8');
const page = fs.readFileSync('index.html', 'utf8');
const styles = fs.readFileSync('styles-game.css', 'utf8') + fs.readFileSync('styles-responsive.css', 'utf8');

for (const card of ['divinissimo','terror','atra','impoluto','monkey','jaguar','crocodile','creature','devotee','raven','amalgam','repugnium','anssiedium']) {
  assert.match(expansion, new RegExp(`${card}:\\{`), `definição ausente: ${card}`);
}
for (const effect of ['crown','blackRoses','kingdom','tunnel','blackHole','moon','abyss','noEscape','eyes']) {
  assert.match(expansion, new RegExp(`${effect}:\\{`), `efeito ausente: ${effect}`);
}
assert.match(expansion, /archetypes\.abyss=/);
assert.match(expansion, /assets\/icons\//);
assert.match(runtime, /baseDoMove/);
assert.match(runtime, /transformed:true,fusion:0,pointValue:1/, 'Atra criada pela Coroa deve valer somente um ponto');
assert.match(ui, /beginMonkeyDestination/);
assert.match(ui, /grantImpolutoPower/);
assert.match(ui, /sacrificeForAtra/);
assert.match(page, /id="setup-rules-btn"/);
assert.match(page, /engine-expansion\.js\?v=10/);
assert.match(page, /VERSÃO 133/);
assert.match(expansion, /Rosas Pálidas: quando um jogador perde um peão/);
assert.match(expansion, /Rosas Negras: quando um jogador ganha pontos/);
assert.match(expansion, /Cavaleiro da Casa Branca de Xadria: Justiça Alva/);
assert.match(expansion, /1 ataque por turno e ganha mais 1 ataque para cada peão aliado derrotado/);
assert.doesNotMatch(expansion, /Justiça[^\n]+100 ATK/);
for (const exactName of ['Criatura Abissal','Devoto Abissal','Corvo da floresta Abissal','Amalgama Abissal','Ser Abissal: Repugnium','Ser Abissal: Anssiedium','Não há escapatoria','Eu vejo os olhos']) {
  assert.ok(expansion.includes(`name:'${exactName}'`), `nome Abissal alterado: ${exactName}`);
}
assert.match(expansion, /\['archer','horse','babel','terror','atra'\]\.includes\(key\)\?'black':'white'/);
assert.match(expansion, /repugnium:'haunting'/);
assert.doesNotMatch(expansion, /repugnium:'evil-eyes'/);
assert.match(expansion, /Pode incluir peões adversários que toquem um Devoto/);
assert.match(ui, /allUnits\(\)\.filter\(u=>fusionMaterialFits\(card,u\)\)/);
assert.match(ui, /archetypeOfUnit\(u\)!=='abyss'&&!enemyAllowed/);
assert.match(ui, /!card\.variableFusion&&fusionMaterials\.length===card\.fusion/);
assert.match(ui, /function equipmentTargetAllowed/);
assert.match(ui, /function copyEquipmentForRavens/);
assert.match(ui, /raven\.owner!==state\.current/);
assert.match(ui, /equipmentTargetAllowed\(equipmentKey,u,player\)/);
assert.match(expansion, /justice:'mounted-knight'/);
assert.match(expansion, /terror:'mounted-knight'/);
assert.match(expansion, /Peões adversários dentro de seu raio não podem se mover para fora dele/);
assert.match(expansion, /Se puder se mover e terminar o turno sem mover, o peão equipado é destruído/);
assert.match(expansion, /commonSlots=36-fusionSlots/);
assert.match(actionsA, /repugnium-range/);
assert.match(styles, /\.cell\.repugnium-range::after/);
assert.match(styles, /data-arena=abyss[^}]+six-eyes\.svg/);
assert.match(styles, /\.art-crop\.tone-black\{background:linear-gradient/);
assert.match(styles, /\.art-crop\.xadria-white-art/);
assert.match(styles, /\.art-crop\.xadria-black-art/);
assert.match(styles, /\.peace-banner/);
assert.match(styles, /data-arena=blackRoses/);
assert.match(styles, /\.rules-hero/);

for (const icon of ['confluxo-favicon','empty-chessboard','flower-twirl','forest','orbit','evil-eyes','six-eyes','haunting','rose','peace-dove']) {
  assert.ok(fs.existsSync(`assets/icons/${icon}.svg`), `ícone ausente: ${icon}`);
}
assert.match(expansion, /rider:'caveman'/);
assert.match(expansion, /jaguar:'feline'/);
assert.match(expansion, /Onça Selvagem[^\n]+ganha 100 ATK permanentemente/);
assert.doesNotMatch(expansion, /reveal:\{|camouflage/);
assert.doesNotMatch(expansion, /Peões virados para baixo são destruídos/);
for (const icon of ['caveman','feline']) assert.ok(fs.existsSync(`assets/icons/${icon}.svg`), `ícone ausente: ${icon}`);

console.log('Expansion tests passed.');
