const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.chdir(__dirname);

const expansion=fs.readFileSync('engine-expansion.js','utf8');
const gold=fs.readFileSync('engine-gold.js','utf8');
const actionsA=fs.readFileSync('engine-actions-a.js','utf8');
const actionsB=fs.readFileSync('engine-actions-b.js','utf8');
const core=fs.readFileSync('engine-core.js','utf8');
const ui=fs.readFileSync('engine-ui.js','utf8');
const page=fs.readFileSync('index.html','utf8');
const styles=['styles-core.css','styles-game.css','styles-responsive.css'].map(file=>fs.readFileSync(file,'utf8')).join('\n');

for(const pawn of ['goldWorshipper','goldGoblin','goldPriest','goldBlacksmith','goldGolem','goldDragon'])assert.match(expansion,new RegExp(`${pawn}:\\{`),`Peão Era Dourada ausente: ${pawn}`);
for(const effect of ['goldenAge','goldArmor','richer','gild','allOrNothing'])assert.match(expansion,new RegExp(`${effect}:\\{`),`Efeito Era Dourada ausente: ${effect}`);
for(const icon of ['tarot-17-the-star','goblin','sun-priest','blacksmith','rock-golem','wyvern','gold-stack','abdominal-armor','coins-pile','gold-nuggets','slot-machine']){
 assert.ok(fs.existsSync(`assets/icons/${icon}.svg`),`Ícone dourado ausente: ${icon}`);
 assert.doesNotMatch(fs.readFileSync(`assets/icons/${icon}.svg`,'utf8'),/<path d="M0 0h512v512H0z"\/>/,`Ícone ${icon} não pode ter fundo sólido`);
}
assert.match(page,/data-deck="gold"/);
assert.match(page,/engine-gold\.js\?v=1/);
assert.match(styles,/deck-gold/);
assert.match(styles,/data-arena=goldenAge/);

const helperContext={state:{arena:null,goldDefeatedCount:0},hasEffect:(u,key)=>u.kind===key,allUnits:()=>[],inMovementRadius:()=>false,effectiveAtk:u=>u.atk+(u.bonusAtk||0),log:()=>{}};
vm.createContext(helperContext);
for(const name of ['isGoldUnit','materialMatchesRequirement','reduceGoldAttack','consumeGoldArmor','transferGoldAttack','gildUnit','resolveAllOrNothing'])vm.runInContext(gold.match(new RegExp(`function ${name}\\([^\\n]+`))[0],helperContext);
const combined={kind:'goldGolem',types:['OURO'],fusion:2},normal={kind:'goldGoblin',types:['OURO']};
assert.equal(helperContext.materialMatchesRequirement(combined,{type:'OURO',combined:true}),true);
assert.equal(helperContext.materialMatchesRequirement(normal,{type:'OURO',combined:true}),false);
assert.equal(helperContext.materialMatchesRequirement(normal,{type:'OURO',normal:true}),true);
const worshipper={kind:'goldWorshipper',types:['OURO'],atk:250,bonusAtk:0};
assert.equal(helperContext.reduceGoldAttack(worshipper,100),0,'Adorador não pode perder ATK');
const goldPawn={kind:'goldGoblin',types:['OURO'],atk:100,bonusAtk:0};
assert.equal(helperContext.reduceGoldAttack(goldPawn,100),100);
assert.equal(goldPawn.bonusAtk,-100);
const richA={id:'a',kind:'goldGoblin',types:['OURO'],atk:100,bonusAtk:0},richB={id:'b',kind:'goldPriest',types:['OURO'],atk:200,bonusAtk:0};
assert.equal(helperContext.transferGoldAttack(richA,richB),true);
assert.equal(richA.atk,0);
assert.equal(richB.atk,300);
const gilded={types:['PEDRA'],baseTypes:['PEDRA']};
helperContext.gildUnit(gilded);
assert.deepEqual(Array.from(gilded.types),['PEDRA','OURO']);
const armorBearer={equipment:['goldArmor']};
assert.equal(helperContext.consumeGoldArmor(armorBearer),true);
assert.deepEqual(armorBearer.equipment,[]);
helperContext.allUnits=()=>[worshipper,{kind:'goldGoblin',types:['OURO'],atk:100,bonusAtk:0}];
const jackpot={kind:'tower',types:['PEDRA'],atk:150,bonusAtk:0};
assert.equal(helperContext.resolveAllOrNothing(jackpot),100,'Adorador não deve contribuir ATK por ser imune à redução');
assert.equal(jackpot.bonusAtk,100);

const suppression={state:{arena:'goldenAge'}};
vm.createContext(suppression);
vm.runInContext(actionsA.match(/function hasEffect\([^\n]+/)[0],suppression);
assert.equal(suppression.hasEffect({kind:'duck',types:['NATURAL']},'duck'),false);
assert.equal(suppression.hasEffect({kind:'goldGoblin',types:['OURO']},'goldGoblin'),true);
assert.match(core,/equipment\?\.includes\('goldArmor'\).*\[\[-1,0\],\[0,-1\],\[0,1\],\[1,0\]\]/);
assert.match(actionsB,/consumeGoldArmor\(u\)/);
assert.match(actionsB,/resolveGoldenGoblin\(defender,attacker\)/);
assert.match(actionsB,/goldDefeatedCount/);
assert.match(actionsB,/hasEffect\(u,'goldDragon'\)/);
assert.match(actionsB,/goldUnitHasReducedAttack\(u\)&&allUnits\(\)\.some\(priest=>priest\.row!==null&&hasEffect\(priest,'goldPriest'\)\)\)atk\*=2/,'Sacerdote deve dobrar o Peão Ouro que teve ATK reduzido');
assert.doesNotMatch(actionsB,/hasEffect\(u,'goldPriest'\)&&allUnits\(\)\.some\(goldUnitHasReducedAttack\)/,'Sacerdote não deve dobrar o próprio ATK apenas porque outro peão foi reduzido');
assert.match(ui,/transferGoldAttack\(pendingAbilityTarget,u\)/);
assert.match(ui,/resolveAllOrNothing\(u\)/);
assert.match(ui,/gildUnit\(u\)/);

console.log('Era Dourada tests passed');
