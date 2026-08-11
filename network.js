var onlineMode=false,localPlayer=null,onlineRole=null,peerConnection=null,dataChannel=null,applyingRemote=false,remoteDeck=null,networkSequence=0,roomCode='',reconnectTimer=null,heartbeatTimer=null,remoteVisualTimer=null,reconnectAttempts=0;

function networkStatus(text,kind=''){
 const box=document.querySelector('.signal-status'),label=document.querySelector('#connection-status');
 if(label)label.textContent=text;if(box)box.className=`signal-status ${kind}`;
 const badge=document.querySelector('#network-badge');
 if(badge){badge.classList.toggle('connected',kind==='connected');badge.querySelector('span').textContent=kind==='connected'?`J${localPlayer} · ONLINE`:'CONECTANDO'}
}
function cleanRoomCode(value){return String(value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,10)}
function getRoomCode(){
 const input=document.querySelector('#room-code');roomCode=cleanRoomCode(input.value);input.value=roomCode;
 if(roomCode.length===10){input.classList.remove('invalid');return roomCode}
 input.classList.remove('invalid');void input.offsetWidth;input.classList.add('invalid');networkStatus('O código precisa ter exatamente 10 letras','error');return null
}
function generateRoomCode(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ',values=new Uint32Array(10);crypto.getRandomValues(values);
 document.querySelector('#room-code').value=[...values].map(value=>alphabet[value%alphabet.length]).join('');networkStatus('Código pronto — use o mesmo nos dois dispositivos','')
}
function roomPeerId(code){return `confluxo-${code.toLowerCase()}`}
function clearConnectionTimers(){clearTimeout(reconnectTimer);clearInterval(heartbeatTimer);reconnectTimer=null;heartbeatTimer=null}
function closePeer(){
 clearConnectionTimers();reconnectAttempts=0;
 const channel=dataChannel,peer=peerConnection;dataChannel=null;peerConnection=null;remoteDeck=null;
 try{channel?.removeAllListeners?.();channel?.close();peer?.removeAllListeners?.();peer?.destroy()}catch{}
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
 if(document.querySelector('#setup').classList.contains('hidden')&&error?.type!=='browser-incompatible'){networkStatus('Reconectando a partida…','connecting');scheduleReconnect();return}
 clearTimeout(reconnectTimer);reconnectTimer=null;networkStatus(messages[error?.type]||'Não foi possível estabelecer a conexão','error');setLobbyBusy(false)
}
function setLobbyBusy(busy){document.querySelector('#host-online').disabled=busy;document.querySelector('#join-online').disabled=busy;document.querySelector('#generate-code').disabled=busy;document.querySelector('#room-code').disabled=busy}
function attachChannel(channel){
 const previous=dataChannel;if(previous&&previous!==channel){try{previous.removeAllListeners?.();previous.close()}catch{}}
 dataChannel=channel;
 dataChannel.on('open',()=>{if(channel!==dataChannel)return;clearTimeout(reconnectTimer);reconnectTimer=null;reconnectAttempts=0;startHeartbeat();networkStatus('Conectado ao outro duelista','connected');document.querySelector('#network-badge').classList.remove('hidden');document.body.classList.remove('connection-lost');sendPacket({type:'deck',deck:selectedDecks[localPlayer]});updateOnlineStart();if(state)updateOnlineLock();if(onlineRole==='host'&&document.querySelector('#setup').classList.contains('hidden'))setTimeout(()=>sendGameState(true),80)});
 dataChannel.on('data',receivePacket);
 dataChannel.on('close',()=>handleChannelClose(channel));
 dataChannel.on('error',()=>{if(channel===dataChannel&&!channel.open)handleChannelClose(channel)})
}
function startHeartbeat(){clearInterval(heartbeatTimer);heartbeatTimer=setInterval(()=>sendPacket({type:'heartbeat',at:Date.now()}),12000)}
function handleChannelClose(channel){
 if(!onlineMode||channel!==dataChannel)return;clearInterval(heartbeatTimer);heartbeatTimer=null;dataChannel=null;networkStatus('Reconectando a partida…','connecting');document.body.classList.add('online-waiting','connection-lost');scheduleReconnect()
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
 peer.on('connection',channel=>{if(dataChannel?.open)return channel.close();attachChannel(channel)});scheduleReconnect(5000);return peer
}
function connectGuestToHost(){
 if(!peerConnection||peerConnection.destroyed||peerConnection.disconnected||dataChannel?.open)return scheduleReconnect();
 const channel=peerConnection.connect(roomPeerId(roomCode),{reliable:true,serialization:'json',metadata:{room:roomCode}});attachChannel(channel);setTimeout(()=>{if(channel===dataChannel&&!channel.open){try{channel.close()}catch{}handleChannelClose(channel)}},10000)
}
function ensureGuestPeer(recovering=false){
 if(peerConnection&&!peerConnection.destroyed){if(peerConnection.disconnected){try{peerConnection.reconnect()}catch{}scheduleReconnect();return peerConnection}connectGuestToHost();return peerConnection}
 const peer=makePeer();if(!peer){scheduleReconnect();return null}peer.on('open',()=>{if(!dataChannel?.open){networkStatus(recovering?'Reencontrando a sala…':'Procurando a sala…','connecting');connectGuestToHost()}});scheduleReconnect(5000);return peer
}
function createRoom(){
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='host';localPlayer=1;chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Criando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureHostPeer();if(!peer)return;
 peer.on('open',()=>networkStatus(`Sala ${code} pronta — aguardando o Duelista 2`,'connecting'))
}
function joinRoom(){
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='guest';localPlayer=2;chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Procurando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureGuestPeer();if(!peer)return;
 setTimeout(()=>{if(!dataChannel?.open&&document.querySelector('#setup').classList.contains('hidden')===false)handlePeerError({type:'peer-unavailable'})},12000)
}
function chooseOwnDeckRow(){
 document.querySelectorAll('.lobby-role').forEach(button=>button.classList.toggle('selected',button.id===(onlineRole==='host'?'host-online':'join-online')));
 document.querySelectorAll('.choice-row').forEach(row=>{let own=+row.dataset.player===localPlayer;row.classList.toggle('online-only-player',own);row.classList.toggle('remote-player',!own)});
 updateOnlineStart()
}
function sendPacket(packet){if(!dataChannel?.open)return false;try{dataChannel.send(packet);return true}catch{handleChannelClose(dataChannel);return false}}
function sendGameState(force=false){if(!onlineMode||applyingRemote||!state||state.animating||!dataChannel?.open)return;sendPacket({type:'state',actor:localPlayer,sequence:++networkSequence,force,started:document.querySelector('#setup').classList.contains('hidden'),state,selectedDecks})}
function syncOnlineState(){if(onlineMode)setTimeout(()=>sendGameState(),35)}
function receivePacket(raw){
 let packet=raw;if(typeof raw==='string'){try{packet=JSON.parse(raw)}catch{return}}
 if(!packet||typeof packet!=='object')return;
 if(packet.type==='heartbeat')return;
 if(packet.type==='visual'&&state){clearTimeout(remoteVisualTimer);let units=allUnits();state.animating=true;if(packet.kind==='combat'){let defender=units.find(u=>u.id===packet.defender);(packet.attackers||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u&&defender){u.combatRole='attacker';u.combatDx=defender.col-u.col;u.combatDy=defender.row-u.row}});if(defender)defender.combatRole='defender';let tower=units.find(u=>u.id===packet.tower);if(tower)tower.combatRole='sacrifice';hint(packet.label||'Combate em andamento…')}else if(packet.kind==='combine'){(packet.materials||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u){u.combining=true;u.combineDx=packet.pos.col-u.col;u.combineDy=packet.pos.row-u.row}});hint('Combinando materiais…')}render();remoteVisualTimer=setTimeout(()=>{if(!state?.animating)return;clearAnimationMarks(allUnits());state.animating=false;render()},1200);return}
 if(packet.type==='deck'){remoteDeck=packet.deck;selectedDecks[localPlayer===1?2:1]=packet.deck;updateOnlineStart();return}
 if(packet.type==='restart-request'&&onlineRole==='host'){if(confirm('O outro jogador quer reiniciar a partida. Aceitar?')){newGame();sendGameState(true)}return}
 if(packet.type!=='state'||!packet.state)return;
 if(!packet.force&&state){let expected=state.swordQueue?.[0]??(state.placementPhase?state.placementPlayer:state.current);if(packet.actor!==expected)return}
 clearTimeout(remoteVisualTimer);remoteVisualTimer=null;applyingRemote=true;if(packet.started)document.querySelector('#setup').classList.add('hidden');state=packet.state;selectedDecks=packet.selectedDecks||selectedDecks;selected=null;selectedEffect=null;mode=null;targets=[];pendingCard=null;castleFirst=null;fusionMaterials=[];
 document.querySelectorAll('#turn-draw,#pass,#sword-transfer').forEach(element=>element.classList.add('hidden'));render();applyingRemote=false;checkWin();if(!state.forfeitWinner)resumeOnlinePhase()
}
function resumeOnlinePhase(){
 if(!onlineMode||!state)return;updateOnlineLock();
 if(state.swordQueue?.[0]===localPlayer)return openSwordTransfer();
 if(state.placementPhase&&state.placementPlayer===localPlayer){beginInitialPlacement(localPlayer);return}
 if(!state.placementPhase&&state.current===localPlayer&&state.passPurpose){beginTurn();syncOnlineState()}
}
function updateOnlineLock(){
 if(!onlineMode||!state)return;let active=canLocalAct()&&(state.placementPhase?state.placementPlayer===localPlayer:true);document.body.classList.toggle('online-waiting',!active);
 if(!active)hint(state.swordQueue?.length?'Aguardando a escolha da Espada Maldita…':`Aguardando a jogada do Duelista ${state.current}…`)
}
function updateOnlineStart(){
 if(!onlineMode)return;let start=document.querySelector('#start-game'),connected=!!dataChannel?.open;
 if(onlineRole==='host'){start.textContent=connected&&remoteDeck?'INICIAR PARTIDA ONLINE':connected?'SINCRONIZANDO DECKS…':'AGUARDANDO DUELISTA 2';start.disabled=!(connected&&remoteDeck)}else{start.textContent=connected?'AGUARDANDO O ANFITRIÃO':'ENTRE EM UMA SALA';start.disabled=true}
}
function selectGameMode(mode){
 onlineMode=mode==='online';document.querySelector('#mode-local').classList.toggle('selected',!onlineMode);document.querySelector('#mode-online').classList.toggle('selected',onlineMode);document.querySelector('#online-lobby').classList.toggle('hidden',!onlineMode);document.querySelector('.setup-card').classList.toggle('online-setup',onlineMode);document.querySelectorAll('.choice-row').forEach(row=>row.classList.remove('online-only-player','remote-player'));
 if(!onlineMode){closePeer();onlineRole=null;localPlayer=null;roomCode='';setLobbyBusy(false);document.querySelector('#start-game').disabled=false;document.querySelector('#start-game').textContent='INICIAR DUELO LOCAL'}else{document.querySelector('#start-game').disabled=true;document.querySelector('#start-game').textContent='DIGITE O MESMO CÓDIGO NOS DOIS DISPOSITIVOS';networkStatus('Digite um código e escolha uma opção','')}
}
function onlineDeckChanged(player,deck){if(onlineMode&&player===localPlayer)sendPacket({type:'deck',deck})}
function startOnlineGame(){if(onlineRole!=='host'||!dataChannel?.open||!remoteDeck)return;document.querySelector('#setup').classList.add('hidden');newGame();sendGameState(true)}

