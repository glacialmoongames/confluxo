const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=__dirname;
const expansion=fs.readFileSync(path.join(root,'engine-expansion.js'),'utf8');
const insects=fs.readFileSync(path.join(root,'engine-insects.js'),'utf8');
const core=fs.readFileSync(path.join(root,'engine-core.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'engine-ui.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const styles=fs.readFileSync(path.join(root,'styles-responsive.css'),'utf8');
const network=fs.readFileSync(path.join(root,'network.js'),'utf8');
const schema=fs.readFileSync(path.join(root,'supabase','schema.sql'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase','migration-222-insects.sql'),'utf8');

for(const key of ['amberTragedy','direLadybug','direCockroach','direCaterpillar','direAnt','direCentipede','volcanicLadybug','radiantCockroach','stormButterfly','vastAnt','ruinCentipede'])assert.match(expansion,new RegExp(`${key}:\\{`),`peão ausente: ${key}`);
for(const key of ['calamityEruption','calamityNuclear','calamityHurricane','calamityTsunami','calamityQuake','volcanicHeat','nuclearWinter','unstableTyphoon','endlessOcean','tremblingEarth','badOmen','wildCage'])assert.match(expansion,new RegExp(`${key}:\\{`),`efeito ausente: ${key}`);
assert.match(expansion,/calamityHurricane:\{name:'Calamidade: Furacão'[^\n]+atkBonus:350[^\n]+dá 350 ATK/,'Calamidade: Furacão deve conceder exatamente 350 ATK');
assert.match(expansion,/registerArchetype\('insects'/);
for(const key of ['volcanicHeat','nuclearWinter','unstableTyphoon','endlessOcean','tremblingEarth'])assert.match(expansion,new RegExp(`${key}:\\{[^\\n]+undrawable:true`),`${key} não deve entrar na pilha de compra`);
assert.match(core,/effects\[effectKey\]\?\.undrawable/,'o construtor da pilha deve remover Arenas que só são invocadas');
assert.match(insects,/kind:effect\.calamityTarget/,'a transformação precisa atualizar a identidade interna do peão');
assert.doesNotMatch(insects,/p\.effectDeck\.includes\(key\)/,'Mal preságio não deve comprar as Arenas invocadas');
assert.match(expansion,/if\(!card\?\.fusion\|\|card\.calamityFrom\)return''/,'peões calamitosos não devem mostrar materiais necessários');
assert.match(styles,/\.deck-choice\[data-deck=insects\]\{--deck-color:#34373d/,'somente a seleção do deck deve usar cinza escuro');
assert.match(styles,/--arc-insects-bg:#eee8dc/,'cartas e peões normais do arquétipo devem continuar claros');
for(const kind of ['volcanicLadybug','radiantCockroach','stormButterfly','vastAnt','ruinCentipede'])assert.match(styles,new RegExp(`unit-card\\[data-deck=insects\\]\\.kind-${kind}\\{--calamity-card:`),`detalhes sem cor própria: ${kind}`);

const transformContext={
 effects:{calamityHurricane:{name:'Calamidade: Furacão',equipOnly:'direCaterpillar',calamityTarget:'stormButterfly'}},
 defs:{stormButterfly:{name:'Borboleta Calamitosa',atk:50,movement:[[0,1]],types:['INSETO','AR'],glyph:'B',fusion:1,text:'Arena Tufão'}},
 log(){}
};
vm.createContext(transformContext);
vm.runInContext(insects.slice(insects.indexOf('function transformCalamity'),insects.indexOf('function nuclearWasteAt')),transformContext);
const caterpillar={kind:'direCaterpillar',name:'Lagarta Funesta',atk:100,movement:[[1,0]],types:['INSETO'],baseTypes:['INSETO'],glyph:'L',text:'Original',owner:1,id:'bug',row:3,col:2,origin:{row:1,col:2},equipment:[]};
assert.equal(transformContext.transformCalamity(caterpillar,'calamityHurricane'),true);
assert.equal(caterpillar.kind,'stormButterfly','a Borboleta transformada deve disparar suas próprias habilidades');
assert.deepEqual(Array.from(caterpillar.equipment),['calamityHurricane']);
caterpillar.equipment=[];
assert.equal(transformContext.revertCalamity(caterpillar),true);
assert.equal(caterpillar.kind,'direCaterpillar','ao perder a Calamidade, a Borboleta deve voltar a ser Lagarta');
assert.match(expansion,/delete archetypes\.celestial/);
assert.doesNotMatch(html,/data-deck="celestial"/);
assert.equal((html.match(/data-deck="insects"/g)||[]).length,2);
assert.match(insects,/previous===key[^\n]+as duas Arenas se anularam/);
assert.match(ui,/applyArenaState\(key,player\)/);
assert.match(expansion,/flameTemple:[^\n]+6 turnos/);
assert.match(styles,/\.cell\.flame-temple-range::after\{background:#bd241c35/);
assert.match(network,/packet\.type==='rematch-ready'/);
assert.match(network,/state\.matchId!==previousMatchId\)resetRematchState/);
assert.match(schema,/egyptian','insects'/);
assert.match(migration,/migration-222-insects|insects/i);

const newIcons=['algae','amber-mosquito','ant','big-wave','bird-cage','butterfly','caterpillar','centipede','death-note','earth-crack','earth-spit','fire-zone','ladybug','long-antennae-bug','mushroom-cloud','nuclear','stomp-tornado','tornado','volcano'];
for(const name of newIcons){const svg=fs.readFileSync(path.join(root,'assets','icons',`${name}.svg`),'utf8');assert.doesNotMatch(svg,/<path\s+d="M0 0h512v512H0z"/i,`${name}.svg ainda possui fundo sólido`);assert.match(svg,/<svg\b/i,`${name}.svg inválido`)}

console.log('Insetos Calamitosos, Arenas e ícones transparentes tests passed');
