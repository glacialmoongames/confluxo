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
renderCard=function(){explainBaseRenderCard();const u=detailSelectedUnit();if(!u||detailSelectedEffect())return;const box=document.querySelector('#unit-card .statline');if(!box)return;const data=attackExplanation(u);box.insertAdjacentHTML('afterend',`<details class="attack-explanation"><summary>${combatText('Como chegou a este ATK?','How is this ATK calculated?')}</summary>${data.rows.map((row,i)=>`<div><span>${escapeLogText(row.label)}</span><b>${i&&row.value>0?'+':''}${row.value}</b></div>`).join('')}<div><strong>${combatText('ATK atual','Current ATK')}</strong><b>${data.total}</b></div><small>${combatText('O saldo reúne efeitos que somam, reduzem ou substituem o ataque. Valores podem mudar durante o combate.','The net includes effects that add, reduce or replace attack. Values may change during combat.')}</small></details>`)};
function combatPreviewData(attacker,defender){
 const arena=calamityArenaFromAttack(attacker)||state.arena,trembling=arena==='tremblingEarth';
 const unique=list=>[...new Map(list.map(u=>[u.id,u])).values()];
 const nearby=trembling?allUnits().filter(u=>u.row!==null&&inMovementRadius(attacker,u)):[];
 const attackers=unique([attacker,...(trembling?nearby.filter(u=>u.owner===attacker.owner):state.players[attacker.owner].units.filter(u=>u.id!==attacker.id&&u.row!==null&&adjacent(u,defender)))]);
 const defenders=unique([defender,...(trembling?nearby.filter(u=>u.owner===defender.owner):[])]);
 let attack=trembling?attackers.reduce((s,u)=>s+effectiveAtk(u,false),0):egyptianJointAttack(attackers)??attackers.reduce((s,u)=>s+effectiveAtk(u,false),0);
 const infantry=!trembling&&attackers.length>1&&attackers.some(u=>hasEffect(u,'infantry'))?Math.max(...attackers.map(u=>effectiveAtk(u,false))):0;attack+=infantry;
 const defense=defenders.reduce((s,u)=>s+effectiveAtk(u,true),0);
 return{attackers,defenders,attack,defense,infantry,arena,changing:arena!==state.arena||state.arena==='volcanicHeat'};
}
const combatPreviewDialog=document.createElement('dialog');combatPreviewDialog.className='combat-preview-dialog';document.body.append(combatPreviewDialog);
const explainBaseDoAttack=doAttack;
doAttack=function(attacker,defender){
 if(botControls(state.current))return explainBaseDoAttack(attacker,defender);
 if(!canLocalAct()||state.animating||!attacker||!defender||!own(attacker)||!canUnitAttack(attacker)||attacksLocked(attacker.owner)||defender.owner===attacker.owner||!canAttackTarget(attacker,defender))return;
 if(combatPreviewDialog.open)return;
 const preview=combatPreviewData(attacker,defender),matchId=state.matchId,turn=state.turn,version=gameVersion;
 const members=(units,defending)=>units.map(u=>`<li><span>${escapeLogText(u.name)} <small>${boardCoordinate(u.row,u.col)}</small></span><b>${effectiveAtk(u,defending)} ATK</b></li>`).join('');
 const sources=allUnits().filter(u=>u.row!==null&&[...preview.attackers,...preview.defenders].some(v=>v.id===u.id||effectContact(u,v)||inMovementRadius(u,v)));
 combatPreviewDialog.innerHTML=`<h2>${combatText('Conferir combate','Review combat')}</h2><h3>${combatText('Atacantes','Attackers')}</h3><ul>${members(preview.attackers,false)}</ul>${preview.infantry?`<p>${escapeLogText(defs.infantry.name)}: +${preview.infantry} ATK</p>`:''}<h3>${combatText('Defesa','Defense')}</h3><ul>${members(preview.defenders,true)}</ul><p class="combat-comparison">${preview.attack} × ${preview.defense}</p><p>${preview.changing?combatText('A arena muda ou altera o ATK ao atacar. Estes são os valores antes da ativação.','The arena changes or modifies ATK on attack. These are values before activation.'):combatText('Comparação de ATK atual; proteções e efeitos podem mudar quem sobrevive.','Current ATK comparison; protection and effects may change who survives.')}</p><details><summary>${combatText('Efeitos dos participantes e peões próximos','Effects of participants and nearby pawns')}</summary>${sources.map(u=>`<p><b>${escapeLogText(u.name)}</b><br>${escapeLogText(u.text||'')}${(u.equipment||[]).map(k=>`<br><b>${escapeLogText(effects[k]?.name||k)}</b>: ${escapeLogText(effects[k]?.text||'')}`).join('')}</p>`).join('')}${preview.arena?`<p><b>${escapeLogText(effects[preview.arena].name)}</b><br>${escapeLogText(effects[preview.arena].text)}</p>`:''}</details><p><small>${combatText('Somente o atacante selecionado gasta seu ataque. Confira as exceções nas cartas.','Only the selected attacker spends its attack. Check card effects for exceptions.')}</small></p><div class="combat-preview-actions"><button data-cancel>${combatText('Cancelar','Cancel')}</button><button data-confirm>${combatText('ATACAR','ATTACK')}</button></div>`;
 combatPreviewDialog.querySelector('[data-cancel]').onclick=()=>combatPreviewDialog.close();
 combatPreviewDialog.querySelector('[data-confirm]').onclick=()=>{combatPreviewDialog.close();if(version!==gameVersion||matchId!==state?.matchId||turn!==state.turn||state.animating||!canLocalAct())return;const current=allUnits(),a=current.find(u=>u.id===attacker.id),d=current.find(u=>u.id===defender.id);if(!a||!d||!own(a)||!canUnitAttack(a)||attacksLocked(a.owner)||!canAttackTarget(a,d))return;explainBaseDoAttack(a,d)};
 combatPreviewDialog.showModal();
};
const explainBaseDestroy=destroy;
destroy=function(u,scorer,reason='combate'){
 const present=u&&state.players[u.owner]?.units.some(v=>v.id===u.id);if(!present)return explainBaseDestroy(u,scorer,reason);
 const name=u.name,kind=u.kind,equipment=[...(u.equipment||[])],mounted=u.mounted,coordinate=boardCoordinate(u.row,u.col),before={1:state.players[1].score,2:state.players[2].score};
 const removed=explainBaseDestroy(u,scorer,reason);
 if(removed){const gains=[1,2].map(owner=>({name:state.players[owner].name,points:state.players[owner].score-before[owner]})).filter(g=>g.points>0);log(`${name} (${coordinate}) — ${combatText('destruído por','destroyed by')} ${reason}. ${combatText('Pontos nesta resolução','Points in this resolution')}: ${gains.length?gains.map(g=>`${g.name}: +${g.points}`).join(' · '):'0'}`,'combat')}
 else if(kind!==u.kind||mounted!==u.mounted||equipment.length!==(u.equipment||[]).length){log(`${name} (${coordinate}) — ${combatText('permaneceu em campo após','remained on the board after')} ${reason}. ${kind!==u.kind?u.name:equipment.filter(key=>!u.equipment.includes(key)).map(key=>effects[key]?.name||key).join(', ')||combatText('Montador destruído','Rider destroyed')}`,'effect')}
 return removed;
};
