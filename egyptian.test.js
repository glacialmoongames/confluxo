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
assert.match(page,/engine-egypt\.js\?v=2/);
assert.match(page,/VERSÃO 219/);
assert.match(page,/data-deck="egyptian"><img src="assets\/icons\/hills\.svg\?v=2"/);
assert.match(expansion,/registerArchetype\('egyptian',\{[^\n]+emblemArt:icon\('hills'\)/);
for(const icon of ['anubis','bandaged','card-pickup','egyptian-profile','great-pyramid','hills','horus','mummy-head','scarab-beetle','slavery-whip','soul'])assert.doesNotMatch(fs.readFileSync(`assets/icons/${icon}.svg`,'utf8'),/<path d="M0 0h512v512H0z"\/>/,`${icon} deve ter fundo transparente`);
assert.match(expansion,/grayMummy:\{[^\n]+ao final do turno/);
assert.match(expansion,/ra:\{[^\n]+não pode se tornar Múmia Cinzenta/);
assert.match(egypt,/u\.kind==='ra'/);
assert.match(egypt,/u\.mummyTransformPending=true/);
assert.match(egypt,/u\.row!==null&&u\.mummyTransformPending/);
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

const mummyMessages=[];
const mummyContext={defs:{grayMummy:{name:'Múmia Cinzenta',atk:150,movement:[],types:['FOGO','ZUMBI'],glyph:'☠'}},log(message){mummyMessages.push(message)},hasEffect:(unit,key)=>unit.kind===key};
vm.createContext(mummyContext);
vm.runInContext(`${egypt.match(/function transformIntoGrayMummy[^\n]+/)[0]}\n${egypt.match(/function prepareMummyCombat[^\n]+/)[0]}\nthis.transform=transformIntoGrayMummy;this.prepare=prepareMummyCombat`,mummyContext);
const mummy={kind:'grayMummy',row:2},ally={kind:'fireSlave',row:2},ra={kind:'ra',row:2},defender={kind:'firePrince',row:3};
mummyContext.prepare([mummy,ally,ra],defender);
assert.equal(ally.kind,'fireSlave','o combate deve ser resolvido antes da transformação');
assert.equal(ally.mummyTransformPending,true);
assert.equal(defender.mummyTransformPending,true);
assert.equal(ra.mummyTransformPending,undefined,'Rá não deve ser marcado para virar Múmia');
assert.equal(mummyContext.transform(ra),false,'Rá é imune a qualquer transformação em Múmia Cinzenta');

console.log('Egyptian Flames tests passed');