document.addEventListener('DOMContentLoaded',()=>{
 const roomInput=document.querySelector('#room-code');
 roomInput.addEventListener('input',()=>{roomInput.value=cleanRoomCode(roomInput.value);roomInput.classList.remove('invalid')});
 roomInput.addEventListener('keydown',event=>{if(event.key==='Enter')document.querySelector('#join-online').click()});
 document.querySelector('#generate-code').onclick=generateRoomCode;
 document.querySelector('#mode-local').onclick=()=>selectGameMode('local');document.querySelector('#mode-online').onclick=()=>selectGameMode('online');document.querySelector('#host-online').onclick=createRoom;document.querySelector('#join-online').onclick=joinRoom;
 window.addEventListener('online',()=>{if(onlineMode&&!dataChannel?.open){networkStatus('Internet restaurada — reconectando…','connecting');scheduleReconnect(100)}});
 window.addEventListener('offline',()=>{if(onlineMode){networkStatus('Sem internet — a partida tentará voltar automaticamente','connecting');document.body.classList.add('connection-lost')}});
 document.addEventListener('click',event=>{if(!onlineMode||applyingRemote||!state)return;if(event.target.closest('#setup,#rules-dialog'))return;let actor=state.placementPhase?state.placementPlayer:state.current;if(actor===localPlayer)syncOnlineState()},true)
});
var onlineMode=false,localPlayer=null,onlineRole=null,peerConnection=null,dataChannel=null,applyingRemote=false,remoteDeck=null,networkSequence=0,roomCode='',reconnectTimer=null,heartbeatTimer=null,remoteVisualTimer=null,reconnectAttempts=0;

