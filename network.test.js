const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
process.chdir(__dirname);

const source = fs.readFileSync('network.js', 'utf8');
assert.match(source, /document\.addEventListener\('click',[^\n]+\},false\)/, 'o estado online deve ser sincronizado depois que o clique alterar a jogada');
assert.match(source, /replace\(\/\[\^A-Z0-9\]\/g,''\)\.slice\(0,12\)/, 'códigos devem aceitar letras e números até 12 caracteres');
assert.match(source, /selectedDecks\[2\]=selectedLobbyDeck\(\)/, 'quem entra na sala deve usar o deck exibido na primeira seleção como J2');
assert.match(source, /channel\.metadata\?\.role==='spectator'/, 'o anfitrião deve separar espectadores do canal do adversário');
assert.match(source, /spectatorChannels\.forEach\(channel=>sendChannelPacket/, 'o estado deve ser distribuído para vários espectadores');
assert.match(source, /if\(packet\?\.type==='heartbeat'\)[^\n]+if\(packet\?\.type==='spectate-request'\)[^\n]+if\(packet\?\.type==='chat'\)/, 'o canal espectador deve aceitar presença, leitura e mensagens');
assert.match(source, /raw\?\.type==='chat'[^\n]+broadcastSpectators\(packet\)/, 'mensagens dos jogadores devem ser validadas e retransmitidas aos espectadores');
assert.match(source, /onlineSpectators=\[\]/, 'o lobby deve manter a lista de espectadores');
assert.match(source, /type:'spectator-list'/, 'a lista de espectadores deve ser sincronizada');
assert.match(source, /function renderLobbyParticipants/, 'o lobby deve mostrar os perfis presentes');
assert.match(source, /updatePointGoalControl/, 'a meta de pontos deve ser visível somente ao anfitrião');
assert.match(source, /class="lobby-profile-icon"/, 'o ícone de cada jogador na sala deve separar o fundo do SVG');
assert.match(source, /profileStyle\(safe\?\.profileColor\)/, 'a cor do perfil deve acompanhar o jogador no lobby');
assert.doesNotMatch(source, /<article class="lobby-participant\$\{dim\?' spectator':''\}"><img/, 'o SVG do jogador não pode receber o fundo que o filtro clareia');
assert.match(source, /function maybeStartQuickMatch\(/, 'a partida rápida deve iniciar automaticamente depois da sincronização');
assert.match(source, /if\(\['host','guest','spectator'\]\.includes\(onlineRole\)/, 'criar ou entrar novamente deve sair da sala atual');
assert.match(source, /packet\.type==='room-left'/, 'a saída da sala deve ser informada ao outro duelista');
assert.match(source, /function updateRematchAvailability\(/, 'a conexão deve controlar se Jogar novamente continua disponível');
assert.match(source, /dataChannel=null;updateRematchAvailability\(\)/, 'uma queda do adversário deve desativar imediatamente a revanche');
assert.match(source, /function cancelQuickMatch\(\)/, 'a procura rápida deve poder ser cancelada');
assert.match(source, /busy&&!quickMatchSearching/, 'o botão da partida rápida deve continuar ativo durante a procura');
assert.match(source, /ticket!==quickMatchTicket\|\|!quickMatchSearching/, 'uma resposta tardia não deve reabrir uma busca cancelada');
assert.match(source, /const DISCONNECT_FORFEIT_MS=90000/, 'a tolerância de desconexão deve ser de 90 segundos');
assert.match(source, /function startMatchPresence\(/, 'a partida deve manter presença independente do canal P2P');
assert.match(source, /touch_match_presence/, 'a presença deve ser atualizada no servidor');
assert.match(source, /claim_disconnect_win/, 'a vitória deve ser reivindicada somente após confirmar a ausência do rival');
assert.match(source, /startDisconnectForfeit\(\);scheduleReconnect\(\)/, 'a queda deve iniciar o prazo sem interromper as tentativas de reconexão');
assert.match(source, /function announceOnlineMatchResult\(/, 'o resultado deve ser confirmado em um pacote independente do estado da jogada');
assert.match(source, /packet\.type==='match-result'/, 'o adversário deve receber a confirmação explícita do resultado');

function classList() {
  return { add() {}, remove() {}, toggle() {}, contains() { return true } };
}

function playerState(current, marker) {
  return {
    matchId: '11111111-1111-4111-8111-111111111111',
    turn: 2,
    current,
    marker,
    animating: false,
    placementPhase: false,
    passPurpose: null,
    swordQueue: [],
    players: { 1: { units: [] }, 2: { units: [] } },
    log: []
  };
}

function makeClient(player, initialState) {
  const setup = { classList: classList() };
  const context = {
    console,
    Date,
    JSON,
    structuredClone,
    Uint32Array,
    crypto: { getRandomValues(values) { return values.fill(1) } },
    setTimeout() { return 1 },
    clearTimeout() {},
    setInterval() { return 1 },
    clearInterval() {},
    window: { addEventListener() {} },
    document: {
      body: { classList: classList() },
      visibilityState: 'visible',
      addEventListener() {},
      querySelector(selector) { return selector === '#setup' ? setup : null },
      querySelectorAll() { return [] }
    },
    state: structuredClone(initialState),
    botVsBot: false,
    spectatorViewPlayer: 1,
    spectatorSelected: null,
    spectatorEffect: null,
    pointGoal: 10,
    selectedDecks: { 1: 'xadria', 2: 'selvagem' },
    selected: null,
    selectedEffect: null,
    mode: null,
    targets: [],
    pendingCard: null,
    castleFirst: null,
    fusionMaterials: [],
    render() {},
    checkWin() {},
    hint() {},
    openSwordTransfer() {},
    openDrawChoice() {},
    beginInitialPlacement() {},
    beginTurn() {},
    canLocalAct() { return context.state.current === context.localPlayer },
    updateOnlineStart() {},
    clearAnimationMarks() {},
    appendChatMessage(packet) { if (!context.state.log.some(entry => entry.chatId === packet.id)) context.state.log.unshift({chatId: packet.id, msg: packet.message, sender: packet.sender, type: 'chat', turn: packet.turn}); },
    allUnits() { return [] },
    confirm() { return false }
  };
  context.resultReports = [];
  context.safeAccountSnapshot = value => value?.id ? structuredClone(value) : null;
  context.accountPublicSnapshot = () => ({id:`account-${player}`,username:`Player ${player}`});
  context.reportOnlineMatchResult = (winner, reason) => context.resultReports.push({winner, reason});
  context.spectatingMatch = () => context.onlineRole === 'spectator';
  context.selectedPointGoal = () => context.pointGoal;
  context.setPointGoal = value => context.pointGoal = Math.max(1, Math.min(99, Math.round(Number(value)) || 10));
  vm.createContext(context);
  vm.runInContext(source, context);
  context.onlineMode = true;
  context.localPlayer = player;
  context.onlineRole = player === 1 ? 'host' : 'guest';
  context.updateOnlineStart = () => {};
  context.gameStarted = () => true;
  return context;
}

{
  const host = makeClient(1, playerState(1, 'resultado-host'));
  const guest = makeClient(2, playerState(1, 'resultado-guest'));
  link(host, guest);
  assert.equal(host.announceOnlineMatchResult(1, 'points'), true);
  assert.deepEqual(guest.resultReports, [{winner:1, reason:'points'}], 'o outro cliente deve confirmar o mesmo resultado no banco');
  assert.deepEqual(host.resultReports, [{winner:1, reason:'points'}], 'o destinatário deve responder e confirmar o resultado também no cliente original');
  assert.equal(guest.onlineAccounts[1].id, 'account-1', 'o pacote deve recuperar a identidade verificada do adversário');
  assert.equal(host.onlineAccounts[2].id, 'account-2', 'a resposta deve recuperar a identidade do segundo jogador');
  assert.equal(host.announceOnlineMatchResult(1, 'points'), false, 'o mesmo resultado não deve ser anunciado duas vezes');
}

{
  const host = makeClient(1, playerState(1, 'chat-host'));
  const guest = makeClient(2, playerState(1, 'chat-guest'));
  link(host, guest);
  host.sendPacket({type:'chat',id:'chat-1',sender:'Ana',message:'Boa partida!',turn:1});
  assert.equal(guest.state.log[0].msg, 'Boa partida!', 'a mensagem deve chegar ao outro jogador sem sincronizar todo o estado');
  assert.equal(guest.state.log[0].sender, 'Ana');
}

{
  const drawState = playerState(2, 'compra-pendente');
  drawState.awaitingDraw = true;
  drawState.players[2].drawn = false;
  const guest = makeClient(2, drawState);
  let reopened = 0;
  guest.openDrawChoice = () => reopened++;
  guest.resumeOnlinePhase();
  assert.equal(reopened, 1, 'a escolha de compra deve reaparecer após voltar à aba ou ressincronizar');
}

{
  const client = makeClient(1, playerState(1, 'codigo'));
  assert.equal(client.cleanRoomCode('a-1_b2'), 'A1B2');
  assert.equal(client.cleanRoomCode('1234567890ABCDE'), '1234567890AB');
  assert.equal(client.cleanPlayerName('  Ana   <Lua>  '), 'Ana Lua');
}

{
  const host = makeClient(1, playerState(1, 'estado-para-espectadores'));
  const receivedA = [], receivedB = [];
  host.spectatorChannels = [
    {open: true, send(packet) { receivedA.push(structuredClone(packet)); }},
    {open: true, send(packet) { receivedB.push(structuredClone(packet)); }}
  ];
  host.sendGameState(true, false);
  assert.equal(receivedA.at(-1).state.marker, 'estado-para-espectadores');
  assert.equal(receivedB.at(-1).state.marker, 'estado-para-espectadores');
}

{
  const watcher = makeClient(1, playerState(1, 'estado-local'));
  watcher.onlineRole = 'spectator';watcher.localPlayer = null;watcher.botVsBot = true;
  watcher.dataChannel = {open: true, send() {}};
  watcher.receivePacket({type:'state',force:true,revision:0,started:true,state:playerState(2,'estado-observado'),selectedDecks:{1:'xadria',2:'wild'}});
  assert.equal(watcher.state.marker, 'estado-observado', 'o espectador deve aceitar o retrato completo mesmo na revisão inicial');
  assert.equal(watcher.state.current, 2);
}

{
  const host = makeClient(1, playerState(1, 'partida-rapida'));
  host.gameStarted = () => false;
  host.quickMatchConnection = true;
  host.remoteDeck = 'wild';
  host.dataChannel = {open: true, send() {}};
  let scheduled = false;
  host.setTimeout = () => { scheduled = true; return 1 };
  assert.equal(host.maybeStartQuickMatch(), true);
  assert.equal(host.quickMatchStarting, true);
  assert.equal(scheduled, true, 'o anfitrião encontrado deve agendar o início sem exigir outro clique');
}

function link(a, b, shouldDrop = () => false) {
  let drop = shouldDrop;
  const channelA = {
    open: true,
    send(packet) { if (!drop(packet, 'a')) b.receivePacket(structuredClone(packet)) },
    close() {},
    on() {},
    removeAllListeners() {}
  };
  const channelB = {
    open: true,
    send(packet) { if (!drop(packet, 'b')) a.receivePacket(structuredClone(packet)) },
    close() {},
    on() {},
    removeAllListeners() {}
  };
  a.dataChannel = channelA;
  b.dataChannel = channelB;
  return { stopDropping() { drop = () => false } };
}

{
  const largeMarker = `estado-grande-${'x'.repeat(30000)}`;
  const host = makeClient(1, playerState(1, largeMarker));
  const guest = makeClient(2, playerState(1, 'estado-antigo'));
  link(host, guest);
  host.sendGameState();
  assert.equal(guest.state.marker, largeMarker, 'estados grandes devem chegar completos em partes menores');
  assert.equal(host.pendingStatePacket, null, 'o estado dividido deve receber confirmacao normalmente');
}

{
  const lobby = makeClient(1, playerState(1, 'estado-provisorio'));
  lobby.gameStarted = () => false;
  lobby.dataChannel = { open: true, send() { throw new Error('o lobby nao deveria enviar estado de jogo'); } };
  assert.equal(lobby.sendGameState(true, false), false, 'o lobby nao deve sincronizar jogadas antes do inicio');
  assert.equal(lobby.pendingStatePacket, null, 'o lobby nao deve criar uma jogada pendente');
}

{
  const hostState = playerState(1, 'animacao-do-sol');
  hostState.animating = true;
  const host = makeClient(1, hostState);
  const guest = makeClient(2, playerState(1, 'antes-da-animacao'));
  link(host, guest);
  assert.equal(host.sendGameState(), false, 'uma jogada normal não deve ser enviada no meio de uma animação');
  assert.equal(host.syncOnlineAnimationState(), true, 'uma fase visual explícita deve ser sincronizada');
  assert.equal(guest.state.marker, 'animacao-do-sol');
  assert.equal(guest.state.animating, true);
}

{
  const host = makeClient(1, playerState(1, 'sala-host'));
  const guest = makeClient(2, playerState(1, 'sala-guest'));
  host.pointGoal = 18;
  let dropped = false;
  const connection = link(host, guest, (packet, side) => side === 'a' && packet.type === 'deck' && !dropped && (dropped = true));

  host.sendDeckChoice();
  assert.equal(guest.remoteDeck, null, 'o primeiro deck deveria ser perdido no teste');
  guest.sendDeckChoice();
  assert.equal(host.remoteDeck, 'selvagem', 'o host deve receber o deck do convidado');
  assert.equal(guest.remoteDeck, 'xadria', 'a confirmacao deve levar o deck do host ao convidado');
  assert.equal(guest.pointGoal, 18, 'o convidado deve receber a meta de pontos escolhida pelo anfitrião');

  connection.stopDropping();
  host.sendDeckChoice();
  assert.equal(guest.remoteDeck, 'xadria', 'o reenvio do deck deve manter a sala sincronizada');
}

{
  const a = makeClient(1, playerState(2, 'turno-passado'));
  const b = makeClient(2, playerState(1, 'estado-antigo'));
  let dropped = false;
  const connection = link(a, b, (packet, side) => side === 'a' && packet.type === 'state' && !dropped && (dropped = true));

  a.sendGameState();
  assert.equal(b.state.marker, 'estado-antigo', 'o primeiro pacote deveria ser perdido no teste');
  assert.ok(a.pendingStatePacket, 'o estado perdido precisa permanecer pendente');

  connection.stopDropping();
  a.flushPendingState();
  assert.equal(b.state.marker, 'turno-passado', 'o reenvio deve atualizar o adversário');
  assert.equal(b.state.current, 2, 'a passagem de turno deve chegar ao adversário');
  assert.equal(a.pendingStatePacket, null, 'a confirmação deve encerrar os reenvios');
}

{
  const host = makeClient(1, playerState(1, 'estado-antigo-do-host'));
  const guest = makeClient(2, playerState(1, 'jogada-mais-recente'));
  host.networkRevision = 3;
  guest.networkRevision = 3;
  guest.sendGameState();
  assert.equal(guest.networkRevision, 4);
  assert.ok(guest.pendingStatePacket, 'a jogada feita durante a queda deve ser guardada');

  link(host, guest);
  guest.flushPendingState();
  assert.equal(host.networkRevision, 4, 'a reconexão deve escolher a revisão mais recente');
  assert.equal(host.state.marker, 'jogada-mais-recente', 'o estado antigo não pode sobrescrever a jogada recente');
  assert.equal(guest.pendingStatePacket, null, 'o estado deve ser confirmado após reconectar');
}

{
  const hostState = playerState(1, 'antes-da-jogada');
  hostState.players[1] = {units: [{id: 'carta-lida', name: 'Peão observado'}], reserve: [], initialUnits: []};
  const guestState = structuredClone(hostState);
  guestState.marker = 'depois-da-jogada';
  guestState.players[1].units[0].row = 3;
  const host = makeClient(1, hostState);
  const guest = makeClient(2, guestState);
  host.selected = host.state.players[1].units[0];
  host.selectedEffect = {key: 'peace', index: 0, owner: 1, arena: false};
  link(host, guest);
  guest.sendGameState();
  assert.equal(host.selected?.id, 'carta-lida', 'a carta de peão inspecionada deve continuar nos detalhes após uma jogada remota');
  assert.equal(host.selected?.row, 3, 'a inspeção deve apontar para a versão atualizada do peão');
  assert.equal(host.selectedEffect?.key, 'peace', 'a carta de Efeito inspecionada não deve ser trocada pela ação do oponente');
}

console.log('network synchronization tests passed');
