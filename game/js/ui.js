// Ember Duel — rendering.
//
// render(state) redraws the whole table from the state object: both
// duelists' bars, the foe's face-down hand, both champion rows, the
// player's face-up hand and the clash log. Cards are plain divs built by
// cardElement; the big number on each face is the value that matters
// (power, shield or the spell's headline amount), printed large enough
// to read across the table.

(function () {
  'use strict';

  var Engine = window.EmberEngine;

  function el(id) { return document.getElementById(id); }

  function bigNumber(card) {
    if (card.kind === 'champion') return { value: card.power, label: 'Power' };
    if (card.kind === 'guard') return { value: card.shield, label: 'Shield' };
    if (card.damage) return { value: card.damage, label: 'Damage' };
    if (card.heal) return { value: card.heal, label: 'Mend' };
    return { value: card.draw, label: 'Draw' };
  }

  function cardElement(card, options) {
    options = options || {};
    var node = document.createElement('div');
    node.className = 'card ' + card.kind + (options.onBoard ? ' on-board' : '');
    if (options.playable) node.classList.add('playable');
    if (options.unplayable) node.classList.add('unplayable');
    if (options.handIndex !== undefined) node.dataset.handIndex = options.handIndex;

    var cost = document.createElement('div');
    cost.className = 'cost';
    cost.textContent = card.cost;
    node.appendChild(cost);

    var glyph = document.createElement('div');
    glyph.className = 'glyph';
    glyph.textContent = card.glyph;
    node.appendChild(glyph);

    var name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = card.name;
    node.appendChild(name);

    var text = document.createElement('div');
    text.className = 'card-text';
    text.textContent = card.text;
    node.appendChild(text);

    var big = bigNumber(card);
    var number = document.createElement('div');
    number.className = 'big-number';
    number.textContent = big.value;
    node.appendChild(number);

    var label = document.createElement('div');
    label.className = 'big-label';
    label.textContent = big.label;
    node.appendChild(label);

    return node;
  }

  function cardBackElement() {
    var node = document.createElement('div');
    node.className = 'card-back';
    node.textContent = '▲';
    return node;
  }

  function fillRow(rowEl, nodes, emptyText) {
    rowEl.innerHTML = '';
    if (nodes.length === 0) {
      var note = document.createElement('div');
      note.className = 'empty-note';
      note.textContent = emptyText;
      rowEl.appendChild(note);
      return;
    }
    for (var i = 0; i < nodes.length; i++) rowEl.appendChild(nodes[i]);
  }

  function renderBar(prefix, duelist, showMax) {
    el(prefix + '-life').textContent = 'Life ' + Math.max(0, duelist.life);
    el(prefix + '-shield').textContent = 'Shield ' + duelist.shield;
    el(prefix + '-ember').textContent = showMax
      ? 'Ember ' + duelist.ember + '/' + duelist.maxEmber
      : 'Ember ' + duelist.ember;
    el(prefix + '-deck').textContent = 'Deck ' + duelist.deck.length;
  }

  function renderBattle(state, handlers) {
    renderBar('foe', state.foe, false);
    renderBar('player', state.player, true);

    var backs = [];
    for (var i = 0; i < state.foe.hand.length; i++) backs.push(cardBackElement());
    fillRow(el('foe-hand'), backs, 'The foe holds no cards.');

    var foeBoard = state.foe.board.map(function (card) {
      return cardElement(card, { onBoard: true });
    });
    fillRow(el('foe-board'), foeBoard, 'No foe champions yet.');

    var playerBoard = state.player.board.map(function (card) {
      return cardElement(card, { onBoard: true });
    });
    fillRow(el('player-board'), playerBoard, 'Your champions will stand here.');

    var handNodes = state.player.hand.map(function (card, index) {
      var playable = state.phase === 'battle' && state.turn === 'player' && Engine.canPlay(state.player, card);
      var node = cardElement(card, {
        handIndex: index,
        playable: playable,
        unplayable: state.phase === 'battle' && state.turn === 'player' && !playable
      });
      if (playable && handlers && handlers.onCard) {
        node.addEventListener('click', function () { handlers.onCard(index); });
      }
      return node;
    });
    fillRow(el('player-hand'), handNodes, 'Your hand is empty.');

    el('turn-banner').textContent = state.phase === 'battle'
      ? (state.turn === 'player' ? 'Your turn — turn ' + state.turnNumber : 'The foe is thinking…')
      : 'The duel is over';
    el('clash-log').innerHTML = state.log.map(escapeHtml).join('<br>');
    el('end-turn-button').disabled = !(state.phase === 'battle' && state.turn === 'player');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function showScreen(name) {
    el('title-screen').classList.toggle('hidden', name !== 'title');
    el('battle-screen').classList.toggle('hidden', name !== 'battle');
    el('end-screen').classList.toggle('hidden', name !== 'end');
  }

  function renderEnd(state) {
    var won = state.phase === 'victory';
    el('end-glyph').textContent = won ? '★' : '●';
    el('end-title').textContent = won ? 'VICTORY' : 'DEFEAT';
    el('end-line').textContent = won
      ? 'The Ashen Foe falls. The ember is yours.'
      : 'Your ember gutters out — but the table is still warm.';
    el('stat-turns').textContent = state.turnNumber;
    el('stat-damage').textContent = state.player.damageDealt;
    el('stat-life').textContent = Math.max(0, state.player.life);
    el('stat-foe-life').textContent = Math.max(0, state.foe.life);
  }

  window.EmberUi = {
    cardElement: cardElement,
    renderBattle: renderBattle,
    renderEnd: renderEnd,
    showScreen: showScreen
  };
})();
