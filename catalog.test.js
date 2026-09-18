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
for (const name of ['uid','unit','shuffle','addNormalMaterial','nativeArchetypeForKind','fusionNormalMaterialCountsFor','fusionNormalMaterialCounts','randomCombinedSetValid','randomEffectHasPawnTarget','createRandomDeckRecipe','randomVisualArchetype','makePawnDeck','ownedFusionKinds','ownsEveryUniqueFusion','takePawnFromDeck','takeEffectFromDeck','makeEffectDeck']) {
  vm.runInContext(coreSource.match(new RegExp(`function ${name}\\([^\\n]+`))[0], integrated);
}

assert.deepEqual({...integrated.summary},{pawns:67,effects:47,archetypes:8});
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
assert.equal(integrated.archetypes.random.name,'Aleatório');
assert.ok(Object.values(integrated.archetypes).every(deck=>deck.effects.includes('quickHands')));
assert.equal(integrated.defs.goldDragon.materials.requirements[0].combined,true);
assert.equal(integrated.defs.candyZombie.atk,150);
assert.equal(integrated.defs.cookieDemon.materials.type,'DOCE');
assert.equal(integrated.defs.duck.text,'Não é destruída por combate. Pode se mover uma vez por turno sem nunca gastar a ação de movimento.');
assert.match(integrated.effects.moon.text,/preenche continuamente seu raio até 3 casas/);
assert.equal(integrated.randomEffectHasPawnTarget('moon',['horse']),false,'Lua em Órbita exige uma Terra na pilha de Peões');
assert.equal(integrated.randomEffectHasPawnTarget('moon',['earth']),true,'Lua em Órbita pode entrar quando há uma Terra');
assert.equal(integrated.randomEffectHasPawnTarget('badOmen',['horse']),false,'Mal preságio exige um Peão Funesto compatível');
assert.equal(integrated.randomEffectHasPawnTarget('badOmen',['direAnt']),true,'Mal preságio pode entrar quando há um Peão Funesto');
const expectedNormalMaterials={xadria:15,wild:7,abyss:5,candy:8,gold:5,egyptian:7,insects:6};

for (const [key,deck] of Object.entries(integrated.archetypes)) {
  const recipe = key==='random'?integrated.createRandomDeckRecipe():null;
  const pawnDeck = integrated.makePawnDeck(1,key,recipe);
  const effectDeck = integrated.makeEffectDeck(key,recipe);
  assert.equal(pawnDeck.length,25,`${key} deve ter exatamente 25 Peões`);
  assert.equal(effectDeck.length,25,`${key} deve ter exatamente 25 Efeitos`);
  if(key==='random'){
    assert.equal(new Set(recipe.fusions).size,5,'o Aleatório deve escolher 5 Peões Combinados diferentes');
    assert.ok(recipe.fusions.every(kind=>integrated.defs[kind].fusion),'todos os escolhidos devem ser Peões Combinados');
    assert.equal(new Set(recipe.arenas).size,2,'o Aleatório deve escolher 2 Arenas diferentes');
    assert.ok(recipe.arenas.every(kind=>integrated.effects[kind].type==='ARENA'),'as duas cartas especiais devem ser Arenas');
    assert.ok(pawnDeck.filter(card=>card.fusion).every(card=>recipe.fusions.includes(card.kind)),'a pilha não deve conter Combinados fora da receita');
    assert.ok(pawnDeck.filter(card=>!card.fusion).every(card=>recipe.normalKinds.includes(card.kind)),'os normais devem ser materiais dos Combinados escolhidos');
    continue;
  }
  for (const kind of [...new Set([...deck.pawns,...deck.fusions])]) assert.ok(pawnDeck.some(card=>card.kind===kind),`${key} deve conter ${kind}`);
  for (const effect of [...new Set(deck.effects.filter(effect=>!integrated.effects[effect]?.undrawable))]) assert.ok(effectDeck.includes(effect),`${key} deve conter ${effect}`);
  const required=integrated.fusionNormalMaterialCounts(key),actual=pawnDeck.filter(card=>!card.fusion).reduce((counts,card)=>(counts[card.kind]=(counts[card.kind]||0)+1,counts),{});
  assert.equal(Object.values(required).reduce((sum,count)=>sum+count,0),expectedNormalMaterials[key],`${key} deve reservar a quantidade correta de materiais normais`);
  for(const [kind,count] of Object.entries(required))assert.ok((actual[kind]||0)>=count,`${key} deve conter ${count} cópia(s) normal(is) de ${kind} para suas combinações`);
}
const variedEffects={effectDeck:['pit','pit','push'],lastEffectDrawKey:'pit'};
assert.equal(integrated.takeEffectFromDeck(variedEffects),'push','a compra não deve repetir o último Efeito quando há alternativa');
const variedPawns={archetype:'xadria',pawnDeck:[{kind:'tower'},{kind:'tower'},{kind:'infantry'}],lastPawnDrawKind:'tower',reserve:[],units:[],initialUnits:[]};
assert.equal(integrated.takePawnFromDeck(variedPawns).kind,'infantry','a compra não deve repetir o último Peão quando há alternativa');

for(const forbidden of Object.keys(integrated.archetypes))for(let attempt=0;attempt<100;attempt++)assert.notEqual(integrated.randomVisualArchetype(forbidden),forbidden,'a cor sorteada nunca pode repetir a cor adversária');

for(let attempt=0;attempt<250;attempt++){
  const recipe=integrated.createRandomDeckRecipe(),pawns=integrated.makePawnDeck(1,'random',recipe),effectDeck=integrated.makeEffectDeck('random',recipe);
  assert.equal(new Set(recipe.fusions).size,5,`sorteio ${attempt} deve manter 5 Combinados únicos`);
  assert.equal(pawns.length,25,`sorteio ${attempt} deve caber em 25 Peões`);
  assert.equal(effectDeck.length,25,`sorteio ${attempt} deve caber em 25 Efeitos`);
  assert.equal(new Set(effectDeck.filter(kind=>integrated.effects[kind].type==='ARENA')).size,2,`sorteio ${attempt} deve manter exatamente 2 tipos de Arena`);
  const pawnKinds=pawns.map(card=>card.kind);
  assert.ok(effectDeck.every(kind=>integrated.effects[kind].type==='ARENA'||integrated.randomEffectHasPawnTarget(kind,pawnKinds)),`sorteio ${attempt} não deve conter Efeito sem alvo possível na pilha de Peões`);
  for(const [kind,count] of Object.entries(recipe.materialCounts))assert.ok(pawns.filter(card=>card.kind===kind).length>=count,`sorteio ${attempt} precisa dos materiais de ${kind}`);
}

console.log('catalog registry tests passed');
