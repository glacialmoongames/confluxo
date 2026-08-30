/* Conteúdo sincronizado com a documentação do Obsidian em 26/08/2026. */
const GAME_ICON_CREDIT='Game-icons.net · CC BY 3.0';
const icon=name=>`assets/icons/${name}.svg`;
function setCardIcon(card,name,tone='white'){Object.assign(card,{art:icon(name),artCrop:{scale:76,x:0,y:0},artCredit:GAME_ICON_CREDIT,iconTone:tone})}

Object.assign(defs,{
 divinissimo:{name:'Bispo da Casa Branca de Xadria: Divinissimo',atk:300,movement:[[-2,-2],[-2,2],[-1,-1],[-1,1],[1,-1],[1,1],[2,-2],[2,2]],types:['LUZ'],glyph:'✧',fusion:2,materials:{type:'LUZ'},text:'Enquanto estiver em campo, seus peões Xadria não são destruídos quando um combate termina empatado.'},
 terror:{name:'Cavaleiro da Casa Preta de Xadria: Terror Umbra',atk:150,movement:[[-2,-1],[-2,1],[-1,-1],[-1,0],[-1,1],[0,-2],[0,-1],[0,1],[0,2],[1,-1],[1,0],[1,1],[2,-1],[2,1]],types:['TREVAS'],glyph:'☠',fusion:2,materials:{type:'TREVAS'},text:'Ganha 100 ATK para cada peão adversário em campo.'},
 atra:{name:'Rainha da Casa Preta de Xadria: Atra',atk:500,movement:[[-3,-3],[-3,3],[-2,-2],[-2,0],[-2,2],[-1,-1],[-1,0],[-1,1],[0,-2],[0,-1],[0,1],[0,2],[1,-1],[1,0],[1,1],[2,-2],[2,0],[2,2],[3,-3],[3,3]],types:['TREVAS'],glyph:'♛',fusion:4,materials:{type:'TREVAS'},activated:true,abilityLabel:'SACRIFICAR PEÃO',text:'Habilidade: sacrifique um aliado em seu raio para ganhar um movimento e um ataque extras neste turno.'},
 impoluto:{name:'Rei da Casa Branca de Xadria: Impoluto',atk:400,movement:[[-2,0],[-1,-1],[-1,0],[-1,1],[0,-2],[0,-1],[0,1],[0,2],[1,-1],[1,0],[1,1],[2,0]],types:['TREVAS'],glyph:'♚',fusion:3,materials:{type:'LUZ'},activated:true,abilityLabel:'CONCEDER ATK',text:'Uma vez por turno, perde 100 ATK e concede 200 ATK permanentemente a outro peão em seu raio.'},
 monkey:{name:'Macaco Selvagem',atk:200,movement:[[-3,-3],[-3,0],[-3,3],[-2,-2],[-2,0],[-2,2],[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,0]],types:['NATURAL'],glyph:'●',activated:true,abilityLabel:'MOVER ALIADO',text:'Habilidade: escolha um aliado NATURAL em contato e mova-o para uma casa dentro do raio do Macaco.'},
 jaguar:{name:'Onça Selvagem',atk:250,movement:[[-2,-1],[-2,0],[-2,1],[-1,-1],[-1,1],[2,0]],types:['NATURAL'],glyph:'◆',text:'Ao derrotar um peão adversário em combate, ganha 100 ATK permanentemente.'},
 crocodile:{name:'Crocodilo Selvagem',atk:350,movement:[[-2,-2],[-2,0],[-2,2],[-1,-2],[-1,-1],[-1,0],[-1,1],[-1,2],[0,-1],[0,1]],types:['NATURAL'],glyph:'⌁',fusion:2,materials:{type:'NATURAL'},text:'Depois de destruir um peão em combate, deve se mover novamente e, se alcançar outro adversário, pode atacar de novo.'},
 creature:{name:'Criatura Abissal',atk:200,movement:[[-1,-2],[-1,-1],[-1,0],[-1,1],[-1,2],[0,-1],[0,1],[1,-2],[1,-1],[1,0],[1,1],[1,2]],types:['TREVAS'],glyph:'●',text:'Um peão Abissal básico.'},
 devotee:{name:'Devoto Abissal',atk:250,movement:[[-2,-1],[-2,1],[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]],types:['TREVAS'],glyph:'†',text:'Quando entra em campo, cria um Poço sem Fundo em qualquer casa livre.'},
 raven:{name:'Corvo da floresta Abissal',atk:150,movement:[[-2,0],[-1,-1],[-1,1],[1,-1],[1,1],[2,0]],types:['TREVAS'],glyph:'⌃',text:'Uma vez por turno, quando o oponente usa um Equipamento, cria uma cópia dessa carta na mão do dono do Corvo.'},
 amalgam:{name:'Amalgama Abissal',atk:0,movement:[],types:['TREVAS'],glyph:'☍',fusion:2,variableFusion:true,materials:{archetype:'abyss'},text:'Combine dois ou mais peões Abissais. Pode incluir peões adversários que toquem um Devoto; soma o ATK e os alcances de todos os materiais.'},
 repugnium:{name:'Ser Abissal: Repugnium',atk:400,movement:[[-2,-1],[-2,0],[-2,1],[-1,-2],[-1,-1],[-1,0],[-1,1],[-1,2],[0,-2],[0,-1],[0,1],[0,2],[1,-2],[1,-1],[1,0],[1,1],[1,2],[2,-1],[2,0],[2,1]],types:['TREVAS'],glyph:'◉',fusion:2,materials:{archetype:'abyss'},condition:'destroyed-this-turn',text:'Só pode ser combinado se um peão foi destruído neste turno. Inimigos em seu raio ficam presos e são destruídos após dois turnos nele.'},
 anssiedium:{name:'Ser Abissal: Anssiedium',atk:500,movement:[[-2,-1],[-2,0],[-2,1],[-1,0],[1,0],[2,-1],[2,0],[2,1]],types:['TREVAS'],glyph:'▼',fusion:1,materials:{archetype:'abyss'},condition:'pit-this-turn',text:'Só pode ser combinado após um peão cair em um Poço neste turno. Ao se mover, deixa um Poço na casa anterior.'}
});

