const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = {
  ROWS: 8,
  state: {turn: 3, current: 1, arena: null, players: {1: {name: 'D1', hand: [], pawnDeck: [], units: [], attackLocked: false, attackedThisTurn: false, neptuneAbilityTurn: 0, lastLosses: 0}, 2: {name: 'D2', hand: [], pawnDeck: [], units: [], attackLocked: false, attackedThisTurn: false, neptuneAbilityTurn: 0, lastLosses: 0}}},
  defs: {},
  units: [],
  gameVersion: 1,
  onlineMode: false,
  pendingCard: null,
  mode: null,
  targets: [],
  logs: [],
  allUnits() { return globalThis.units; },
  hasEffect(unit, kind) { return unit.kind === kind || unit.copiedKind === kind; },
  movementOffsets(unit) { return unit.movement || []; },
  adjacent(a, b) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1; },
  inMovementRadius(unit, target) { return (unit.movement || []).some(([dr, dc]) => unit.row + dr === target.row && unit.col + dc === target.col); },
  at(r, c) { return globalThis.units.find(unit => unit.row === r && unit.col === c); },
  obstacleAt() { return null; },
  pitAt() { return null; },
  fruitAt() { return null; },
  place(unit, r, c) { unit.row = r; unit.col = c; },
  collectFruit() {},
  destroy(unit) { unit.destroyed = true; return true; },
  boardCoordinate(r, c) { return `${String.fromCharCode(65 + c)}${r + 1}`; },
  log(message) { globalThis.logs.push(message); },
  hint() {}, clearAction() {}, render() {}, renderBoard() {}, checkWin() {}, syncOnlineState() {}, sendPacket() {}, clearAnimationMarks() {},
  setTimeout(callback) { callback(); return 1; }
};
context.allUnits = () => context.units;
context.at = (r, c) => context.units.find(unit => unit.row === r && unit.col === c);
context.log = message => context.logs.push(message);
vm.createContext(context);
vm.runInContext(fs.readFileSync('engine-celestial.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('engine-actions-b.js', 'utf8'), context);

const mercury = {id: 'm', kind: 'mercury', row: 3, col: 3, owner: 1};
const watcher = {id: 'w', kind: 'earth', row: 2, col: 2, owner: 1, movement: [[1, 1]]};
context.units = [mercury, watcher];
assert.equal(context.mercuryCanMoveAgain(mercury), true);

const venus = {id: 'v', kind: 'venus', row: 2, col: 2, owner: 2, movement: [[1, 0], [1, 1]]};
const trapped = {id: 't', kind: 'earth', row: 3, col: 2, owner: 1};
context.units = [venus, trapped];
assert.equal(context.remainsInsideVenusRadius(trapped, 3, 3), true);
assert.equal(context.remainsInsideVenusRadius(trapped, 4, 2), false);
const alliedVenus = {id: 'va', kind: 'venus', row: 2, col: 2, owner: 1, movement: [[1, 0]]};
context.units = [alliedVenus, trapped];
assert.equal(context.remainsInsideVenusRadius(trapped, 4, 2), true);

const uranus = {id: 'u', kind: 'uranus', row: 2, col: 2, owner: 2, movement: [[1, 0]]};
context.units = [uranus, trapped];
assert.equal(context.uranusBlocking(trapped), uranus);

const saturn = {id: 's', kind: 'saturn', owner: 1};
context.onUnitDeployed(saturn);
assert.deepEqual(context.state.players[1].hand, ['asteroid', 'asteroid']);
context.onUnitDeployed(saturn);
assert.equal(context.state.players[1].hand.length, 2);

const protectedUnit = {name: 'Planeta', equipment: ['asteroid']};
assert.equal(context.consumeAsteroidShield(protectedUnit), true);
assert.deepEqual(protectedUnit.equipment, []);

const neptune = {owner: 1};
const pushed = {row: 5, col: 2};
context.units = [pushed];
const landing = context.neptuneLanding(neptune, pushed);
assert.equal(landing.r, 0);
assert.equal(landing.c, 2);
assert.equal(context.neptuneUsedThisTurn(1), false);
context.state.players[1].neptuneAbilityTurn = context.state.turn;
assert.equal(context.neptuneUsedThisTurn(1), true);
assert.equal(context.neptuneUsedThisTurn(2), false);
context.state.players[1].neptuneAbilityTurn = 0;
const neptuneCopyA = {id: 'n1', name: 'Netuno A', kind: 'neptune', owner: 1, row: 6, col: 0, abilityTurn: 0};
const neptuneCopyB = {id: 'n2', name: 'Netuno B', kind: 'neptune', owner: 1, row: 6, col: 1, abilityTurn: 0};
const firstTarget = {id: 'nt1', name: 'Alvo 1', kind: 'earth', owner: 2, row: 5, col: 2};
const secondTarget = {id: 'nt2', name: 'Alvo 2', kind: 'earth', owner: 2, row: 5, col: 3};
context.units = [neptuneCopyA, neptuneCopyB, firstTarget, secondTarget];
assert.equal(context.activateNeptunePush(neptuneCopyA, firstTarget), true);
assert.equal(context.state.players[1].neptuneAbilityTurn, context.state.turn);
assert.equal(context.activateNeptunePush(neptuneCopyB, secondTarget), false);
assert.equal(secondTarget.row, 5, 'a segunda cópia não pode empurrar no mesmo turno');

context.state.arena = 'project';
const linked = [
  {id: 'a', row: 1, col: 1, movement: [[0, 2]]},
  {id: 'b', row: 1, col: 3, movement: [[1, 0]]},
  {id: 'c', row: 2, col: 3, movement: []}
];
assert.equal(context.fusionSetConnected(linked), true);

const earth = {id: 'earth', kind: 'earth', row: 2, col: 2, owner: 1, movement: [[0, 1]], atk: 100, celestial: true, equipment: []};
const celestial = {id: 'planet', kind: 'mercury', row: 2, col: 3, owner: 1, movement: [], atk: 150, celestial: true, equipment: []};
context.units = [earth, celestial];
context.state.players[1].units = [earth, celestial];
assert.equal(context.effectiveAtk(celestial, false), 300);

context.state.players[1].hand = ['peace'];
context.state.players[1].attackedThisTurn = true;
assert.equal(context.playPeaceTreaty(context.state.players[1], 0), false);
assert.deepEqual(context.state.players[1].hand, ['peace']);
context.state.players[1].attackedThisTurn = false;
assert.equal(context.playPeaceTreaty(context.state.players[1], 0), true);
assert.equal(context.state.players[1].attackLocked, true);
assert.equal(context.state.players[2].attackLocked, true);

console.log('celestial deck tests passed');
