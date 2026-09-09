const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.chdir(__dirname);

const page=fs.readFileSync('index.html','utf8');
const expansion=fs.readFileSync('engine-expansion.js','utf8');
const egypt=fs.readFileSync('engine-egypt.js','utf8');
const actions=fs.readFileSync('engine-actions-b.js','utf8');
const styles=fs.readFileSync('styles-responsive.css','utf8');
const migration=fs.readFileSync('supabase/migration-212-egyptian-flames.sql','utf8');

for(const key of ['fireScarab','fireSlave','firePrince','grayMummy','ammit','anubis','ra'])assert.match(expansion,new RegExp(`${key}:\\{`));
for(const key of ['burningDesert','emberMummify','flameTemple','quickHands'])assert.match(expansion,new RegExp(`${key}:\\{`));
assert.match(page,/data-deck="egyptian"/);
assert.match(page,/engine-egypt\.js\?v=1/);
assert.match(page,/VERSÃO 212/);
assert.match(styles,/\.board\[data-arena=burningDesert\] \.cell\.light\{background:#a84c18\}/);
assert.match(styles,/\.board\[data-arena=burningDesert\] \.cell\.dark\{background:#612509\}/);
assert.match(styles,/\.cell\.flame-temple-range::after/);
assert.match(actions,/!u\.attachedTo&&attacksUsedThisTurn/);
assert.match(expansion,/repugnium:\{[^\n]+movement:\[\[-2,-1\],\[-2,1\]/);
assert.match(expansion,/perdem 150 ATK/);
assert.match(migration,/'egyptian'/);

const context={state:{fireTemples:[{row:3,col:2}]}};
vm.createContext(context);
vm.runInContext(`${egypt.match(/const FLAME_TEMPLE_RANGE[^;]+;/)[0]}\n${egypt.match(/function inFlameTempleRange[^\n]+/)[0]}\nthis.inRange=inFlameTempleRange`,context);
assert.equal(context.inRange(context.state.fireTemples[0],{row:0,col:2}),true);
assert.equal(context.inRange(context.state.fireTemples[0],{row:0,col:0}),false);

const quickMessages=[];
const quickContext={effects:{quickHands:{name:'Mãos Rápidas'},pit:{name:'Poço sem Fundo'}},state:{players:{1:{name:'J1',hand:['quickHands']},2:{name:'J2',hand:['pit']}}},messages:quickMessages,log(message){quickMessages.push(message)}};
vm.createContext(quickContext);
vm.runInContext(`${egypt.match(/function resolveQuickHands[^\n]+/)[0]}\nthis.play=resolveQuickHands`,quickContext);
quickContext.play(1,0);
assert.deepEqual([...quickContext.state.players[1].hand],['pit']);
assert.deepEqual([...quickContext.state.players[2].hand],[]);
quickContext.state.players[1].hand=['quickHands'];
quickContext.play(1,0);
assert.equal(quickContext.state.players[2].effectLockPending,true);

console.log('Egyptian Flames tests passed');
