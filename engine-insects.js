/* Regras de Insetos Calamitosos e transições gerais de Arena. */
const INSECT_ARENAS=['volcanicHeat','nuclearWinter','unstableTyphoon','endlessOcean','tremblingEarth'];
const CALAMITY_FOR={direLadybug:'calamityEruption',direCockroach:'calamityNuclear',direCaterpillar:'calamityHurricane',direAnt:'calamityTsunami',direCentipede:'calamityQuake'};

function clearArenaFeatures(previous){
 if(previous==='jungle')clearJungleFeatures();
 if(previous==='nuclearWinter')state.obstacles=[];
}
function recordInsectArena(owner,key){
 if(!INSECT_ARENAS.includes(key))return;
 state.insectArenasPlayed??={1:[],2:[]};let list=state.insectArenasPlayed[owner]??=[];
 if(!list.includes(key))list.push(key);state.insectArenasPlayed[owner]=list;
 state.players[owner].units.filter(u=>u.row!==null&&u.kind==='amberTragedy').forEach(u=>u.doomCounters=list.length);
 if(list.length>=5&&state.players[owner].units.some(u=>u.row!==null&&u.kind==='amberTragedy'))state.insectWinner=owner;
}
function applyArenaState(key,owner,{cancelDuplicate=true}={}){
 let previous=state.arena,xadriaPair=new Set(['roses','blackRoses']);
 if(cancelDuplicate&&previous===key){clearArenaFeatures(previous);state.arena=null;state.arenaOwner=null;state.arenaDefeatedStart=state.defeatedCount||0;log(`${effects[key].name} encontrou outra cópia e as duas Arenas se anularam.`,'arena');return null}
 clearArenaFeatures(previous);
 state.arena=xadriaPair.has(previous)&&xadriaPair.has(key)&&previous!==key?'kingdom':key;
 state.arenaOwner=owner;state.arenaDefeatedStart=state.defeatedCount||0;
 recordInsectArena(owner,key);
 if(state.arena==='abyss')allUnits().filter(u=>u.faceDown).forEach(u=>destroy(u,u.owner===1?2:1,'arena'));
 return state.arena;
}
function calamityArenaFromAttack(u){return({volcanicLadybug:'volcanicHeat',stormButterfly:'unstableTyphoon',vastAnt:'endlessOcean',ruinCentipede:'tremblingEarth'})[u?.kind]||null}
function transformCalamity(u,key){
 let effect=effects[key],target=defs[effect?.calamityTarget];if(!u||!target||u.kind!==effect.equipOnly)return false;
 let old=u.name,originKind=u.kind,origin={name:u.name,atk:u.atk,movement:[...u.movement],types:[...u.types],baseTypes:[...(u.baseTypes||u.types)],glyph:u.glyph,art:u.art,artCrop:u.artCrop,artCredit:u.artCredit,iconTone:u.iconTone,text:u.text};
 Object.assign(u,target,{kind:effect.calamityTarget,owner:u.owner,id:u.id,row:u.row,col:u.col,origin:u.origin,equipment:[...u.equipment,key],calamityOriginKind:originKind,calamityOrigin:origin,pointValue:2,types:[...target.types],baseTypes:[...target.types]});
 log(`${old} recebeu ${effect.name} e tornou-se ${target.name}.`,'combine');return true
}
function revertCalamity(u){
 if(!u?.calamityOrigin)return false;let old=u.name,origin=u.calamityOrigin;
 Object.assign(u,origin,{kind:u.calamityOriginKind,types:[...origin.types],baseTypes:[...origin.baseTypes],pointValue:1});delete u.calamityOrigin;delete u.calamityOriginKind;
 log(`${old} perdeu sua Calamidade e voltou a ser ${u.name}.`,'effect');return true
}
function nuclearWasteAt(r,c){return(state.obstacles||[]).find(item=>item.type==='NUCLEAR'&&item.row===r&&item.col===c)}
function createNuclearWaste(u){
 if(state.arena!=='nuclearWinter'||!u)return;state.obstacles??=[];
 rawMovementOffsets(u).forEach(([dr,dc])=>{let row=u.row+dr*(u.owner===2?-1:1),col=u.col+dc;if(row<0||row>=ROWS||col<0||col>=COLS||at(row,col)||pitAt(row,col)||flameTempleAt(row,col))return;if(!nuclearWasteAt(row,col))state.obstacles.push({row,col,type:'NUCLEAR',source:'nuclearWinter'})});
}
function mutantContactSpread(){
 let mutants=allUnits().filter(u=>u.row!==null&&u.types?.length===1&&u.types[0]==='MUTANTE');mutants.forEach(source=>allUnits().filter(u=>u.id!==source.id&&u.row!==null&&adjacent(source,u)&&!(u.types?.length===1&&u.types[0]==='MUTANTE')).forEach(u=>{u.types=['MUTANTE'];u.baseTypes=['MUTANTE'];log(`${u.name} tornou-se MUTANTE pelo contato.`,'effect')}));
}
function insectWaterUnit(u){return u?.types?.includes('ÁGUA')||u?.kind==='direAnt'&&allUnits().some(v=>v.owner===u.owner&&v.row!==null&&v.kind==='vastAnt')}
function decayRadiantAttack(u){let current=effectiveAtk(u,false),lost=Math.min(50,Math.max(0,current-100));if(!lost)return 0;u.bonusAtk=(u.bonusAtk||0)-lost;return lost}
function resolveInsectEndTurn(){
 allUnits().filter(u=>u.row!==null&&u.kind==='radiantCockroach').forEach(u=>{let lost=decayRadiantAttack(u);if(lost)log(`${u.name} perdeu ${lost} ATK e agora possui ${effectiveAtk(u,false)} ATK.`,'effect')});
 allUnits().filter(ruin=>ruin.row!==null&&ruin.kind==='ruinCentipede').forEach(ruin=>allUnits().filter(u=>u.owner!==ruin.owner&&u.row!==null&&inMovementRadius(ruin,u)).forEach(u=>{let lost=reduceGoldAttack(u,50);if(lost)log(`${u.name} perdeu ${lost} ATK no raio de ${ruin.name}.`,'effect')}));
 mutantContactSpread();
}
function typhoonHazardAt(u,r,c){if(pitAt(r,c))return'pit';let waste=nuclearWasteAt(r,c);return waste&&!u.types.includes('RADIOATIVO')?'nuclear':null}
function typhoonDestination(u){let dr=u.owner===1?1:-1,row=u.row,col=u.col;for(let next=row+dr;next>=0&&next<ROWS;next+=dr){if(at(next,col))break;let hazard=typhoonHazardAt(u,next,col);if(hazard)return{row:next,col,hazard};if(featureAt(next,col))break;row=next}return{row,col,hazard:null}}
function resolveTyphoonPush(){
 if(state.arena!=='unstableTyphoon')return;
 let moved=[],affected=allUnits().filter(u=>u.row!==null&&!u.types.includes('AR')).sort((a,b)=>a.owner-b.owner||(a.owner===1?b.row-a.row:a.row-b.row));affected.forEach(u=>{let destination=typhoonDestination(u);if(destination.row===u.row&&!destination.hazard)return;let name=u.name,from=boardCoordinate(u.row,u.col),to=boardCoordinate(destination.row,destination.col);u.row=destination.row;u.col=destination.col;if(destination.hazard){let reason=destination.hazard==='pit'?'poço':'lixo nuclear';destroy(u,u.owner===1?2:1,reason);moved.push(`${name}: ${from}→${to} e caiu ${destination.hazard==='pit'?'no Poço sem Fundo':'no lixo nuclear'}`)}else moved.push(`${name}: ${from}→${to}`)});if(moved.length)log(`O Tufão Instavel empurrou os peões o mais para trás possível: ${moved.join(' · ')}.`,'arena')
}
function playBadOmen(player,index){
 let p=state.players[player],available=p.units.filter(u=>u.row!==null&&CALAMITY_FOR[u.kind]).map(u=>CALAMITY_FOR[u.kind]);p.hand.splice(index,1);
 if(available.length){let key=available[Math.floor(Math.random()*available.length)];p.hand.push(key);log(`${p.name} usou Mal preságio e recebeu ${effects[key].name}.`,'effect')}
 else log(`${p.name} usou Mal preságio, mas não havia Peão Funesto compatível em campo.`,'effect')
}

