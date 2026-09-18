/* Read-only explanations: combat continues through the existing rule engine. */
function combatText(pt,en){return document.documentElement.lang.startsWith('en')?en:pt}
function attackExplanation(u){
 const total=effectiveAtk(u,false),rows=[{label:combatText('ATK base atual','Current base ATK'),value:u.atk}];
 if(u.bonusAtk)rows.push({label:combatText('Bônus e perdas acumulados','Accumulated bonuses and losses'),value:u.bonusAtk});
 const fixed={moon:100,eyes:400,goldArmor:500,camouflagedVest:100};
 for(const key of u.equipment||[]){const value=effects[key]?.atkBonus??fixed[key];if(value)rows.push({label:effects[key].name,value})}
 if(u.mounted)rows.push({label:defs[u.mounted].name,value:defs[u.mounted].atk});
 const residual=total-rows.reduce((sum,row)=>sum+row.value,0);
 if(residual)rows.push({label:combatText('Habilidades, auras e arena (saldo)','Abilities, auras and arena (net)'),value:residual});
 return{total,rows};
}
const explainBaseRenderCard=renderCard;
renderCard=function(){explainBaseRenderCard();const u=detailSelectedUnit();if(!u||detailSelectedEffect())return;const box=document.querySelector('#unit-card .statline');if(!box)return;const data=attackExplanation(u);box.insertAdjacentHTML('afterend',`<details class="attack-explanation"><summary>${combatText('Como chegou a este ATK?','How is this ATK calculated?')}</summary>${data.rows.map((row,i)=>`<div><span>${escapeLogText(row.label)}</span><b>${i&&row.value>0?'+':''}${row.value}</b></div>`).join('')}<div><strong>${combatText('ATK atual','Current ATK')}</strong><b>${data.total}</b></div></details>`)};
function combatPreviewData(attacker,defender){
 const arena=calamityArenaFromAttack(attacker)||state.arena,trembling=arena==='tremblingEarth';
 const unique=list=>[...new Map(list.map(u=>[u.id,u])).values()];
 const nearby=trembling?allUnits().filter(u=>u.row!==null&&inMovementRadius(attacker,u)):[];
 const attackers=unique([attacker,...(trembling?nearby.filter(u=>u.owner===attacker.owner):state.players[attacker.owner].units.filter(u=>u.id!==attacker.id&&u.row!==null&&adjacent(u,defender)))]);
 const defenders=unique([defender,...(trembling?nearby.filter(u=>u.owner===defender.owner):[])]);
 let attack=trembling?attackers.reduce((s,u)=>s+effectiveAtk(u,false),0):egyptianJointAttack(attackers)??attackers.reduce((s,u)=>s+effectiveAtk(u,false),0);
 const infantry=!trembling&&attackers.length>1&&attackers.some(u=>hasEffect(u,'infantry'))?Math.max(...attackers.map(u=>effectiveAtk(u,false))):0;attack+=infantry;
 const defense=defenders.reduce((s,u)=>s+effectiveAtk(u,true),0);
 return{attackers,defenders,attackerValues:attackers.map(u=>({name:u.name,atk:effectiveAtk(u,false)})),defenderValues:defenders.map(u=>({name:u.name,atk:effectiveAtk(u,true)})),attack,defense,infantry,arena,changing:arena!==state.arena||state.arena==='volcanicHeat'};
}
const explainBaseDoAttack=doAttack;
let pendingCombatExplanation=null;
doAttack=function(attacker,defender){
 if(attacker&&defender&&attacker.row!==null&&defender.row!==null){try{pendingCombatExplanation=combatPreviewData(attacker,defender)}catch(_){pendingCombatExplanation=null}}
 const result=explainBaseDoAttack(attacker,defender);
 if(!state?.animating)pendingCombatExplanation=null;
 return result;
};
function combatSideText(values){return values.map(item=>`${item.name} ${item.atk} ATK`).join(' + ')}
const explainBaseLogCombatResult=logCombatResult;
logCombatResult=function(message,before){
 const preview=pendingCombatExplanation;pendingCombatExplanation=null;
 if(preview){
  const infantry=preview.infantry?` + ${defs.infantry.name} ${preview.infantry} ATK`:'';
  const arena=preview.arena&&effects[preview.arena]?` · ${combatText('Arena','Arena')}: ${effects[preview.arena].name}`:'';
  const breakdown=`${combatText('Combate','Combat')}: ${combatSideText(preview.attackerValues)}${infantry} = ${preview.attack} ATK ${combatText('contra','vs')} ${combatSideText(preview.defenderValues)} = ${preview.defense} ATK${arena}`;
  const outcome=String(message).replace(/\s*\(\d+\s*×\s*\d+\)/g,'').replace(/^\s+|\s+$/g,'');
  message=`${breakdown}. ${outcome}`;
 }
 return explainBaseLogCombatResult(message,before);
};
