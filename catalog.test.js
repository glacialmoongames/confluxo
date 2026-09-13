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
for (const name of ['uid','unit','shuffle','makePawnDeck','ownedFusionKinds','ownsEveryUniqueFusion','takePawnFromDeck','takeEffectFromDeck','makeEffectDeck']) {
  vm.runInContext(coreSource.match(new RegExp(`function ${name}\\([^\\n]+`))[0], integrated);
}

assert.deepEqual({...integrated.summary},{pawns:67,effects:47,archetypes:7});
assert.equal(integrated.archetypes.xadria.pawns.length,6);
assert.equal(integrated.archetypes.wild.pawns.length,5);
assert.equal(integrated.archetypes.celestial,undefined);
assert.equal(integrated.archetypes.insects.pawns.length,6);
assert.equal(integrated.archetypes.abyss.fusions.length,3);
assert.equal(integrated.archetypes.candy.pawns.length,4);
assert.equal(integrated.archetypes.candy.fusions.length,3);
assert.equal(integrated.archetypes.gold.pawns.length,3);
assert.equal(integrated.archetypes.gold.fusions.length,3);
assert.equal(integrated.archetypes.gold.effects.length,11);
assert.equal(integrated.archetypes.egyptian.pawns.length,3);
assert.equal(integrated.archetypes.egyptian.fusions.length,3);
assert.ok(Object.values(integrated.archetypes).every(deck=>deck.effects.includes('quickHands')));
assert.equal(integrated.defs.goldDragon.materials.requirements[0].combined,true);
assert.equal(integrated.defs.candyZombie.atk,150);
assert.equal(integrated.defs.cookieDemon.materials.type,'DOCE');
assert.equal(integrated.defs.duck.text,'Não é destruída por combate. Pode se mover uma vez por turno sem nunca gastar a ação de movimento.');
assert.match(integrated.effects.moon.text,/preenche continuamente seu raio até 3 casas/);

for (const [key,deck] of Object.entries(integrated.archetypes)) {
  const pawnDeck = integrated.makePawnDeck(1,key);
  const effectDeck = integrated.makeEffectDeck(key);
  assert.equal(pawnDeck.length,20,`${key} deve ter exatamente 20 Peões`);
  assert.equal(effectDeck.length,20,`${key} deve ter exatamente 20 Efeitos`);
  for (const kind of [...new Set([...deck.pawns,...deck.fusions])]) assert.ok(pawnDeck.some(card=>card.kind===kind),`${key} deve conter ${kind}`);
  for (const effect of [...new Set(deck.effects.filter(effect=>!integrated.effects[effect]?.undrawable))]) assert.ok(effectDeck.includes(effect),`${key} deve conter ${effect}`);
  assert.ok(pawnDeck.filter(card=>!card.fusion).length>=Math.max(0,...deck.fusions.map(kind=>integrated.defs[kind].fusion||0)),`${key} deve ter materiais normais suficientes para combinar`);
}
const variedEffects={effectDeck:['pit','pit','push'],lastEffectDrawKey:'pit'};
assert.equal(integrated.takeEffectFromDeck(variedEffects),'push','a compra não deve repetir o último Efeito quando há alternativa');
const variedPawns={archetype:'xadria',pawnDeck:[{kind:'tower'},{kind:'tower'},{kind:'infantry'}],lastPawnDrawKind:'tower',reserve:[],units:[],initialUnits:[]};
assert.equal(integrated.takePawnFromDeck(variedPawns).kind,'infantry','a compra não deve repetir o último Peão quando há alternativa');

console.log('catalog registry tests passed');
