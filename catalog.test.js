const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const catalogSource = fs.readFileSync('game-catalog.js', 'utf8');
const coreSource = fs.readFileSync('engine-core.js', 'utf8');
const expansionSource = fs.readFileSync('engine-expansion.js', 'utf8');

const registry = {};
vm.createContext(registry);
vm.runInContext(catalogSource, registry);
vm.runInContext(`this.api={registerPawns,registerEffects,registerArchetype,updatePawn,updateEffect,updateArchetype,validateGameCatalog};this.defs=defs;this.effects=effects;this.archetypes=archetypes`, registry);

registry.api.registerPawns({samplePawn:{name:'Teste',atk:100,movement:[],types:['LUZ']}});
assert.throws(()=>registry.api.registerPawns({samplePawn:{name:'Duplicado',atk:100,movement:[],types:['LUZ']}}),/duplicado/i);
registry.api.updatePawn('samplePawn',{atk:200});
assert.equal(registry.defs.samplePawn.atk,200);
assert.throws(()=>registry.api.updateEffect('missing',{}),/inexistente/i);

const definitions = [catalogSource, coreSource.slice(0,coreSource.indexOf('let selectedDecks')), expansionSource.slice(0,expansionSource.indexOf('function archetypeVisual'))].join('\n');
const integrated = {console};
vm.createContext(integrated);
vm.runInContext(`${definitions}\nthis.summary=validateGameCatalog();this.defs=defs;this.effects=effects;this.archetypes=archetypes`, integrated);

assert.deepEqual({...integrated.summary},{pawns:49,effects:31,archetypes:6});
assert.equal(integrated.archetypes.xadria.pawns.length,6);
assert.equal(integrated.archetypes.wild.pawns.length,5);
assert.equal(integrated.archetypes.celestial.pawnComposition.length,18);
assert.equal(integrated.archetypes.abyss.fusions.length,3);
assert.equal(integrated.archetypes.candy.pawns.length,4);
assert.equal(integrated.archetypes.candy.fusions.length,3);
assert.equal(integrated.archetypes.gold.pawns.length,3);
assert.equal(integrated.archetypes.gold.fusions.length,3);
assert.equal(integrated.archetypes.gold.effects.length,10);
assert.equal(integrated.defs.goldDragon.materials.requirements[0].combined,true);
assert.equal(integrated.defs.candyZombie.atk,150);
assert.equal(integrated.defs.cookieDemon.materials.type,'DOCE');
assert.equal(integrated.defs.duck.text,'Não é destruída por combate. Pode se mover uma vez por turno sem nunca gastar a ação de movimento.');
assert.match(integrated.effects.moon.text,/preenche continuamente seu raio até 3 casas/);

console.log('catalog registry tests passed');
