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
assert.match(source, /if\(packet\?\.type==='heartbeat'\)[^\n]+if\(packet\?\.type==='spectate-request'\)/, 'o canal espectador deve aceitar somente presença e solicitação de leitura');
assert.match(source, /onlineSpectators=\[\]/, 'o lobby deve manter a lista de espectadores');
assert.match(source, /type:'spectator-list'/, 'a lista de espectadores deve ser sincronizada');
assert.match(source, /function renderLobbyParticipants/, 'o lobby deve mostrar os perfis presentes');
assert.match(source, /updatePointGoalControl/, 'a meta de pontos deve ser visível somente ao anfitrião');

function classList() {
  return { add() {}, remove() {}, toggle() {}, contains() { return true } };
}

function playerState(current, marker) {
  return {
    turn: 2,
    current,
    marker,
    animating: false,
    placementPhase: false,
    passPurpose: null,
    swordQueue: [],
    players: { 1: { units: [] }, 2: { units: [] } }
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
    allUnits() { return [] },
    confirm() { return false }
  };
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
