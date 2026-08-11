const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('network.js', 'utf8');

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
    beginInitialPlacement() {},
    beginTurn() {},
    canLocalAct() { return context.state.current === context.localPlayer },
    updateOnlineStart() {},
    clearAnimationMarks() {},
    allUnits() { return [] },
    confirm() { return false }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.onlineMode = true;
  context.localPlayer = player;
  context.onlineRole = player === 1 ? 'host' : 'guest';
  context.updateOnlineStart = () => {};
  context.gameStarted = () => true;
  return context;
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
  const lobby = makeClient(1, playerState(1, 'estado-provisorio'));
  lobby.gameStarted = () => false;
  lobby.dataChannel = { open: true, send() { throw new Error('o lobby nao deveria enviar estado de jogo'); } };
  assert.equal(lobby.sendGameState(true, false), false, 'o lobby nao deve sincronizar jogadas antes do inicio');
  assert.equal(lobby.pendingStatePacket, null, 'o lobby nao deve criar uma jogada pendente');
}

{
  const host = makeClient(1, playerState(1, 'sala-host'));
  const guest = makeClient(2, playerState(1, 'sala-guest'));
  let dropped = false;
  const connection = link(host, guest, (packet, side) => side === 'a' && packet.type === 'deck' && !dropped && (dropped = true));

  host.sendDeckChoice();
  assert.equal(guest.remoteDeck, null, 'o primeiro deck deveria ser perdido no teste');
  guest.sendDeckChoice();
  assert.equal(host.remoteDeck, 'selvagem', 'o host deve receber o deck do convidado');
  assert.equal(guest.remoteDeck, 'xadria', 'a confirmacao deve levar o deck do host ao convidado');

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

console.log('network synchronization tests passed');
