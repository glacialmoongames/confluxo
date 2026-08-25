const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = ['engine-core.js', 'engine-celestial.js', 'engine-actions-a.js', 'engine-actions-b.js', 'engine-ui.js'].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const page = fs.readFileSync('index.html', 'utf8');
const styles = ['styles-core.css', 'styles-game.css', 'styles-responsive.css']
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
const definitions = source.slice(0, source.indexOf('let selectedDecks'));
const context = {};
vm.createContext(context);
vm.runInContext(`${definitions}\nthis.defs=defs;this.effects=effects;this.archetypes=archetypes;`, context);

assert.equal(context.defs.horse.atk, 250);
assert.equal(context.defs.horse.movement.length, 8);
assert.equal(context.defs.jester.movement.length, 11);
assert.ok(context.defs.jester.movement.some(([dr, dc]) => dr === 1 && dc === 2));
assert.equal(context.defs.hawk.atk, 250);
assert.doesNotMatch(context.defs.hawk.text, /cria um obstáculo/i);
assert.match(context.defs.hawk.text, /duas vezes/i);
assert.equal(context.defs.golem.fusion, 2);
assert.equal(context.defs.golem.atk, 400);
assert.deepEqual(Array.from(context.defs.babel.materials.kinds), ['tower', 'infantry']);
assert.equal(context.defs.justice.materials.type, 'LUZ');
assert.equal(context.defs.serpent.materials.type, 'NATURAL');
assert.equal(context.defs.golem.materials.type, 'NATURAL');
assert.equal(context.defs.duck.name, 'Ave Eterna do Reino Xadria');
assert.ok(context.effects.pit, 'Poço sem Fundo deve existir');
assert.ok(context.effects.push, 'Empurrão deve existir');
assert.match(context.effects.pit.text, /permanece/i);
assert.match(context.effects.jungle.text, /fruta/i);
assert.match(context.effects.roses.text, /ganha 1 ponto/i);
assert.doesNotMatch(context.effects.roses.text, /100 ATK/i);
assert.ok(context.archetypes.xadria.pawns.includes('horse'));
assert.ok(context.archetypes.wild.pawns.includes('hawk'));
assert.ok(context.archetypes.wild.fusions.includes('golem'));
assert.equal(context.archetypes.celestial.name, 'Objeto Celeste');
assert.equal(context.archetypes.celestial.pawnComposition.length, 18);
assert.equal(context.archetypes.celestial.pawnComposition.filter(kind => kind === 'pluto').length, 1);
assert.equal(context.archetypes.celestial.pawnComposition.filter(kind => kind === 'sun').length, 1);
for (const planet of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
  assert.equal(context.archetypes.celestial.pawnComposition.filter(kind => kind === planet).length, 2);
}
assert.equal(context.defs.sun.atk, 10000);
assert.equal(context.defs.sun.fusion, 8);
assert.deepEqual(Array.from(context.defs.sun.materials.kinds), ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']);
assert.ok(context.effects.asteroid);
assert.ok(context.effects.project);
assert.ok(context.effects.peace);
assert.match(source, /até o fim da partida/);
assert.doesNotMatch(source, /delete u\.copiedKind/);
assert.match(source, /hawkMovesThisTurn/);
assert.match(source, /u\.hawkMoves\+\+/);
assert.match(source, /PEÕES NECESSÁRIOS/);
assert.match(source, /fusion-eligible/);
assert.match(source, /availableAttackTargets/);
assert.match(source, /outcome==='win'/);
assert.match(source, /addEventListener\('pointerdown'/);
assert.doesNotMatch(source, /state\.pits=state\.pits\.filter/);
assert.doesNotMatch(page, /id="attack"/);
assert.match(source, /classList\.toggle\('viewer'/);
assert.match(source, /function toggleMobileDetails/);
assert.match(source, /repeated&&toggleMobileDetails\(\)/);
assert.match(styles, /100dvh - 38px/);
assert.match(styles, /grid-template-rows:28px 22px minmax\(0,1fr\) 28px 36px 68px/);
assert.match(styles, /card-details\.mobile-details-hidden/);
assert.match(source, /HABILIDADE COPIADA E ATIVA/);
assert.match(source, /copy-mark/);
assert.match(source, /spawnJungleFeature\(\)/);
assert.match(source, /function collectFruit/);
assert.match(source, /fruitPickup/);
assert.match(source, /collectFruit\(u,r,c\)/);
assert.match(source, /source:'jungle'/);
assert.match(source, /clearJungleFeatures/);
assert.match(source, /function drawRoseReward/);
assert.match(source, /function awardPoints/);
assert.doesNotMatch(source, /state\.players\[scorer\]\.score\+\+/);
assert.match(source, /u\.bonusAtk=\(u\.bonusAtk\|\|0\)\+200/);
assert.match(source, /hideMobileDetails\(\);selectedEffect=null;pendingCard=/);
assert.match(source, /function animateRoseReward/);
assert.match(styles, /rose-reward-card/);
assert.match(source, /function hasNormalPawnAvailable/);
assert.match(source, /function botCanMoveUnit/);
assert.match(source, /hasEffect\(u,'duck'\)\)return u\.movedTurn!==state\.turn/);
assert.match(source, /botCanMoveUnit\(u,p\)/);
const botMoveContext = {
  state: {turn: 4, players: {2: {moved: false}}},
  botPlayer: 2,
  hasEffect: (unit, kind) => unit.kind === kind,
  hawkMovesThisTurn: () => 0,
  mercuryMovesThisTurn: () => 0,
  mercuryCanMoveAgain: () => false
};
vm.createContext(botMoveContext);
vm.runInContext(source.match(/function botCanMoveUnit\([^\n]+/)[0], botMoveContext);
assert.equal(botMoveContext.botCanMoveUnit({kind: 'duck'}), true);
assert.equal(botMoveContext.botCanMoveUnit({kind: 'duck', movedTurn: 4}), false);
assert.equal(botMoveContext.botCanMoveUnit({kind: 'infantry'}), true);
assert.match(source, /Vitória automática/);
assert.match(source, /if\(\(p\.pawnDeck\|\|\[\]\)\.length\)return true/);
assert.match(source, /reason=.*pointWinner\?'points'/);
assert.match(source, /reason==='points'\?`\$\{p\.score\} pontos conquistados`/);
assert.match(source, /!obstacleAt\(r,c\)&&!pitAt\(r,c\)/);
assert.match(source, /moveTargets\(u\)\.filter\(target=>!pitAt\(target\.r,target\.c\)\)/);
assert.doesNotMatch(source, /limite de 5 peões/i);
assert.doesNotMatch(source, /units\.filter\(u=>u\.row!==null\)\.length>=5/);
assert.doesNotMatch(page, /\/5<\/span>/);
assert.match(source, /destroy\(u,u\.owner===1\?2:1,'poço'\)/);
assert.match(source, /destroy\(pushed,pushed\.owner===1\?2:1,'poço'\)/);
assert.match(source, /retreatPit=pitAt\(row,col\)/);
assert.match(source, /if\(retreatPit\)\{destroy\(u,u\.owner===1\?2:1,'poço'\)/);
assert.match(source, /let retreatObstacle=obstacleAt\(row,col\),retreatPit=pitAt\(row,col\)/);
assert.match(source, /if\(retreatObstacle\)state\.obstacles=state\.obstacles\.filter\(x=>x!==retreatObstacle\)/);
assert.match(source, /babel-range/);
assert.match(source, /<p>\$\{e\.text\}<\/p>/);
assert.match(page, /data-deck="celestial"/);
assert.match(page, /engine-celestial\.js\?v=2/);
assert.match(page, /VERSÃO 74/);
assert.match(page, /engine-ui\.js\?v=7/);
assert.match(styles, /data-arena=project/);
assert.match(styles, /solar-victory/);
assert.match(source, /function mercuryCanMoveAgain/);
assert.match(source, /function uranusBlocking/);
assert.match(source, /function remainsInsideVenusRadius/);
assert.match(source, /function activateNeptunePush/);
assert.match(source, /function consumeAsteroidShield/);
assert.match(source, /function playPeaceTreaty/);
assert.match(source, /isCelestialUnit\(u\)/);
assert.match(source, /effectContact\(earth,u\)/);
assert.match(source, /atk\*=2/);
assert.match(source, /hasEffect\(attacker,'mars'\)/);
assert.match(source, /rewardPluto/);
assert.match(source, /onUnitDeployed\(u\)/);
assert.match(source, /triggerSolarVictory/);

console.log('game card tests passed');
