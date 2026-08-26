const assert = require('node:assert/strict');
const fs = require('node:fs');
process.chdir(__dirname);

const expansion = fs.readFileSync('engine-expansion.js', 'utf8');
const runtime = fs.readFileSync('engine-expansion-runtime.js', 'utf8');
const ui = fs.readFileSync('engine-ui.js', 'utf8');
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
assert.match(page, /engine-expansion\.js\?v=1/);
assert.match(page, /VERSÃO 91/);
assert.match(styles, /\.peace-banner/);
assert.match(styles, /data-arena=blackRoses/);
assert.match(styles, /\.rules-hero/);

for (const icon of ['empty-chessboard','forest','orbit','evil-eyes','rose','peace-dove']) {
  assert.ok(fs.existsSync(`assets/icons/${icon}.svg`), `ícone ausente: ${icon}`);
}

console.log('Expansion tests passed.');
