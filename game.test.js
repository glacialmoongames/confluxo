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
for (const body of ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','pluto','sun']) {
  assert.match(context.defs[body].art, /^assets\/planets\//);
  assert.ok(context.defs[body].artCredit);
  assert.ok(fs.existsSync(context.defs[body].art), `arte ausente para ${body}`);
}
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
  botActor: () => 2,
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
const botModeContext = {botMode: true, botVsBot: true, botPlayer: 2, state: {current: 1}};
vm.createContext(botModeContext);
for (const name of ['botControls', 'botActor', 'botOpponent']) {
  vm.runInContext(source.match(new RegExp(`function ${name}\\([^\\n]+`))[0], botModeContext);
}
assert.equal(botModeContext.botControls(1), true);
assert.equal(botModeContext.botControls(2), true);
assert.equal(botModeContext.botActor(), 1);
assert.equal(botModeContext.botOpponent(), 2);
botModeContext.state.current = 2;
assert.equal(botModeContext.botActor(), 2);
assert.equal(botModeContext.botOpponent(), 1);
botModeContext.botVsBot = false;
assert.equal(botModeContext.botControls(1), false);
assert.equal(botModeContext.botControls(2), true);
const botDeployState = {current: 1, players: {1: {deployed: false, reserve: [{id: 'p1'}]}, 2: {deployed: false, reserve: [{id: 'p2'}]}}};
let botDeployment;
const botDeployContext = {
  state: botDeployState,
  ROWS: 8,
  COLS: 6,
  botActor: () => botDeployState.current,
  at: () => null,
  obstacleAt: () => null,
  pitAt: () => null,
  doDeploy: (unit, r, c) => { botDeployment = {unit, r, c}; }
};
vm.createContext(botDeployContext);
vm.runInContext(source.match(/function botDeployPawn\([^\n]+/)[0], botDeployContext);
assert.equal(botDeployContext.botDeployPawn(), true);
assert.deepEqual(botDeployment, {unit: botDeployContext.state.players[1].reserve[0], r: 6, c: 2});
botDeployContext.state.current = 2;
assert.equal(botDeployContext.botDeployPawn(), true);
assert.deepEqual(botDeployment, {unit: botDeployContext.state.players[2].reserve[0], r: 1, c: 2});
const pitPlayer = {name: 'Bot 1', hand: ['pit'], units: []};
const pitState = {pits: [], players: {1: pitPlayer, 2: {units: [{row: 3, col: 2, faceDown: false}]}}};
const pitContext = {
  state: pitState,
  ROWS: 8,
  COLS: 6,
  botOpponent: () => 2,
  at: () => null,
  featureAt: () => null,
  pitAt: (r, c) => pitState.pits.find(pit => pit.row === r && pit.col === c),
  moveTargets: () => [{r: 2, c: 2}],
  pushTargets: () => [{r: 2, c: 2}],
  boardCoordinate: (r, c) => `${r},${c}`,
  log: () => {},
  render: () => {}
};
vm.createContext(pitContext);
vm.runInContext(source.match(/function botUsePitEffect\([^\n]+/)[0], pitContext);
assert.equal(pitContext.botUsePitEffect(1, pitPlayer), true);
assert.equal(JSON.stringify(pitState.pits), JSON.stringify([{row: 2, col: 2}]));
assert.deepEqual(pitPlayer.hand, []);
const pushedUnit = {name: 'Alvo', row: 3, col: 2, faceDown: false};
const pushPlayer = {name: 'Bot 1', hand: ['push']};
let pitDestruction;
const pushContext = {
  state: {players: {1: pushPlayer, 2: {units: [pushedUnit]}}},
  botOpponent: () => 2,
  pushTargets: () => [{r: 2, c: 2}],
  pitAt: () => ({row: 2, col: 2}),
  fruitAt: () => null,
  place: (unit, r, c) => { unit.row = r; unit.col = c; },
  collectFruit: () => {},
  destroy: (unit, scorer, reason) => { pitDestruction = {unit, scorer, reason}; },
  boardCoordinate: (r, c) => `${r},${c}`,
  log: () => {},
  render: () => {},
  checkWin: () => false
};
vm.createContext(pushContext);
vm.runInContext(source.match(/function botUsePushEffect\([^\n]+/)[0], pushContext);
assert.equal(pushContext.botUsePushEffect(1, pushPlayer, true), true);
assert.deepEqual(pitDestruction, {unit: pushedUnit, scorer: 1, reason: 'poço'});
assert.deepEqual(pushPlayer.hand, []);
const matchupContext = {};
vm.createContext(matchupContext);
vm.runInContext(source.match(/function botMatchupScore\([^\n]+/)[0], matchupContext);
assert.ok(matchupContext.botMatchupScore(400, 200, 1, 0) > matchupContext.botMatchupScore(400, 200, 4, 0), 'bot forte deve preferir aproximação');
assert.ok(matchupContext.botMatchupScore(150, 400, 4, 0) > matchupContext.botMatchupScore(150, 400, 1, 0), 'bot fraco deve preferir distância');
assert.ok(matchupContext.botMatchupScore(150, 400, 2, 0) > matchupContext.botMatchupScore(150, 400, 2, 1), 'ameaça deve pesar mais contra peão forte');
const responseContext = {};
vm.createContext(responseContext);
vm.runInContext(source.match(/function botResponseLossValue\([^\n]+/)[0], responseContext);
assert.equal(responseContext.botResponseLossValue(200, 400, 1, false, false, false), 0);
assert.ok(responseContext.botResponseLossValue(500, 200, 1, false, false, false) > 0);
assert.ok(responseContext.botResponseLossValue(500, 200, 3, false, false, false) > responseContext.botResponseLossValue(500, 200, 1, false, false, false));
assert.equal(responseContext.botResponseLossValue(1000, 0, 1, false, true, true), 0);
assert.equal(responseContext.botResponseLossValue(1000, 200, 1, true, false, false), 120);
assert.match(source, /Vitória automática/);
assert.match(source, /if\(\(p\.pawnDeck\|\|\[\]\)\.length\)return true/);
assert.match(source, /reason=.*pointWinner\?'points'/);
assert.match(source, /reason==='points'\?`\$\{p\.score\} pontos conquistados · meta de \$\{state\.pointGoal\|\|10\}`/);
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
assert.match(page, /engine-celestial\.js\?v=3/);
assert.match(page, /VERSÃO 85/);
assert.match(page, /engine-ui\.js\?v=12/);
assert.match(page, /engine-core\.js\?v=11/);
assert.doesNotMatch(source, /cartas\.png/, 'nenhuma carta deve continuar usando a antiga folha de artes desenhadas');
assert.match(page, /engine-actions-a\.js\?v=10/);
assert.match(page, /engine-actions-b\.js\?v=5/);
assert.match(page, /styles-responsive\.css\?v=5/);
assert.match(page, /network\.js\?v=34/);
assert.match(page, /styles-game\.css\?v=6/);
assert.match(page, /id="mode-bots"/);
assert.match(page, /BOT CONTRA BOT/);
assert.match(source, /function botControls\(player\)/);
assert.match(source, /botVsBot\?state\.current:botPlayer/);
assert.match(source, /state\.players\[botOpponent\(player\)\]/);
assert.doesNotMatch(source, /classList\.toggle\('same-deck'/);
assert.match(styles, /board \.piece\.p1/);
assert.match(styles, /board \.piece\.p2/);
assert.doesNotMatch(styles, /content:"J1"/);
assert.doesNotMatch(styles, /content:"J2"/);
assert.match(source, /function botUsePitEffect\(player,p\)/);
assert.match(source, /function botUsePushEffect\(player,p,requirePit=false\)/);
assert.match(source, /function botUseRetreatEffect\(player,p\)/);
assert.match(source, /function botUseCamouflageEffect\(player,p\)/);
assert.match(source, /played<2&&botPlayEffect\(\)/);
assert.match(source, /function botMatchupScore\(/);
assert.match(source, /function botProjectedEnemyRisk\(defender\)/);
assert.match(source, /moveTargets\(mover\)\.filter\(target=>!pitAt/);
assert.match(source, /responseRisk<plan\.currentRisk/);
assert.match(source, /responseRisk\*3/);
assert.match(styles, /art-crop\.celestial-art img/);
for (const [key, pawn] of Object.entries(context.defs)) {
  assert.ok(pawn.art, `arte ausente para o peão ${key}`);
  assert.ok(fs.existsSync(pawn.art), `arquivo de arte ausente para o peão ${key}`);
}
for (const [key, effect] of Object.entries(context.effects)) {
  assert.ok(effect.art, `arte ausente para a carta ${key}`);
  assert.ok(fs.existsSync(effect.art), `arquivo de arte ausente para a carta ${key}`);
}
assert.match(source, /effect-hand-art/);
assert.match(source, /Imagem: \$\{e\.artCredit\}/);
assert.match(styles, /effect-card \.effect-hand-art/);
assert.ok(fs.existsSync('CREDITOS.md'));
assert.match(styles, /data-arena=project/);
assert.match(styles, /solar-victory/);
assert.match(source, /function mercuryCanMoveAgain/);
assert.match(source, /function uranusBlocking/);
assert.match(source, /function remainsInsideVenusRadius/);
assert.match(source, /function activateNeptunePush/);
assert.match(source, /function neptuneUsedThisTurn/);
assert.match(source, /neptuneAbilityTurn=state\.turn/);
assert.match(source, /independentemente de quantas cópias de Netuno/);
assert.match(source, /function drawRandomInitialPawns/);
assert.match(page, /id="point-goal"/);
assert.match(source, /function normalizePointGoal/);
assert.match(source, /pointGoal:selectedPointGoal\(\)/);
assert.match(source, /score>=\(state\.pointGoal\|\|10\)/);
const goalContext = {};
vm.createContext(goalContext);
vm.runInContext(source.match(/function normalizePointGoal\([^\n]+/)[0], goalContext);
assert.equal(goalContext.normalizePointGoal(15), 15);
assert.equal(goalContext.normalizePointGoal(0), 1);
assert.equal(goalContext.normalizePointGoal(150), 99);
assert.equal(goalContext.normalizePointGoal('inválido'), 10);
assert.match(source, /findIndex\(u=>!u\.fusion\)/);
assert.match(source, /drawRandomInitialPawns\(player\)/);
assert.doesNotMatch(source, /starters:/);
const initialDrawContext = {};
vm.createContext(initialDrawContext);
vm.runInContext(source.match(/function drawRandomInitialPawns\([^\n]+/)[0], initialDrawContext);
const initialPlayer = {pawnDeck: [{kind:'sun',fusion:8},{kind:'mars'},{kind:'venus'},{kind:'earth'},{kind:'mercury'}],initialUnits:[]};
initialDrawContext.drawRandomInitialPawns(initialPlayer);
assert.deepEqual(initialPlayer.initialUnits.map(u=>u.kind), ['mars','venus','earth']);
assert.equal(initialPlayer.initialUnits.every(u=>u.initial), true);
assert.equal(initialPlayer.pawnDeck.some(u=>u.kind==='sun'), true, 'Peões Combinados permanecem no deck');
assert.match(source, /function completeSolarFusion/);
assert.match(source, /syncOnlineAnimationState/);
assert.match(source, /solarEvaporating=true/);
assert.match(styles, /@keyframes solarAbsorb/);
assert.match(styles, /@keyframes solarEvaporate/);
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
