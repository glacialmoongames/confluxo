/*
 * Catálogo central de cartas do Confluxo.
 *
 * Para adicionar conteúdo:
 *   registerPawns({ chave: { name, atk, movement, types, ... } });
 *   registerEffects({ chave: { name, type, text, ... } });
 *   registerArchetype('chave', { name, pawns, fusions, effects, ... });
 *
 * Alterações posteriores devem ser explícitas com updatePawn, updateEffect ou
 * updateArchetype. Isso evita sobrescritas silenciosas e chaves duplicadas.
 */
const defs={};
const effects={};
const archetypes={};

function registerCatalogEntries(registry,entries,label){
 Object.entries(entries).forEach(([key,definition])=>{
  if(registry[key])throw new Error(`${label} duplicado no catálogo: ${key}`);
  registry[key]={...definition};
 });
 return registry;
}
function updateCatalogEntry(registry,key,changes,label){
 if(!registry[key])throw new Error(`${label} inexistente no catálogo: ${key}`);
 Object.assign(registry[key],changes);
 return registry[key];
}
function registerPawns(entries){return registerCatalogEntries(defs,entries,'Peão')}
function registerEffects(entries){return registerCatalogEntries(effects,entries,'Efeito')}
function registerArchetype(key,definition){registerCatalogEntries(archetypes,{[key]:definition},'Arquétipo');return archetypes[key]}
function updatePawn(key,changes){return updateCatalogEntry(defs,key,changes,'Peão')}
function updateEffect(key,changes){return updateCatalogEntry(effects,key,changes,'Efeito')}
function updateArchetype(key,changes){return updateCatalogEntry(archetypes,key,changes,'Arquétipo')}

function validateGameCatalog(){
 let errors=[];
 Object.entries(defs).forEach(([key,card])=>{
  if(!card.name)errors.push(`Peão ${key} sem nome`);
  if(!Number.isFinite(card.atk))errors.push(`Peão ${key} sem ATK válido`);
  if(!Array.isArray(card.movement))errors.push(`Peão ${key} sem alcance`);
  if(!Array.isArray(card.types))errors.push(`Peão ${key} sem tipos`);
 });
 Object.entries(effects).forEach(([key,card])=>{
  if(!card.name)errors.push(`Efeito ${key} sem nome`);
  if(!['UTILIDADE','EQUIPAMENTO','ARENA'].includes(card.type))errors.push(`Efeito ${key} com tipo inválido`);
 });
 Object.entries(archetypes).forEach(([key,deck])=>{
  for(let pawn of deck.pawns||[])if(!defs[pawn])errors.push(`Arquétipo ${key} referencia peão ausente: ${pawn}`);
  for(let fusion of deck.fusions||[])if(!defs[fusion])errors.push(`Arquétipo ${key} referencia combinado ausente: ${fusion}`);
  for(let effect of deck.effects||[])if(!effects[effect])errors.push(`Arquétipo ${key} referencia efeito ausente: ${effect}`);
  for(let card of deck.pawnComposition||[])if(!defs[card])errors.push(`Composição ${key} referencia peão ausente: ${card}`);
 });
 if(errors.length)throw new Error(`Catálogo inválido:\n${errors.join('\n')}`);
 return{pawns:Object.keys(defs).length,effects:Object.keys(effects).length,archetypes:Object.keys(archetypes).length};
}
