# Ember Duel — dossier

## The game

Ember Duel is a one-on-one, turn-based card duel played in a desktop
browser from static files. You face the Ashen Foe across a dark table.
Both duelists start at 30 life with a 30-card deck and a hand of five.
The first duelist whose life reaches zero loses; a victory or defeat
screen closes the duel with its numbers (turns played, damage dealt,
life left on both sides) and a play-again button.

## How to play

- **Ember** is the resource. You start with 3; at the start of each of
  your turns it refills and its maximum grows by 1, up to 8. Cards cost
  ember to play.
- **Champions** (orange) stay on your side of the table. When you end
  your turn, every champion you control strikes the foe for its power.
- **Guards** (blue) raise a shield. Incoming strikes soak into the
  shield first; only the overflow reaches life. Shield lasts until it
  is spent.
- **Spells** (purple) resolve at once: Spark Bolt deals 3 damage,
  Second Wind restores 4 life, Kindling draws 2 cards, Wildfire deals
  2 damage and draws 1.
- **Controls:** click a card in your hand to play it, or press 1-7 for
  the hand slots. Enter (or Space, or the End turn button) ends your
  turn. On the end screens, R or Enter starts a fresh duel.
- Drawing from an empty deck costs escalating fatigue life, so a duel
  always ends.

## The foe

The Ashen Foe plays by a small readable heuristic: it casts a lethal
burn when one is available, raises a shield when hurt, otherwise
summons the priciest champion its ember allows, then spends leftovers
on guards and spells. It plays through the same engine calls a click
makes, so both sides obey identical rules.

## Design notes

- The whole duel state lives in one object (`js/engine.js`); rendering
  (`js/ui.js`) redraws the table from it after every action, so the
  screenshots and the live game can never disagree.
- Card faces print one big number — power, shield or the spell's
  headline amount — with the cost in the corner, readable at a glance
  and in a shrunken screenshot.
- Games are seeded (mulberry32). `?shot=battle&seed=7` stages a fixed
  mid-duel table; the four screenshots in `screenshots/` are real
  headless-Chrome renders of those states, listed in `shots.json`.
- Files each do one job: `cards.js` (pool and deck), `engine.js`
  (rules), `ai.js` (foe), `ui.js` (rendering), `main.js` (boot and
  input). No network requests anywhere; system fonts only.
