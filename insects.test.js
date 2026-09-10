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
assert.match(expansion,/radiantCockroach:\{name:'Barata Calamitosa: Radianta'[^\n]+Perde 50 ATK ao fim de cada turno até ter 100 ATK/,'o efeito de perda gradual da Radianta deve aparecer nos detalhes');
assert.match(expansion,/nuclearWinter:\{name:'Inverno Nuclear'[^\n]+por 2 turnos/,'a duração do lixo nuclear deve aparecer nos detalhes');
assert.match(insects,/type:'NUCLEAR',source:'nuclearWinter',expiresAfterStep:\(state\.insectEndStep\|\|0\)\+2/,'todo lixo criado deve receber duração de dois turnos');
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

const typhoonContext={ROWS:8,COLS:6,units:[],features:[],pits:[]};
typhoonContext.at=(r,c)=>typhoonContext.units.find(u=>u.row===r&&u.col===c);
typhoonContext.featureAt=(r,c)=>typhoonContext.features.find(feature=>feature.row===r&&feature.col===c);
typhoonContext.pitAt=(r,c)=>typhoonContext.pits.find(pit=>pit.row===r&&pit.col===c);
typhoonContext.nuclearWasteAt=(r,c)=>typhoonContext.features.find(feature=>feature.type==='NUCLEAR'&&feature.row===r&&feature.col===c);
vm.createContext(typhoonContext);
vm.runInContext(insects.slice(insects.indexOf('function typhoonHazardAt'),insects.indexOf('function resolveTyphoonPush')),typhoonContext);
let pushed={owner:1,row:2,col:3,types:['INSETO']};
assert.deepEqual({...typhoonContext.typhoonDestination(pushed)},{row:7,col:3,hazard:null},'o Tufão deve levar o peão até a última fileira livre');
typhoonContext.pits=[{row:5,col:3}];
assert.deepEqual({...typhoonContext.typhoonDestination(pushed)},{row:5,col:3,hazard:'pit'},'o peão deve cair no Poço em vez de parar antes dele');
typhoonContext.pits=[];typhoonContext.features=[{row:4,col:3,type:'NUCLEAR'}];
assert.deepEqual({...typhoonContext.typhoonDestination(pushed)},{row:4,col:3,hazard:'nuclear'},'o peão vulnerável deve cair no obstáculo mortal');
pushed.types=['RADIOATIVO'];
assert.deepEqual({...typhoonContext.typhoonDestination(pushed)},{row:3,col:3,hazard:null},'lixo nuclear deve continuar bloqueando sem matar um peão RADIOATIVO');
typhoonContext.features=[{row:4,col:3,type:'NATURAL'}];pushed.types=['INSETO'];
assert.deepEqual({...typhoonContext.typhoonDestination(pushed)},{row:3,col:3,hazard:null},'um obstáculo comum deve bloquear o empurrão');

const cageMessages=[];
const cageContext={state:{matchId:'test',turn:2,arena:'wildCage',players:{1:{name:'J1',deployed:false,score:0},2:{name:'J2',deployed:false,score:0}}}};
cageContext.awardPoints=(owner,count,message)=>{cageContext.state.players[owner].score+=count;cageMessages.push(message)};
vm.createContext(cageContext);
vm.runInContext(insects.slice(insects.indexOf('function wildCageTurnKey'),insects.indexOf('endTurn=function')),cageContext);
assert.equal(cageContext.resolveWildCagePenalty(1),true);
assert.equal(cageContext.state.players[2].score,1,'encerrar sem colocar peão deve dar exatamente 1 ponto ao adversário');
assert.equal(cageContext.resolveWildCagePenalty(1),false);
assert.equal(cageContext.state.players[2].score,1,'a penalidade não pode ser repetida no mesmo turno');
cageContext.state.turn=3;cageContext.state.players[1].deployed=true;
assert.equal(cageContext.resolveWildCagePenalty(1),false);
assert.equal(cageContext.state.players[2].score,1,'quem colocou peão não deve sofrer a penalidade');
assert.equal(cageMessages.length,1,'a penalidade deve produzir somente um registro de pontuação');

const radiantContext={effectiveAtk:u=>u.atk+(u.bonusAtk||0)+300};
vm.createContext(radiantContext);
vm.runInContext(insects.match(/function decayRadiantAttack\([^\n]+/)[0],radiantContext);
const radiant={atk:250,bonusAtk:0};
assert.equal(radiantContext.decayRadiantAttack(radiant),50);
assert.equal(radiantContext.effectiveAtk(radiant),500);
for(let turn=0;turn<12;turn++)radiantContext.decayRadiantAttack(radiant);
assert.equal(radiantContext.effectiveAtk(radiant),100,'a Radianta não pode perder ATK abaixo de 100 por seu próprio efeito');
assert.equal(radiantContext.decayRadiantAttack(radiant),0);

const wasteLogs=[];
const wasteContext={state:{insectEndStep:0,obstacles:[{row:1,col:2,type:'NUCLEAR',expiresAfterStep:2},{row:3,col:4,type:'NATURAL'}]},boardCoordinate:(row,col)=>`${col},${row}`,log:message=>wasteLogs.push(message)};
vm.createContext(wasteContext);
vm.runInContext(insects.match(/function expireNuclearWaste\([^\n]+/)[0],wasteContext);
assert.equal(wasteContext.expireNuclearWaste(),0);
assert.equal(wasteContext.state.obstacles.length,2,'o lixo deve continuar após o primeiro turno');
assert.equal(wasteContext.expireNuclearWaste(),1);
assert.deepEqual(wasteContext.state.obstacles.map(item=>item.type),['NATURAL'],'somente o lixo nuclear deve desaparecer no segundo turno');
assert.equal(wasteLogs.length,1,'a expiração deve gerar um único registro visual');

const blastContext={};
vm.createContext(blastContext);
vm.runInContext(insects.match(/function volcanicBlastScorer\([^\n]+/)[0],blastContext);
const ladybug={owner:1};
assert.equal(blastContext.volcanicBlastScorer(ladybug,{owner:2}),1,'inimigos atingidos pela erupção devem pontuar para a Joaninha');
assert.equal(blastContext.volcanicBlastScorer(ladybug,{owner:1}),2,'aliados e a própria Joaninha devem conceder pontos ao adversário');
assert.match(insects,/logCombatResult\(`A erupção de \$\{volcanicName\} destruiu/,'as vítimas e os pontos da erupção devem aparecer na crônica');
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
