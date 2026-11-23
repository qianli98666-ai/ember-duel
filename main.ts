// Ember Duel — hand-in program for make.fun's best-card-game bounty.
//
// Node 22, standard library only. The grader runs this file with the
// repository read-only and a writable output directory; the program
// copies the playable game (game/) and its screenshots (screenshots/)
// into that directory and writes dossier.json — the summary the judge
// reads — using buildDossier from the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The run is deterministic: copying files and hashing them writes the
// same bytes every time, which the grader checks by running it twice.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, as the kit's gate states them: dossier text at most
// 160 KiB, at most 4 screenshots of 256 KiB each, game/ at most 993
// entries and 48 MiB, paths under game/ at most 1000 bytes. Passing the
// same numbers keeps the dossier this program writes identical to the
// one the gate rebuilds for comparison.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyInto(source, target) {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  copyInto(join(repoDir, 'game'), join(outDir, 'game'));

  const shotsSource = join(repoDir, 'screenshots');
  if (existsSync(shotsSource)) {
    copyInto(shotsSource, join(outDir, 'screenshots'));
  } else {
    mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outDir, GATE_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const shotCount = existsSync(shotsSource)
    ? readdirSync(shotsSource).filter((name) => !name.startsWith('.')).length
    : 0;
  console.log(
    'Ember Duel handed in: game, ' + shotCount + ' screenshots and dossier.json written to ' + outDir
  );
}

handIn();
