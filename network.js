var onlineMode=false,localPlayer=null,onlineRole=null,peerConnection=null,dataChannel=null,applyingRemote=false,remoteDeck=null,networkSequence=0;
const rtcConfig={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};

function networkStatus(text,kind=''){
 const box=document.querySelector('.signal-status'),label=document.querySelector('#connection-status');
 if(label)label.textContent=text;if(box)box.className=`signal-status ${kind}`;
 const badge=document.querySelector('#network-badge');if(badge){badge.classList.toggle('connected',kind==='connected');badge.querySelector('span').textContent=kind==='connected'?`J${localPlayer} · ONLINE`:'CONECTANDO'}
}
function setSignalInstruction(text,button='CONTINUAR'){document.querySelector('#signal-instruction').textContent=text;document.querySelector('#apply-signal').textContent=button}
function encodeSignal(description){return btoa(JSON.stringify({type:description.type,sdp:description.sdp}))}
function decodeSignal(code){return JSON.parse(atob(code.trim().replace(/\s/g,'')))}
function waitForIce(pc){if(pc.iceGatheringState==='complete')return Promise.resolve();return new Promise(resolve=>{const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve()}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,9000)})}
function closePeer(){try{dataChannel?.close();peerConnection?.close()}catch{}dataChannel=null;peerConnection=null;remoteDeck=null}
function makePeer(){
 closePeer();peerConnection=new RTCPeerConnection(rtcConfig);
 peerConnection.onconnectionstatechange=()=>{let s=peerConnection.connectionState;if(s==='connected')networkStatus('Conexão direta estabelecida','connected');else if(['failed','disconnected','closed'].includes(s)){networkStatus('Conexão interrompida','error');document.body.classList.add('online-waiting')}else networkStatus('Conectando os duelistas…','connecting')};
 peerConnection.ondatachannel=e=>attachChannel(e.channel);return peerConnection
}
function attachChannel(channel){
 dataChannel=channel;dataChannel.onopen=()=>{networkStatus('Conexão direta estabelecida','connected');document.querySelector('#network-badge').classList.remove('hidden');sendPacket({type:'deck',deck:selectedDecks[localPlayer]});updateOnlineStart()};
 dataChannel.onclose=()=>{networkStatus('O outro duelista desconectou','error');document.body.classList.add('online-waiting')};dataChannel.onerror=()=>networkStatus('Falha no canal da partida','error');dataChannel.onmessage=e=>receivePacket(e.data)
}
function sendPacket(packet){if(dataChannel?.readyState==='open')dataChannel.send(JSON.stringify(packet))}
function sendGameState(force=false){if(!onlineMode||applyingRemote||!state||dataChannel?.readyState!=='open')return;sendPacket({type:'state',actor:localPlayer,sequence:++networkSequence,force,started:document.querySelector('#setup').classList.contains('hidden'),state,selectedDecks})}
function syncOnlineState(){if(onlineMode)setTimeout(()=>sendGameState(),35)}
function receivePacket(raw){
 let packet;try{packet=JSON.parse(raw)}catch{return}
 if(packet.type==='deck'){remoteDeck=packet.deck;selectedDecks[localPlayer===1?2:1]=packet.deck;updateOnlineStart();return}
 if(packet.type==='restart-request'&&onlineRole==='host'){if(confirm('O outro jogador quer reiniciar a partida. Aceitar?')){newGame();sendGameState(true)}return}
 if(packet.type!=='state'||!packet.state)return;
 if(!packet.force&&state){let expected=state.swordQueue?.[0]??(state.placementPhase?state.placementPlayer:state.current);if(packet.actor!==expected)return}
 applyingRemote=true;if(packet.started)document.querySelector('#setup').classList.add('hidden');state=packet.state;selectedDecks=packet.selectedDecks||selectedDecks;selected=null;selectedEffect=null;mode=null;targets=[];pendingCard=null;castleFirst=null;
 document.querySelectorAll('#turn-draw,#pass,#sword-transfer').forEach(el=>el.classList.add('hidden'));render();applyingRemote=false;checkWin();if(!state.forfeitWinner)resumeOnlinePhase()
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
 if(!onlineMode)return;let start=document.querySelector('#start-game'),connected=dataChannel?.readyState==='open';
 if(onlineRole==='host'){start.textContent=connected&&remoteDeck?'INICIAR PARTIDA ONLINE':'AGUARDANDO DUELISTA 2';start.disabled=!(connected&&remoteDeck)}else{start.textContent=connected?'AGUARDANDO O ANFITRIÃO':'CONECTE-SE AO ANFITRIÃO';start.disabled=true}
}
async function createHostOffer(){
 onlineMode=true;onlineRole='host';localPlayer=1;makePeer();attachChannel(peerConnection.createDataChannel('veu-game',{ordered:true}));networkStatus('Preparando código do anfitrião…','connecting');
 await peerConnection.setLocalDescription(await peerConnection.createOffer());await waitForIce(peerConnection);document.querySelector('#signal-code').value=encodeSignal(peerConnection.localDescription);setSignalInstruction('Envie este código ao Duelista 2. Depois substitua-o pelo código de resposta recebido.','USAR RESPOSTA');networkStatus('Oferta pronta para compartilhar','');document.querySelector('#signal-code').select();updateOnlineStart()
}
async function joinHostOffer(){
 let offer=decodeSignal(document.querySelector('#signal-code').value);onlineMode=true;onlineRole='guest';localPlayer=2;makePeer();networkStatus('Lendo oferta do anfitrião…','connecting');await peerConnection.setRemoteDescription(offer);await peerConnection.setLocalDescription(await peerConnection.createAnswer());await waitForIce(peerConnection);document.querySelector('#signal-code').value=encodeSignal(peerConnection.localDescription);setSignalInstruction('Envie este código de resposta ao Duelista 1. A conexão abrirá quando ele confirmar.','AGUARDAR ANFITRIÃO');document.querySelector('#apply-signal').disabled=true;networkStatus('Resposta pronta para compartilhar','');updateOnlineStart()
}
async function acceptGuestAnswer(){let answer=decodeSignal(document.querySelector('#signal-code').value);networkStatus('Confirmando resposta…','connecting');await peerConnection.setRemoteDescription(answer);setSignalInstruction('Resposta aceita. A partida começará quando a conexão ficar verde.','CONECTADO');document.querySelector('#apply-signal').disabled=true}
function chooseOnlineRole(role){
 onlineRole=role;localPlayer=role==='host'?1:2;document.querySelectorAll('.lobby-role').forEach(b=>b.classList.toggle('selected',b.id===(role==='host'?'host-online':'join-online')));document.querySelector('#signal-panel').classList.remove('hidden');document.querySelector('#signal-code').value='';document.querySelector('#apply-signal').disabled=false;
 document.querySelectorAll('.choice-row').forEach(row=>{let own=+row.dataset.player===localPlayer;row.classList.toggle('online-only-player',own);row.classList.toggle('remote-player',!own)});
 if(role==='host'){setSignalInstruction('Gere um código e envie ao Duelista 2.','GERAR OFERTA');networkStatus('Pronto para criar a conexão','')}else{setSignalInstruction('Cole aqui o código enviado pelo Duelista 1.','GERAR RESPOSTA');networkStatus('Aguardando código do anfitrião','')}updateOnlineStart()
}
function selectGameMode(mode){
 onlineMode=mode==='online';document.querySelector('#mode-local').classList.toggle('selected',!onlineMode);document.querySelector('#mode-online').classList.toggle('selected',onlineMode);document.querySelector('#online-lobby').classList.toggle('hidden',!onlineMode);document.querySelector('.setup-card').classList.toggle('online-setup',onlineMode);document.querySelectorAll('.choice-row').forEach(r=>r.classList.remove('online-only-player','remote-player'));
 if(!onlineMode){closePeer();onlineRole=null;localPlayer=null;document.querySelector('#start-game').disabled=false;document.querySelector('#start-game').textContent='INICIAR DUELO LOCAL'}else{document.querySelector('#start-game').disabled=true;document.querySelector('#start-game').textContent='ESCOLHA CRIAR OU ENTRAR'}
}
function onlineDeckChanged(player,deck){if(onlineMode&&player===localPlayer)sendPacket({type:'deck',deck})}
function startOnlineGame(){if(onlineRole!=='host'||dataChannel?.readyState!=='open'||!remoteDeck)return;document.querySelector('#setup').classList.add('hidden');newGame();sendGameState(true)}

document.addEventListener('DOMContentLoaded',()=>{
 document.querySelector('#mode-local').onclick=()=>selectGameMode('local');document.querySelector('#mode-online').onclick=()=>selectGameMode('online');document.querySelector('#host-online').onclick=()=>chooseOnlineRole('host');document.querySelector('#join-online').onclick=()=>chooseOnlineRole('guest');
 document.querySelector('#copy-signal').onclick=async()=>{let field=document.querySelector('#signal-code');if(!field.value)return;try{await navigator.clipboard.writeText(field.value)}catch{field.select();document.execCommand('copy')}networkStatus('Código copiado','')};
 document.querySelector('#apply-signal').onclick=async()=>{try{if(onlineRole==='host'&&!peerConnection)await createHostOffer();else if(onlineRole==='host')await acceptGuestAnswer();else if(onlineRole==='guest')await joinHostOffer()}catch(error){networkStatus('Código inválido ou conexão recusada','error');console.error(error)}};
 document.addEventListener('click',event=>{if(!onlineMode||applyingRemote||!state)return;if(event.target.closest('#setup,#rules-dialog'))return;let actor=state.placementPhase?state.placementPlayer:state.current;if(actor===localPlayer)syncOnlineState()},true)
});