Object.assign(defs.babel,{movement:[[-2,0],[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[2,0]],materials:{requirements:[{kind:'tower'},{type:'TREVAS'}]},text:'Inimigos nas casas de seu alcance de movimento têm o ATK reduzido à metade.'});
Object.assign(defs.justice,{name:'Cavaleiro da Casa Branca de Xadria: Justiça Alva',atk:350,movement:[[-2,-1],[-2,0],[-2,1],[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[2,-1],[2,0],[2,1]],text:'Começa com 1 ataque por turno e ganha mais 1 ataque para cada peão aliado derrotado no turno anterior.'});
Object.assign(defs.serpent,{name:'Grande Serpente Selvagem',movement:[[-3,0],[-2,-1],[-1,0],[0,-1],[0,1],[1,0],[2,1],[3,0]],activated:true,abilityLabel:'CRIAR OBSTÁCULO',text:'Habilidade: cria um obstáculo NATURAL em qualquer casa livre, uma vez por turno.'});
Object.assign(defs.golem,{types:['NATURAL','PEDRA']});
Object.assign(defs.venus,{text:'Peões adversários dentro de seu raio não podem se mover para fora dele.'});
Object.assign(defs.uranus,{text:'Peões inimigos dentro de seu raio não podem se mover nem atacar.'});
Object.assign(defs.rider,{activated:true,abilityLabel:'MONTAR ALIADO'});
Object.assign(defs.jester,{activated:true,abilityLabel:'COPIAR HABILIDADE'});
Object.assign(defs.neptune,{activated:true,abilityLabel:'EMPURRAR PEÃO'});

Object.assign(effects,{
 crown:{name:'Coroa da Herdeira',type:'EQUIPAMENTO',icon:'♛',equipOnly:'infantry',text:'Equipe somente à Infantaria. Ao chegar à última fileira inimiga, ela se transforma em Atra.'},
 blackRoses:{name:'Colina das Rosas Negras',type:'ARENA',icon:'❦',text:'Sempre que um jogador ganha pontos, compra uma carta aleatória entre as pilhas de Peões e Efeitos.'},
 kingdom:{name:'Reino de Xadria',type:'ARENA',icon:'▦',undrawable:true,text:'Surge quando Campo das Rosas Pálidas e Colina das Rosas Negras se encontram e mantém os dois efeitos para ambos os jogadores. Rosas Pálidas: quando um jogador perde um peão, esse jogador compra 1 carta aleatória entre Peões e Efeitos. Rosas Negras: quando um jogador ganha pontos, esse jogador compra 1 carta aleatória entre Peões e Efeitos para cada ponto recebido.'},
 tunnel:{name:'Cavar Túnel',type:'UTILIDADE',icon:'◒',text:'Coloque duas entradas em casas livres e conectadas. Um peão que pisa em uma entrada sai pela outra.'},
 blackHole:{name:'Buraco Negro',type:'UTILIDADE',icon:'●',text:'Coloque-o em uma casa livre. No começo do próximo turno, todos os peões adjacentes são destruídos.'},
 moon:{name:'Lua em Órbita',type:'EQUIPAMENTO',icon:'☾',equipOnly:'earth',text:'Equipe somente à Terra: triplica seu raio e concede 100 ATK.'},
 abyss:{name:'Abismo do Terror',type:'ARENA',icon:'◉',text:'Ao destruir um peão, o responsável ganha 100 ATK e cria um Poço na casa da vítima.'},
 noEscape:{name:'Não há escapatoria',type:'UTILIDADE',icon:'↯',text:'Nenhum peão pode se mover durante o próximo turno do oponente.'},
 eyes:{name:'Eu vejo os olhos',type:'EQUIPAMENTO',icon:'◉',text:'O equipado ganha 400 ATK. Se puder se mover e terminar o turno sem mover, o peão equipado é destruído.'}
});
Object.assign(effects.roses,{text:'Sempre que um jogador perde um peão, compra uma carta aleatória entre as pilhas de Peões e Efeitos.'});
Object.assign(effects.bow,{name:'Arco Primitivo',text:'O equipado pode atacar peões nas casas do seu próprio alcance de movimento, sem precisar estar em contato.'});

const cardIcons={infantry:'guards',tower:'white-tower',jester:'jester-hat',archer:'bowman',duck:'duck',horse:'horse-head',babel:'evil-tower',justice:'mounted-knight',divinissimo:'chess-bishop',terror:'mounted-knight',atra:'chess-queen',impoluto:'chess-king',rabbit:'rabbit',rider:'caveman',serpent:'cobra',hawk:'hawk-emblem',golem:'golem-head',monkey:'monkey',jaguar:'feline',crocodile:'croc-jaws',creature:'monster-grasp',devotee:'cultist',raven:'raven',amalgam:'tentacles-skull',repugnium:'haunting',anssiedium:'sinking-trap'};
Object.entries(cardIcons).forEach(([key,name])=>setCardIcon(defs[key],name,['archer','horse','babel','terror','atra'].includes(key)?'black':'white'));
const effectIcons={retreat:'backward-time',castle:'castle',sword:'rune-sword',burn:'burning-embers',roses:'rose',blackRoses:'shut-rose',kingdom:'empty-chessboard',crown:'queen-crown',jungle:'forest',bow:'bow-arrow',tunnel:'cave-entrance',pit:'hole',push:'push',asteroid:'asteroid',project:'orbit',peace:'peace-dove',blackHole:'black-hole-bolas',moon:'moon-orbit',abyss:'evil-eyes',noEscape:'fish-escape',eyes:'all-seeing-eye'};
Object.entries(effectIcons).forEach(([key,name])=>setCardIcon(effects[key],name,['roses','kingdom','crown','moon'].includes(key)?'black':'white'));

Object.assign(archetypes.xadria,{emblem:'▦',emblemArt:icon('empty-chessboard'),fusions:['babel','justice','divinissimo','terror','atra','impoluto'],effects:['retreat','castle','sword','crown','burn','roses','blackRoses','pit','push','peace']});
Object.assign(archetypes.wild,{emblem:'✿',emblemArt:icon('forest'),pawns:['rabbit','rider','hawk','monkey','jaguar'],fusions:['serpent','golem','crocodile'],effects:['jungle','bow','tunnel','retreat','burn','pit','push','peace']});
Object.assign(archetypes.celestial,{emblem:'✺',emblemArt:icon('orbit'),effects:['asteroid','project','blackHole','moon','burn','pit','push','peace']});
archetypes.abyss={name:'Terror Abissal',emblem:'◉',emblemArt:icon('evil-eyes'),pawns:['creature','devotee','raven'],fusions:['amalgam','repugnium','anssiedium'],effects:['abyss','noEscape','eyes','pit','push','peace']};

function archetypeVisual(key,extra=''){let a=archetypes[key];return `<img class="archetype-icon ${extra}" src="${a.emblemArt}" alt="Símbolo ${a.name}">`}
function archetypeOfUnit(u){return state?.players?.[u?.owner]?.archetype||Object.keys(archetypes).find(key=>[...archetypes[key].pawns,...archetypes[key].fusions].includes(u?.kind))||'xadria'}
function makePawnDeck(owner,key){let arc=archetypes[key];if(arc.pawnComposition)return shuffle([...arc.pawnComposition,...arc.pawnComposition].map(kind=>unit(kind,owner)));let fusionSlots=Math.min(12,arc.fusions.length*4),commonSlots=36-fusionSlots,cards=Array.from({length:commonSlots},(_,i)=>unit(arc.pawns[i%arc.pawns.length],owner));for(let i=0;i<fusionSlots;i++)cards.push(unit(arc.fusions[i%arc.fusions.length],owner));return shuffle(cards)}

fusionRequirementVisual=function(card){
 if(!card?.fusion)return'';
 let field=state?.players?.[card.owner]?.units?.filter(u=>u.row!==null)||[],requirements=card.materials?.requirements||null;
 if(requirements){let chips=requirements.map(req=>{let found=field.some(u=>req.kind?u.kind===req.kind:u.types.includes(req.type)),label=req.kind?defs[req.kind].name:`PEÃO ${req.type}`;return`<span class="material-chip ${found?'ready':'missing'}"><i>${req.kind?defs[req.kind].glyph:req.type==='TREVAS'?'◐':'✦'}</i><b>${label}</b><em>${found?'EM CAMPO':'FALTA'}</em></span>`}).join('');return`<div class="fusion-requirements"><small>PEÕES NECESSÁRIOS</small><div>${chips}</div><p>Aproxime os materiais indicados para combinar.</p></div>`}
 if(card.materials?.archetype){let count=field.filter(u=>archetypeOfUnit(u)===card.materials.archetype).length,chips=Array.from({length:card.fusion},(_,i)=>`<span class="material-chip ${i<count?'ready':'missing'}"><i>◉</i><b>PEÃO ABISSAL</b><em>${i<count?'EM CAMPO':'FALTA'}</em></span>`).join('');return`<div class="fusion-requirements"><small>PEÕES NECESSÁRIOS</small><div>${chips}</div><p>${Math.min(count,card.fusion)}/${card.fusion} materiais no campo.</p></div>`}
 let type=card.materials?.type,kinds=card.materials?.kinds,labels=kinds?kinds.map(kind=>({kind})):Array.from({length:card.fusion},()=>({type})),chips=labels.map(item=>{let found=field.some(u=>item.kind?u.kind===item.kind:u.types.includes(item.type)),label=item.kind?defs[item.kind].name:`PEÃO ${item.type}`;return`<span class="material-chip ${found?'ready':'missing'}"><i>${item.kind?defs[item.kind].glyph:item.type==='LUZ'?'✦':'✿'}</i><b>${label}</b><em>${found?'EM CAMPO':'FALTA'}</em></span>`}).join('');return`<div class="fusion-requirements"><small>PEÕES NECESSÁRIOS</small><div>${chips}</div><p>Mantenha os materiais em contato.</p></div>`
};

const baseBeginTurn=beginTurn;
beginTurn=function(){
 let current=state.players[state.current];
 (state.blackHoles||[]).filter(h=>h.armedFor===state.current).forEach(h=>{let victims=allUnits().filter(u=>Math.abs(u.row-h.row)+Math.abs(u.col-h.col)===1);victims.forEach(u=>destroy(u,h.owner,'buraco negro'));log(`O Buraco Negro em ${boardCoordinate(h.row,h.col)} consumiu ${victims.length} peão${victims.length===1?'':'ões'}.`)});
 state.blackHoles=(state.blackHoles||[]).filter(h=>h.armedFor!==state.current);
 allUnits().filter(u=>u.owner!==state.current&&hasEffect(u,'repugnium')).forEach(rep=>state.players[state.current].units.filter(u=>u.row!==null&&inMovementRadius(rep,u)).forEach(u=>{u.repugniumTurns=(u.repugniumTurns||0)+1;if(u.repugniumTurns>=2)destroy(u,rep.owner,'efeito')}));
 return baseBeginTurn();
};
