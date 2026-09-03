var onlineMode=false,localPlayer=null,onlineRole=null,peerConnection=null,dataChannel=null,spectatorChannels=[],onlineSpectators=[],applyingRemote=false,remoteDeck=null,remoteName='',onlineNames={1:'Duelista 1',2:'Duelista 2'},onlineAccounts={1:null,2:null},networkSequence=0,networkRevision=0,roomCode='',reconnectTimer=null,heartbeatTimer=null,deckSyncTimer=null,stateRetryTimer=null,stateSyncTimer=null,remoteVisualTimer=null,reconnectAttempts=0,pendingStatePacket=null,lastPacketAt=0,stateChunks={},quickMatchTicket=null,quickMatchTimer=null,quickMatchSearching=false,quickMatchConnection=false,quickMatchStarting=false;
const STATE_CHUNK_SIZE=8000;

function networkStatus(text,kind=''){
 const box=document.querySelector('.signal-status'),label=document.querySelector('#connection-status');
 if(label)label.textContent=text;if(box)box.className=`signal-status ${kind}`;
 const badge=document.querySelector('#network-badge');
 if(badge){badge.classList.toggle('connected',kind==='connected');badge.querySelector('span').textContent=kind==='connected'?(onlineRole==='spectator'?'ESPECTADOR · ONLINE':`J${localPlayer} · ONLINE`):'CONECTANDO'}
}
function updateRematchAvailability(){let button=document.querySelector('#winner-restart');if(!button)return;let unavailable=onlineMode&&(onlineRole==='spectator'||!dataChannel?.open);button.disabled=unavailable;button.title=unavailable?'O outro duelista não está mais conectado.':''}
function cleanRoomCode(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)}
function cleanPlayerName(value){return String(value||'').replace(/[<>]/g,'').trim().replace(/\s+/g,' ').slice(0,24)}
function getOnlineName(fallback='Duelista'){let account=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null;if(account)return account.username;let input=document.querySelector('#online-name'),name=cleanPlayerName(input?.value);if(input)input.value=name;return name||fallback}
function lobbyDeckName(key){return typeof accountDeckNames!=='undefined'&&accountDeckNames[key]?accountDeckNames[key]:String(key||'SEM DECK').toUpperCase()}
function lobbyParticipantCard(name,account,deck,role,dim=false){let safe=typeof safeAccountSnapshot==='function'?safeAccountSnapshot(account):null,icon=typeof profileIconUrl==='function'?profileIconUrl(safe?.profileIcon):'assets/icons/flower-twirl.svg',color=typeof profileStyle==='function'?profileStyle(safe?.profileColor):'--profile-color:#7f4c91',favorite=typeof mostUsedDeck==='function'?mostUsedDeck(safe?.deckUsage):null;return`<article class="lobby-participant${dim?' spectator':''}"><span class="lobby-profile-icon" style="${color}"><img src="${icon}" alt=""></span><span><small>${role}</small><b>${safe?.username||cleanPlayerName(name)||'Aguardando jogador'}</b><em>${safe?`${safe.rating} FLUX · ${safe.wins}V/${safe.losses}D · ${favorite?lobbyDeckName(favorite):'SEM HISTÓRICO'}`:'CONVIDADO'}${deck?` · DECK ${lobbyDeckName(deck)}`:''}</em></span></article>`}
function renderLobbyParticipants(){let area=document.querySelector('#lobby-participants');if(!area)return;area.classList.toggle('hidden',!onlineMode||!onlineRole);if(!onlineMode||!onlineRole)return;let p1=document.querySelector('#lobby-player-one'),p2=document.querySelector('#lobby-player-two'),spectators=document.querySelector('#lobby-spectators');p1.innerHTML=lobbyParticipantCard(onlineNames[1],onlineAccounts[1],selectedDecks[1],'DUELISTA 1');p2.innerHTML=remoteDeck||onlineAccounts[2]||onlineRole==='guest'?lobbyParticipantCard(onlineNames[2],onlineAccounts[2],selectedDecks[2],'DUELISTA 2'):lobbyParticipantCard('',null,null,'DUELISTA 2');spectators.innerHTML=onlineSpectators.map(item=>lobbyParticipantCard(item.name,item.account,null,'ESPECTADOR',true)).join('')}
function updatePointGoalControl(){let control=document.querySelector('#point-goal-control');if(control)control.classList.toggle('hidden',onlineMode&&onlineRole!=='host')}
function getRoomCode(){
 const input=document.querySelector('#room-code');roomCode=cleanRoomCode(input.value);input.value=roomCode;
 if(roomCode.length>=1&&roomCode.length<=12){input.classList.remove('invalid');return roomCode}
 input.classList.remove('invalid');void input.offsetWidth;input.classList.add('invalid');networkStatus('Use um código de 1 a 12 letras ou números','error');return null
}
function generateRoomCode(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',values=new Uint32Array(8);crypto.getRandomValues(values);
 document.querySelector('#room-code').value=[...values].map(value=>alphabet[value%alphabet.length]).join('');networkStatus('Código pronto — use o mesmo nos dois dispositivos','')
}
function roomPeerId(code){return `confluxo-${code.toLowerCase()}`}
function gameStarted(){return document.querySelector('#setup').classList.contains('hidden')}
function clearConnectionTimers(){clearTimeout(reconnectTimer);clearInterval(heartbeatTimer);clearInterval(deckSyncTimer);clearTimeout(stateRetryTimer);clearTimeout(stateSyncTimer);reconnectTimer=null;heartbeatTimer=null;deckSyncTimer=null;stateRetryTimer=null;stateSyncTimer=null}
function closePeer(){
 clearConnectionTimers();reconnectAttempts=0;networkRevision=0;pendingStatePacket=null;lastPacketAt=0;stateChunks={};
 const channel=dataChannel,peer=peerConnection,spectators=[...spectatorChannels];dataChannel=null;peerConnection=null;spectatorChannels=[];onlineSpectators=[];remoteDeck=null;remoteName='';renderLobbyParticipants();
 try{channel?.removeAllListeners?.();channel?.close();spectators.forEach(item=>{item.removeAllListeners?.();item.close()});peer?.removeAllListeners?.();peer?.destroy()}catch{}
}
function makePeer(id){
 const oldPeer=peerConnection;peerConnection=null;try{oldPeer?.removeAllListeners?.();oldPeer?.destroy()}catch{}
 if(typeof Peer==='undefined'){networkStatus('Não foi possível carregar o serviço online','error');return null}
 peerConnection=id?new Peer(id,{debug:0}):new Peer({debug:0});
 peerConnection.on('error',handlePeerError);
 peerConnection.on('disconnected',()=>{if(dataChannel?.open){setTimeout(()=>{try{if(peerConnection&&!peerConnection.destroyed&&peerConnection.disconnected)peerConnection.reconnect()}catch{}},900);return}networkStatus('Reconectando ao serviço de salas…','connecting');scheduleReconnect()});
 return peerConnection
}
function handlePeerError(error){
 const messages={'unavailable-id':'Esse código já possui uma sala. Use Entrar na sala.','peer-unavailable':'Sala não encontrada. Confirme o código e tente novamente.',network:'Não foi possível alcançar o serviço de salas.','server-error':'O serviço de salas está temporariamente indisponível.','browser-incompatible':'Este navegador não suporta a conexão online.'};
 const signallingOnly=['network','server-error','socket-error','socket-closed','disconnected','unavailable-id'].includes(error?.type);
 if(dataChannel?.open&&signallingOnly)return;
 if((quickMatchConnection||document.querySelector('#setup').classList.contains('hidden'))&&error?.type!=='browser-incompatible'){networkStatus('Reconectando a partida…','connecting');scheduleReconnect();return}
 clearTimeout(reconnectTimer);reconnectTimer=null;networkStatus(messages[error?.type]||'Não foi possível estabelecer a conexão','error');setLobbyBusy(false)
}
function setLobbyBusy(busy){document.querySelector('#host-online').disabled=busy;document.querySelector('#join-online').disabled=busy;document.querySelector('#quick-match-online').disabled=busy;document.querySelector('#generate-code').disabled=busy;document.querySelector('#room-code').disabled=busy;document.querySelector('#online-name').disabled=busy}
function selectedLobbyDeck(){return document.querySelector('.choice-row[data-player="1"] .deck-choice.selected')?.dataset.deck||'xadria'}
function sendDeckChoice(type='deck'){if(!localPlayer)return false;onlineAccounts[localPlayer]=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null;return sendPacket({type,deck:selectedDecks[localPlayer],name:onlineNames[localPlayer],account:onlineAccounts[localPlayer],player:localPlayer,pointGoal:onlineRole==='host'?selectedPointGoal():pointGoal})}
function stopDeckSync(){clearInterval(deckSyncTimer);deckSyncTimer=null}
function startDeckSync(){
 stopDeckSync();sendDeckChoice();sendPacket({type:'deck-request'});
 deckSyncTimer=setInterval(()=>{if(!onlineMode||!dataChannel?.open)return stopDeckSync();if(remoteDeck)return stopDeckSync();sendDeckChoice();sendPacket({type:'deck-request'});networkStatus('Conectado - confirmando os decks...','connecting')},800)
}
function verifyRemoteAccount(player,value){if(typeof lookupAccountProfile!=='function')return;lookupAccountProfile(value).then(profile=>{onlineAccounts[player]=profile;if(profile)onlineNames[player]=profile.username;if(state?.players?.[player]){state.players[player].account=profile;if(profile)state.players[player].name=profile.username;render()}renderLobbyParticipants();updateOnlineStart()})}
function acceptRemoteDeck(packet){
 if(!packet.deck)return false;let other=localPlayer===1?2:1;remoteDeck=packet.deck;onlineAccounts[other]=typeof safeAccountSnapshot==='function'?safeAccountSnapshot(packet.account):null;verifyRemoteAccount(other,packet.account);remoteName=onlineAccounts[other]?.username||cleanPlayerName(packet.name)||`Duelista ${other}`;onlineNames[other]=remoteName;selectedDecks[other]=packet.deck;if(onlineRole==='guest')setPointGoal(packet.pointGoal);stopDeckSync();renderLobbyParticipants();updateOnlineStart();if(maybeStartQuickMatch())networkStatus('Adversário encontrado — iniciando a partida…','connecting');else networkStatus(onlineRole==='host'?'Sala pronta — clique em Iniciar Partida Online':'Sala pronta — aguardando o anfitrião','connected');return true
}
function sendChannelPacket(channel,packet,prefix='spectator'){
 if(!channel?.open)return false;try{let serialized=packet?.type==='state'?JSON.stringify(packet):null;if(serialized&&serialized.length>STATE_CHUNK_SIZE){let total=Math.ceil(serialized.length/STATE_CHUNK_SIZE),id=`${prefix}-${packet.revision}-${packet.sequence||Date.now()}`;for(let index=0;index<total;index++)channel.send({type:'state-chunk',id,index,total,data:serialized.slice(index*STATE_CHUNK_SIZE,(index+1)*STATE_CHUNK_SIZE)});return true}channel.send(packet);return true}catch{return false}
}
function spectatorSnapshot(){return gameStarted()&&state?{type:'state',actor:0,sequence:networkSequence,revision:networkRevision,force:true,started:true,state:cloneNetworkValue(state),selectedDecks:cloneNetworkValue(selectedDecks)}:{type:'spectator-lobby',names:cloneNetworkValue(onlineNames),accounts:cloneNetworkValue(onlineAccounts),spectators:cloneNetworkValue(onlineSpectators),selectedDecks:cloneNetworkValue(selectedDecks),pointGoal:selectedPointGoal()}}
function sendSpectatorSnapshot(channel){return sendChannelPacket(channel,spectatorSnapshot(),'watch')}
function broadcastSpectators(packet){spectatorChannels=spectatorChannels.filter(channel=>channel?.open);spectatorChannels.forEach(channel=>sendChannelPacket(channel,packet,'watch'))}
function syncSpectatorRoster(){onlineSpectators=spectatorChannels.filter(channel=>channel?.open).map(channel=>channel.spectatorProfile).filter(Boolean);renderLobbyParticipants();let packet={type:'spectator-list',spectators:cloneNetworkValue(onlineSpectators)};if(dataChannel?.open)sendChannelPacket(dataChannel,packet,'players');spectatorChannels.forEach(channel=>sendChannelPacket(channel,packet,'watch'))}
function attachSpectatorChannel(channel,autoAssigned=false){let supplied=typeof safeAccountSnapshot==='function'?safeAccountSnapshot(channel.metadata?.account):null;channel.spectatorProfile={name:supplied?.username||cleanPlayerName(channel.metadata?.name)||'Espectador',account:supplied};spectatorChannels.push(channel);if(supplied&&typeof lookupAccountProfile==='function')lookupAccountProfile(supplied).then(profile=>{if(profile)channel.spectatorProfile={name:profile.username,account:profile};syncSpectatorRoster()});channel.on('open',()=>{if(autoAssigned)sendChannelPacket(channel,{type:'spectator-assigned'},'watch');syncSpectatorRoster();sendSpectatorSnapshot(channel)});channel.on('data',packet=>{if(packet?.type==='heartbeat')return sendChannelPacket(channel,{type:'heartbeat',at:Date.now()});if(packet?.type==='spectate-request')sendSpectatorSnapshot(channel)});channel.on('close',()=>{spectatorChannels=spectatorChannels.filter(item=>item!==channel);syncSpectatorRoster()});channel.on('error',()=>{spectatorChannels=spectatorChannels.filter(item=>item!==channel);syncSpectatorRoster()})}
function attachChannel(channel){
 const previous=dataChannel;if(previous&&previous!==channel){try{previous.removeAllListeners?.();previous.close()}catch{}}
 dataChannel=channel;
 dataChannel.on('open',()=>{if(channel!==dataChannel)return;clearTimeout(reconnectTimer);reconnectTimer=null;reconnectAttempts=0;lastPacketAt=Date.now();startHeartbeat();updateRematchAvailability();document.querySelector('#network-badge').classList.remove('hidden');document.body.classList.remove('connection-lost');if(onlineRole==='spectator'){networkStatus('Conectado como espectador','connected');sendPacket({type:'spectate-request'});return}networkStatus('Conectado ao outro duelista','connected');startDeckSync();updateOnlineStart();if(state&&gameStarted())updateOnlineLock();if(gameStarted()){flushPendingState();sendPacket({type:'sync-request',revision:networkRevision});if(onlineRole==='host')setTimeout(()=>sendGameState(true,false),80)}});
 dataChannel.on('data',raw=>{if(channel===dataChannel){if(onlineRole==='host'&&['visual','state','state-chunk'].includes(raw?.type))broadcastSpectators(raw);receivePacket(raw)}});
 dataChannel.on('close',()=>handleChannelClose(channel));
 dataChannel.on('error',()=>{if(channel===dataChannel&&!channel.open)handleChannelClose(channel)})
}
function startHeartbeat(){
 clearInterval(heartbeatTimer);heartbeatTimer=setInterval(()=>{if(!dataChannel?.open)return;if(lastPacketAt&&Date.now()-lastPacketAt>20000){let stale=dataChannel;try{stale.close()}catch{}handleChannelClose(stale);return}sendPacket({type:'heartbeat',at:Date.now()})},5000)
}
function handleChannelClose(channel){
 if(channel===dataChannel)stopDeckSync();
 if(!onlineMode||channel!==dataChannel)return;clearInterval(heartbeatTimer);heartbeatTimer=null;dataChannel=null;updateRematchAvailability();networkStatus('Reconectando a partida…','connecting');document.body.classList.add('online-waiting','connection-lost');scheduleReconnect()
}
function scheduleReconnect(delay){
 if(!onlineMode||dataChannel?.open||reconnectTimer)return;let wait=delay??Math.min(1000+reconnectAttempts*700,5000);reconnectTimer=setTimeout(()=>{reconnectTimer=null;reconnectAttempts++;recoverConnection()},wait)
}
function recoverConnection(){
 if(!onlineMode||dataChannel?.open||!roomCode)return;
 if(dataChannel){scheduleReconnect(5000);return}
 if(onlineRole==='host')ensureHostPeer(true);else ensureGuestPeer(true)
}
function ensureHostPeer(recovering=false){
 if(peerConnection&&!peerConnection.destroyed){if(peerConnection.disconnected){try{peerConnection.reconnect()}catch{}}scheduleReconnect(3500);return peerConnection}
 const peer=makePeer(roomPeerId(roomCode));if(!peer){scheduleReconnect();return null}
 peer.on('open',()=>{if(!dataChannel?.open)networkStatus(recovering?'Sala recuperada — aguardando o adversário':'Sala pronta — aguardando o Duelista 2','connecting')});
 peer.on('connection',channel=>{if(channel.metadata?.role==='spectator')return attachSpectatorChannel(channel);if(dataChannel)return attachSpectatorChannel(channel,true);attachChannel(channel)});scheduleReconnect(5000);return peer
}
function connectGuestToHost(){
 if(!peerConnection||peerConnection.destroyed||peerConnection.disconnected||dataChannel?.open)return scheduleReconnect();
 const identity=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null,channel=peerConnection.connect(roomPeerId(roomCode),{reliable:true,serialization:'json',metadata:{room:roomCode,role:onlineRole==='spectator'?'spectator':'player',name:getOnlineName('Espectador'),account:identity}});attachChannel(channel);setTimeout(()=>{if(channel===dataChannel&&!channel.open){try{channel.close()}catch{}handleChannelClose(channel)}},10000)
}
function ensureGuestPeer(recovering=false){
 if(peerConnection&&!peerConnection.destroyed){if(peerConnection.disconnected){try{peerConnection.reconnect()}catch{}scheduleReconnect();return peerConnection}connectGuestToHost();return peerConnection}
 const peer=makePeer();if(!peer){scheduleReconnect();return null}peer.on('open',()=>{if(!dataChannel?.open){networkStatus(recovering?'Reencontrando a sala…':'Procurando a sala…','connecting');connectGuestToHost()}});scheduleReconnect(5000);return peer
}
function createRoom(){
 if(['host','guest','spectator'].includes(onlineRole)&&(peerConnection||dataChannel||roomCode))return leaveOnlineRoom();
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='host';localPlayer=1;botVsBot=false;document.body.classList.remove('spectator-mode');selectedDecks[1]=selectedLobbyDeck();onlineAccounts[1]=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null;onlineNames[1]=getOnlineName('Duelista 1');chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Criando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureHostPeer();if(!peer)return;
 peer.on('open',()=>networkStatus(`Sala ${code} pronta — aguardando o Duelista 2`,'connecting'))
}
function joinRoom(){
 if(['host','guest','spectator'].includes(onlineRole)&&(peerConnection||dataChannel||roomCode))return leaveOnlineRoom();
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='guest';localPlayer=2;botVsBot=false;document.body.classList.remove('spectator-mode');selectedDecks[2]=selectedLobbyDeck();onlineAccounts[2]=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null;onlineNames[2]=getOnlineName('Duelista 2');chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Procurando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureGuestPeer();if(!peer)return;
 setTimeout(()=>{if(!dataChannel?.open&&document.querySelector('#setup').classList.contains('hidden')===false)handlePeerError({type:'peer-unavailable'})},12000)
}
function promoteToSpectator(){onlineRole='spectator';localPlayer=null;botVsBot=true;spectatorViewPlayer=1;quickMatchConnection=false;document.body.classList.add('spectator-mode');document.querySelector('.setup-card').classList.add('spectator-setup');document.querySelector('.setup-card').classList.remove('quick-match-setup');document.querySelectorAll('.lobby-role').forEach(button=>button.classList.toggle('selected',button.id==='join-online'));updatePointGoalControl();renderLobbyParticipants();updateOnlineStart();updateRematchAvailability();networkStatus('Sala cheia — você entrou como espectador','connected');sendPacket({type:'spectate-request'})}
function leaveOnlineRoom(notify=true,message='Você saiu da sala'){if(notify){sendPacket({type:'room-left'});if(onlineRole==='host')broadcastSpectators({type:'room-left'})}stopQuickMatch();quickMatchConnection=false;quickMatchStarting=false;closePeer();onlineRole=null;localPlayer=null;roomCode='';botVsBot=false;document.body.classList.remove('spectator-mode','online-waiting','connection-lost');document.querySelector('.setup-card').classList.remove('spectator-setup','quick-match-setup');document.querySelectorAll('.lobby-role').forEach(button=>button.classList.remove('selected'));document.querySelectorAll('.choice-row').forEach(row=>row.classList.remove('online-only-player','remote-player'));document.querySelector('#player-one-label').textContent='SEU DECK';document.querySelector('#point-goal').disabled=true;setLobbyBusy(false);updatePointGoalControl();renderLobbyParticipants();updateRematchAvailability();let start=document.querySelector('#start-game');start.disabled=true;start.textContent='DIGITE O CÓDIGO DA SALA';networkStatus(message,'')}
function watchRoom(){
 const code=getRoomCode();if(!code)return;onlineMode=true;onlineRole='spectator';localPlayer=null;botVsBot=true;spectatorViewPlayer=1;document.body.classList.add('spectator-mode');chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Procurando a sala para assistir…','connecting');closePeer();roomCode=code;const peer=ensureGuestPeer();if(!peer)return;setTimeout(()=>{if(!dataChannel?.open&&!gameStarted())handlePeerError({type:'peer-unavailable'})},12000)
}
function chooseOwnDeckRow(){
 const selectedRole=onlineRole==='host'?'host-online':onlineRole==='guest'||onlineRole==='spectator'?'join-online':onlineRole==='quick'?'quick-match-online':null;document.querySelectorAll('.lobby-role').forEach(button=>button.classList.toggle('selected',button.id===selectedRole));
 document.querySelector('.setup-card').classList.toggle('spectator-setup',onlineRole==='spectator');document.querySelector('#player-one-label').textContent=onlineRole==='spectator'?'ESPECTADOR':`SEU DECK · ${onlineNames[localPlayer]||''}`;document.querySelectorAll('.choice-row').forEach(row=>{let own=+row.dataset.player===1;row.classList.toggle('online-only-player',own);row.classList.toggle('remote-player',!own)});
 document.querySelector('#point-goal').disabled=onlineRole!=='host';updatePointGoalControl();renderLobbyParticipants();updateOnlineStart()
}
function sendPacket(packet){
 if(!dataChannel?.open)return false;
 try{
  let serialized=packet?.type==='state'?JSON.stringify(packet):null;
  if(serialized&&serialized.length>STATE_CHUNK_SIZE){let total=Math.ceil(serialized.length/STATE_CHUNK_SIZE),id=`${localPlayer}-${packet.revision}-${packet.sequence}`;for(let index=0;index<total;index++)dataChannel.send({type:'state-chunk',id,index,total,data:serialized.slice(index*STATE_CHUNK_SIZE,(index+1)*STATE_CHUNK_SIZE)});return true}
  dataChannel.send(packet);if(onlineRole==='host'&&packet?.type==='visual')broadcastSpectators(packet);return true
 }catch(error){console.error('Falha ao enviar pacote online',error);networkStatus('Falha no envio — tentando novamente…','connecting');return false}
}
function cloneNetworkValue(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function findInspectedUnit(id){if(!id||!state?.players)return null;for(let player of [1,2]){let p=state.players[player]||{};let found=[...(p.units||[]),...(p.reserve||[]),...(p.initialUnits||[])].find(u=>u.id===id);if(found)return found}return null}
function scheduleStateRetry(){
 clearTimeout(stateRetryTimer);stateRetryTimer=null;if(!pendingStatePacket)return;
 stateRetryTimer=setTimeout(()=>{if(!pendingStatePacket)return;if(dataChannel?.open){sendPacket(pendingStatePacket);networkStatus('Sincronizando a jogada…','connecting')}scheduleStateRetry()},900)
}
function flushPendingState(){if(!pendingStatePacket||!dataChannel?.open)return false;let sent=sendPacket(pendingStatePacket);if(sent)scheduleStateRetry();return sent}
function acknowledgeState(revision){sendPacket({type:'state-ack',revision})}
function sendGameState(force=false,advance=!force,allowAnimating=false){
 if(!onlineMode||!gameStarted()||applyingRemote||!state||state.animating&&!allowAnimating)return false;
 if(advance)networkRevision++;
 let packet={type:'state',actor:localPlayer,sequence:++networkSequence,revision:networkRevision,force,started:document.querySelector('#setup').classList.contains('hidden'),state:cloneNetworkValue(state),selectedDecks:cloneNetworkValue(selectedDecks)};
 if(advance||!pendingStatePacket||pendingStatePacket.revision<=packet.revision)pendingStatePacket=packet;
 if(onlineRole==='host')broadcastSpectators(packet);
 return flushPendingState()
}
function syncOnlineState(urgent=false){
 if(!onlineMode)return;clearTimeout(stateSyncTimer);stateSyncTimer=null;
 if(urgent)return sendGameState();
 stateSyncTimer=setTimeout(()=>{stateSyncTimer=null;sendGameState()},35)
}
function syncOnlineAnimationState(){if(!onlineMode)return false;clearTimeout(stateSyncTimer);stateSyncTimer=null;return sendGameState(false,true,true)}
function receivePacket(raw){
 let packet=raw;if(typeof raw==='string'){try{packet=JSON.parse(raw)}catch{return}}
 if(!packet||typeof packet!=='object')return;
 lastPacketAt=Date.now();
 if(packet.type==='heartbeat')return;
 if(packet.type==='room-left')return leaveOnlineRoom(false,'O outro duelista saiu da sala');
 if(packet.type==='spectator-assigned')return promoteToSpectator();
 if(packet.type==='spectator-list'){onlineSpectators=Array.isArray(packet.spectators)?packet.spectators:[];renderLobbyParticipants();return}
 if(packet.type==='spectator-lobby'){onlineNames=packet.names||onlineNames;onlineAccounts=packet.accounts||onlineAccounts;onlineSpectators=Array.isArray(packet.spectators)?packet.spectators:onlineSpectators;selectedDecks=packet.selectedDecks||selectedDecks;setPointGoal(packet.pointGoal);renderLobbyParticipants();networkStatus('Sala encontrada — aguardando o início da partida','connected');return}
 if(packet.type==='state-chunk'){
  let index=Number(packet.index),total=Number(packet.total);if(!packet.id||!Number.isInteger(index)||!Number.isInteger(total)||index<0||index>=total||total>100||typeof packet.data!=='string')return;
  let transfer=stateChunks[packet.id];if(!transfer||transfer.total!==total)transfer=stateChunks[packet.id]={total,parts:Array(total),received:0};if(transfer.parts[index]===undefined){transfer.parts[index]=packet.data;transfer.received++}if(transfer.received===total){delete stateChunks[packet.id];try{receivePacket(JSON.parse(transfer.parts.join('')))}catch{sendPacket({type:'sync-request',revision:networkRevision})}}return
 }
 if(packet.type==='state-ack'){if(pendingStatePacket&&Number(packet.revision)>=pendingStatePacket.revision){pendingStatePacket=null;clearTimeout(stateRetryTimer);stateRetryTimer=null;networkStatus('Jogada sincronizada','connected')}return}
 if(packet.type==='sync-request'){
  if(!gameStarted())return;
  let remoteRevision=Number(packet.revision)||0;
  if(pendingStatePacket&&pendingStatePacket.revision>=remoteRevision)flushPendingState();else if(state&&networkRevision>=remoteRevision)sendGameState(true,false);
  return
 }
 if(packet.type==='visual'&&state){clearTimeout(remoteVisualTimer);let units=allUnits();state.animating=true;if(packet.kind==='combat'){let defender=units.find(u=>u.id===packet.defender);(packet.attackers||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u&&defender){u.combatRole='attacker';u.combatDx=defender.col-u.col;u.combatDy=defender.row-u.row}});if(defender)defender.combatRole='defender';let tower=units.find(u=>u.id===packet.tower);if(tower)tower.combatRole='sacrifice';hint(packet.label||'Combate em andamento…')}else if(packet.kind==='combine'){(packet.materials||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u){u.combining=true;u.combineDx=packet.pos.col-u.col;u.combineDy=packet.pos.row-u.row}});hint('Combinando materiais…')}else if(packet.kind==='move'){let u=units.find(x=>x.id===packet.unit);if(u&&packet.from&&packet.to){u.moving=true;u.moveDx=packet.from.col-packet.to.col;u.moveDy=packet.from.row-packet.to.row;place(u,packet.to.row,packet.to.col);hint(`${u.name} em movimento…`)}}render();remoteVisualTimer=setTimeout(()=>{if(!state?.animating)return;clearAnimationMarks(allUnits());state.animating=false;render()},packet.kind==='move'?650:1200);return}
 if(packet.type==='deck-request'){sendDeckChoice();return}
 if(packet.type==='deck'){if(acceptRemoteDeck(packet))sendDeckChoice('deck-ack');return}
 if(packet.type==='deck-ack'){acceptRemoteDeck(packet);return}
 if(packet.type==='restart-request'&&onlineRole==='host'){if(confirm('O outro jogador quer reiniciar a partida. Aceitar?')){newGame();sendGameState(true,true)}return}
 if(packet.type!=='state'||!packet.state)return;
 let incomingRevision=Number(packet.revision);if(!Number.isFinite(incomingRevision))incomingRevision=networkRevision+1;
 if(incomingRevision<networkRevision){acknowledgeState(incomingRevision);sendGameState(true,false);return}
 if(incomingRevision===networkRevision&&state&&!packet.force){acknowledgeState(incomingRevision);return}
 networkRevision=incomingRevision;if(pendingStatePacket&&pendingStatePacket.revision<=networkRevision){pendingStatePacket=null;clearTimeout(stateRetryTimer);stateRetryTimer=null}
 let watching=typeof spectatingMatch==='function'&&spectatingMatch(),inspected=watching?spectatorSelected:selected,shownEffect=watching?spectatorEffect:selectedEffect,inspectedUnitId=inspected?.id,inspectedEffect=shownEffect?{...shownEffect}:null;
 clearTimeout(remoteVisualTimer);remoteVisualTimer=null;applyingRemote=true;if(packet.started){quickMatchConnection=false;quickMatchStarting=false;document.querySelector('#setup').classList.add('hidden')}state=packet.state;selectedDecks=packet.selectedDecks||selectedDecks;if(watching){spectatorSelected=findInspectedUnit(inspectedUnitId);spectatorEffect=inspectedEffect}else{selected=findInspectedUnit(inspectedUnitId);selectedEffect=inspectedEffect}mode=null;targets=[];pendingCard=null;castleFirst=null;fusionMaterials=[];
 document.querySelectorAll('#turn-draw,#pass,#sword-transfer').forEach(element=>element.classList.add('hidden'));render();applyingRemote=false;acknowledgeState(networkRevision);networkStatus('Jogada recebida','connected');checkWin();if(!state.forfeitWinner)resumeOnlinePhase()
}
function resumeOnlinePhase(){
 if(!onlineMode||!state)return;updateOnlineLock();if(onlineRole==='spectator')return;
 if(state.swordQueue?.[0]===localPlayer)return openSwordTransfer();
 if(state.placementPhase&&state.placementPlayer===localPlayer){beginInitialPlacement(localPlayer);return}
 if(!state.placementPhase&&state.current===localPlayer&&state.passPurpose){beginTurn();syncOnlineState()}
 else if(!state.placementPhase&&state.current===localPlayer&&state.awaitingDraw&&!state.players[localPlayer].drawn)openDrawChoice()
}
function updateOnlineLock(){
 if(!onlineMode||!state)return;if(onlineRole==='spectator'){document.body.classList.add('online-waiting');hint(`Assistindo pela visão de ${state.players[spectatorViewPlayer].name}.`);return}let active=canLocalAct()&&(state.placementPhase?state.placementPlayer===localPlayer:true);document.body.classList.toggle('online-waiting',!active);
 if(!active)hint(state.swordQueue?.length?'Aguardando a escolha da Espada Maldita…':`Aguardando a jogada de ${state.players[state.current].name}…`)
}
function updateOnlineStart(){
 if(!onlineMode)return;let start=document.querySelector('#start-game'),connected=!!dataChannel?.open;
 if(onlineRole==='host'){start.textContent=quickMatchConnection?'INICIANDO PARTIDA…':connected&&remoteDeck?'INICIAR PARTIDA ONLINE':connected?'SINCRONIZANDO DECKS…':'AGUARDANDO DUELISTA 2';start.disabled=quickMatchConnection||!(connected&&remoteDeck)}else if(onlineRole==='spectator'){start.textContent='ASSISTINDO À SALA';start.disabled=true}else if(onlineRole==='quick'){start.textContent=quickMatchSearching?'PROCURANDO ADVERSÁRIO…':'PRONTO · PROCURAR PARTIDA';start.disabled=quickMatchSearching}else{start.textContent=connected?'AGUARDANDO O ANFITRIÃO':'ENTRE EM UMA SALA';start.disabled=true}
}
function maybeStartQuickMatch(){if(!quickMatchConnection||quickMatchStarting||onlineRole!=='host'||!dataChannel?.open||!remoteDeck||gameStarted())return false;quickMatchStarting=true;updateOnlineStart();setTimeout(()=>{if(onlineRole==='host'&&dataChannel?.open&&remoteDeck&&!gameStarted())startOnlineGame();else quickMatchStarting=false},300);return true}
function makeQuickMatchTicket(){if(crypto.randomUUID)return crypto.randomUUID();let bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=bytes[6]&15|64;bytes[8]=bytes[8]&63|128;let hex=[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');return`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`}
function stopQuickMatch(remove=true){clearInterval(quickMatchTimer);quickMatchTimer=null;let ticket=quickMatchTicket;quickMatchTicket=null;quickMatchSearching=false;if(remove&&ticket&&accountClient)accountClient.rpc('leave_quick_match',{p_ticket:ticket}).then(()=>{}).catch(()=>{})}
function prepareQuickMatch(){stopQuickMatch();closePeer();onlineMode=true;onlineRole='quick';localPlayer=1;botVsBot=false;quickMatchConnection=false;setPointGoal(10);selectedDecks[1]=selectedLobbyDeck();onlineAccounts[1]=typeof accountPublicSnapshot==='function'?accountPublicSnapshot():null;onlineNames[1]=getOnlineName('Duelista');document.body.classList.remove('spectator-mode');document.querySelector('.setup-card').classList.add('quick-match-setup');chooseOwnDeckRow();setLobbyBusy(false);networkStatus('Escolha seu deck e clique em Pronto','')}
async function startQuickMatch(){if(quickMatchSearching)return;if(!accountClient)return networkStatus('A partida rápida precisa do serviço online. Recarregue a página e tente novamente.','error');selectedDecks[1]=selectedLobbyDeck();onlineNames[1]=getOnlineName('Duelista');quickMatchTicket=makeQuickMatchTicket();quickMatchSearching=true;setLobbyBusy(true);updateOnlineStart();networkStatus('Procurando um adversário…','connecting');let {data,error}=await accountClient.rpc('join_quick_match',{p_ticket:quickMatchTicket,p_name:onlineNames[1],p_deck:selectedDecks[1]});if(error)return failQuickMatch(error);if(processQuickMatch(data))return;quickMatchTimer=setInterval(pollQuickMatch,1400)}
async function pollQuickMatch(){if(!quickMatchTicket||!quickMatchSearching)return;let {data,error}=await accountClient.rpc('quick_match_status',{p_ticket:quickMatchTicket});if(error)return failQuickMatch(error);if(data?.status==='expired')return failQuickMatch(new Error('A busca expirou.'));processQuickMatch(data)}
function failQuickMatch(error){console.warn('Partida rápida indisponível:',error?.message||error);stopQuickMatch(false);setLobbyBusy(false);updateOnlineStart();networkStatus('Não foi possível procurar uma partida. Confira se a atualização do banco foi aplicada.','error')}
function processQuickMatch(result){if(!result||result.status!=='matched'||!result.roomCode)return false;let ticket=quickMatchTicket,matchedRole=result.role,code=cleanRoomCode(result.roomCode);clearInterval(quickMatchTimer);quickMatchTimer=null;quickMatchSearching=false;quickMatchTicket=null;if(ticket&&accountClient)accountClient.rpc('leave_quick_match',{p_ticket:ticket}).then(()=>{}).catch(()=>{});document.querySelector('#room-code').value=code;document.querySelector('.setup-card').classList.remove('quick-match-setup');quickMatchConnection=true;networkStatus('Adversário encontrado — conectando…','connecting');if(matchedRole==='host')createRoom();else setTimeout(joinRoom,700);return true}
function selectGameMode(mode){
 stopQuickMatch();quickMatchConnection=false;onlineMode=mode==='online';botMode=mode==='bot'||mode==='bots';botVsBot=mode==='bots';spectatorViewPlayer=1;document.body.classList.remove('spectator-mode');document.querySelector('#mode-local').classList.toggle('selected',mode==='local');document.querySelector('#mode-bot').classList.toggle('selected',mode==='bot');document.querySelector('#mode-bots').classList.toggle('selected',botVsBot);document.querySelector('#mode-online').classList.toggle('selected',onlineMode);document.querySelector('#setup-tab-local').classList.toggle('selected',!onlineMode);document.querySelector('#local-modes').classList.toggle('hidden',onlineMode);document.querySelector('#online-lobby').classList.toggle('hidden',!onlineMode);document.querySelector('.setup-card').classList.toggle('online-setup',onlineMode);document.querySelector('.setup-card').classList.remove('spectator-setup','quick-match-setup');document.querySelector('#player-two-label').textContent=botMode?'BOT · DUELISTA 2':'DUELISTA 2';document.querySelectorAll('.choice-row').forEach(row=>row.classList.remove('online-only-player','remote-player'));
 document.querySelector('#player-one-label').textContent=onlineMode?'SEU DECK':botVsBot?'BOT · DUELISTA 1':'DUELISTA 1';
 if(!onlineMode){closePeer();onlineRole=null;localPlayer=null;roomCode='';setLobbyBusy(false);document.querySelector('#point-goal').disabled=false;document.querySelector('#start-game').disabled=false;document.querySelector('#start-game').textContent=botVsBot?'ASSISTIR BOTS LUTAREM':botMode?'INICIAR CONTRA O BOT':'INICIAR DUELO LOCAL'}else{closePeer();onlineRole=null;localPlayer=null;document.querySelector('#point-goal').disabled=true;document.querySelector('#start-game').disabled=true;document.querySelector('#start-game').textContent='DIGITE O CÓDIGO DA SALA';networkStatus('Escolha seu deck, digite um código e entre','')}updatePointGoalControl();renderLobbyParticipants();updateRematchAvailability()
}
function onlineDeckChanged(player,deck){if(onlineMode&&player===localPlayer){if(onlineRole==='quick'){selectedDecks[1]=deck;updateOnlineStart();return}sendDeckChoice()}}
function startOnlineGame(){if(onlineRole==='quick')return startQuickMatch();if(onlineRole!=='host'||!dataChannel?.open||!remoteDeck)return;selectedPointGoal();networkStatus('Iniciando a partida…','connecting');document.querySelector('#setup').classList.add('hidden');newGame();quickMatchConnection=false;quickMatchStarting=false;sendGameState(true,true)}

document.addEventListener('DOMContentLoaded',()=>{
 const roomInput=document.querySelector('#room-code');
 roomInput.addEventListener('input',()=>{roomInput.value=cleanRoomCode(roomInput.value);roomInput.classList.remove('invalid')});
 roomInput.addEventListener('keydown',event=>{if(event.key==='Enter')document.querySelector('#join-online').click()});
 document.querySelector('#generate-code').onclick=generateRoomCode;
 document.querySelector('#setup-tab-local').onclick=()=>selectGameMode('local');document.querySelector('#mode-local').onclick=()=>selectGameMode('local');document.querySelector('#mode-bot').onclick=()=>selectGameMode('bot');document.querySelector('#mode-bots').onclick=()=>selectGameMode('bots');document.querySelector('#mode-online').onclick=()=>selectGameMode('online');document.querySelector('#host-online').onclick=createRoom;document.querySelector('#join-online').onclick=joinRoom;document.querySelector('#quick-match-online').onclick=prepareQuickMatch;
 window.addEventListener('online',()=>{if(onlineMode&&!dataChannel?.open){networkStatus('Internet restaurada — reconectando…','connecting');scheduleReconnect(100)}});
 window.addEventListener('offline',()=>{if(onlineMode){networkStatus('Sem internet — a partida tentará voltar automaticamente','connecting');document.body.classList.add('connection-lost')}});
 document.addEventListener('visibilitychange',()=>{if(!onlineMode||document.visibilityState!=='visible')return;if(dataChannel?.open){lastPacketAt=Date.now();sendPacket({type:'heartbeat',at:Date.now()});if(onlineRole==='spectator')sendPacket({type:'spectate-request'});else if(gameStarted()){flushPendingState();sendPacket({type:'sync-request',revision:networkRevision})}else sendDeckChoice()}else scheduleReconnect(100)});
 document.addEventListener('click',event=>{if(!onlineMode||applyingRemote||!state)return;if(event.target.closest('#setup,#rules-dialog'))return;let actor=state.placementPhase?state.placementPlayer:state.current;if(actor===localPlayer)syncOnlineState()},false)
});
