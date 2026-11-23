// Ember Duel — the rules engine.
//
// One state object holds both duelists, the turn counter, the clash log
// and the end-of-game stats. The engine is pure rules: it never touches
// the page. ui.js renders whatever the state says, and ai.js asks the
// engine to play the foe's cards through the same functions a click uses.
//
// Turn flow:
//   startTurn(side)   refill ember (max grows by 1, capped at 8), draw 1
//   playCard(...)     pay ember, put a champion or guard down, cast a spell
//   endTurn(side)     the side's champions strike the other duelist
// A strike is soaked by the defender's shield first; what is left hits
// life. Drawing from an empty deck costs fatigue life, so no duel can
// stall forever.

(function () {
  'use strict';

  var START_LIFE = 30;
  var START_HAND = 5;
  var START_EMBER = 3;
  var MAX_EMBER = 8;

  // Small seeded random source (mulberry32): same seed, same duel.
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newDuelist(name, deck) {
    return {
      name: name,
      life: START_LIFE,
      shield: 0,
      ember: START_EMBER,
      maxEmber: START_EMBER,
      deck: deck,
      hand: [],
      board: [],
      fatigue: 0,
      damageDealt: 0
    };
  }

  function createGame(seed) {
    var rng = makeRng(seed);
    var state = {
      seed: seed,
      rng: rng,
      phase: 'battle',
      turn: 'player',
      turnNumber: 1,
      player: newDuelist('You', window.EmberCards.buildDeck(rng)),
      foe: newDuelist('The Ashen Foe', window.EmberCards.buildDeck(rng)),
      log: []
    };
    drawCards(state, state.player, START_HAND, true);
    drawCards(state, state.foe, START_HAND, true);
    pushLog(state, 'The duel begins. Both duelists stand at ' + START_LIFE + ' life.');
    return state;
  }

  function pushLog(state, line) {
    state.log.push(line);
    if (state.log.length > 4) state.log.shift();
  }

  function otherSide(state, side) {
    return side === state.player ? state.foe : state.player;
  }

  function drawCards(state, duelist, count, silent) {
    for (var i = 0; i < count; i++) {
      if (duelist.deck.length === 0) {
        duelist.fatigue += 1;
        duelist.life -= duelist.fatigue;
        if (!silent) {
          pushLog(state, duelist.name + ' has no cards left and takes ' + duelist.fatigue + ' fatigue.');
        }
      } else {
        duelist.hand.push(duelist.deck.pop());
      }
    }
    checkEnd(state);
  }

  function startTurn(state, duelist) {
    if (state.turnNumber > 1 || duelist === state.foe) {
      duelist.maxEmber = Math.min(MAX_EMBER, duelist.maxEmber + 1);
    }
    duelist.ember = duelist.maxEmber;
    drawCards(state, duelist, 1, false);
  }

  function canPlay(duelist, card) {
    return duelist.ember >= card.cost;
  }

  // Plays the card at handIndex for the given duelist. Returns true when
  // the play happened, false when the card was not affordable.
  function playCard(state, duelist, handIndex) {
    var card = duelist.hand[handIndex];
    if (!card || !canPlay(duelist, card)) return false;
    duelist.hand.splice(handIndex, 1);
    duelist.ember -= card.cost;
    var foe = otherSide(state, duelist);

    if (card.kind === 'champion') {
      duelist.board.push(card);
      pushLog(state, duelist.name + ' summons ' + card.name + ' (power ' + card.power + ').');
    } else if (card.kind === 'guard') {
      duelist.shield += card.shield;
      pushLog(state, duelist.name + ' raises ' + card.name + ' — shield now ' + duelist.shield + '.');
    } else {
      pushLog(state, duelist.name + ' casts ' + card.name + '.');
      if (card.damage) dealDamage(state, duelist, foe, card.damage, card.name);
      if (card.heal) {
        duelist.life = Math.min(START_LIFE, duelist.life + card.heal);
        pushLog(state, duelist.name + ' mends ' + card.heal + ' life (now ' + duelist.life + ').');
      }
      if (card.draw) drawCards(state, duelist, card.draw, false);
    }
    checkEnd(state);
    return true;
  }

  // Damage always meets the shield first; the overflow reaches life.
  function dealDamage(state, attacker, defender, amount, sourceName) {
    var soaked = Math.min(defender.shield, amount);
    defender.shield -= soaked;
    var through = amount - soaked;
    defender.life -= through;
    attacker.damageDealt += through;
    if (soaked > 0 && through > 0) {
      pushLog(state, sourceName + ' hits for ' + amount + ': shield soaks ' + soaked + ', ' + through + ' reaches ' + defender.name + '.');
    } else if (soaked > 0) {
      pushLog(state, sourceName + ' hits for ' + amount + ' — the shield soaks it all.');
    } else {
      pushLog(state, sourceName + ' hits ' + defender.name + ' for ' + through + '.');
    }
    checkEnd(state);
  }

  function boardPower(duelist) {
    var total = 0;
    for (var i = 0; i < duelist.board.length; i++) total += duelist.board[i].power;
    return total;
  }

  // Ending a turn: your champions strike, then the other side starts.
  function endTurn(state, duelist) {
    if (state.phase !== 'battle') return;
    var defender = otherSide(state, duelist);
    var power = boardPower(duelist);
    if (power > 0) {
      dealDamage(state, duelist, defender, power, duelist.name + "'s champions");
    } else {
      pushLog(state, duelist.name + ' has no champions to strike with.');
    }
    if (state.phase !== 'battle') return;
    if (duelist === state.player) {
      state.turn = 'foe';
      startTurn(state, state.foe);
    } else {
      state.turn = 'player';
      state.turnNumber += 1;
      startTurn(state, state.player);
    }
  }

  function checkEnd(state) {
    if (state.phase !== 'battle') return;
    if (state.foe.life <= 0 && state.player.life > 0) {
      state.phase = 'victory';
      pushLog(state, 'The Ashen Foe falls. The ember is yours.');
    } else if (state.player.life <= 0) {
      state.phase = 'defeat';
      pushLog(state, 'Your ember gutters out.');
    }
  }

  window.EmberEngine = {
    START_LIFE: START_LIFE,
    START_HAND: START_HAND,
    MAX_EMBER: MAX_EMBER,
    makeRng: makeRng,
    createGame: createGame,
    drawCards: drawCards,
    startTurn: startTurn,
    canPlay: canPlay,
    playCard: playCard,
    endTurn: endTurn,
    boardPower: boardPower,
    pushLog: pushLog
  };
})();