function networkStatus(text,kind=''){
 const box=document.querySelector('.signal-status'),label=document.querySelector('#connection-status');
 if(label)label.textContent=text;if(box)box.className=`signal-status ${kind}`;
 const badge=document.querySelector('#network-badge');
 if(badge){badge.classList.toggle('connected',kind==='connected');badge.querySelector('span').textContent=kind==='connected'?`J${localPlayer} · ONLINE`:'CONECTANDO'}
}
function cleanRoomCode(value){return String(value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,10)}
function getRoomCode(){
 const input=document.querySelector('#room-code');roomCode=cleanRoomCode(input.value);input.value=roomCode;
 if(roomCode.length===10){input.classList.remove('invalid');return roomCode}
 input.classList.remove('invalid');void input.offsetWidth;input.classList.add('invalid');networkStatus('O código precisa ter exatamente 10 letras','error');return null
}
function generateRoomCode(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ',values=new Uint32Array(10);crypto.getRandomValues(values);
 document.querySelector('#room-code').value=[...values].map(value=>alphabet[value%alphabet.length]).join('');networkStatus('Código pronto — use o mesmo nos dois dispositivos','')
}
function roomPeerId(code){return `veu-${code.toLowerCase()}`}
function clearConnectionTimers(){clearTimeout(reconnectTimer);clearInterval(heartbeatTimer);reconnectTimer=null;heartbeatTimer=null}
function closePeer(){
 clearConnectionTimers();reconnectAttempts=0;
 const channel=dataChannel,peer=peerConnection;dataChannel=null;peerConnection=null;remoteDeck=null;
 try{channel?.removeAllListeners?.();channel?.close();peer?.removeAllListeners?.();peer?.destroy()}catch{}
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
 if(document.querySelector('#setup').classList.contains('hidden')&&error?.type!=='browser-incompatible'){networkStatus('Reconectando a partida…','connecting');scheduleReconnect();return}
 clearTimeout(reconnectTimer);reconnectTimer=null;networkStatus(messages[error?.type]||'Não foi possível estabelecer a conexão','error');setLobbyBusy(false)
}
function setLobbyBusy(busy){document.querySelector('#host-online').disabled=busy;document.querySelector('#join-online').disabled=busy;document.querySelector('#generate-code').disabled=busy;document.querySelector('#room-code').disabled=busy}
function attachChannel(channel){
 const previous=dataChannel;if(previous&&previous!==channel){try{previous.removeAllListeners?.();previous.close()}catch{}}
 dataChannel=channel;
 dataChannel.on('open',()=>{if(channel!==dataChannel)return;clearTimeout(reconnectTimer);reconnectTimer=null;reconnectAttempts=0;startHeartbeat();networkStatus('Conectado ao outro duelista','connected');document.querySelector('#network-badge').classList.remove('hidden');document.body.classList.remove('connection-lost');sendPacket({type:'deck',deck:selectedDecks[localPlayer]});updateOnlineStart();if(state)updateOnlineLock();if(onlineRole==='host'&&document.querySelector('#setup').classList.contains('hidden'))setTimeout(()=>sendGameState(true),80)});
 dataChannel.on('data',receivePacket);
 dataChannel.on('close',()=>handleChannelClose(channel));
 dataChannel.on('error',()=>{if(channel===dataChannel&&!channel.open)handleChannelClose(channel)})
}
function startHeartbeat(){clearInterval(heartbeatTimer);heartbeatTimer=setInterval(()=>sendPacket({type:'heartbeat',at:Date.now()}),12000)}
function handleChannelClose(channel){
 if(!onlineMode||channel!==dataChannel)return;clearInterval(heartbeatTimer);heartbeatTimer=null;dataChannel=null;networkStatus('Reconectando a partida…','connecting');document.body.classList.add('online-waiting','connection-lost');scheduleReconnect()
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
 peer.on('connection',channel=>{if(dataChannel?.open)return channel.close();attachChannel(channel)});scheduleReconnect(5000);return peer
}
function connectGuestToHost(){
 if(!peerConnection||peerConnection.destroyed||peerConnection.disconnected||dataChannel?.open)return scheduleReconnect();
 const channel=peerConnection.connect(roomPeerId(roomCode),{reliable:true,serialization:'json',metadata:{room:roomCode}});attachChannel(channel);setTimeout(()=>{if(channel===dataChannel&&!channel.open){try{channel.close()}catch{}handleChannelClose(channel)}},10000)
}
function ensureGuestPeer(recovering=false){
 if(peerConnection&&!peerConnection.destroyed){if(peerConnection.disconnected){try{peerConnection.reconnect()}catch{}scheduleReconnect();return peerConnection}connectGuestToHost();return peerConnection}
 const peer=makePeer();if(!peer){scheduleReconnect();return null}peer.on('open',()=>{if(!dataChannel?.open){networkStatus(recovering?'Reencontrando a sala…':'Procurando a sala…','connecting');connectGuestToHost()}});scheduleReconnect(5000);return peer
}
function createRoom(){
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='host';localPlayer=1;chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Criando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureHostPeer();if(!peer)return;
 peer.on('open',()=>networkStatus(`Sala ${code} pronta — aguardando o Duelista 2`,'connecting'))
}
function joinRoom(){
 const code=getRoomCode();if(!code)return;
 onlineMode=true;onlineRole='guest';localPlayer=2;chooseOwnDeckRow();setLobbyBusy(true);networkStatus('Procurando a sala…','connecting');
 closePeer();roomCode=code;const peer=ensureGuestPeer();if(!peer)return;
 setTimeout(()=>{if(!dataChannel?.open&&document.querySelector('#setup').classList.contains('hidden')===false)handlePeerError({type:'peer-unavailable'})},12000)
}
function chooseOwnDeckRow(){
 document.querySelectorAll('.lobby-role').forEach(button=>button.classList.toggle('selected',button.id===(onlineRole==='host'?'host-online':'join-online')));
 document.querySelectorAll('.choice-row').forEach(row=>{let own=+row.dataset.player===localPlayer;row.classList.toggle('online-only-player',own);row.classList.toggle('remote-player',!own)});
 updateOnlineStart()
}
function sendPacket(packet){if(!dataChannel?.open)return false;try{dataChannel.send(packet);return true}catch{handleChannelClose(dataChannel);return false}}
function sendGameState(force=false){if(!onlineMode||applyingRemote||!state||state.animating||!dataChannel?.open)return;sendPacket({type:'state',actor:localPlayer,sequence:++networkSequence,force,started:document.querySelector('#setup').classList.contains('hidden'),state,selectedDecks})}
function syncOnlineState(){if(onlineMode)setTimeout(()=>sendGameState(),35)}
function receivePacket(raw){
 let packet=raw;if(typeof raw==='string'){try{packet=JSON.parse(raw)}catch{return}}
 if(!packet||typeof packet!=='object')return;
 if(packet.type==='heartbeat')return;
 if(packet.type==='visual'&&state){clearTimeout(remoteVisualTimer);let units=allUnits();state.animating=true;if(packet.kind==='combat'){let defender=units.find(u=>u.id===packet.defender);(packet.attackers||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u&&defender){u.combatRole='attacker';u.combatDx=defender.col-u.col;u.combatDy=defender.row-u.row}});if(defender)defender.combatRole='defender';let tower=units.find(u=>u.id===packet.tower);if(tower)tower.combatRole='sacrifice';hint(packet.label||'Combate em andamento…')}else if(packet.kind==='combine'){(packet.materials||[]).forEach(id=>{let u=units.find(x=>x.id===id);if(u){u.combining=true;u.combineDx=packet.pos.col-u.col;u.combineDy=packet.pos.row-u.row}});hint('Combinando materiais…')}render();remoteVisualTimer=setTimeout(()=>{if(!state?.animating)return;clearAnimationMarks(allUnits());state.animating=false;render()},1200);return}
 if(packet.type==='deck'){remoteDeck=packet.deck;selectedDecks[localPlayer===1?2:1]=packet.deck;updateOnlineStart();return}
 if(packet.type==='restart-request'&&onlineRole==='host'){if(confirm('O outro jogador quer reiniciar a partida. Aceitar?')){newGame();sendGameState(true)}return}
 if(packet.type!=='state'||!packet.state)return;
 if(!packet.force&&state){let expected=state.swordQueue?.[0]??(state.placementPhase?state.placementPlayer:state.current);if(packet.actor!==expected)return}
 clearTimeout(remoteVisualTimer);remoteVisualTimer=null;applyingRemote=true;if(packet.started)document.querySelector('#setup').classList.add('hidden');state=packet.state;selectedDecks=packet.selectedDecks||selectedDecks;selected=null;selectedEffect=null;mode=null;targets=[];pendingCard=null;castleFirst=null;fusionMaterials=[];
 document.querySelectorAll('#turn-draw,#pass,#sword-transfer').forEach(element=>element.classList.add('hidden'));render();applyingRemote=false;checkWin();if(!state.forfeitWinner)resumeOnlinePhase()
}
function resumeOnlinePhase(){
 if(!onlineMode||!state)return;updateOnlineLock();
 if(state.swordQueue?.[0]===localPlayer)return openSwordTransfer();
 if(state.placementPhase&&state.placementPlayer===localPlayer){beginInitialPlacement(localPlayer);return}
 if(!state.placementPhase&&state.current===localPlayer&&state.passPurpose){beginTurn();syncOnlineState()}
}
function updateOnlineLock(){
 if(!onlineMode||!state)return;let active=canLocalAct()&&(state.placementPhase?state.placementPlayer===localPlayer:true);document.body.classList.toggle('online-waiting',!active);
 if(!active)hint(state.swordQueue?.length?'Aguardando a escolha da Espada Maldita…':`Aguardando a jogada do Duelista ${state.current}…`)
}
function updateOnlineStart(){
 if(!onlineMode)return;let start=document.querySelector('#start-game'),connected=!!dataChannel?.open;
 if(onlineRole==='host'){start.textContent=connected&&remoteDeck?'INICIAR PARTIDA ONLINE':connected?'SINCRONIZANDO DECKS…':'AGUARDANDO DUELISTA 2';start.disabled=!(connected&&remoteDeck)}else{start.textContent=connected?'AGUARDANDO O ANFITRIÃO':'ENTRE EM UMA SALA';start.disabled=true}
}
function selectGameMode(mode){
 onlineMode=mode==='online';document.querySelector('#mode-local').classList.toggle('selected',!onlineMode);document.querySelector('#mode-online').classList.toggle('selected',onlineMode);document.querySelector('#online-lobby').classList.toggle('hidden',!onlineMode);document.querySelector('.setup-card').classList.toggle('online-setup',onlineMode);document.querySelectorAll('.choice-row').forEach(row=>row.classList.remove('online-only-player','remote-player'));
 if(!onlineMode){closePeer();onlineRole=null;localPlayer=null;roomCode='';setLobbyBusy(false);document.querySelector('#start-game').disabled=false;document.querySelector('#start-game').textContent='INICIAR DUELO LOCAL'}else{document.querySelector('#start-game').disabled=true;document.querySelector('#start-game').textContent='DIGITE O MESMO CÓDIGO NOS DOIS DISPOSITIVOS';networkStatus('Digite um código e escolha uma opção','')}
}
function onlineDeckChanged(player,deck){if(onlineMode&&player===localPlayer)sendPacket({type:'deck',deck})}
function startOnlineGame(){if(onlineRole!=='host'||!dataChannel?.open||!remoteDeck)return;document.querySelector('#setup').classList.add('hidden');newGame();sendGameState(true)}

