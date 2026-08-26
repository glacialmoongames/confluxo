/* Regras que estendem ações já carregadas sem duplicar o motor principal. */
const baseDoMove=doMove;
doMove=function(u,r,c){
 let from={row:u.row,col:u.col},wasAnssiedium=hasEffect(u,'anssiedium');
 baseDoMove(u,r,c);
 if(wasAnssiedium&&!pitAt(from.row,from.col)){state.pits.push({row:from.row,col:from.col,owner:u.owner,source:'anssiedium'});log(`${u.name} deixou um Poço em ${boardCoordinate(from.row,from.col)}.`)}
 let pair=(state.tunnels||[]).find(entries=>entries.some(entry=>entry.row===u.row&&entry.col===u.col));
 if(pair){let exit=pair.find(entry=>entry.row!==u.row||entry.col!==u.col);if(exit&&!at(exit.row,exit.col)){let entrance=boardCoordinate(u.row,u.col);place(u,exit.row,exit.col);log(`${u.name} entrou no túnel em ${entrance} e saiu em ${boardCoordinate(exit.row,exit.col)}.`)}}
 if(u.kind==='infantry'&&hasEquipment(u,'crown')&&(u.owner===1&&u.row===0||u.owner===2&&u.row===ROWS-1)){let keep={id:u.id,owner:u.owner,row:u.row,col:u.col,origin:u.origin,equipment:u.equipment.filter(e=>e!=='crown'),bonusAtk:u.bonusAtk||0,moveHistory:u.moveHistory};Object.assign(u,defs.atra,keep,{kind:'atra',faceDown:false,transformed:true});log(`${defs.infantry.name} alcançou o polo rival e se transformou em ${u.name}.`)}
 render();
};

const baseRenderBoard=renderBoard;
renderBoard=function(){
 baseRenderBoard();
 let board=$('#board');
 (state.blackHoles||[]).forEach(h=>{let cell=board.querySelector(`[data-r="${h.row}"][data-c="${h.col}"]`);if(cell&&!cell.querySelector('.black-hole'))cell.insertAdjacentHTML('beforeend','<span class="black-hole" title="Buraco Negro"><img src="assets/icons/black-hole-bolas.svg" alt=""></span>')});
 (state.tunnels||[]).flat().forEach(t=>{let cell=board.querySelector(`[data-r="${t.row}"][data-c="${t.col}"]`);if(cell&&!cell.querySelector('.tunnel-mark'))cell.insertAdjacentHTML('beforeend','<span class="tunnel-mark" title="Entrada de túnel"><img src="assets/icons/cave-entrance.svg" alt=""></span>')});
};
