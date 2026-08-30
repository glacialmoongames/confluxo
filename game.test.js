const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const source = ['game-catalog.js', 'engine-core.js', 'engine-celestial.js', 'engine-actions-a.js', 'engine-actions-b.js', 'engine-ui.js'].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const page = fs.readFileSync('index.html', 'utf8');
const styles = ['styles-core.css', 'styles-game.css', 'styles-responsive.css']
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
const definitions = source.slice(0, source.indexOf('let selectedDecks'));
const context = {};
vm.createContext(context);
vm.runInContext(`${definitions}\nthis.defs=defs;this.effects=effects;this.archetypes=archetypes;`, context);
vm.runInContext(source.match(/function artStyle\([^\n]+/)[0], context);
vm.runInContext(source.match(/function artVisual\([^\n]+/)[0], context);
vm.runInContext(source.match(/function rawMovementOffsets\([^\n]+/)[0], context);

assert.equal(context.defs.horse.atk, 250);
assert.equal(context.defs.horse.movement.length, 8);
assert.equal(context.defs.jester.movement.length, 11);
assert.ok(context.defs.jester.movement.some(([dr, dc]) => dr === 1 && dc === 2));
assert.equal(context.defs.hawk.atk, 250);
assert.doesNotMatch(context.defs.hawk.text, /cria um obstáculo/i);
assert.match(context.defs.hawk.text, /duas vezes/i);
assert.equal(context.defs.golem.fusion, 2);
assert.equal(context.defs.golem.atk, 400);
assert.match(context.artVisual({...context.defs.tower, kind: 'tower', iconTone: 'white'}), /xadria-white-art/);
assert.match(context.artVisual({...context.defs.horse, kind: 'horse', iconTone: 'black'}), /xadria-black-art/);
assert.match(context.artVisual({...context.defs.infantry, kind: 'infantry', iconTone: 'white'}), /dual-xadria-art/);
assert.deepEqual(Array.from(context.defs.babel.materials.kinds), ['tower', 'infantry']);
assert.equal(context.defs.justice.materials.type, 'LUZ');
assert.equal(context.defs.justice.name, 'Cavaleiro da Casa Branca de Xadria: Justiça Alva');
assert.equal(context.defs.justice.atk, 350);
assert.equal(context.defs.justice.movement.length, 14);
assert.match(context.defs.justice.text, /1 ataque por turno e ganha mais 1 ataque para cada peão aliado derrotado/i);
assert.equal(context.defs.serpent.materials.type, 'NATURAL');
assert.equal(context.defs.golem.materials.type, 'NATURAL');
assert.equal(context.defs.duck.name, 'Ave Eterna do Reino Xadria');
assert.match(context.defs.duck.text, /sem nunca gastar a ação de movimento/i);
const moonEarthRange = context.rawMovementOffsets({...context.defs.earth, kind: 'earth', equipment: ['moon']}).map(offset => Array.from(offset));
for (const distance of [1, 2, 3]) assert.ok(moonEarthRange.some(([dr, dc]) => dr === 0 && dc === distance), `Lua deve preencher a casa ${distance} do raio da Terra`);
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
assert.match(source, /hasActivatedAbility=!!defs\[activeKind\]\?\.activated/, 'peões com habilidade ativável devem abrir os detalhes no celular');
assert.match(source, /activeDef=shown\.copiedKind\?defs\[activeKind\]:shown/, 'o botão deve usar a habilidade presente na própria carta em campo');
assert.match(source, /copy-mark/);
assert.match(source, /spawnJungleFeature\(\)/);
assert.match(source, /function jungleSpawnBlocked/);
const jungleState = {
  arenaOwner: 1,
  obstacles: [{row: 0, col: 1, type: 'NATURAL'}],
  pits: [{row: 0, col: 2}],
  blackHoles: [{row: 1, col: 0}],
  tunnels: [[{row: 1, col: 1}]],
  tunnelDraft: []
};
const jungleContext = {
  state: jungleState,
  ROWS: 2,
  COLS: 3,
  at: (r, c) => r === 0 && c === 0 ? {id: 'occupied'} : null,
  featureAt: (r, c) => jungleState.obstacles.find(item => item.row === r && item.col === c),
  pitAt: (r, c) => jungleState.pits.find(item => item.row === r && item.col === c),
  boardCoordinate: (r, c) => `${r},${c}`,
  log: () => {},
  Math: Object.create(Math)
};
jungleContext.Math.random = () => 0.9;
vm.createContext(jungleContext);
vm.runInContext(source.match(/function jungleSpawnBlocked\([^\n]+/)[0], jungleContext);
vm.runInContext(source.match(/function spawnJungleFeature\([^\n]+/)[0], jungleContext);
jungleContext.spawnJungleFeature();
assert.deepEqual(
  jungleState.obstacles.map(({row, col}) => [row, col]),
  [[0, 1], [1, 2]],
  'frutas e obstáculos da Selva só podem surgir em uma casa totalmente livre'
);
assert.match(source, /function collectFruit/);
assert.match(source, /fruitPickup/);
assert.match(source, /collectFruit\(u,r,c\)/);
assert.match(source, /source:'jungle'/);
assert.match(source, /clearJungleFeatures/);
assert.match(source, /function drawRoseReward/);
assert.match(source, /function awardPoints/);
assert.doesNotMatch(source, /state\.players\[scorer\]\.score\+\+/);
const ownInfantry = {id: 'own-infantry', owner: 1, kind: 'infantry', row: 6, col: 2};
const ownTower = {id: 'own-tower', owner: 1, kind: 'tower', row: 6, col: 3};
const enemyInfantry = {id: 'enemy-infantry', owner: 2, kind: 'infantry', row: 1, col: 2};
const ravenOne = {id: 'raven-1', name: 'Corvo 1', owner: 1, kind: 'raven', row: 5, col: 1};
const ravenTwo = {id: 'raven-2', name: 'Corvo 2', owner: 2, kind: 'raven', row: 2, col: 4};
const equipmentContext = {
  state: {turn: 3, current: 1, players: {1: {hand: []}, 2: {hand: []}}},
  effects: {crown: {name: 'Coroa da Herdeira', equipOnly: 'infantry'}, sword: {name: 'Espada Maldita'}},
  allUnits: () => [ownInfantry, ownTower, enemyInfantry, ravenOne, ravenTwo],
  hasEffect: (unit, kind) => unit.kind === kind,
  log: () => {}
};
vm.createContext(equipmentContext);
vm.runInContext(source.match(/function equipmentTargetAllowed\([^\n]+/)[0], equipmentContext);
vm.runInContext(source.match(/function copyEquipmentForRavens\([^\n]+/)[0], equipmentContext);
assert.equal(equipmentContext.equipmentTargetAllowed('crown', ownInfantry), true);
assert.equal(equipmentContext.equipmentTargetAllowed('crown', ownTower), false, 'Coroa deve rejeitar outro tipo de peão');
assert.equal(equipmentContext.equipmentTargetAllowed('crown', enemyInfantry), true, 'a restrição de tipo não deve impedir equipar uma Infantaria adversária');
assert.equal(equipmentContext.equipmentTargetAllowed('sword', ownTower), true, 'Equipamento comum deve aceitar peão aliado');
assert.equal(equipmentContext.equipmentTargetAllowed('sword', enemyInfantry), true, 'Equipamento comum deve aceitar peão adversário');
equipmentContext.copyEquipmentForRavens('crown');
assert.deepEqual(equipmentContext.state.players[1].hand, [], 'Corvo aliado não copia Equipamento usado pelo próprio jogador');
assert.deepEqual(equipmentContext.state.players[2].hand, ['crown'], 'Corvo adversário copia Equipamento usado pelo rival');
equipmentContext.copyEquipmentForRavens('crown');
assert.deepEqual(equipmentContext.state.players[1].hand, [], 'Corvo aliado continua sem copiar Equipamentos do próprio jogador');
assert.deepEqual(equipmentContext.state.players[2].hand, ['crown'], 'Limite de uma cópia por turno também vale para o Corvo rival');
equipmentContext.state.current = 2;
equipmentContext.copyEquipmentForRavens('crown');
assert.deepEqual(equipmentContext.state.players[1].hand, ['crown'], 'Corvo copia o Equipamento quando ele é usado pelo oponente');
assert.deepEqual(equipmentContext.state.players[2].hand, ['crown'], 'Corvo do jogador ativo não copia o próprio Equipamento');
assert.match(source, /u\.bonusAtk=\(u\.bonusAtk\|\|0\)\+200/);
assert.match(source, /hideMobileDetails\(\);selectedEffect=null;pendingCard=/);
assert.match(source, /function animateRoseReward/);
assert.match(styles, /rose-reward-card/);
assert.match(source, /function hasNormalPawnAvailable/);
assert.match(source, /function botCanMoveUnit/);
assert.match(source, /hasEffect\(u,'duck'\)\)return u\.movedTurn!==state\.turn/);
assert.match(source, /freeMove=hasEffect\(u,'duck'\),hawk=/, 'o movimento da Ave deve ser sempre gratuito, inclusive quando for o primeiro do turno');
assert.doesNotMatch(source, /freeMove=hasEffect\(u,'duck'\)&&/, 'o movimento gratuito da Ave não pode depender de outra ação anterior');
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
const justiceAttackContext = {
  state: {turn: 7, players: {1: {lastLosses: 2}}},
  hasEffect: (unit, kind) => unit.kind === kind
};
vm.createContext(justiceAttackContext);
for (const name of ['attackLimit', 'attacksUsedThisTurn', 'canUnitAttack', 'recordAttack']) {
  vm.runInContext(source.match(new RegExp(`function ${name}\\([^\\n]+`))[0], justiceAttackContext);
}
const justiceUnit = {kind: 'justice', owner: 1};
assert.equal(justiceAttackContext.attackLimit(justiceUnit), 3);
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), true);
justiceAttackContext.recordAttack(justiceUnit);
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), true, 'Justiça deve poder atacar novamente após a primeira perda aliada');
justiceAttackContext.recordAttack(justiceUnit);
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), true, 'o ataque base continua somado aos ataques ganhos');
justiceAttackContext.recordAttack(justiceUnit);
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), false, 'Justiça deve parar após o ataque base e um extra por aliado derrotado');
justiceAttackContext.state.players[1].lastLosses = 0;
justiceAttackContext.state.turn = 8;
assert.equal(justiceAttackContext.attackLimit(justiceUnit), 1, 'sem aliados derrotados, Justiça mantém um ataque');
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), true);
justiceAttackContext.recordAttack(justiceUnit);
assert.equal(justiceAttackContext.canUnitAttack(justiceUnit), false);
assert.equal(justiceAttackContext.attackLimit({kind: 'infantry', owner: 1}), 1, 'outros peões mantêm um ataque por turno');
justiceAttackContext.state.turn = 9;
const attackInitiator = {kind: 'infantry', owner: 1};
const participatingRaven = {kind: 'raven', owner: 1};
justiceAttackContext.recordAttack(attackInitiator);
assert.equal(justiceAttackContext.canUnitAttack(attackInitiator), false, 'o peão selecionado deve gastar seu único ataque');
assert.equal(justiceAttackContext.canUnitAttack(participatingRaven), true, 'o Corvo participante do ataque conjunto deve conservar seu próprio ataque');
assert.doesNotMatch(source, /allies\.filter\(u=>u\.id!==attacker\.id\)\.forEach\(recordAttack\)/, 'participantes do ataque conjunto não podem gastar seus ataques');
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
  botFusionMaterialPriority: () => 0,
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
botDeployContext.state.current = 1;
botDeployContext.state.players[1] = {deployed: false, archetype: 'xadria', reserve: [{id: 'soldier', kind: 'soldier'}, {id: 'duck', kind: 'duck'}]};
botDeployContext.hasEffect = (unit, effect) => unit.kind === effect;
assert.equal(botDeployContext.botDeployPawn(), true);
assert.equal(botDeployment.unit.id, 'duck', 'Xadria deve colocar o Pato em campo para bloquear o rival');
const drawPlayer = {name: 'Bot', drawn: false, pawnDeck: ['pawn'], effectDeck: ['effect'], reserve: [], hand: []};
const drawContext = {state: {awaitingDraw: true, players: {1: drawPlayer}}, botActor: () => 1, botGameAdvantageScore: () => 1, botFusionMissingCount: () => 0, log: () => {}};
vm.createContext(drawContext);
vm.runInContext(source.match(/function botDraw\([^\n]+/)[0], drawContext);
drawContext.botDraw();
assert.deepEqual(drawPlayer.hand, ['effect'], 'bot em vantagem deve comprar uma carta de Efeito');
assert.deepEqual(drawPlayer.pawnDeck, ['pawn']);
Object.assign(drawPlayer, {drawn: false, pawnDeck: ['fusion-material'], effectDeck: ['second-effect'], reserve: [], hand: []});
drawContext.botFusionMissingCount = () => 1;
drawContext.botDraw();
assert.deepEqual(drawPlayer.reserve, ['fusion-material'], 'material ausente para combinação deve superar a preferência por Efeitos');
const fusionPlanningContext = {botFusionMaterials: () => [{kind: 'tower'}]};
vm.createContext(fusionPlanningContext);
vm.runInContext(source.match(/function botFusionCoverage\([^\n]+/)[0], fusionPlanningContext);
vm.runInContext(source.match(/function botFusionMissingCount\([^\n]+/)[0], fusionPlanningContext);
const babelPlan = {fusion: 2, materials: {kinds: ['tower', 'infantry']}};
const fusionPlayer = {reserve: [babelPlan]};
assert.equal(fusionPlanningContext.botFusionCoverage(babelPlan, fusionPlayer), 1);
assert.equal(fusionPlanningContext.botFusionMissingCount(fusionPlayer), 1);
const normalA = {id: 'normal-a', fusion: 0, equipment: []}, normalB = {id: 'normal-b', fusion: 0, equipment: []}, alreadyCombined = {id: 'combined', fusion: 2, equipment: []};
const botFusionCard = {id: 'new-fusion', fusion: 2, atk: 400};
let botFusionParts = null, allowWinningException = false;
const protectedFusionContext = {
  state: {players: {1: {archetype: 'wild', reserve: [botFusionCard], units: [normalA, normalB, alreadyCombined]}}},
  selected: null,
  botActor: () => 1,
  fusionMaterialFits: () => true,
  validFusionSet: () => true,
  effectiveAtk: unit => unit.fusion ? 800 : 100,
  botStrategicPowerValue: attack => attack,
  hasEffect: () => false,
  botCombinationWinsNow: () => allowWinningException,
  completeFusion: (_card, parts) => { botFusionParts = parts; }
};
vm.createContext(protectedFusionContext);
vm.runInContext(source.match(/function combinationsOf\([^\n]+/)[0], protectedFusionContext);
vm.runInContext(source.match(/function botFusionCandidateSets\([^\n]+/)[0], protectedFusionContext);
vm.runInContext(source.match(/function botCombinePawn\([^\n]+/)[0], protectedFusionContext);
assert.equal(protectedFusionContext.botCombinePawn(), true);
assert.ok(botFusionParts.every(part => !part.fusion), 'o bot deve preservar peões já combinados quando houver materiais normais');
protectedFusionContext.state.players[1].units = [normalA, alreadyCombined];
botFusionParts = null;
assert.equal(protectedFusionContext.botCombinePawn(), false, 'o bot não deve consumir um combinado sem vitória imediata');
allowWinningException = true;
assert.equal(protectedFusionContext.botCombinePawn(), true, 'o bot pode consumir um combinado quando isso garante a vitória');
assert.ok(botFusionParts.some(part => part.fusion));
const amalgamCard = {id: 'amalgam-card', fusion: 2, variableFusion: true, materials: {archetype: 'abyss'}};
const devotee = {id: 'devotee', kind: 'devotee', owner: 1, row: 2, col: 2, archetype: 'abyss'};
const abyssAlly = {id: 'abyss-ally', kind: 'creature', owner: 1, row: 2, col: 1, archetype: 'abyss'};
const enemy = {id: 'enemy', kind: 'soldier', owner: 2, row: 2, col: 3, archetype: 'xadria'};
let completedAmalgamParts = null;
const amalgamContext = {
  state: {animating: false, current: 1, players: {1: {units: [devotee, abyssAlly]}, 2: {units: [enemy]}}},
  selected: amalgamCard,
  botVsBot: false,
  mode: 'combinar',
  fusionMaterials: [],
  targets: [],
  allUnits: () => [devotee, abyssAlly, enemy],
  hasEffect: (unit, kind) => unit.kind === kind,
  adjacent: (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1,
  fusionLinked: (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1,
  fusionSetConnected: () => true,
  archetypeOfUnit: unit => unit.archetype,
  renderBoard: () => {},
  hint: () => {},
  completeFusion: (_card, parts) => { completedAmalgamParts = parts; }
};
vm.createContext(amalgamContext);
for (const name of ['fusionMaterialFits', 'fusionTargets', 'validFusionSet', 'toggleFusionMaterial']) {
  vm.runInContext(source.match(new RegExp(`function ${name}\\([^\\n]+`))[0], amalgamContext);
}
assert.equal(amalgamContext.fusionMaterialFits(amalgamCard, enemy), true, 'inimigo de qualquer arquétipo tocando o Devoto deve ser material válido');
assert.ok(amalgamContext.fusionTargets(amalgamCard).some(target => target.r === enemy.row && target.c === enemy.col));
amalgamContext.toggleFusionMaterial(devotee);
amalgamContext.toggleFusionMaterial(abyssAlly);
assert.equal(completedAmalgamParts, null, 'a Amálgama não deve combinar automaticamente ao selecionar o mínimo de dois materiais');
amalgamContext.toggleFusionMaterial(enemy);
assert.equal(completedAmalgamParts, null, 'materiais adicionais devem continuar selecionáveis antes da confirmação');
assert.match(source, /finish\.onclick=\(\)=>completeFusion\(card,\[\.\.\.fusionMaterials\]\)/, 'o botão sobre a Arena deve finalizar a Amálgama com todos os materiais escolhidos');
assert.match(source, /!event\.target\.closest\('#board,#finish-combination'\)/, 'qualquer clique fora da Arena deve cancelar a combinação');
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
const defensiveContext = {};
vm.createContext(defensiveContext);
vm.runInContext(source.match(/function botIsDefensiveByPower\([^\n]+/)[0], defensiveContext);
vm.runInContext(source.match(/function botRepetitionPenalty\([^\n]+/)[0], defensiveContext);
assert.equal(defensiveContext.botIsDefensiveByPower(500, 800), true);
assert.equal(defensiveContext.botIsDefensiveByPower(800, 500), false);
const movementHistory = [{fromRow: 2, fromCol: 2, toRow: 3, toCol: 2}];
assert.ok(defensiveContext.botRepetitionPenalty(movementHistory, {r: 2, c: 2}) > 0, 'bot deve evitar desfazer imediatamente o último movimento');
assert.ok(defensiveContext.botRepetitionPenalty(movementHistory, {r: 3, c: 2}) > 0, 'bot deve evitar revisitar casas recentes');
assert.equal(defensiveContext.botRepetitionPenalty(movementHistory, {r: 4, c: 4}), 0);
vm.runInContext(source.match(/function botStrategicPowerValue\([^\n]+/)[0], defensiveContext);
vm.runInContext(source.match(/function botGameAdvantageValue\([^\n]+/)[0], defensiveContext);
vm.runInContext(source.match(/function botAdvanceProgress\([^\n]+/)[0], defensiveContext);
assert.equal(defensiveContext.botStrategicPowerValue(0, true), 600, 'o Pato deve ter valor estratégico apesar do ATK 0');
assert.ok(defensiveContext.botGameAdvantageValue(1, 0, 0) > 0);
assert.ok(defensiveContext.botGameAdvantageValue(0, 1, 0) > 0);
assert.equal(defensiveContext.botAdvanceProgress(1, 6, 8), 1);
assert.equal(defensiveContext.botAdvanceProgress(1, 4, 8), 3);
assert.equal(defensiveContext.botAdvanceProgress(2, 1, 8), 1);
assert.equal(defensiveContext.botAdvanceProgress(2, 3, 8), 3);
vm.runInContext(source.match(/function botEnemySpawnDistance\([^\n]+/)[0], defensiveContext);
vm.runInContext(source.match(/function botFieldControlValue\([^\n]+/)[0], defensiveContext);
assert.equal(defensiveContext.botEnemySpawnDistance(1, 1, 8), 0);
assert.equal(defensiveContext.botEnemySpawnDistance(1, 4, 8), 3);
assert.equal(defensiveContext.botEnemySpawnDistance(2, 6, 8), 0);
assert.ok(defensiveContext.botFieldControlValue(1, 0, 4) > defensiveContext.botFieldControlValue(1, 0, 1), 'bot deve parar de valorizar avanço perto do polo inimigo');
vm.runInContext(source.match(/function botCastleSwapValue\([^\n]+/)[0], defensiveContext);
assert.ok(defensiveContext.botCastleSwapValue(1000, 100, 0, 0, 0) > 0, 'roque deve salvar uma formação ameaçada');
assert.ok(defensiveContext.botCastleSwapValue(0, 0, 1000, 0, 0) > 0, 'roque deve ajudar a preparar combinações');
assert.ok(defensiveContext.botCastleSwapValue(0, 0, 0, 1000, 0) > 0, 'roque deve criar oportunidades de ataque');
assert.ok(defensiveContext.botCastleSwapValue(0, 1000, 0, 0, 0) < 0, 'roque não deve piorar a segurança sem compensação');
assert.ok(defensiveContext.botCastleSwapValue(0, 0, 0, -1000, 0) < 0, 'roque não deve abandonar um ataque favorável');
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
assert.match(page, /engine-celestial\.js\?v=7/);
assert.match(page, /engine-actions-b\.js\?v=16/);
assert.match(page, /engine-actions-a\.js\?v=25/);
assert.match(page, /VERSÃO 140/);
assert.match(page, /game-catalog\.js\?v=1/);
assert.match(source, /function registerPawns/);
assert.match(source, /function registerEffects/);
assert.match(source, /function registerArchetype/);
assert.match(source, /function validateGameCatalog/);
assert.match(page, /network\.js\?v=36/);
assert.match(page, /engine-ui\.js\?v=37/);
assert.match(source, /function botCombinationWinsNow/);
assert.match(source, /usesCombined:parts\.some\(u=>u\.fusion\)/);
assert.match(source, /normalOptions\.length\?normalOptions:winningExceptions/);
assert.match(source, /state\.arena=xadriaPair\.has\(previous\)&&xadriaPair\.has\(key\)&&previous!==key\?'kingdom':key/);
assert.match(source, /state\.arena==='kingdom'&&xadriaPair\.has\(k\)/);
assert.match(page, /styles-core\.css\?v=5/);
assert.match(page, /id="home-brand"/);
assert.match(source, /\$\('#home-brand'\)\.onclick=/);
assert.match(page, /engine-core\.js\?v=23/);
assert.doesNotMatch(source, /cartas\.png/, 'nenhuma carta deve continuar usando a antiga folha de artes desenhadas');
assert.match(page, /engine-actions-a\.js\?v=25/);
assert.match(page, /engine-actions-b\.js\?v=16/);
assert.match(source, /function recoverBotTurn/);
assert.match(source, /catch\(error\)\{recoverBotTurn\(error\)\}/);
assert.match(source, /function armBotWatchdog/);
assert.match(source, /if\(state\.swordQueue\.length\)\{openSwordTransfer\(\);return\}endTurn\(\)/);
assert.match(source, /function botFusionCandidateSets/);
assert.match(source, /if\(!botVsBot&&\(mode==='combinar'\|\|pendingCard\)/);
assert.match(source, /function detailSelectedUnit\(\)\{return botVsBot\?spectatorSelected:selected\}/);
assert.match(source, /A Espada Maldita foi destruída porque não havia outro peão/);
assert.match(source, /slice\(0,10\)/, 'o cálculo defensivo do bot deve limitar ameaças simuladas');
assert.match(source, /slice\(0,8\)/, 'o cálculo defensivo do bot deve limitar movimentos simulados');
assert.match(source, /Array\.from\(\{length:40\}/, 'os decks de Efeito devem ter 40 cartas');
assert.match(source, /commonSlots=36-fusionSlots/, 'os decks de Peões devem ter 36 cartas');
assert.match(source, /destroy\(u,next,'efeito'\)/, 'Eu Vejo os Olhos deve destruir o peão que não se moveu');
assert.match(source, /u\.movedTurn=state\.turn;place\(u,r,c\)/, 'todo movimento deve registrar o turno no próprio peão para Eu Vejo os Olhos');
assert.match(source, /destroy\(tower,attacker\.owner,'sacrifício'\)/, 'o sacrifício da Torre Branca deve dar o ponto ao atacante');
assert.match(source, /pointValue:1/, 'todo peão deve começar valendo um ponto');
assert.match(source, /let pts=u\.pointValue\?\?u\.fusion\?\?1/, 'a pontuação deve usar o valor real dos materiais combinados');
assert.match(source, /f\.pointValue=parts\.length/, 'o Peão Combinado deve valer exatamente a quantidade de cartas usadas como materiais');
assert.match(source, /combine-card-button/, 'os detalhes devem oferecer o botão Combinar');
assert.match(source, /Confira \$\{u\.name\} e toque em Combinar/, 'no celular a carta combinada deve abrir para leitura antes da combinação');
assert.match(source, /function combatPointSummary/, 'o resultado do combate deve informar os pontos ganhos');
const logContext = {};
vm.createContext(logContext);
vm.runInContext(source.match(/function inferLogType\([^\n]+/)[0], logContext);
assert.equal(logContext.inferLogType('Bot 1 usou Recuar! em Golem: B3 → B2.'), 'effect', 'cartas de efeito devem ficar azuis mesmo quando movem um peão');
assert.equal(logContext.inferLogType('Torre moveu de C8 para C5.'), 'move', 'movimentos comuns devem ficar amarelos');
assert.equal(logContext.inferLogType('Bot 2 ativou a Arena Selva Selvagem.'), 'arena', 'Arenas colocadas devem ficar laranjas');
assert.match(source, /mobile\?state\.log:\[\.\.\.state\.log\]\.reverse\(\)/, 'a crônica móvel deve mostrar o evento mais recente primeiro');
assert.match(page, /id="finish-combination"/, 'a Amálgama deve poder ser finalizada por um botão sobre a Arena');
for (const type of ['combat','deploy','effect','combine','move','arena']) assert.match(styles, new RegExp(`log-entry\\.log-${type}`), `cor ausente na crônica: ${type}`);
assert.doesNotMatch(page, /id="flip"/, 'a ação de virar deve ter sido removida da interface');
assert.equal(context.effects.camouflage, undefined, 'Camuflar-se deve sair do jogo junto da mecânica de virar');
assert.doesNotMatch(source, /function flipSelected|function botSetFaceDown/, 'jogadores e bots não devem mais virar peões');
assert.match(source, /hasEffect\(attacker,'jaguar'\)[^\n]+bonusAtk=.*\+100/, 'a Onça deve ganhar 100 ATK quando derrota um adversário');
assert.match(source, /selectedEffect=\{key:k,index:i,owner,arena:false\}/, 'os detalhes devem manter o dono da carta inspecionada');
assert.match(page, /styles-responsive\.css\?v=33/);
assert.doesNotMatch(page, /SUA MÃO/);
assert.match(page, /<div class="reserve-head"><div><b>Peões<\/b><\/div><span><b id="pawn-deck-count">0<\/b> na pilha<\/span><\/div>/);
assert.match(styles, /reserve-hand-panel \.reserve-head>span/);
assert.match(styles, /clamp\(360px,calc\(100vw - 661px\),528px\)/);
assert.match(styles, /effect-hand-panel\{margin-right:-18px\}/);
assert.match(styles, /reserve-hand-panel\{margin-left:-18px\}/);
assert.match(source, /shown\.fusion\?' combined-detail'/);
assert.doesNotMatch(source, /fusion-badge">PEÃO COMBINADO/);
assert.match(styles, /\.board \.piece\{box-shadow:none!important\}/);
assert.match(styles, /\.board \.piece\.fusion\{box-shadow:/);
assert.match(styles, /\.unit-card\.combined-detail\{background:/);
assert.match(styles, /clamp\(145px,12vw,200px\)/);
assert.match(styles, /clamp\(190px,15vw,270px\)/);
assert.match(styles, /border-width:16px 18px/);
assert.match(styles, /reserve-piece:has\(\.xadria-black-art\) \.reserve-label/);
assert.match(source, /class="reserve-label"/);
assert.match(source, /effect-equipment/);
assert.match(source, /effect-arena/);
assert.match(source, /effect-utility/);
assert.match(styles, /effect-card\.effect-equipment/);
assert.match(styles, /effect-card\.effect-arena/);
assert.match(styles, /effect-card\.effect-utility/);
assert.match(styles, /height:calc\(100% \+ 92px\)/);
assert.match(styles, /\.board\[data-arena\] \.cell\.valid::before/);
assert.match(styles, /\.board\[data-arena\] \.cell\.target::before/);
assert.match(styles, /\.board \.piece\.p2\{border:3px solid/);
assert.doesNotMatch(styles, /\.board \.piece\.p2\{border:[^}]*dashed/);
assert.match(source, /dual-xadria-art/);
assert.match(styles, /\.art-crop\.dual-xadria-art/);
assert.match(styles, /\.art-crop\.xadria-white-art\{background:[^}]+#151119/);
assert.match(styles, /\.art-crop\.xadria-black-art\{background:[^}]+#fffdf7/);
assert.match(styles, /\.board \.piece:not\(\.fusion\) \.board-art\.xadria-white-art\{background:#29212f!important\}/, 'Casa Branca deve manter ícone branco sobre fundo escuro no campo');
assert.match(styles, /\.board \.piece:not\(\.fusion\) \.board-art\.xadria-black-art\{background:#eee7db!important\}/, 'Casa Preta deve manter ícone preto sobre fundo claro no campo');
assert.match(styles, /\.board \.piece:not\(\.fusion\) \.board-art\.xadria-black-art img\{filter:brightness\(0\)!important\}/);
assert.match(page, /rel="icon"[^>]+confluxo-favicon\.svg/);
assert.match(page, /setup-mark[^>]*><img src="assets\/icons\/flower-twirl\.svg"/);
assert.match(source, /SUA VEZ! · Confluxo/);
assert.match(source, /visibilitychange/);
const noticeContext = {
  onlineMode: true, localPlayer: 1, botMode: false, botVsBot: false,
  state: {current: 1, placementPhase: false, swordQueue: []},
  document: {hidden: true, title: ''},
  $: () => ({classList: {contains: () => true}})
};
vm.createContext(noticeContext);
const noticeCode = ['const BASE_TAB_TITLE[^\n]+', 'function tabHumanPlayer\(\)[^\n]+', 'function updateTurnTabNotice\(\)[^\n]+']
  .map(pattern => source.match(new RegExp(pattern))[0]).join('\n');
vm.runInContext(`${noticeCode}\nupdateTurnTabNotice()`, noticeContext);
assert.equal(noticeContext.document.title, 'SUA VEZ! · Confluxo');
noticeContext.state.current = 2;
vm.runInContext('updateTurnTabNotice()', noticeContext);
assert.equal(noticeContext.document.title, 'Confluxo — Jogo de Cartas Tático');
assert.match(styles, /data-arena=abyss[^}]+six-eyes\.svg/);
assert.doesNotMatch(fs.readFileSync('assets/icons/six-eyes.svg', 'utf8'), /M0 0h512v512H0z/, 'Six Eyes deve permanecer com fundo transparente');
assert.match(page, /<h3>Ataque em conjunto<\/h3>/);
assert.match(page, /outros peões <b>em contato com o alvo<\/b>/);
assert.match(page, /network\.js\?v=36/);
assert.match(page, /styles-game\.css\?v=10/);
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
assert.match(source, /function botUseEyesEffect\(player,p\)/);
assert.match(source, /state\.players\[botOpponent\(player\)\]\.units\.filter/);
assert.match(source, /k!==['"]eyes['"]&&effects\[k\]\.type===['"]EQUIPAMENTO['"]/);
const ownEyesTarget = {name: 'Devoto aliado', row: 6, fusion: 0, atk: 250, equipment: []};
const enemyEyesTarget = {name: 'Peão adversário', row: 1, fusion: 2, atk: 400, equipment: []};
const eyesBotContext = {
  state: {players: {1: {name: 'Bot', hand: ['eyes'], units: [ownEyesTarget]}, 2: {units: [enemyEyesTarget]}}},
  effects: {eyes: {name: 'Eu vejo os olhos'}}, botOpponent: () => 2,
  moveTargets: () => [{r: 2, c: 2}], effectiveAtk: unit => unit.atk,
  copyEquipmentForRavens() {}, log() {}, render() {}
};
vm.createContext(eyesBotContext);
vm.runInContext(source.match(/function botUseEyesEffect\([^\n]+/)[0], eyesBotContext);
assert.equal(eyesBotContext.botUseEyesEffect(1, eyesBotContext.state.players[1]), true);
assert.deepEqual(ownEyesTarget.equipment, [], 'o bot não deve equipar Eu vejo os olhos em um peão próprio');
assert.deepEqual(enemyEyesTarget.equipment, ['eyes'], 'o bot deve usar Eu vejo os olhos em um peão adversário');
assert.match(source, /function botUsePushEffect\(player,p,requirePit=false\)/);
assert.match(source, /function botUseRetreatEffect\(player,p\)/);
assert.doesNotMatch(source, /function botUseCamouflageEffect\(player,p\)/);
assert.match(source, /played<2&&botPlayEffect\(\)/);
const arenaBotContext = {
  state: {arena: 'roses', defeatedCount: 0, players: {1: {units: []}, 2: {name: 'Bot', hand: ['blackRoses'], units: []}}},
  effects: {roses: {name: 'Campo das Rosas Pálidas', type: 'ARENA'}, blackRoses: {name: 'Colina das Rosas Negras', type: 'ARENA'}, kingdom: {name: 'Reino de Xadria', type: 'ARENA'}},
  botActor: () => 2, botOpponent: () => 1,
  botUsePushEffect: () => false, botUseCastleEffect: () => false, botUsePitEffect: () => false, botUseEyesEffect: () => false,
  botUseRetreatEffect: () => false,
  clearJungleFeatures() {}, allUnits: () => [], destroy() {}, render() {}, log() {},
  equipmentTargetAllowed: () => false, effectiveAtk: () => 0, copyEquipmentForRavens() {},
  botAttackChoices: () => [], playerAttackedThisTurn: () => false, playPeaceTreaty: () => false
};
vm.createContext(arenaBotContext);
vm.runInContext(source.match(/function botPlayEffect\(\)\{[\s\S]*?\n\}/)[0], arenaBotContext);
assert.equal(arenaBotContext.botPlayEffect(), true);
assert.equal(arenaBotContext.state.arena, 'kingdom', 'o bot deve convergir as duas Arenas de Xadria');
assert.deepEqual(arenaBotContext.state.players[2].hand, []);
arenaBotContext.state.players[2].hand = ['roses'];
assert.equal(arenaBotContext.botPlayEffect(), false, 'o bot não deve gastar outra Arena de Xadria enquanto o Reino estiver ativo');
assert.deepEqual(arenaBotContext.state.players[2].hand, ['roses']);
assert.match(source, /function botMatchupScore\(/);
assert.match(source, /function botProjectedEnemyRisk\(defender\)/);
assert.match(source, /moveTargets\(mover\)\.filter\(target=>!pitAt/);
assert.match(source, /responseRisk<plan\.currentRisk/);
assert.match(source, /responseRisk\*3/);
assert.match(source, /defensive&&joint\?35000/);
assert.match(source, /jointSetup\*\(defensive\?35:3\)/);
assert.match(source, /defensiveJoint\.length\?defensiveJoint/);
assert.match(source, /u\.moveHistory=\[/);
assert.match(source, /ahead=botGameAdvantageScore\(player\)>0/);
assert.match(source, /p\.archetype==='xadria'\?normal\.find\(card=>hasEffect\(card,'duck'\)\)/);
assert.match(source, /fieldControl=botFieldControlValue\(advance,supportGap,botEnemySpawnDistance/);
assert.match(source, /enemyApproach\.has/);
assert.doesNotMatch(source, /function botChooseReveal|function botChooseHide|botRevealPhase|botHidePhase/);
assert.match(source, /scheduleBot\(attacked\?botAttackPhase:botFinishTurn/);
assert.match(source, /function botFusionMissingCount\(p\)/);
assert.match(source, /function botFusionSetupScore\(p\)/);
assert.match(source, /priority:botFusionMaterialPriority\(p,card\)/);
assert.match(source, /fusionSetup=\(botFusionSetupScore\(p\)-fusionBefore\)\*5/);
assert.match(source, /needsFusionMaterial=botFusionMissingCount\(p\)>0/);
assert.match(source, /function botCombinationFollowup\(next\)/);
assert.match(source, /botCombinationFollowup\(botAttackPhase\)/);
assert.match(source, /function botUseCastleEffect\(player,p\)/);
assert.doesNotMatch(source, /function botPrepareCastle\(\)/);
assert.match(source, /botUsePushEffect\(player,p,true\)\|\|botUseCastleEffect\(player,p\)/);
assert.match(source, /botCastleGuardValue\(tower,p\)/);
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
assert.match(source, /initialPlacementResume=\{unit:u,version\};onUnitDeployed\(u\)/);
assert.match(source, /state\.placementPhase&&pendingCard\?\.key==='devotee-pit'/);
assert.match(source, /key==='devotee-pit'&&initialPlacementResume/);
assert.match(source, /continueInitialPlacement\(resume\.unit,resume\.version\)/);
assert.match(source, /pendingCard\?\.key==='devotee-pit'[^\n]+cardTarget/);
assert.match(source, /triggerSolarVictory/);
assert.match(styles, /\.board\{box-sizing:content-box;width:auto;height:calc\(100% - 32px\)[^}]+aspect-ratio:6\/8/);
assert.match(styles, /\.board\{box-sizing:content-box;width:calc\(100% - 22px\)[^}]+aspect-ratio:6\/8/);
assert.match(styles, /\.board \.piece\{box-shadow:none!important\}/);
assert.doesNotMatch(styles, /\.board \.piece\.p[12]\{[^}]*box-shadow/);
assert.match(styles, /\.board \.piece:not\(\.fusion\)\.deck-xadria\{background:#4b3455\}/);
assert.match(styles, /\.board \.piece:not\(\.fusion\)\.deck-wild\{background:#294d35\}/);
assert.match(styles, /\.board \.piece:not\(\.fusion\) \.board-art\{background:inherit!important;box-shadow:none!important\}/);
assert.doesNotMatch(styles, /\.board \.piece:not\(\.fusion\) \.board-art\.tone-(?:black|white)[^{]*\{background:/);
assert.doesNotMatch(styles, /\.board \.piece:not\(\.fusion\) \.board-art\.xadria-black-art img[^}]+invert\(1\)/, 'a Casa Preta deve usar ícone preto no campo');
assert.match(styles, /\.setup\{grid-template-rows:minmax\(16px,1fr\) auto minmax\(16px,1fr\)[^}]+overflow-y:auto/, 'a tela inicial deve rolar quando o lobby ultrapassar a altura disponível');
assert.match(styles, /\.setup-card,\.setup-card\.online-setup\{max-height:none;overflow:visible\}/, 'no celular a rolagem deve pertencer à página inicial inteira');
assert.match(styles, /\.reserve-piece:not\(\.fusion-card\)\{background:#cfc5b3;box-shadow:none!important\}/);
assert.match(styles, /\.unit-card:not\(\.combined-detail\)\[data-deck=celestial\] \.detail-art\{background:#173b5c!important\}/);
assert.match(styles, /\.board\{outline:4px solid #17141b;outline-offset:0\}/);
assert.match(styles, /\.reserve-piece:not\(\.fusion-card\)\.deck-xadria\{background:#4b3455\}/);
assert.match(styles, /\.reserve-piece:not\(\.fusion-card\)\.deck-wild\{background:#294d35\}/);
assert.match(source, /reserve-piece deck-\$\{archetypeOfUnit\(u\)\}/);
assert.match(styles, /\.board \.piece\.fusion\.deck-xadria[^}]+linear-gradient/);
assert.match(styles, /\.board \.piece\.fusion\.deck-xadria\{box-shadow:[^}]+#f2bd4fa8/);
assert.match(styles, /\.board \.piece\.fusion\.deck-wild[^}]+linear-gradient/);
assert.match(styles, /\.reserve-piece\.fusion-card\.deck-celestial\{background:linear-gradient/);
assert.match(styles, /\.unit-card\.combined-detail\[data-deck=abyss\]\{background:linear-gradient/);

console.log('game card tests passed');