document.addEventListener('DOMContentLoaded',()=>{
 const roomInput=document.querySelector('#room-code');
 roomInput.addEventListener('input',()=>{roomInput.value=cleanRoomCode(roomInput.value);roomInput.classList.remove('invalid')});
 roomInput.addEventListener('keydown',event=>{if(event.key==='Enter')document.querySelector('#join-online').click()});
 document.querySelector('#generate-code').onclick=generateRoomCode;
 document.querySelector('#mode-local').onclick=()=>selectGameMode('local');document.querySelector('#mode-online').onclick=()=>selectGameMode('online');document.querySelector('#host-online').onclick=createRoom;document.querySelector('#join-online').onclick=joinRoom;
 window.addEventListener('online',()=>{if(onlineMode&&!dataChannel?.open){networkStatus('Internet restaurada — reconectando…','connecting');scheduleReconnect(100)}});
 window.addEventListener('offline',()=>{if(onlineMode){networkStatus('Sem internet — a partida tentará voltar automaticamente','connecting');document.body.classList.add('connection-lost')}});
 document.addEventListener('click',event=>{if(!onlineMode||applyingRemote||!state)return;if(event.target.closest('#setup,#rules-dialog'))return;let actor=state.placementPhase?state.placementPlayer:state.current;if(actor===localPlayer)syncOnlineState()},true)
});
