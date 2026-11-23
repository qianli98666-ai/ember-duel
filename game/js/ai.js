// Ember Duel — the Ashen Foe's brain.
//
// A small, readable heuristic. The foe plays one card at a time through
// the same engine call a player's click makes, re-reading the table after
// each play:
//   1. If a damage spell ends the duel, cast it.
//   2. When hurt and holding a guard, raise the shield.
//   3. Otherwise summon the priciest affordable champion.
//   4. Cast draw and mend spells when nothing better is on offer.
// When nothing is affordable (or worth casting) the foe ends its turn
// and its champions strike.

(function () {
  'use strict';

  var Engine = window.EmberEngine;

  function affordableIndexes(duelist) {
    var out = [];
    for (var i = 0; i < duelist.hand.length; i++) {
      if (Engine.canPlay(duelist, duelist.hand[i])) out.push(i);
    }
    return out;
  }

  function pickByKind(duelist, indexes, kind, preferHighestCost) {
    var best = -1;
    for (var k = 0; k < indexes.length; k++) {
      var card = duelist.hand[indexes[k]];
      if (card.kind !== kind) continue;
      if (best === -1) { best = indexes[k]; continue; }
      var bestCard = duelist.hand[best];
      if (preferHighestCost ? card.cost > bestCard.cost : card.cost < bestCard.cost) {
        best = indexes[k];
      }
    }
    return best;
  }

  // Chooses the foe's next play, or -1 when the foe should stop.
  function choosePlay(state) {
    var foe = state.foe;
    var player = state.player;
    var options = affordableIndexes(foe);
    if (options.length === 0) return -1;

    // 1. Lethal burn: a damage spell that finishes the player.
    for (var i = 0; i < options.length; i++) {
      var card = foe.hand[options[i]];
      if (card.kind === 'spell' && card.damage) {
        var through = Math.max(0, card.damage - player.shield);
        if (through >= player.life) return options[i];
      }
    }

    // 2. Hurt? Raise a shield before summoning more attackers.
    if (foe.life <= 10) {
      var guard = pickByKind(foe, options, 'guard', true);
      if (guard !== -1) return guard;
    }

    // 3. Summon the biggest champion the ember allows.
    var champion = pickByKind(foe, options, 'champion', true);
    if (champion !== -1) return champion;

    // 4. A guard is still better than passing with ember unspent.
    var anyGuard = pickByKind(foe, options, 'guard', true);
    if (anyGuard !== -1) return anyGuard;

    // 5. Spells: draw first, then burn, then mend when hurt.
    for (var j = 0; j < options.length; j++) {
      var spell = foe.hand[options[j]];
      if (spell.kind !== 'spell') continue;
      if (spell.draw) return options[j];
    }
    for (var m = 0; m < options.length; m++) {
      var burn = foe.hand[options[m]];
      if (burn.kind === 'spell' && burn.damage) return options[m];
    }
    if (foe.life <= 14) {
      for (var n = 0; n < options.length; n++) {
        var mend = foe.hand[options[n]];
        if (mend.kind === 'spell' && mend.heal) return options[n];
      }
    }
    return -1;
  }

  // Plays the foe's whole turn, then hands the table back.
  function takeFoeTurn(state) {
    var guard = 0;
    while (state.phase === 'battle' && guard < 12) {
      guard += 1;
      var next = choosePlay(state);
      if (next === -1) break;
      if (!Engine.playCard(state, state.foe, next)) break;
    }
    if (state.phase === 'battle') Engine.endTurn(state, state.foe);
  }

  window.EmberAi = {
    choosePlay: choosePlay,
    takeFoeTurn: takeFoeTurn
  };
})();
