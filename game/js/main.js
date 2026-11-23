// Ember Duel — boot and input.
//
// Wires the buttons and keys to the engine, keeps the current game in
// one place, and re-renders after every action. The foe answers a beat
// after the player ends a turn so the strike can be read first.
//
// For screenshots the page accepts ?shot=title|battle|victory|defeat
// with a seed: battle stages a fixed mid-duel table (champions out,
// shields up, life partly spent) so a headless browser captures the
// same frame every time.

(function () {
  'use strict';

  var Engine = window.EmberEngine;
  var Ai = window.EmberAi;
  var Ui = window.EmberUi;
  var Cards = window.EmberCards;

  var state = null;
  var foeTimer = null;

  function freshSeed() {
    return (Date.now() % 2147483647) + 1;
  }

  function newGame(seed) {
    state = Engine.createGame(seed);
    Ui.showScreen('battle');
    render();
  }

  function render() {
    if (!state) return;
    if (state.phase === 'battle') {
      Ui.showScreen('battle');
      Ui.renderBattle(state, { onCard: playFromHand });
    } else {
      Ui.renderBattle(state, { onCard: playFromHand });
      Ui.renderEnd(state);
      Ui.showScreen('end');
    }
  }

  function playFromHand(handIndex) {
    if (!state || state.phase !== 'battle' || state.turn !== 'player') return;
    if (Engine.playCard(state, state.player, handIndex)) render();
  }

  function endPlayerTurn() {
    if (!state || state.phase !== 'battle' || state.turn !== 'player') return;
    Engine.endTurn(state, state.player);
    render();
    if (state.phase !== 'battle') return;
    foeTimer = setTimeout(function () {
      Ai.takeFoeTurn(state);
      render();
    }, 650);
  }

  function bindInput() {
    document.getElementById('start-button').addEventListener('click', function () {
      newGame(freshSeed());
    });
    document.getElementById('again-button').addEventListener('click', function () {
      newGame(freshSeed());
    });
    document.getElementById('end-turn-button').addEventListener('click', endPlayerTurn);

    document.addEventListener('keydown', function (event) {
      if (!state) {
        if (event.key === 'Enter' || event.key === ' ') newGame(freshSeed());
        return;
      }
      if (state.phase !== 'battle') {
        if (event.key === 'r' || event.key === 'R' || event.key === 'Enter') newGame(freshSeed());
        return;
      }
      if (state.turn !== 'player') return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        endPlayerTurn();
        return;
      }
      var slot = parseInt(event.key, 10);
      if (slot >= 1 && slot <= 9) playFromHand(slot - 1);
    });
  }

  // ---- staged tables for screenshots -------------------------------

  function stageMidDuel(seed) {
    var staged = Engine.createGame(seed);
    staged.turnNumber = 6;
    staged.player.life = 17;
    staged.player.shield = 4;
    staged.player.ember = 5;
    staged.player.maxEmber = 6;
    staged.player.board = [
      Cards.freshCard('flame-herald'),
      Cards.freshCard('ember-hound'),
      Cards.freshCard('cinder-imp')
    ];
    staged.player.hand = [
      Cards.freshCard('obsidian-brute'),
      Cards.freshCard('spark-bolt'),
      Cards.freshCard('ironbark-sentinel'),
      Cards.freshCard('skyfire-roc'),
      Cards.freshCard('kindling')
    ];
    staged.player.damageDealt = 11;
    staged.foe.life = 13;
    staged.foe.shield = 2;
    staged.foe.ember = 4;
    staged.foe.maxEmber = 6;
    staged.foe.board = [
      Cards.freshCard('ash-warden'),
      Cards.freshCard('flame-herald')
    ];
    staged.foe.hand = [
      Cards.freshCard('cinder-imp'),
      Cards.freshCard('spark-bolt'),
      Cards.freshCard('ember-hound'),
      Cards.freshCard('second-wind')
    ];
    staged.log = [
      'The Ashen Foe summons Flame Herald (power 4).',
      "The Ashen Foe's champions hits for 6: shield soaks 4, 2 reaches You.",
      'Your turn — ember refilled to 5.'
    ];
    return staged;
  }

  function bootFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    var seed = parseInt(params.get('seed') || '7', 10);
    if (shot === 'battle') {
      state = stageMidDuel(seed);
      Ui.showScreen('battle');
      render();
      return true;
    }
    if (shot === 'victory' || shot === 'defeat') {
      state = stageMidDuel(seed);
      if (shot === 'victory') {
        state.foe.life = 0;
        state.phase = 'victory';
      } else {
        state.player.life = 0;
        state.phase = 'defeat';
      }
      render();
      return true;
    }
    if (shot === 'title') {
      Ui.showScreen('title');
      return true;
    }
    return false;
  }

  bindInput();
  if (!bootFromQuery()) Ui.showScreen('title');
})();
