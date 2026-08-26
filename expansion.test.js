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
for (const effect of ['crown','blackRoses','kingdom','tunnel','blackHole','moon','reveal','abyss','noEscape','eyes']) {
  assert.match(expansion, new RegExp(`${effect}:\\{`), `efeito ausente: ${effect}`);
}
assert.match(expansion, /archetypes\.abyss=/);
assert.match(expansion, /assets\/icons\//);
assert.match(runtime, /baseDoMove/);
assert.match(ui, /beginMonkeyDestination/);
assert.match(ui, /grantImpolutoPower/);
assert.match(ui, /sacrificeForAtra/);
assert.match(page, /id="setup-rules-btn"/);
assert.match(page, /engine-expansion\.js\?v=4/);
assert.match(page, /VERSÃO 99/);
assert.match(expansion, /Rosas Pálidas: quando um jogador perde um peão/);
assert.match(expansion, /Rosas Negras: quando um jogador ganha pontos/);
for (const exactName of ['Criatura Abissal','Devoto Abissal','Corvo da floresta Abissal','Amalgama Abissal','Ser Abissal: Repugnium','Ser Abissal: Anssiedium','Não há escapatoria','Eu vejo os olhos']) {
  assert.ok(expansion.includes(`name:'${exactName}'`), `nome Abissal alterado: ${exactName}`);
}
assert.match(expansion, /\['archer','horse','babel','terror','atra'\]\.includes\(key\)\?'black':'white'/);
assert.match(expansion, /repugnium:'haunting'/);
assert.doesNotMatch(expansion, /repugnium:'evil-eyes'/);
const iconMaps = [...expansion.matchAll(/const (?:card|effect)Icons=\{([^}]+)\}/g)].flatMap(match => [...match[1].matchAll(/:'([^']+)'/g)].map(icon => icon[1]));
assert.equal(new Set(iconMaps).size, iconMaps.length, 'cada carta deve ter um ícone exclusivo');
assert.match(actionsA, /repugnium-range/);
assert.match(styles, /\.cell\.repugnium-range::after/);
assert.match(styles, /data-arena=abyss[^}]+evil-eyes\.svg/);
assert.match(styles, /\.art-crop\.tone-black\{background:linear-gradient/);
assert.match(styles, /\.peace-banner/);
assert.match(styles, /data-arena=blackRoses/);
assert.match(styles, /\.rules-hero/);

for (const icon of ['confluxo-favicon','empty-chessboard','flower-twirl','forest','orbit','evil-eyes','haunting','rose','peace-dove']) {
  assert.ok(fs.existsSync(`assets/icons/${icon}.svg`), `ícone ausente: ${icon}`);
}

console.log('Expansion tests passed.');
