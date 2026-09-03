/* Regras que estendem ações já carregadas sem duplicar o motor principal. */
const baseDoMove=doMove;
doMove=function(u,r,c){
 let from={row:u.row,col:u.col},wasAnssiedium=hasEffect(u,'anssiedium'),followers=allUnits().filter(ghost=>ghost.id!==u.id&&ghost.row!==null&&hasEffect(ghost,'gumGhost')&&adjacent(ghost,u)).map(ghost=>({ghost,dr:ghost.row-u.row,dc:ghost.col-u.col}));
 baseDoMove(u,r,c);
 if(wasAnssiedium&&!pitAt(from.row,from.col)){state.pits.push({row:from.row,col:from.col,owner:u.owner,source:'anssiedium'});log(`${u.name} deixou um Poço em ${boardCoordinate(from.row,from.col)}.`)}
 let pair=(state.tunnels||[]).find(entries=>entries.some(entry=>entry.row===u.row&&entry.col===u.col));
 if(pair){let exit=pair.find(entry=>entry.row!==u.row||entry.col!==u.col);if(exit&&!at(exit.row,exit.col)){let entrance=boardCoordinate(u.row,u.col);place(u,exit.row,exit.col);log(`${u.name} entrou no túnel em ${entrance} e saiu em ${boardCoordinate(exit.row,exit.col)}.`)}}
 if(allUnits().some(piece=>piece.id===u.id))followers.forEach(({ghost,dr,dc})=>{if(!allUnits().some(piece=>piece.id===ghost.id))return;let row=u.row+dr,col=u.col+dc;if(row<0||row>=ROWS||col<0||col>=COLS||at(row,col)||obstacleAt(row,col)||pitAt(row,col))return;let origin=boardCoordinate(ghost.row,ghost.col);place(ghost,row,col);log(`${ghost.name} acompanhou ${u.name}: ${origin} → ${boardCoordinate(row,col)}.`,'move')});
 if(u.kind==='infantry'&&hasEquipment(u,'crown')&&(u.owner===1&&u.row===0||u.owner===2&&u.row===ROWS-1)){let keep={id:u.id,owner:u.owner,row:u.row,col:u.col,origin:u.origin,equipment:u.equipment.filter(e=>e!=='crown'),bonusAtk:u.bonusAtk||0,moveHistory:u.moveHistory};Object.assign(u,defs.atra,keep,{kind:'atra',faceDown:false,transformed:true,fusion:0,pointValue:1});log(`${defs.infantry.name} alcançou o polo rival e se transformou em ${u.name}.`,'effect')}
 render();
};

