const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const core = fs.readFileSync('engine-core.js','utf8');
const actions = fs.readFileSync('engine-actions-b.js','utf8');
const runtime = fs.readFileSync('engine-expansion-runtime.js','utf8');
const ui = fs.readFileSync('engine-ui.js','utf8');

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
assert.equal(conversionContext.state.players[1].units[0],killer);

const werewolfContext={
  allUnits:()=>[],
  isSweetUnit:unit=>unit.types.includes('DOCE'),
  hasEffect:(unit,kind)=>unit.kind===kind,
  hasEquipment:()=>false,
  isCelestialUnit:()=>false,
  effectContact:()=>false,
  inMovementRadius:()=>false,
  state:{players:{1:{units:[]},2:{units:[]}}}
};
const werewolf={id:'w',kind:'iceWerewolf',owner:1,atk:100,bonusAtk:0,types:['DOCE']};
const sweet={id:'s',kind:'candyZombie',owner:1,atk:350,bonusAtk:50,types:['DOCE']};
werewolfContext.allUnits=()=>[werewolf,sweet];
vm.createContext(werewolfContext);
vm.runInContext(actions.match(/function effectiveAtk\([^\n]+/)[0],werewolfContext);
assert.equal(werewolfContext.effectiveAtk(werewolf,false),500);

const deployContext={
  ROWS:8,COLS:6,
  state:{arena:null,players:{1:{units:[{row:5,col:2,kind:'jellyWitch'}]},2:{units:[]}}},
  hasEffect:(unit,kind)=>unit.kind===kind,
  at:()=>null,obstacleAt:()=>null,pitAt:()=>null,Map
};
vm.createContext(deployContext);
vm.runInContext(core.match(/function deploymentTargetsFor\([^\n]+/)[0],deployContext);
let deployTargets=deployContext.deploymentTargetsFor(1);
assert.ok(deployTargets.some(cell=>cell.r===4&&cell.c===2),'Bruxa deve permitir colocação em contato fora do polo');
deployContext.state.arena='mausoleum';
deployTargets=deployContext.deploymentTargetsFor(1);
assert.ok(deployTargets.some(cell=>cell.r===5&&cell.c===0),'Mausoléu deve expandir a área até o peão mais avançado');

assert.match(actions,/state\.graveyard/,'peões normais destruídos precisam entrar no cemitério');
assert.match(actions,/spawnRecipeZombie\(recipeOwner,death\)/,'Receita de Doce precisa criar o Zombie Bombom');
assert.match(ui,/k==='candyRebuild'/);
assert.match(ui,/k==='trickTreat'/);
assert.match(ui,/key==='candyRecipe'/);
assert.match(runtime,/hasEffect\(ghost,'gumGhost'\)/);
assert.match(runtime,/hasEffect\(u,'cookieDemon'\)/);

console.log('Mortos Doces tests passed');
