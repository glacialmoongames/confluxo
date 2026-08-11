const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('game.js', 'utf8');
const definitions = source.slice(0, source.indexOf('let selectedDecks'));
const context = {};
vm.createContext(context);
vm.runInContext(`${definitions}\nthis.defs=defs;this.effects=effects;this.archetypes=archetypes;`, context);

assert.equal(context.defs.horse.atk, 250);
assert.equal(context.defs.horse.movement.length, 8);
assert.equal(context.defs.hawk.atk, 250);
assert.equal(context.defs.golem.fusion, 2);
assert.equal(context.defs.golem.atk, 400);
assert.equal(context.defs.duck.name, 'Ave Eterna do Reino Xadria');
assert.ok(context.effects.pit, 'Poço sem Fundo deve existir');
assert.match(context.effects.jungle.text, /fruta/i);
assert.ok(context.archetypes.xadria.pawns.includes('horse'));
assert.ok(context.archetypes.wild.pawns.includes('hawk'));
assert.ok(context.archetypes.wild.fusions.includes('golem'));
assert.match(source, /até o fim da partida/);
assert.doesNotMatch(source, /delete u\.copiedKind/);
assert.match(source, /spawnJungleFeature\(\)/);
assert.match(source, /u\.bonusAtk=\(u\.bonusAtk\|\|0\)\+200/);

console.log('game card tests passed');