function isSweetUnit(u){return !!u&&(u.candyConverted===true||u.types?.includes('DOCE'))}
function insideMausoleumOwnerArea(u){return u?.row!==null&&mausoleumAreaContains(state.arenaOwner,u.row)}
function refreshMausoleumTypes(){if(!state?.players)return;allUnits().forEach(u=>{u.baseTypes??=[...(u.types||[])];let transformed=insideMausoleumOwnerArea(u);if(transformed){u.types=['DOCE','ZUMBI'];u.mausoleumSweet=true}else if(u.mausoleumSweet){u.types=[...u.baseTypes];delete u.mausoleumSweet}})}
function spawnRecipeZombie(owner,cell){if(!owner||cell.row===null||at(cell.row,cell.col))return false;let zombie=unit('candyZombie',owner);place(zombie,cell.row,cell.col);state.players[owner].units.push(zombie);log(`${effects.candyRecipe.name} criou ${zombie.name} em ${boardCoordinate(cell.row,cell.col)} para ${state.players[owner].name}.`,'effect');return true}
function spawnChocolateSkeleton(owner,cell){if(!owner||cell.row===null||at(cell.row,cell.col))return false;let skeleton=unit('chocolateSkeleton',owner);place(skeleton,cell.row,cell.col);state.players[owner].units.push(skeleton);log(`${skeleton.name} surgiu em ${boardCoordinate(cell.row,cell.col)} após a destruição de um Peão Combinado em contato.`,'effect');return true}
function resolveCandyZombieConversion(zombie,killer){if(!hasEffect(zombie,'candyZombie')||state.current!==zombie.owner||!killer||killer.row===null)return false;let previous=killer.owner,newOwner=zombie.owner;if(previous===newOwner)return false;state.players[previous].units=state.players[previous].units.filter(u=>u.id!==killer.id);killer.owner=newOwner;killer.candyConverted=true;killer.baseTypes=[...new Set([...(killer.baseTypes||killer.types||[]),'DOCE','ZUMBI'])];killer.types=[...killer.baseTypes];state.players[newOwner].units.push(killer);log(`${zombie.name} converteu ${killer.name} em DOCE · ZUMBI e o passou para ${state.players[newOwner].name}.`,'effect');return true}
function resolveCandyContacts(){if(!state?.players||state.resolvingCandyContacts)return;state.resolvingCandyContacts=true;let changed=true,guard=0;while(changed&&guard++<20){changed=false;let demons=allUnits().filter(u=>u.row!==null&&hasEffect(u,'cookieDemon'));for(let demon of demons){let victim=allUnits().find(u=>u.id!==demon.id&&u.row!==null&&isSweetUnit(u)&&adjacent(demon,u));if(!victim)continue;let name=victim.name,scorer=victim.owner===demon.owner?(demon.owner===1?2:1):demon.owner;if(destroy(victim,scorer,'efeito')){demon.bonusAtk=(demon.bonusAtk||0)+200;log(`${demon.name} devorou ${name}; ${state.players[scorer].name} recebeu os pontos e o Demônio ganhou 200 ATK.`,'combat');changed=true;break}}}state.resolvingCandyContacts=false}

const baseRenderBoard=renderBoard;
renderBoard=function(){
 if(typeof syncGoldPriestVisuals==='function')syncGoldPriestVisuals();
 baseRenderBoard();
 let board=$('#board');
 board.querySelectorAll('.cell').forEach(cell=>{let row=+cell.dataset.r;cell.classList.toggle('mausoleum-zone-p1',mausoleumAreaContains(1,row));cell.classList.toggle('mausoleum-zone-p2',mausoleumAreaContains(2,row))});
 (state.blackHoles||[]).forEach(h=>{let cell=board.querySelector(`[data-r="${h.row}"][data-c="${h.col}"]`);if(cell&&!cell.querySelector('.black-hole'))cell.insertAdjacentHTML('beforeend','<span class="black-hole" title="Buraco Negro"><img src="assets/icons/black-hole-bolas.svg" alt=""></span>')});
 (state.tunnels||[]).flat().forEach(t=>{let cell=board.querySelector(`[data-r="${t.row}"][data-c="${t.col}"]`);if(cell&&!cell.querySelector('.tunnel-mark'))cell.insertAdjacentHTML('beforeend','<span class="tunnel-mark" title="Entrada de túnel"><img src="assets/icons/cave-entrance.svg" alt=""></span>')});
 let goldVisualDirection=perspectivePlayer()===2?-1:1;allUnits().filter(u=>u.row!==null).forEach(u=>{let piece=board.querySelector(`[data-r="${u.row}"][data-c="${u.col}"] .piece`);if(!piece)return;if(typeof goldPriestIsActive==='function'&&goldPriestIsActive(u))piece.classList.add('gold-priest-active');if(u.goldDrainTo){piece.classList.add('gold-draining');piece.style.setProperty('--gold-drain-x',`${(u.goldDrainTo.col-u.col)*goldVisualDirection*100}%`);piece.style.setProperty('--gold-drain-y',`${(u.goldDrainTo.row-u.row)*goldVisualDirection*100}%`)}if(u.goldReceiving)piece.classList.add('gold-receiving')});
};
