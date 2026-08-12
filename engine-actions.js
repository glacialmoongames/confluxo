function adjacent(a,b){return Math.abs(a.row-b.row)+Math.abs(a.col-b.col)===1}
function log(msg){state.log.unshift({turn:state.turn,msg});state.log=state.log.slice(0,40)}
function hint(t){$('#hint').textContent=t}
function clearAction(){mode=null;targets=[];attackTargets=[];pendingCard=null;pendingPushTarget=null;castleFirst=null;fusionMaterials=[];$$('.action').forEach(b=>b.classList.remove('active'))}
function revealMobileDetails(){$('.card-details')?.classList.remove('mobile-details-hidden')}
function hideMobileDetails(){$('.card-details')?.classList.add('mobile-details-hidden')}
function toggleMobileDetails(){if(!window.matchMedia('(max-width:760px)').matches)return false;$('.card-details')?.classList.toggle('mobile-details-hidden');return true}
function mobileDetailsOpen(){return!$('.card-details')?.classList.contains('mobile-details-hidden')}
function select(u){let repeated=!!(u&&selected?.id===u.id);clearAction();selectedEffect=null;selected=u;if(repeated&&toggleMobileDetails()){render();hint(`${u.name} selecionado Â· detalhes ${mobileDetailsOpen()?'abertos':'fechados'}.`);return}if(!u||!own(u)||!canLocalAct())revealMobileDetails();else hideMobileDetails();render();hint(u?`${u.name} selecionado.`:'SeleÃ§Ã£o removida.')}
function startMode(m,valid,msg){if(!valid){hint(msg);return}mode=m;targets=[];$$('.action').forEach(b=>b.classList.remove('active'));$('#'+m)?.classList.add('active');hint(msg);renderBoard()}
function render(){renderHeader();renderBoard();renderHands();renderCard();renderLog();if(onlineMode)updateOnlineLock()}
function updateArenaTheme(board){let arenaSlot=$('.global-arena'),arenaKey=state.arena||'none',changed=arenaKey!==lastArenaVisual;board.dataset.arena=arenaKey;arenaSlot.dataset.arena=arenaKey;if(changed&&arenaKey!=='none'){clearTimeout(arenaAnimationTimer);[board,arenaSlot].forEach(el=>{el.classList.remove('arena-changing');void el.offsetWidth;el.classList.add('arena-changing')});arenaAnimationTimer=setTimeout(()=>[board,arenaSlot].forEach(el=>el.classList.remove('arena-changing')),900)}lastArenaVisual=arenaKey}
function renderHeader(){
 let active=state.players[state.current],view=state.players[viewPlayerNumber()],arc=archetypes[active.archetype],board=$('#board'),locked=state.placementPhase,busy=state.animating,waiting=!canLocalAct();
 let perspective=perspectivePlayer(),layout=$('.game-layout'),handZone=$('.hand-zone');$('main').insertBefore($(`#p${perspective===1?2:1}-strip`),layout);$('main').insertBefore($(`#p${perspective}-strip`),handZone);
 $('#turn-count').textContent=locked?'PREPARAÃ‡ÃƒO':`TURNO ${state.turn}`;$('#turn-name').textContent=`${active.name.toUpperCase()} Â· ${arc.name.toUpperCase()}`;$('#phase-label').textContent=busy?'Resolvendo animaÃ§Ã£o':waiting?'Aguardando adversÃ¡rio':locked?'Posicione os peÃµes iniciais':state.awaitingDraw?'Escolha uma pilha':mode?`AÃ§Ã£o: ${mode}`:'Escolha sua aÃ§Ã£o';document.body.dataset.deck=view.archetype;board.dataset.p1=state.players[1].archetype;board.dataset.p2=state.players[2].archetype;updateArenaTheme(board);
 for(let n=1;n<=2;n++){let x=state.players[n],a=archetypes[x.archetype],strip=$(`#p${n}-strip`);$(`#p${n}-score`).textContent=x.score;$(`#p${n}-field`).textContent=x.units.filter(u=>u.row!==null).length;$(`#p${n}-hand-count`).textContent=onlineMode&&n!==localPlayer||botMode&&n===botPlayer?'?':x.hand.length;$(`#p${n}-name`).textContent=a.name;$(`#p${n}-deck`).textContent=`DECK ${a.name.toUpperCase()}`;$(`#p${n}-emblem`).textContent=a.emblem;strip.querySelector('.player-id small').textContent=botMode?(n===botPlayer?'BOT Â· J2':'VOCÃŠ Â· J1'):onlineMode?(n===localPlayer?`VOCÃŠ Â· J${n}`:`RIVAL Â· J${n}`):`DUELISTA ${n}`;strip.dataset.deck=x.archetype;strip.classList.toggle('current',n===state.current);strip.classList.toggle('opponent',n!==state.current);strip.classList.toggle('viewer',n===perspective);strip.classList.toggle('rival',n!==perspective)}
 $('#reserve-count').textContent=view.reserve.length+view.initialUnits.length;$('#pawn-deck-count').textContent=view.pawnDeck.length;$('#effect-deck-count').textContent=view.effectDeck.length;$('#arena-global').textContent=state.arena?effects[state.arena].name:'SLOT VAZIO';$('#arena-owner').textContent=state.arenaOwner?`ATIVADA PELO DUELISTA ${state.arenaOwner}`:'';$('#draw-pawn').disabled=waiting||locked||busy||view.drawn||!view.pawnDeck.length;$('#draw-effect').disabled=waiting||locked||busy||view.drawn||!view.effectDeck.length;['flip','ability','end-turn'].forEach(id=>$('#'+id).disabled=waiting||locked||busy);let selectedAlreadyAttacked=!!(selected&&own(selected)&&selected.attackedTurn===state.turn);$('#flip').disabled=$('#flip').disabled||selectedAlreadyAttacked
}
function renderBoard(){let board=$('#board'),perspective=perspectivePlayer(),rows=[...Array(ROWS).keys()],cols=[...Array(COLS).keys()];if(perspective===2){rows.reverse();cols.reverse()}board.dataset.view=perspective;board.classList.toggle('combat-active',!!state.animating&&allUnits().some(u=>u.combatRole));board.classList.toggle('combine-active',!!state.animating&&allUnits().some(u=>u.combining));board.innerHTML='';for(let r of rows)for(let c of cols){let cell=document.createElement('div'),file=String.fromCharCode(65+c),coordinate=`${file}${r+1}`;cell.className=`cell ${(r+c)%2?'dark':'light'}${r>=ROWS-2?' zone1':r<2?' zone2':''}`;cell.dataset.r=r;cell.dataset.c=c;cell.dataset.coordinate=coordinate;cell.setAttribute('aria-label',`Casa ${coordinate}`);let edgeLabels=[];if(r===rows[0])edgeLabels.push(['coord-file coord-top',file]);if(r===rows[rows.length-1])edgeLabels.push(['coord-file coord-bottom',file]);if(c===cols[0])edgeLabels.push(['coord-rank coord-left',r+1]);if(c===cols[cols.length-1])edgeLabels.push(['coord-rank coord-right',r+1]);edgeLabels.forEach(([className,text])=>{let label=document.createElement('span');label.className=`coord ${className}`;label.textContent=text;cell.append(label)});let u=at(r,c),o=featureAt(r,c),pit=pitAt(r,c);if(isValidCell(r,c))cell.classList.add(mode==='attack'?'target':'valid');if(isAttackCell(r,c))cell.classList.add('target');if(o){let e=document.createElement('span');e.className=o.type==='FRUIT'?'fruit':'obstacle';e.textContent=o.type==='FRUIT'?'â—':'âœ¿';e.title=o.type==='FRUIT'?'Fruta: concede 100 ATK':'ObstÃ¡culo NATURAL';cell.append(e)}if(pit){let e=document.createElement('span');e.className='pit';e.textContent='â—‰';e.title='PoÃ§o sem Fundo';cell.append(e)}if(u){let pc=document.createElement('div');pc.className=`piece p${u.owner} deck-${state.players[u.owner].archetype}${u.faceDown?' facedown':''}${u.fusion?' fusion':''}${u.mounted?' mounted':''}${u.copiedKind?' has-copied-effect':''}${selected?.id===u.id?' selected':''}${fusionMaterials.some(x=>x.id===u.id)?' fusion-material':''}${mode==='combinar'&&isValidCell(r,c)?' fusion-eligible':''}${u.combatRole?` combat-${u.combatRole}`:''}${u.combining?' combining-material':''}${u.combinedEntry?' combined-entry':''}${u.moving?' moving-piece':''}${u.intro?' intro-piece':''}${u.deployed?' deploy-piece':''}`;pc.style.setProperty('--delay',`${u.enterDelay||0}ms`);if(u.combatRole==='attacker'){let combatDirection=perspective===2?-1:1;pc.style.setProperty('--combat-x',`${u.combatDx*72*combatDirection}%`);pc.style.setProperty('--combat-y',`${u.combatDy*72*combatDirection}%`)}if(u.combining){pc.style.setProperty('--combine-x',`${u.combineDx*105}%`);pc.style.setProperty('--combine-y',`${u.combineDy*105}%`)}if(u.moving){let viewDirection=perspective===2?-1:1;pc.style.setProperty('--move-x',`${u.moveDx*100*viewDirection}%`);pc.style.setProperty('--move-y',`${u.moveDy*100*viewDirection}%`)}pc.innerHTML=`${unitVisual(u,'board-art')}<span class="atk">${effectiveAtk(u,false)}</span>${equipmentMarks(u)}${copiedEffectStatus(u)}${u.mounted?'<span class="mount-mark">âŸ</span>':''}`;pc.title=u.faceDown?'PeÃ£o virado para baixo':u.copiedKind?`${u.name} Â· habilidade copiada: ${defs[u.copiedKind].name}`:u.name;cell.append(pc)}cell.onclick=()=>cellClick(r,c);board.append(cell)}}
function renderHands(){let p=state.players[viewPlayerNumber()],pawnCards=[...p.initialUnits,...p.reserve];$('#effect-hand').innerHTML=p.hand.map((k,i)=>`<article class="effect-card ${state.initialDeal?'initial-card':''} ${selectedEffect&&!selectedEffect.arena&&selectedEffect.index===i?'selected':''}" data-i="${i}" style="--i:${i}" title="Clique para ver o efeito"><span class="effect-symbol">${effects[k].icon}</span><h4>${effects[k].name}</h4><span class="type">${effects[k].type}</span></article>`).join('')||'<div class="empty-pile">VAZIA</div>';$$('.effect-card').forEach(e=>e.onclick=()=>inspectEffect(+e.dataset.i));$('#pawn-hand').innerHTML=pawnCards.map(u=>`<button class="reserve-piece ${u.art?'has-art':''} ${u.initial?'initial-pawn-card':''} ${u.fusion?'fusion-card':''} ${selected?.id===u.id?'selected':''}" data-id="${u.id}" title="${u.name}${u.fusion?` Â· NECESSÃRIOS: ${fusionRequirementLabel(u)}`:''}">${unitVisual(u,'hand-art')}<b>${u.initial?'INICIAL':u.fusion?fusionRequirementLabel(u,true):u.atk}</b></button>`).join('')||'<div class="empty-pile">VAZIA</div>';$$('.reserve-piece').forEach(e=>e.onclick=()=>selectPawnFromHand(pawnCards.find(u=>u.id===e.dataset.id)))}
function inspectEffect(i){let k=state.players[viewPlayerNumber()].hand[i];if(!k)return;let repeated=selectedEffect&&!selectedEffect.arena&&selectedEffect.index===i&&selectedEffect.key===k;selected=null;clearAction();selectedEffect={key:k,index:i,arena:false};if(repeated&&toggleMobileDetails()){render();return hint(`Detalhes de ${effects[k].name} ${mobileDetailsOpen()?'abertos':'fechados'}.`)}revealMobileDetails();render();hint(canLocalAct()&&!state.placementPhase?'Confira o efeito e use o botÃ£o Jogar carta.':'Carta inspecionada â€” vocÃª pode ler seu efeito enquanto aguarda.')}
function inspectArena(){if(!state.arena)return hint('O Slot de Arena estÃ¡ vazio.');let repeated=selectedEffect?.arena&&selectedEffect.key===state.arena;selected=null;clearAction();selectedEffect={key:state.arena,index:null,arena:true};if(repeated&&toggleMobileDetails()){render();return hint(`Detalhes da Arena ${mobileDetailsOpen()?'abertos':'fechados'}.`)}revealMobileDetails();render();hint('Efeito global da Arena ativa.')}
function selectPawnFromHand(u){if(!u)return;if(state.animating)return hint('Aguarde a animaÃ§Ã£o terminar.');select(u);if(!canLocalAct())return hint('Carta inspecionada â€” vocÃª pode ler seu efeito enquanto aguarda.');if(u.initial){if(!state.placementPhase||u.owner!==state.placementPlayer)return;mode='initial-deploy';targets=initialTargetsFor(state.placementPlayer);renderBoard();return hint('Escolha uma casa destacada para este peÃ£o inicial.')}if(u.fusion)return beginFusion(u);beginDeploy()}
function renderCard(){
 let el=$('#unit-card'),title=$('#detail-title');title.textContent='DETALHES DA CARTA';
 if(selectedEffect){let e=effects[selectedEffect.key],canPlay=canLocalAct()&&!state.placementPhase,arenaStatus=selectedEffect.arena?`<p class="arena-status">ATIVA NO CAMPO Â· EFEITO PARA AMBOS</p>`:'',effectArt=e.art?artVisual(e,'detail-art'):`<span>${e.icon}</span>`;el.className='unit-card effect-detail';el.innerHTML=`<div class="card-art effect-art">${effectArt}</div><h3>${e.name}</h3><div class="badges"><span class="badge">${e.type}</span></div><p class="full-effect">${e.text}</p>${arenaStatus}${selectedEffect.arena?'':`<button id="play-selected-effect" class="primary play-card-btn" ${canPlay?'':'disabled'}>${canPlay?'JOGAR CARTA':'SOMENTE NO SEU TURNO'}</button>`}`;if(!selectedEffect.arena)$('#play-selected-effect').onclick=()=>playCard(selectedEffect.index);return}
 if(!selected){el.className='unit-card empty';el.innerHTML='<div class="card-art"><span>â¬¢</span></div><h3>Selecione uma carta</h3><p>PeÃµes, Efeitos e a Arena aparecem aqui.</p>';return}
 let art=selected.art?artVisual(selected,'detail-art'):`<span>${selected.glyph}</span>`,mountInfo=selected.mounted?`<div class="mount-status"><span>âŸ</span><div><b>MONTADOR ACOPLADO</b><small>+${defs.rider.atk} ATK Â· ao perder, somente o Montador Ã© destruÃ­do</small></div></div>`:'',copyInfo=copiedEffectStatus(selected,true),riderButton=hasEffect(selected,'rider')&&canLocalAct()&&own(selected)&&selected.row!==null&&!selected.mounted?'<button id="mount-now" class="primary mount-now">âŸ MONTAR ALIADO</button>':'';
 el.className=`unit-card${selected.mounted?' mounted-card':''}`;el.innerHTML=`<div class="card-art">${art}</div><h3>${selected.name}</h3><div class="badges">${selected.mounted?'<span class="badge mounted-badge">MONTADO</span>':''}${selected.fusion?`<span class="badge fusion-badge">PEÃƒO COMBINADO Â· ${selected.fusion} MATERIAIS</span>`:''}${selected.types.map(t=>`<span class="badge">${t}</span>`).join('')}</div>${fusionRequirementVisual(selected)}<div class="statline"><span>ATK ${effectiveAtk(selected,false)}</span><span>${rawMovementOffsets(selected).length} CASAS</span></div>${movementPreview(selected)}${equipmentMarks(selected,true)}${mountInfo}${copyInfo}<p>${selected.text}</p>${riderButton}`;if(riderButton)$('#mount-now').onclick=useAbility
}
function renderLog(){$('#log').innerHTML=state.log.map(x=>`<div class="log-entry"><b>T${x.turn}</b> ${x.msg}</div>`).join('')}
function isValidCell(r,c){return['initial-deploy','move','deploy','attack','serpent','copy','mount','combinar','pit','push'].includes(mode)&&targets.some(t=>t.r===r&&t.c===c)}
function isAttackCell(r,c){return attackTargets.some(t=>t.r===r&&t.c===c)}
function availableAttackTargets(u){if(!u||u.faceDown||u.attackedTurn===state.turn)return[];return allUnits().filter(target=>target.owner!==u.owner&&canAttackTarget(u,target)).map(target=>({r:target.row,c:target.col}))}
function showPawnActions(u){attackTargets=availableAttackTargets(u);renderBoard();if(attackTargets.length)hint(`${attackTargets.length} adversÃ¡rio${attackTargets.length>1?'s':''} ao alcance â€” clique no Ã­cone âš” para atacar ou escolha um movimento.`)}
function cellClick(r,c){if(state.animating)return hint('Aguarde a animaÃ§Ã£o terminar.');let u=at(r,c);if(!canLocalAct()){if(u){select(u);return hint('PeÃ£o inspecionado â€” vocÃª pode ler seu efeito enquanto aguarda.')}return hint('Aguarde a jogada do adversÃ¡rio.')}if(state.placementPhase){if(mode==='initial-deploy'&&isValidCell(r,c))placeInitialPawn(r,c);else hint('Durante a preparaÃ§Ã£o, escolha uma casa destacada para o peÃ£o inicial.');return}if(mode==='combinar'){if(u&&fusionMaterials.some(x=>x.id===u.id))toggleFusionMaterial(u);else if(isValidCell(r,c))toggleFusionMaterial(u);else hint('Escolha somente um material destacado que esteja tocando os demais.');return}if(pendingCard){cardTarget(u,r,c);return}if(selected&&u&&isAttackCell(r,c))return doAttack(selected,u);if(mode&&isValidCell(r,c)){if(mode==='move')doMove(selected,r,c);else if(mode==='deploy')doDeploy(selected,r,c);else if(mode==='attack')doAttack(selected,u);else if(mode==='serpent')createObstacle(selected,r,c);else if(mode==='copy')copyEffect(selected,u);else if(mode==='mount')mountRider(selected,u);retÛÛh‘éì¶»§q«^uXİYY™™Xİ[[ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÚ[
	ĞØ\ØH˜^šXK‰Ê__B™[˜İ[Ûˆ\ÑY™™Xİ
KÚ[™
^Ü™]\›ˆKšÚ[™OOZÚ[™K˜ÛÜYYÚ[™OOZÚ[™B™[˜İ[Ûˆ[İ™U\™Ù]ÊJ^Û]İ]V×NÙ›ÜŠ]Ù‹×HÙˆ[İ™[Y[Ù™œÙ]ÊJJ^Û]]Kœ›İÊÙ‹Ï]K˜ÛÛ
ÙËØœİXÛO[ØœİXÛP]
‹ÊNÚYŠT“ÕÔßÏÏPÓÓß]
‹Ê_ØœİXÛI‰ˆZ\ÑY™™Xİ
K	ÙÛÛ[IÊJXÛÛ[YNÛİ]œ\Ú
Ü‹ßJ_\™]\›ˆİ]B™[˜İ[Ûˆ[“[İ™[Y[˜Y]\ÊK\™Ù]
^Ü™]\›ˆ[İ™[Y[Ù™œÙ]ÊJKœÛÛYJ
Ù‹×JOOKœ›İÊÙOO]\™Ù]œ›İÉ‰K˜ÛÛ
ÙÏOO]\™Ù]˜ÛÛ
_B™[˜İ[ÛˆØ[\˜Ú\“[İ™JJ^Ü™]\›ˆ[[š]Ê
KœÛÛYJO‹›İÛ™\ˆOO]K›İÛ™\‰‰š[“[İ™[Y[˜Y]\ÊKŠJ_B™[˜İ[Ûˆ]ÚÓ[İ™\Õ\Õ\›ŠJ^Ü™]\›ˆKš]ÚÓ[İ™U\›OO\İ]K\›ÊKš]ÚÓ[İ™\ß
NŒB™[˜İ[Ûˆ™YÚ[“[İ™J
^Û]\İ]Kœ^Y\œÖÜİ]K˜İ\œ™[NÚYŠ[İÛŠÙ[XİY
_Ù[XİYœ›İÏOO[[
\™]\›ˆ[
	ÔÙ[XÚ[Û™H[HpèÛÈÙ]H[HØ[\Ë‰ÊNÚYŠÙ[XİY™˜XÙQİÛŠ\™]\›ˆ[
	ÔpíY\Èš\˜YÜÈ\˜H˜Z^È°èÛÈÙ[HÙH[İ™\‹ˆš\™H\İHpèÛÈ\˜HÚ[XHš[YZ\›Ë‰ÊNÛ]œ™YS[İ™OZ\ÑY™™Xİ
Ù[XİY	ÙXÚÉÊKİX›S[İ™OZ\ÑY™™Xİ
Ù[XİY	Ú]ÚÉÊK]ÚÓ[İ™\ÏYİX›S[İ™OÚ]ÚÓ[İ™\Õ\Õ\›ŠÙ[XİY
NŒÚYŠœ™YS[İ™I‰œÙ[XİY›[İ™Y\›OO\İ]K\›Š\™]\›ˆ[
	ÓÈ[İš[Y[ÈÜ˜]Z]È\İHpèÛÈ°èH›ÚH\ØYÈ™\İH\››Ë‰ÊNÚYŠİX›S[İ™I‰š]ÚÓ[İ™\ÏLŠ\™]\›ˆ[
	ÓÜÈÚ\È[İš[Y[ÜÈ\İHØ]špèÛÈ°èH›Ü˜[H\ØYÜÈ™\İH\››Ë‰ÊNÚYŠ›[İ™Y	‰ˆYœ™YS[İ™I‰ˆJİX›S[İ™I‰š]ÚÓ[İ™\ÏOOLJJ\™]\›ˆ[
	ĞHpéğèÛÈH[İš[Y[È\İH\››È°èH›ÚH\ØYK‰ÊNÚYŠ\ÑY™™Xİ
Ù[XİY	Ø\˜Ú\‰ÊI‰ˆXØ[\˜Ú\“[İ™JÙ[XİY
J\™]\›ˆ[
	ÓÈ\œ]YZ\›ÈğìÈÙH[İ™HÛÛH[HY™\œğè\š[È[HİXH[šK‰ÊNÜİ\[ÙJ	Û[İ™IËYKİX›S[İ™I‰š]ÚÓ[İ™\ÏOOLOÉÑ\ØÛÛHHØ\ØHÈÙYİ[™È[İš[Y[ÈÈØ]špèÛË‰Î‰Ñ\ØÛÛH[XHØ\ØH\İXØYK‰ÊNİ\™Ù]Ï[[İ™U\™Ù]ÊÙ[XİY
NÜ™[™\›Ø\™

_B™[˜İ[ÛˆÓ[İ™JK‹Ê^ÚYŠ[İÛŠJ_Kœ›İÏOO[[
^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	Õ›ØğêˆğìÈÙH[İ™\ˆÙ]\È°ìÜš[ÜÈpíY\Ë‰Ê_ZYŠK™˜XÙQİÛŠ^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	ÔpíY\Èš\˜YÜÈ\˜H˜Z^È°èÛÈÙ[HÙH[İ™\‹‰Ê_[]œ›ÛT›İÏ]Kœ›İËœ›ÛPÛÛ]K˜ÛÛœ›ÛOX›Ø\™ÛÛÜ™[˜]Jœ›ÛT›İËœ›ÛPÛÛ
Kœ™YS[İ™OZ\ÑY™™Xİ
K	ÙXÚÉÊKİX›S[İ™OZ\ÑY™™Xİ
K	Ú]ÚÉÊK™\œÚ[ÛYØ[YU™\œÚ[Û‹œZ]YœZ]]
‹ÊKØœİXÛO[ØœİXÛP]
‹ÊK]\]]
‹ÊNÜİ]K˜[š[X][™Ï]YNİK›[İš[™Ï]YNİK›[İ™QYœ›ÛPÛÛXÎİK›[İ™QOYœ›ÛT›İË\ÜXÙJK‹ÊNÚYŠœZ]
XÛÛXİœZ]
K‹ÊNÚYŠØœİXÛI‰š\ÑY™™Xİ
K	ÙÛÛ[IÊJ^Üİ]K›ØœİXÛ\Ï\İ]K›ØœİXÛ\Ë™š[\ŠOOO[ØœİXÛJNİK˜›Û\Ğ]ÏJK˜›Û\Ğ]ß
JÌŒÛÙÊ	İK›˜[Y_H\ÛXYÛİH[HØœİ0èXİ[ÈUTSHØ[šİHŒUË˜
_ZYŠœ™YS[İ™J]K›[İ™Y\›\İ]K\›Ù[Ù^Üİ]Kœ^Y\œÖÜİ]K˜İ\œ™[K›[İ™Y]YNÚYŠİX›S[İ™J^ÚYŠKš]ÚÓ[İ™U\›ˆOO\İ]K\›Š^İKš]ÚÓ[İ™U\›\İ]K\›İKš]ÚÓ[İ™\ÏL]Kš]ÚÓ[İ™\ÊÊß_[ÙÊ	İK›˜[Y_H[İ™]HH	Ùœ›Û_H\˜H	Ø›Ø\™ÛÛÜ™[˜]J‹Ê_IÙœ™YS[İ™OÉÈÙ[HØ\İ\ˆHpéğèÛÈH[İš[Y[ÉÎ™İX›S[İ™OØ0­È[İš[Y[È	İKš]ÚÓ[İ™\ßKÌ˜‰ÉßK˜
NÚYŠ]
^Ù\İ›ŞJK[	ÜğéÛÉÊNÛÙÊ	İK›˜[Y_HØZ]H›ÈğéÛÈÙ[H[™ÈH›ÚH\İpëYÎÈÈğéÛÈ\›X[™XÙ]H[H	Ø›Ø\™ÛÛÜ™[˜]J‹Ê_K˜
_XÛX\Xİ[ÛŠ
NÜ™[™\Š
NÚ[
]ÉÓÈpèÛÈ›ÚH\İpëYÈHÈğéÛÈÙ[H[™È\›X[™XÙ]H˜H\™[˜K‰Î™İX›S[İ™I‰Kš]ÚÓ[İ™\ÏOOLOÉÔš[YZ\›È[İš[Y[ÈÛÛ˜ÛpëYÈ8 %ÈØ]špèÛÈZ[™HÙHÙH[İ™\ˆ›İ˜[Y[K‰Î˜	İK›˜[Y_H[H[İš[Y[ø )˜
NÚYŠÛ›[™S[ÙJ\Ù[™XÚÙ]
İ\N‰İš\İX[	ËÚ[™‰Û[İ™IË[š]KšYœ›ÛNÜ›İÎ™œ›ÛT›İËÛÛ™œ›ÛPÛÛKÎÜ›İÎœ‹ÛÛ˜ß_JNÜÙ][Y[İ]


OOÚYŠ™\œÚ[ÛˆOOYØ[YU™\œÚ[ÛŠ\™]\›ØÛX\[š[X][Û“X\šÜÊİWJNÜİ]K˜[š[X][™ÏY˜[ÙNÜ™[™\Š
NØÚXÚÕÚ[Š
NÚYŠÛ›[™S[ÙJ\Ş[˜ÓÛ›[™Tİ]JYJ_K
_B™[˜İ[Ûˆ™YÚ[‘\ŞJ
^Û]\İ]Kœ^Y\œÖÜİ]K˜İ\œ™[NÚYŠ™\ŞYY
\™]\›ˆ[
	Õ›Øğêˆ°èHÛÛØÛİH[HpèÛÈ™\İH\››Ë‰ÊNÚYŠ\Ù[XİYÙ[XİYœ›İÈOO[[[İÛŠÙ[XİY
J\™]\›ˆ[
	ÔÙ[XÚ[Û™H[HpèÛÈHpèÛÈHpíY\Ë‰ÊNÚYŠÙ[XİY™\Ú[ÛŠ\™]\›ˆ[
	ÔpíY\ÈÛÛXš[˜YÜÈğìÈ[˜[H[HØ[\È[ÈÛÛXš[˜\ˆÜÈX]\šXZ\È^YÚYÜÈ[HÛÛ]Ë‰ÊNÜİ\[ÙJ	Ù\ŞIËYK	Ñ\ØÛÛH[XHØ\ØH]œ™H›ÈÙ]HÛË‰ÊNÛ]›İÜÏ\İ]K˜İ\œ™[OOLOÖÔ“ÕÔËL‹“ÕÔËLWN–ÌWNİ\™Ù]ÏV×NÙ›ÜŠ]ˆÙˆ›İÜÊY›ÜŠ]ÏLØÏÓÓÎØÊÊÊZYŠX]
‹ÊI‰ˆ[ØœİXÛP]
‹ÊI‰ˆ\]]
‹ÊJ]\™Ù]Ëœ\Ú
Ü‹ßJNÜ™[™\›Ø\™

_B™[˜İ[ÛˆÑ\ŞJK‹Ê^ÚYŠ[İÛŠJ_Kœ›İÈOO[[K™\Ú[ÛŠ^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	Ñ\ÜÙHpèÛÈ°èÛÈÙHÙ\ˆÛÛØØYÈ\ÜØH›Ü›XK‰Ê_[]\İ]Kœ^Y\œÖÜİ]K˜İ\œ™[NÜœ™\Ù\™O\œ™\Ù\™K™š[\ŠOšYOO]KšY
NÜXÙJK‹ÊNİK™\ŞYY]YNÜ[š]Ëœ\Ú
JNÜ™\ŞYY]YNÛ]ÛİœZ]XÛÛXİœZ]
K‹ÊNÛÙÊ	İK›˜[Y_H[›İH[HØ[\È[H	Ø›Ø\™ÛÛÜ™[˜]J‹Ê_IÙÛİœZ]ÉÈHYÛİHHœ]IÎ‰ÉßK˜
NØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜÙ][Y[İ]


OOİK™\ŞYYY˜[ÙNÜ™[™\›Ø\™

_KL
_B™[˜İ[Ûˆ›\Ù[XİY

^ÚYŠ[İÛŠÙ[XİY
_Ù[XİYœ›İÏOO[[
\™]\›ˆ[
	ÔÙ[XÚ[Û™H[HpèÛÈÙ]H[HØ[\Ë‰ÊNÚYŠÙ[XİY˜]XÚÙY\›OO\İ]K\›Š\™]\›ˆ[
	Ñ\İHpèÛÈ°èH]XÛİHH°èÛÈÙHÙ\ˆš\˜YÈ™\İH\››Ë‰ÊNÚYŠÙ[XİY™›\Y\›OO\İ]K\›Š\™]\›ˆ[
	Ñ\İHpèÛÈ°èH›ÚHš\˜YÈ™\İH\››Ë‰ÊNÜÙ[XİY™˜XÙQİÛH\Ù[XİY™˜XÙQİÛÜÙ[XİY™›\Y\›\İ]K\›ÛÙÊ	ÜÙ[XİY›˜[Y_H›ÚHš\˜YÈ	ÜÙ[XİY™˜XÙQİÛÉÜ\˜H˜Z^ÉÎ‰Ü\˜HÚ[XIßK˜
NØÛX\Xİ[ÛŠ
NÜ™[™\Š
_B™[˜İ[Ûˆ\Ñ\]Z\Y[
KÙ^J^Ü™]\›ˆK™\]Z\Y[š[˜ÛY\ÊÙ^J_B™[˜İ[Ûˆ\]Z\Y[X\šÜÊK]Z[Y˜[ÙJ^ÚYŠ]OË™\]Z\Y[Ë›[™İ
\™]\›‰ÉÎÛ]][\Ï]K™\]Z\Y[›X\
Ù^OO™Y™™XİÖÚÙ^WJK™š[\Š›ÛÛX[ŠNÚYŠ]Z[
\™]\›˜]ˆÛ\ÜÏH™\]Z\Y[\İš\ÛX[‘TURTQÏÜÛX[‰Ú][\Ë›X\
OO˜Ü[ˆ]OH‰ÙK›˜[Y_H‰ÙKšXÛÛŸOØ[O‰ÙK›˜[Y_OÙ[OÜÜ[˜
Kš›Ú[Š	ÉÊ_OÙ]˜Ü™]\›˜Ü[ˆÛ\ÜÏHœYXÙKY\]Z\Y[ˆ\šXK[X™[H‘\]Z\[Y[ÜÎˆ	Ú][\Ë›X\
OO™K›˜[YJKš›Ú[Š	Ë	Ê_H‰Ú][\Ë›X\
OO˜H]OH‰ÙK›˜[Y_H‰ÙKšXÛÛŸOÚO˜
Kš›Ú[Š	ÉÊ_OÜÜ[˜B™[˜İ[ÛˆÛÜYYY™™Xİİ]\ÊK]Z[Y˜[ÙJ^ÚYŠ]OË˜ÛÜYYÚ[™YYœÖİK˜ÛÜYYÚ[™J\™]\›‰ÉÎÛ]ÛÜYYYYœÖİK˜ÛÜYYÚ[™NÚYŠ]Z[
\™]\›˜]ˆÛ\ÜÏH˜ÛÜYY\İ]\ÈÜ[ˆÛ\ÜÏH˜ÛÜYY\Ş[X›Û‰ØÛÜYY™Û\OÜÜ[]’P’SQQHÓÔPQHHUUOØİ›Û™Ï‰ØÛÜYY›˜[Y_OÜİ›Û™Ï‰ØÛÜYY^OÜÛX[“È›Ø›ÈX[0ê[H\İHXš[YYH]0êHÈš[HH\YKÜÛX[Ù]Ù]˜Ü™]\›˜Ü[ˆÛ\ÜÏH˜ÛÜK[X\šÈˆ\šXK[X™[H’Xš[YYHÛÜXYNˆ	ØÛÜYY›˜[Y_Hˆ]OH›Ø›ÈÛÜX[™Îˆ	ØÛÜYY›˜[Y_H‰ØÛÜYY™Û\OÜÜ[˜B™[˜İ[ÛˆØ[]XÚÕ\™Ù]
]XÚÙ\‹\™Ù]
^Ü™]\›ˆY˜XÙ[
]XÚÙ\‹\™Ù]
_
\ÑY™™Xİ
]XÚÙ\‹	Ø\˜Ú\‰Ê_\Ñ\]Z\Y[
]XÚÙ\‹	Ø›İÉÊJI‰š[“[İ™[Y[˜Y]\Ê]XÚÙ\‹\™Ù]
_B™[˜İ[Ûˆ™YÚ[]XÚÊ
^ÚYŠ[İÛŠÙ[XİY
_Ù[XİYœ›İÏOO[[
\™]\›ˆ[
	ÔÙ[XÚ[Û™HÈ]XØ[K‰ÊNÚYŠÙ[XİY™˜XÙQİÛŠ\™]\›ˆ[
	ÔpíY\Èš\˜YÜÈ\˜H˜Z^È°èÛÈÙ[H]XØ\‹ˆš\™H\İHpèÛÈ\˜HÚ[XHš[YZ\›Ë‰ÊNÚYŠÙ[XİY˜]XÚÙY\›OO\İ]K\›Š\™]\›ˆ[
	Ñ\İHpèÛÈ°èH]XÛİH™\İH\››Ëˆ\ØÛÛHİ]›ÈpèÛË‰ÊNÛ]\˜Ú\Z\ÑY™™Xİ
Ù[XİY	Ø\˜Ú\‰ÊK›İÏZ\Ñ\]Z\Y[
Ù[XİY	Ø›İÉÊK˜[™ÙYX\˜Ú\Ÿ›İÎÜİ\[ÙJ	Ø]XÚÉËYK\˜Ú\ÉÑ\ØÛÛH[H[š[ZYÛÈ[›ÈÈ˜Z[ÈÈ\œ]YZ\›Ë‰Î˜›İÏÉÑ\ØÛÛH[H[š[ZYÛÈ›È[Ø[˜ÙHH[İš[Y[ÈÈ\]Z\YË‰Î‰Ñ\ØÛÛH[H[š[ZYÛÈY˜XÙ[K‰ÊNİ\™Ù]ÏX[[š]Ê
K™š[\ŠOOK›İÛ™\ˆOO\İ]K˜İ\œ™[	‰˜Ø[]XÚÕ\™Ù]
Ù[XİYJJK›X\
OOŠÜKœ›İËÎK˜ÛÛJJNÚYŠ]\™Ù]Ë›[™İ
^ØÛX\Xİ[ÛŠ
NÚ[
\˜Ú\ÉÓ™[š[HY™\œğè\š[È›È˜Z[ÈÈ\œ]YZ\›Ë‰Î˜›İÏÉÓ™[š[HY™\œğè\š[È[È[Ø[˜ÙHÈ\˜ÛÈÙ[˜YÙ[K‰Î‰Ó™[š[HY™\œğè\š[ÈY˜XÙ[K‰Ê_\™[™\›Ø\™

_B™[˜İ[Ûˆ[š[X]T›ÜÙT™]Ø\™
İÛ™\‹[K[^OL
^ÜÙ][Y[İ]


OOÛ]Ûİ\˜ÙOI
	Ë™ÛØ˜[X\™[˜IÊK\™Ù]I
Ü	ÛİÛ™\ŸK\İš\
NÚYŠ\Ûİ\˜Ù_]\™Ù]
\™]\›Û]O\Ûİ\˜ÙK™Ù]›İ[™[™ĞÛY[™Xİ

K]\™Ù]™Ù]›İ[™[™ĞÛY[™Xİ

KÚÜİYØİ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÙÚÜİ˜Û\ÜÓ˜[YOX›ÜÙK\™]Ø\™XØ\™	Ü[_XÙÚÜİš[›™\’SXÜ[¸§`ÜÜ[‰Ü[OOOIÜ]Û‰ÏÉø«(‰Î‰ø§)‰ßOØÛX[‰Ü[OOOIÜ]Û‰ÏÉÔpàÓÉÎ‰ÑQ‘RUÉßOÜÛX[˜ÓØš™Xİ˜\ÜÚYÛŠÚÜİœİ[KÛY˜	ØK›Y
ØKÚYÌ‹L\Ü˜	ØKÜ
ØKšZYÚÌ‹LÎ\JNÙØİ[Y[˜›ÙK˜\[™
ÚÜİ
NÛ][š[X][ÛYÚÜİ˜[š[X]JŞİ˜[œÙ›Ü›N‰İ˜[œÛ]J
H›İ]VJ
HØØ[JMJIËÜXÚ]NŒKİ˜[œÙ›Ü›N‰İ˜[œÛ]JLMœ
H›İ]VJNYÊHØØ[JKŒJIËÜXÚ]NŒKÙ™œÙ]‹ŒÍ_Kİ˜[œÙ›Ü›N˜˜[œÛ]J	Ø‹›Y
Ø‹ÚYÌ‹XK›YXKÚYÌŸ\	Ø‹Ü
Ø‹šZYÚÌ‹XKÜXKšZYÚÌŸ\
H›İ]VJMYÊHØØ[JÌŠXÜXÚ]N‹ŒM_WKÙ\˜][ÛŒX\Ú[™Î‰ØİXšXËX™^šY\ŠŒ‹Œ‹JIßJNØ[š[X][Û‹›Û™š[š\ÚJ
OOÙÚÜİœ™[[İ™J
Nİ\™Ù]˜[š[X]JŞÙš[\‰ØœšYÚ™\ÜÊJIßKÙš[\‰ØœšYÚ™\ÜÊK
IßKÙš[\‰ØœšYÚ™\ÜÊJIßWKÙ\˜][ÛŒÌŒJ__K[^J_B™[˜İ[Ûˆ˜]Ô›ÜÙT™]Ø\™
İÛ™\‹[^OL
^Û]\İ]Kœ^Y\œÖÛİÛ™\—K]˜Z[X›OV×NÚYŠœ]Û‘XÚË›[™İ
X]˜Z[X›Kœ\Ú
	Ü]Û‰ÊNÚYŠ™Y™™XİXÚË›[™İ
X]˜Z[X›Kœ\Ú
	ÙY™™Xİ	ÊNÚYŠX]˜Z[X›K›[™İ
^ÛÙÊ	Ü›˜[Y_H°èÛÈ[šHØ\\È\ÜÛ°ë]™Z\È\˜HÛÛ\˜\ˆ[ÈØ[\È\È›ÜØ\Ë˜
NÜ™]\›Ÿ[][OX]˜Z[X›VÓX]™›ÛÜŠX]œ˜[™ÛJ
J˜]˜Z[X›K›[™İ
WNÚYŠ[OOOIÜ]Û‰Ê^Üœ™\Ù\™Kœ\Ú
œ]Û‘XÚËœÜ

JNÛÙÊ	Ü›˜[Y_HÛÛ\›İH[HpèÛÈ[ÈØ[\È\È›ÜØ\È0è[Y\Ë˜
_Y[Ù^Üš[™œ\Ú
™Y™™XİXÚËœÜ

JNÛÙÊ	Ü›˜[Y_HÛÛ\›İH[HY™Z]È[ÈØ[\È\È›ÜØ\È0è[Y\Ë˜
_X[š[X]T›ÜÙT™]Ø\™
İÛ™\‹[K[^J_B™[˜İ[Ûˆ]Ø\™Ú[ÊİÛ™\‹Ûİ[
^ÚYŠ[İÛ™\ŸÛİ[L
\™]\›Üİ]Kœ^Y\œÖÛİÛ™\—KœØÛÜ™JÏXÛİ[ÛÙÊ	Üİ]Kœ^Y\œÖÛİÛ™\—K›˜[Y_H™XÙX™]H	ØÛİ[HÛÉØÛİ[ŒOÉÜÉÎ‰ÉßK˜
NÚYŠİ]K˜\™[˜OOOIÜ›ÜÙ\ÉÊY›ÜŠ]OLÚOÛİ[ÚJÊÊY˜]Ô›ÜÙT™]Ø\™
İÛ™\‹JŒN
_B™[˜İ[ÛˆY™™Xİ]™P]ÊKY™[™[™Ê^Û]]Ï]K˜]ÊÊK˜›Û\Ğ]ß
NÚYŠ\ÑY™™Xİ
K	Ú\İXÙIÊJX]ÊÏ\İ]Kœ^Y\œÖİK›İÛ™\—K›\İÜÜÙ\ÊŒLÛ]˜X™[X[[š]Ê
K™š[™
O˜‹›İÛ™\ˆOO]K›İÛ™\‰‰š\ÑY™™Xİ
‹	Ø˜X™[	ÊI‰š[“[İ™[Y[˜Y]\Ê‹JJNÚYŠ˜X™[
X]ÏSX]™›ÛÜŠ]ËÌŠNÚYŠK›[İ[Y
X]ÊÏYYœÖİK›[İ[YK˜]ÎÜ™]\›ˆ]ßB™[˜İ[Ûˆ\İ›ŞJKØÛÜ™\‹™X\ÛÛIØÛÛX˜]IÊ^Û]\İ]Kœ^Y\œÖİK›İÛ™\—NÚYŠ™X\ÛÛOOIØÛÛX˜]IÉ‰K›[İ[Y
^İK›[İ[Y[[Ü›ÜÜÙ\Õ\Õ\›ŠÊÎÜİ]K™Y™X]YÛİ[Jİ]K™Y™X]YÛİ[
JÌNÚYŠØÛÜ™\ŠX]Ø\™Ú[ÊØÛÜ™\‹JNÛÙÊÈ[ÛYÜˆH	İK›˜[Y_H›ÚH\İpëYËX\ÈH[Û\šXH\›X[™XÙ]K˜
NÜ™]\›ˆ˜[Ù_ZYŠ\ÑY™™Xİ
K	ÙXÚÉÊI‰œ™X\ÛÛOOIØÛÛX˜]IÊ^ÛÙÊ	İK›˜[Y_H°èÛÈÙHÙ\ˆ\İpëYÈÜˆÛÛX˜]K˜
NÜ™]\›ˆ˜[Ù_\[š]Ï\[š]Ë™š[\ŠOšYOO]KšY
NÜ›ÜÜÙ\Õ\Õ\›ŠÊÎÜİ]K™Y™X]YÛİ[Jİ]K™Y™X]YÛİ[
JÌNÛ]Ï]K™\Ú[ÛŸNÚYŠØÛÜ™\ŠX]Ø\™Ú[ÊØÛÜ™\‹ÊNÚYŠÙ[XİYËšYOO]KšY
\Ù[XİY[[Ü™]\›ˆY_B™[˜İ[ÛˆÛX\[š[X][Û“X\šÜÊ[š]Ê^İ[š]Ë™š[\Š›ÛÛX[ŠK™›Ü‘XXÚ
OOÙ[]HK˜ÛÛX˜]›ÛNÙ[]HK˜ÛÛX˜]Ù[]HK˜ÛÛX˜]NÙ[]HK˜ÛÛXš[š[™ÎÙ[]HK˜ÛÛXš[™QÙ[]HK˜ÛÛXš[™QNÙ[]HK›[İš[™ÎÙ[]HK›[İ™QÙ[]HK›[İ™Q_J_B™[˜İ[Ûˆš[š\Ú[š[X]YXİ[ÛŠ
^Üİ]K˜[š[X][™ÏY˜[ÙNØÛX\Xİ[ÛŠ
NÜ™[™\Š
NØÚXÚÕÚ[Š
NÚYŠÛ›[™S[ÙJ\Ş[˜ÓÛ›[™Tİ]J
NÚYŠİ]KœİÛÜ™]Y]YK›[™İ
\Ù][Y[İ]
Ü[”İÛÜ™˜[œÙ™\‹N
_B™[˜İ[Ûˆ™]™X[Y™[™\ŠY™[™\Š^Û]™\œÚ[ÛYØ[YU™\œÚ[ÛÜİ]K˜[š[X][™Ï]YNÙY™[™\‹˜ÛÛX˜]›ÛOIÙY™[™\‰ÎØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÚ[
	ÙY™[™\‹›˜[Y_H\İ0èHÙ[™È™]™[Yø )˜
NÜÙ][Y[İ]


OOÚYŠ™\œÚ[ÛˆOOYØ[YU™\œÚ[ÛŠ\™]\›ØÛX\[š[X][Û“X\šÜÊÙY™[™\—JNÙY™[™\‹™˜XÙQİÛY˜[ÙNÛÙÊ	ÙY™[™\‹›˜[Y_H›ÚH™]™[YÎÈÈÛÛX˜]H›ÚHØ[˜Ù[YË˜
NÙš[š\Ú[š[X]YXİ[ÛŠ
_KŒŒ
_B™[˜İ[Ûˆ™\ÛÛ™PÛÛX˜]
]XÚÙ\‹Y™[™\‹[Y\Ë]ËY]ËİÙ\‹™\œÚ[ÛŠ^ÚYŠ™\œÚ[ÛˆOOYØ[YU™\œÚ[ÛŠ\™]\›ØÛX\[š[X][Û“X\šÜÊË‹‹˜[Y\ËY™[™\‹İÙ\—JNÛ]İ\œÙY™X\™\œÏVË‹‹˜[Y\ËY™[™\—K™›]X\
OOK™\]Z\Y[™š[\ŠOO™OOOIÜİÛÜ™	ÊK›X\


OOJJNÚYŠ]Ï™Y]É‰İÙ\Š^Ù\İ›ŞJİÙ\‹[	ÜØXÜšY°ëXÚ[ÉÊNÛÙÊ	ÕÜœ™Hœ˜[˜ØHÙHØXÜšYšXÛİHH™YÛİHÈ]\]YK‰Ê_Y[ÙHYŠİ\œÙY™X\™\œË›[™İ
^Û]šXİ[\Ï[™]ÈX\
ÖÙY™[™\‹šYİ[š]™Y™[™\‹ØÛÜ™\˜]XÚÙ\‹›İÛ™\ŸWWJNØİ\œÙY™X\™\œË™›Ü‘XXÚ
™X\™\OİšXİ[\ËœÙ]
™X\™\‹šYİ[š]˜™X\™\‹ØÛÜ™\˜™X\™\‹›İÛ™\OOX]XÚÙ\‹›İÛ™\ÙY™[™\‹›İÛ™\˜]XÚÙ\‹›İÛ™\ŸJNÚYŠ™X\™\‹šYOOYY™[™\‹šY
]šXİ[\ËœÙ]
]XÚÙ\‹šYİ[š]˜]XÚÙ\‹ØÛÜ™\™Y™[™\‹›İÛ™\ŸJ_JNİšXİ[\Ë™›Ü‘XXÚ

İ[š]ØÛÜ™\ŸJOO™\İ›ŞJ[š]ØÛÜ™\‹	ÛX[péğèÛÉÊJNÛÙÊH\ÜYHX[]H\İZ]H	ÖË‹‹šXİ[\Ë˜[Y\Ê
WK›X\
O‹[š]›˜[YJKš›Ú[Š	ÈH	Ê_K˜
NØİ\œÙY™X\™\œË™›Ü‘XXÚ
™X\™\Oœ]Y]YTİÛÜ™˜[œÙ™\Š™X\™\‹›İÛ™\ŠJ_Y[ÙHYŠ]Ï™Y]Ê^Ù\İ›ŞJY™[™\‹]XÚÙ\‹›İÛ™\ŠNÛÙÊ	Ø]XÚÙ\‹›˜[Y_H™[˜Ù]H
	Ø]ßH0åÈ	ÙY]ßJK˜
_Y[ÙHYŠ]ÏY]Ê^Ù\İ›ŞJ]XÚÙ\‹Y™[™\‹›İÛ™\ŠNÛÙÊ	ÙY™[™\‹›˜[Y_H™\Ú\İ]HH™[˜Ù]H
	ÙY]ßH0åÈ	Ø]ßJK˜
_Y[Ù^Ø[Y\Ë™›Ü‘XXÚ
OO™\İ›ŞJKY™[™\‹›İÛ™\ŠJNÙ\İ›ŞJY™[™\‹]XÚÙ\‹›İÛ™\ŠNÛÙÊ[\]H[H	Ø]ßNˆÙÜÈÜÈ	Ø[Y\Ë›[™İH]XØ[\È\XÚ\[\ÈHÈY™[œÛÜˆ›Ü˜[H][™ÚYÜË˜
_Yš[š\Ú[š[X]YXİ[ÛŠ
_B™[˜İ[ÛˆĞ]XÚÊ]XÚÙ\‹Y™[™\Š^ÂˆYŠİ]K˜[š[X][™Ê\™]\›ˆ[
	ĞYİX\™HH[š[XpéğèÛÈ\›Z[˜\‹‰ÊNÂˆYŠ]XÚÙ\Ë™˜XÙQİÛŠ^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	ÔpíY\Èš\˜YÜÈ\˜H˜Z^È°èÛÈÙ[H]XØ\‹‰Ê_BˆYŠ]XÚÙ\Ë˜]XÚÙY\›OO\İ]K\›Š^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	Ñ\İHpèÛÈ°èH]XÛİH™\İH\››Ë‰Ê_BˆYŠ[İÛŠ]XÚÙ\Š_YY™[™\ŸY™[™\‹›İÛ™\OO\İ]K˜İ\œ™[XØ[]XÚÕ\™Ù]
]XÚÙ\‹Y™[™\ŠJ^ØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÜ™]\›ˆ[
	ĞÛÛX˜]H[°è[YËˆÙ[XÚ[Û™H[HY™\œğè\š[È[È[Ø[˜ÙK‰Ê_Bˆ]XÚÙ\‹˜]XÚÙY\›\İ]K\›ÂˆYŠY™[™\‹™˜XÙQİÛŠ\™]\›ˆ™]™X[Y™[™\ŠY™[™\ŠNÂˆ][Y\ÏVØ]XÚÙ\‹‹‹œİ]Kœ^Y\œÖØ]XÚÙ\‹›İÛ™\—K[š]Ë™š[\ŠOOKšYOOX]XÚÙ\‹šY	‰Kœ›İÈOO[[	‰ˆ]K™˜XÙQİÛ‰‰˜Y˜XÙ[
KY™[™\ŠJWK]ÏX[Y\Ëœ™YXÙJ
İ[KJOOœİ[JÙY™™Xİ]™P]ÊK˜[ÙJK
K[™˜[OX[Y\Ë™š[™
OOš\ÑY™™Xİ
K	Ú[™˜[IÊJNÂˆYŠ[Y\Ë›[™İŒI‰š[™˜[J^Û]™\İSX]›X^
‹‹˜[Y\Ë›X\
OO™Y™™Xİ]™P]ÊK˜[ÙJJJNØ]ÊÏX™\İÛÙÊ	ĞH[™˜[\šXHØœ›İHÈ]\]YHH[H\XÚ\[K‰Ê_Bˆ]Y]ÏYY™™Xİ]™P]ÊY™[™\‹YJKİÙ\\İ]Kœ^Y\œÖÙY™[™\‹›İÛ™\—K[š]Ë™š[™
OOš\ÑY™™Xİ
K	İİÙ\‰ÊI‰KšYOOYY™[™\‹šY	‰˜Y˜XÙ[
KY™[™\ŠJK™\œÚ[ÛYØ[YU™\œÚ[ÛÂˆİ]K˜[š[X][™Ï]YNØ[Y\Ë™›Ü‘XXÚ
OOİK˜ÛÛX˜]›ÛOIØ]XÚÙ\‰ÎİK˜ÛÛX˜]YY™[™\‹˜ÛÛ]K˜ÛÛİK˜ÛÛX˜]OYY™[™\‹œ›İË]Kœ›İßJNÙY™[™\‹˜ÛÛX˜]›ÛOIÙY™[™\‰ÎÚYŠ]Ï™Y]É‰İÙ\Š]İÙ\‹˜ÛÛX˜]›ÛOIÜØXÜšYšXÙIÎØÛX\Xİ[ÛŠ
NÜ™[™\Š
NÛ]ÛÛX˜]X™[X	Ø[Y\Ë›[™İŒOÉĞ]\]YHÛÛš[ÉÎ‰ĞÛÛX˜]IßNˆ	Ø]ßH0åÈ	ÙY]ßXÚ[
ÛÛX˜]X™[
NÚYŠÛ›[™S[ÙJ\Ù[™XÚÙ]
İ\N‰İš\İX[	ËÚ[™‰ØÛÛX˜]	Ë]XÚÙ\œÎ˜[Y\Ë›X\
OOKšY
KY™[™\™Y™[™\‹šYİÙ\˜]Ï™Y]É‰İÙ\İİÙ\‹šY›[X™[˜ÛÛX˜]X™[JNÜÙ][Y[İ]


OOœ™\ÛÛ™PÛÛX˜]
]XÚÙ\‹Y™[™\‹[Y\Ë]ËY]ËİÙ\‹™\œÚ[ÛŠKÍŒ
BŸB™[˜İ[Ûˆ]Y]YTİÛÜ™˜[œÙ™\ŠİÛ™\Š^Üİ]KœİÛÜ™]Y]YKœ\Ú
İÛ™\ŠNÚYŠ\İ]K˜[š[X][™Ê[Ü[”İÛÜ™˜[œÙ™\Š
_B™[˜İ[ÛˆÜ[”İÛÜ™˜[œÙ™\Š
^ÚYŠ\İ]KœİÛÜ™]Y]YK›[™İÛ›[™S[ÙI‰œİ]KœİÛÜ™]Y]YVÌHOO[ØØ[^Y\ŸI
	ÈÜİÛÜ™]˜[œÙ™\‰ÊK˜Û\ÜÓ\İ˜ÛÛZ[œÊ	ÚY[‰ÊJ\™]\›Û]İÛ™\\İ]KœİÛÜ™]Y]YVÌK\İ]Kœ^Y\œÖÛİÛ™\—KÚÚXÙ\ÏX[[š]Ê
K™š[\ŠOOKœ›İÈOO[[
NÚYŠXÚÚXÙ\Ë›[™İ
^ÛÙÊ	ĞH\ÜYHX[]HYİX\™Hİ]›ÈpèÛÈ[HØ[\Ë‰ÊNÜ™[™\“ÙÊ
NÜ™]\›ŸZYŠ›İ[ÙI‰›İÛ™\OOX›İ^Y\Š^Û]\™Ù]XÚÚXÙ\ËœÛÜ

KŠOO™Y™™Xİ]™P]Ê‹˜[ÙJKYY™™Xİ]™P]ÊK˜[ÙJJVÌNÜ™]\›ˆØÚY[P›İ


OO˜ÛÛ\]TİÛÜ™˜[œÙ™\ŠİÛ™\‹\™Ù]šY
KÍL
_I
	ÈÜİÛÜ™[İÛ™\‹[˜[YIÊK^ÛÛ[X	Ü›˜[Y_Nˆ\ØÛÛH]X[]Y\ˆpèÛÈ[HØ[\ØÉ
	ÈÜİÛÜ™[Ü[ÛœÉÊKš[›™\’SXÚÚXÙ\Ë›X\
OO˜]ÛˆÛ\ÜÏHœİÛÜ™[Ü[Ûˆˆ]KZYH‰İKšYH‰İ[š]š\İX[
K	ÜİÛÜ™X\	Ê_O‰İK›˜[Y_OØÛX[‰İK›İÛ™\OO[İÛ™\ÉĞSPQÉÎ‰ĞQ‘T”ğàT’SÉßH0­ÈUÈ	İK˜]ßOÜÛX[Ø]Û˜
Kš›Ú[Š	ÉÊNÉ	
	ËœİÛÜ™[Ü[Û‰ÊK™›Ü‘XXÚ
]ÛO˜]Û‹›Û˜ÛXÚÏJ
OO˜ÛÛ\]TİÛÜ™˜[œÙ™\ŠİÛ™\‹]Û‹™]\Ù]šY
JNÉ
	ÈÜİÛÜ™]˜[œÙ™\‰ÊK˜Û\ÜÓ\İœ™[[İ™J	ÚY[‰Ê_B