const baseInsectOnUnitDeployed=onUnitDeployed;
onUnitDeployed=function(u){let result=baseInsectOnUnitDeployed(u);if(u?.kind==='amberTragedy'){let count=(state.insectArenasPlayed?.[u.owner]||[]).length;u.doomCounters=count;if(count>=5)state.insectWinner=u.owner}let waste=nuclearWasteAt(u?.row,u?.col);if(waste&&!u.types.includes('RADIOATIVO')){let name=u.name;destroy(u,u.owner===1?2:1,'lixo nuclear');log(`${name} entrou sobre lixo nuclear e foi destruído.`,'arena')}mutantContactSpread();return result};

const baseInsectEffectiveAtk=effectiveAtk;
effectiveAtk=function(u,defending,dynamicDepth=0){
 let value=baseInsectEffectiveAtk(u,defending,dynamicDepth);
 (u?.equipment||[]).forEach(key=>value+=effects[key]?.atkBonus||0);
 if(u?.kind==='direAnt'&&allUnits().some(v=>v.owner===u.owner&&v.row!==null&&v.kind==='vastAnt'))value+=50;
 return Math.max(0,value)
};
const baseInsectAttackLimit=attackLimit;
attackLimit=function(u){return u?.kind==='stormButterfly'?2:baseInsectAttackLimit(u)};
const baseInsectDoMove=doMove;
doMove=function(u,r,c){
 let waste=nuclearWasteAt(r,c),water=insectWaterUnit(u),name=u?.name,result=baseInsectDoMove(u,r,c);
 if(!state?.players?.[u?.owner]?.units?.some(piece=>piece.id===u.id))return result;
 if(state.arena==='endlessOcean'){if(water){u.bonusAtk=(u.bonusAtk||0)+50;log(`${name} ganhou 50 ATK ao se mover no Oceano sem fim.`,'arena')}else{let lost=reduceGoldAttack(u,50);if(lost)log(`${name} perdeu ${lost} ATK ao se mover no Oceano sem fim.`,'arena')}}
 if(waste&&!u.types.includes('RADIOATIVO')){destroy(u,u.owner===1?2:1,'lixo nuclear');log(`${name} pisou em lixo nuclear e foi destruído.`,'arena')}
 mutantContactSpread();return result
};
const baseInsectDestroy=destroy;
destroy=function(u,scorer,reason='combate'){
 let snapshot={row:u?.row,col:u?.col,owner:u?.owner,movement:[...(u?.movement||[])],kind:u?.kind,name:u?.name},adjacentUnits=allUnits().filter(v=>v.id!==u?.id&&v.row!==null&&adjacent(v,u));
 let removed=baseInsectDestroy(u,scorer,reason);if(!removed)return false;
 if(snapshot.kind==='radiantCockroach'){adjacentUnits.filter(v=>allUnits().some(unit=>unit.id===v.id)).forEach(v=>{v.types=['MUTANTE'];v.baseTypes=['MUTANTE']});applyArenaState('nuclearWinter',snapshot.owner,{cancelDuplicate:false});log(`${snapshot.name} converteu os peões adjacentes em MUTANTE e trouxe o Inverno Nuclear.`,'arena')}
 createNuclearWaste({...snapshot});
 if(state.arena==='wildCage'&&reason==='combate'&&scorer){let player=state.players[scorer];if(player.effectDeck.length){player.hand.push(player.effectDeck.pop());log(`${player.name} comprou um Efeito por vencer um combate na Jaula Selvagem.`,'effect')}}
 return true
};
const baseInsectResolveCombat=resolveCombat;
resolveCombat=function(attacker,defender,allies,atk,defAtk,tower,version){
 let volcanic=attacker?.kind==='volcanicLadybug',blast=allUnits().filter(u=>u.id!==defender?.id&&u.row!==null&&adjacent(u,defender));
 baseInsectResolveCombat(attacker,defender,allies,atk,defAtk,tower,version);
 if(volcanic&&!allUnits().some(u=>u.id===defender.id))blast.filter(u=>allUnits().some(v=>v.id===u.id)).forEach(u=>destroy(u,attacker.owner,'erupção vulcânica'));
 resolveTyphoonPush();render();checkWin()
};
const baseInsectDoAttack=doAttack;
function doTremblingEarthAttack(attacker,defender){
 if(!canUnitAttack(attacker)||!own(attacker)||!defender||defender.owner===attacker.owner||!canAttackTarget(attacker,defender))return false;
 recordAttack(attacker);state.players[attacker.owner].attackedThisTurn=true;
 let participants=allUnits().filter(u=>u.row!==null&&inMovementRadius(attacker,u)),attackers=[attacker,...participants.filter(u=>u.owner===attacker.owner&&u.id!==attacker.id)],defenders=[defender,...participants.filter(u=>u.owner===defender.owner&&u.id!==defender.id)],unique=list=>[...new Map(list.map(u=>[u.id,u])).values()];attackers=unique(attackers);defenders=unique(defenders);
 let attackValue=attackers.reduce((sum,u)=>sum+effectiveAtk(u,false),0),defenseValue=defenders.reduce((sum,u)=>sum+effectiveAtk(u,true),0),before={1:state.players[1].score,2:state.players[2].score};
 if(attackValue>defenseValue)defenders.slice().forEach(u=>destroy(u,attacker.owner,'combate'));else if(attackValue<defenseValue)attackers.slice().forEach(u=>destroy(u,defender.owner,'combate'));else[...attackers,...defenders].forEach(u=>destroy(u,u.owner===attacker.owner?defender.owner:attacker.owner,'combate'));
 logCombatResult(`Terra Tremula reuniu ${attackers.length} contra ${defenders.length} peões (${attackValue} × ${defenseValue}).`,before);clearAction();render();checkWin();if(onlineMode)syncOnlineState(true);return true
}
doAttack=function(attacker,defender){
 if(state.arena==='volcanicHeat'&&!attacker.types.includes('FOGO')){if(effectiveAtk(attacker,false)<100){let name=attacker.name;destroy(attacker,attacker.owner===1?2:1,'calor vulcânico');log(`${name} foi destruído ao tentar atacar no Calor Vulcanico.`,'arena');render();return checkWin()}let lost=reduceGoldAttack(attacker,100);if(lost)log(`${attacker.name} perdeu ${lost} ATK ao atacar no Calor Vulcanico.`,'arena')}
 let calamity=calamityArenaFromAttack(attacker);if(calamity){applyArenaState(calamity,attacker.owner,{cancelDuplicate:false});log(`${attacker.name} trouxe ${effects[calamity].name} ao atacar.`,'arena')}
 if(state.arena==='tremblingEarth')return doTremblingEarthAttack(attacker,defender);
 return baseInsectDoAttack(attacker,defender)
};
const baseInsectBotDraw=botDraw;
botDraw=function(){if(state.arena!=='wildCage')return baseInsectBotDraw();let p=state.players[state.current],pawn=takePawnFromDeck(p);if(pawn)p.reserve.push(pawn);p.drawn=true;log(`${p.name} comprou um Peão por causa da Jaula Selvagem.`);return pawn};
const baseInsectBotPlayEffect=botPlayEffect;
botPlayEffect=function(){let p=state.players[botActor()],omen=p?.hand?.indexOf('badOmen');if(omen>=0&&p.units.some(u=>u.row!==null&&CALAMITY_FOR[u.kind])){playBadOmen(botActor(),omen);render();return true}let calamitiesBefore=new Map(allUnits().filter(u=>u.calamityOrigin).map(u=>[u.id,u]));let result=baseInsectBotPlayEffect();if(result){allUnits().forEach(u=>{let key=(u.equipment||[]).find(item=>effects[item]?.calamityTarget&&u.kind===effects[item].equipOnly);if(key){u.equipment=u.equipment.filter(item=>item!==key);transformCalamity(u,key)}});calamitiesBefore.forEach(u=>{if(allUnits().some(piece=>piece.id===u.id)&&u.calamityOrigin&&!u.equipment.some(key=>effects[key]?.calamityTarget))revertCalamity(u)})}return result};
const baseInsectEndTurn=endTurn;
function wildCageTurnKey(owner){return`${state.matchId||'local'}:${state.turn}:${owner}`}
function resolveWildCagePenalty(owner){if(state.arena!=='wildCage')return false;let key=wildCageTurnKey(owner);if(state.wildCagePenaltyTurn===key)return false;state.wildCagePenaltyTurn=key;if(state.players[owner].deployed)return false;let rival=owner===1?2:1;awardPoints(rival,1,`${state.players[rival].name} ganhou 1 ponto porque o adversário não colocou um Peão na Jaula Selvagem.`);return true}
endTurn=function(){
 let pointWon=state&&[1,2].some(n=>state.players[n].score>=(state.pointGoal||10)),valid=state&&!state.animating&&!state.placementPhase&&!state.awaitingDraw&&!pointWon&&!state.forfeitWinner&&!state.celestialWinner&&!state.insectWinner,owner=state?.current;
 if(valid){resolveInsectEndTurn();resolveWildCagePenalty(owner)}
 return baseInsectEndTurn()
};
const baseInsectRenderHeader=renderHeader;
renderHeader=function(){baseInsectRenderHeader();for(let n=1;n<=2;n++){let record=$(`#p${n}-record`),account=state?.players?.[n]?.account;if(record)record.textContent=account?`${safeRating(account.rating)} FLUX`:''}};
const baseInsectRenderBoard=renderBoard;
renderBoard=function(){baseInsectRenderBoard();allUnits().filter(u=>u.row!==null).forEach(u=>$(`#board .cell[data-r="${u.row}"][data-c="${u.col}"] .piece`)?.classList.add(`kind-${u.kind}`));(state.obstacles||[]).filter(item=>item.type==='NUCLEAR').forEach(item=>{let cell=$(`#board .cell[data-r="${item.row}"][data-c="${item.col}"]`),mark=cell?.querySelector('.obstacle');if(mark){mark.className='nuclear-waste';mark.textContent='☢';mark.title='Lixo nuclear: destrói quem não seja RADIOATIVO.'}})};
const baseInsectBoardFeatureInspectionAt=boardFeatureInspectionAt;
boardFeatureInspectionAt=function(r,c){if(nuclearWasteAt(r,c))return{key:'nuclearWinter',boardFeature:true,row:r,col:c};return baseInsectBoardFeatureInspectionAt(r,c)};
const baseInsectCheckWin=checkWin;
checkWin=function(){
 if(!state?.insectWinner){let won=baseInsectCheckWin();if(won){let flux=$('#winner-flux');if(flux)flux.textContent=state.onlineFluxDelta?`${state.onlineFluxDelta>0?'+':''}${state.onlineFluxDelta} FLUX`:onlineMode&&currentAccount?'Calculando variação de Flux…':'';updateRematchAvailability()}return won}let winner=state.insectWinner;if(typeof announceOnlineMatchResult==='function')announceOnlineMatchResult(winner,'doomsday');if(typeof reportOnlineMatchResult==='function')reportOnlineMatchResult(winner,'doomsday');let p=state.players[winner],dialog=$('#winner-dialog');dialog.classList.add('doomsday-victory');dialog.querySelector('.winner-crest').textContent='✺';$('#winner-name').textContent=`${p.name} · ${archetypes[p.archetype].name}`;$('#winner-score').textContent='Cinco calamidades convergiram: a Tragédia Ambar encerrou o duelo.';let flux=$('#winner-flux');if(flux)flux.textContent=state.onlineFluxDelta?`${state.onlineFluxDelta>0?'+':''}${state.onlineFluxDelta} FLUX`:onlineMode&&currentAccount?'Calculando variação de Flux…':'';if(typeof updateRematchAvailability==='function')updateRematchAvailability();if(!dialog.open)dialog.showModal();return true
};
function returnToMenuAfterMatch(){clearTimeout(botTimer);botTimer=null;clearTimeout(botWatchdogTimer);botWatchdogTimer=null;$('#winner-dialog')?.close();document.querySelectorAll('#turn-draw,#pass,#sword-transfer,#network-badge').forEach(element=>element.classList.add('hidden'));document.body.classList.remove('online-waiting','connection-lost');if(onlineMode)leaveOnlineRoom(true,'Você saiu da partida');selectGameMode('local');$('#setup').classList.remove('hidden')}
$('#winner-restart').onclick=()=>{if($('#winner-restart').disabled)return;if(onlineMode)return requestOnlineRematch();$('#winner-dialog').close();$('#setup').classList.remove('hidden')};
$('#winner-menu').onclick=returnToMenuAfterMatch;
