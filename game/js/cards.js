// Ember Duel — the card pool and deck builder.
//
// Every card is a plain object: a name, a kind (champion, guard or spell),
// an ember cost, one big number (power for champions, shield for guards,
// the headline amount for spells), a glyph drawn on the face, and a short
// rules line. buildDeck assembles the fixed 30-card duel deck and shuffles
// it with the game's seeded random source, so a seed always deals the
// same game.

(function () {
  'use strict';

  var CARD_POOL = [
    // Champions: they stay on the table and strike at end of turn.
    { id: 'cinder-imp',      name: 'Cinder Imp',      kind: 'champion', cost: 1, power: 2, glyph: '▲', text: 'Small, quick, always smouldering.' },
    { id: 'ember-hound',     name: 'Ember Hound',     kind: 'champion', cost: 2, power: 3, glyph: '◆', text: 'It fetches sparks and trouble.' },
    { id: 'ash-warden',      name: 'Ash Warden',      kind: 'champion', cost: 2, power: 2, glyph: '■', text: 'Holds the grey line without blinking.' },
    { id: 'flame-herald',    name: 'Flame Herald',    kind: 'champion', cost: 3, power: 4, glyph: '★', text: 'Announces every battle twice.' },
    { id: 'obsidian-brute',  name: 'Obsidian Brute',  kind: 'champion', cost: 4, power: 5, glyph: '●', text: 'Glass-hard and twice as sharp.' },
    { id: 'skyfire-roc',     name: 'Skyfire Roc',     kind: 'champion', cost: 5, power: 6, glyph: '✦', text: 'Its shadow arrives before the fire.' },
    { id: 'magma-titan',     name: 'Magma Titan',     kind: 'champion', cost: 7, power: 8, glyph: '▲', text: 'The mountain learned to walk.' },

    // Guards: they raise a shield that soaks the next strikes.
    { id: 'buckler-sprite',  name: 'Buckler Sprite',  kind: 'guard', cost: 1, shield: 2, glyph: '●', text: 'A round shield with wings.' },
    { id: 'ironbark-sentinel', name: 'Ironbark Sentinel', kind: 'guard', cost: 2, shield: 4, glyph: '■', text: 'Roots deep, bark like plate.' },
    { id: 'aegis-colossus',  name: 'Aegis Colossus',  kind: 'guard', cost: 4, shield: 7, glyph: '◆', text: 'A wall that decided to stand here.' },

    // Spells: one-shot effects, resolved the moment they are played.
    { id: 'spark-bolt',      name: 'Spark Bolt',      kind: 'spell', cost: 2, damage: 3, glyph: '✦', text: 'Deal 3 damage to the foe.' },
    { id: 'second-wind',     name: 'Second Wind',     kind: 'spell', cost: 2, heal: 4, glyph: '●', text: 'Restore 4 of your life.' },
    { id: 'kindling',        name: 'Kindling',        kind: 'spell', cost: 1, draw: 2, glyph: '▲', text: 'Draw 2 cards.' },
    { id: 'wildfire',        name: 'Wildfire',        kind: 'spell', cost: 3, damage: 2, draw: 1, glyph: '★', text: 'Deal 2 damage and draw 1 card.' }
  ];

  // How many copies of each card go into a duel deck (30 cards in all).
  var DECK_RECIPE = {
    'cinder-imp': 3,
    'ember-hound': 3,
    'ash-warden': 2,
    'flame-herald': 3,
    'obsidian-brute': 2,
    'skyfire-roc': 2,
    'magma-titan': 1,
    'buckler-sprite': 2,
    'ironbark-sentinel': 2,
    'aegis-colossus': 1,
    'spark-bolt': 3,
    'second-wind': 2,
    'kindling': 2,
    'wildfire': 2
  };

  function cardById(id) {
    for (var i = 0; i < CARD_POOL.length; i++) {
      if (CARD_POOL[i].id === id) return CARD_POOL[i];
    }
    return null;
  }

  // A fresh copy of a card, so two copies in play never share state.
  function freshCard(id) {
    var base = cardById(id);
    var copy = {};
    for (var key in base) copy[key] = base[key];
    return copy;
  }

  function shuffle(deck, rng) {
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  function buildDeck(rng) {
    var deck = [];
    for (var id in DECK_RECIPE) {
      for (var n = 0; n < DECK_RECIPE[id]; n++) deck.push(freshCard(id));
    }
    return shuffle(deck, rng);
  }

  window.EmberCards = {
    CARD_POOL: CARD_POOL,
    DECK_RECIPE: DECK_RECIPE,
    cardById: cardById,
    freshCard: freshCard,
    buildDeck: buildDeck
  };
})();
