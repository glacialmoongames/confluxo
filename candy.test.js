const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const core = fs.readFileSync('engine-core.js','utf8');
const actions = fs.readFileSync('engine-actions-b.js','utf8');
const runtime = fs.readFileSync('engine-expansion-runtime.js','utf8');
const ui = fs.readFileSync('engine-ui.js','utf8');
const celestial = fs.readFileSync('engine-celestial.js','utf8');
const boardRenderer = fs.readFileSync('engine-actions-a.js','utf8');
const responsiveStyles = fs.readFileSync('styles-responsive.css','utf8');
assert.match(fs.readFileSync('engine-expansion.js','utf8'),/cookieDemon:\{name:'Demônio Biscoito'[^\n]+fusion:4,materials:\{type:'DOCE'\}/,'Demônio Biscoito deve exigir 4 Peões DOCE');

const conversionContext = {
  state:{current:1,players:{1:{name:'Doce',units:[]},2:{name:'Rival',units:[]}}},
  hasEffect:(unit,kind)=>unit.kind===kind,
  log:()=>{}
};
const zombie={id:'z',kind:'candyZombie',owner:1,row:null,col:null,types:['DOCE','ZUMBI']};
const killer={id:'k',kind:'tower',owner:2,row:3,col:2,types:['PEDRA'],baseTypes:['PEDRA']};
conversionContext.state.players[2].units.push(killer);
vm.createContext(conversionContext);
vm.runInContext(runtime.match(/function resolveCandyZombieConversion\([^\n]+/)[0],conversionContext);
assert.equal(conversionContext.resolveCandyZombieConversion(zombie,killer),true);
assert.equal(killer.owner,1);
assert.deepEqual(Array.from(killer.types),['PEDRA','DOCE','ZUMBI']);
assert.equal(killer.candyConverted,true,'a conversão do Zombie deve permanecer marcada para efeitos DOCE');
assert.equal(conversionContext.state.players[1].units[0],killer);

const werewolfContext={
  allUnits:()=>[],
  isSweetUnit:unit=>unit.candyConverted===true||unit.types.includes('DOCE'),
  hasEffect:(unit,kind)=>unit.kind===kind,
  hasEquipment:()=>false,
  isCelestialUnit:()=>false,
  effectContact:()=>false,
  inMovementRadius:()=>false,
  state:{players:{1:{units:[]},2:{units:[]}}}
};
const werewolf={id:'w',kind:'iceWerewolf',owner:1,atk:100,bonusAtk:0,types:['DOCE']};
const sweet={id:'s',kind:'tower',owner:1,atk:350,bonusAtk:50,types:['PEDRA'],candyConverted:true};
werewolfContext.allUnits=()=>[werewolf,sweet];
vm.createContext(werewolfContext);
vm.runInContext(actions.match(/function effectiveAtk\([^\n]+/)[0],werewolfContext);
assert.equal(werewolfContext.effectiveAtk(werewolf,false),500);
assert.match(runtime,/u\.candyConverted===true\|\|u\.types\?\.includes\('DOCE'\)/,'Peões convertidos precisam contar como DOCE para o Lobisomem');

const quindimContext={hasEffect:(unit,kind)=>unit.kind===kind,log:()=>{}};
vm.createContext(quindimContext);
vm.runInContext(actions.match(/function rewardQuindimKill\([^\n]+/)[0],quindimContext);
const count={name:'Conde Quindim',kind:'quindimCount',fusion:2,pointValue:2,bonusAtk:0};
assert.equal(quindimContext.rewardQuindimKill(count,300),true);
assert.equal(count.bonusAtk,300,'Conde Quindim deve absorver o ATK do derrotado');
assert.equal(count.pointValue,3,'a primeira derrota deve aumentar em um o valor do Conde');
quindimContext.rewardQuindimKill(count,150);
assert.equal(count.bonusAtk,450);
assert.equal(count.pointValue,4,'cada nova derrota deve somar outro ponto ao valor do Conde');

const skeletonSpawnContext={
  state:{players:{1:{name:'Doce',units:[]},2:{name:'Rival',units:[]}}},
  at:()=>null,
  unit:(kind,owner)=>({id:'new-skeleton',kind,owner,row:null,col:null}),
  place:(unit,row,col)=>{unit.row=row;unit.col=col},
  boardCoordinate:()=> 'C4',
  log:()=>{}
};
vm.createContext(skeletonSpawnContext);
vm.runInContext(runtime.match(/function spawnChocolateSkeleton\([^\n]+/)[0],skeletonSpawnContext);
assert.equal(skeletonSpawnContext.spawnChocolateSkeleton(1,{row:3,col:2}),true);
assert.equal(skeletonSpawnContext.state.players[1].units[0].kind,'chocolateSkeleton');
assert.deepEqual({row:skeletonSpawnContext.state.players[1].units[0].row,col:skeletonSpawnContext.state.players[1].units[0].col},{row:3,col:2},'o Esqueleto deve surgir na casa do combinado destruído');

const deployContext={
  ROWS:8,COLS:6,
  state:{arena:null,players:{1:{units:[{row:5,col:2,kind:'jellyWitch'}]},2:{units:[]}}},
  hasEffect:(unit,kind)=>unit.kind===kind,
  at:()=>null,obstacleAt:()=>null,pitAt:()=>null,Map
};
vm.createContext(deployContext);
vm.runInContext(core.match(/function mausoleumEdge\([^\n]+/)[0],deployContext);
vm.runInContext(core.match(/function mausoleumAreaContains\([^\n]+/)[0],deployContext);
vm.runInContext(core.match(/function deploymentTargetsFor\([^\n]+/)[0],deployContext);
let deployTargets=deployContext.deploymentTargetsFor(1);
assert.ok(deployTargets.some(cell=>cell.r===4&&cell.c===2),'Bruxa deve permitir colocação em contato fora do polo');
deployContext.state.arena='mausoleum';
deployContext.state.arenaOwner=1;
deployTargets=deployContext.deploymentTargetsFor(1);
assert.ok(deployTargets.some(cell=>cell.r===5&&cell.c===0),'Mausoléu deve expandir a área até o peão mais avançado');
assert.equal(deployContext.mausoleumAreaContains(1,5),true,'a linha expandida deve fazer parte da área visual do Mausoléu');
assert.equal(deployContext.mausoleumAreaContains(1,4),false,'linhas além do peão mais avançado não devem receber o efeito');

assert.match(actions,/state\.graveyard/,'peões normais destruídos precisam entrar no cemitério');
assert.match(actions,/spawnRecipeZombie\(recipeOwner,death\)/,'Receita de Doce precisa criar o Zombie Bombom');
assert.match(ui,/k==='candyRebuild'/);
assert.match(ui,/k==='trickTreat'/);
assert.match(ui,/key==='candyRecipe'/);
assert.match(runtime,/hasEffect\(ghost,'gumGhost'\)/);
assert.match(runtime,/hasEffect\(u,'cookieDemon'\)/);
assert.match(actions,/if\(defeated\)rewardQuindimKill\(attacker,defAtk\)/,'o Conde atacante deve progredir ao derrotar');
assert.match(actions,/if\(defeated\)rewardQuindimKill\(defender,attackerPower\)/,'o Conde defensor deve progredir ao derrotar');
assert.match(actions,/chocolateOwner=u\.fusion\?allUnits\(\)\.find/,'somente um Peão Combinado destruído deve ativar o Esqueleto');
assert.match(actions,/if\(chocolateOwner\)spawnChocolateSkeleton\(chocolateOwner,death\)/);
assert.doesNotMatch(celestial,/hasEffect\(v,'chocolateSkeleton'\)/,'Esqueleto Chocolate não deve mais impedir movimento');
assert.doesNotMatch(runtime,/chocolateSkeletonTurns/,'o efeito antigo de contagem deve ser removido');
assert.match(boardRenderer,/mausoleumAreaContains\(state\.arenaOwner,r\)\?' mausoleum-effect'/,'a área afetada pelo Mausoléu deve ser marcada visualmente');
assert.match(responsiveStyles,/board\[data-arena=mausoleum\] \.cell\.light/,'o Mausoléu deve aplicar o tema rosa-claro à Arena');
assert.match(responsiveStyles,/\.cell\.mausoleum-effect/,'as casas afetadas pelo Mausoléu precisam de destaque próprio');
assert.match(runtime,/classList\.toggle\('mausoleum-zone-p1',mausoleumAreaContains\(1,row\)\)/,'a área expandida do J1 deve ser marcada independentemente do dono da Arena');
assert.match(runtime,/classList\.toggle\('mausoleum-zone-p2',mausoleumAreaContains\(2,row\)\)/,'a área expandida do J2 deve ser marcada independentemente do dono da Arena');
assert.match(responsiveStyles,/\.board\[data-p1=gold\]\{--p1-zone:var\(--arc-gold-bg\);--p1-zone-edge:var\(--arc-gold-border\)\}/,'a zona expandida de Era Dourada deve reutilizar a identidade dourada');

console.log('Mortos Doces tests passed');
