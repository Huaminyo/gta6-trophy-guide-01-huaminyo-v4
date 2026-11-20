// The Leonida Field Manual — GTA VI trophy guide, entrypoint (Node 22, stdlib only).
//
// What this program does: it takes the guide as built (the static files under
// app/ plus the screenshots/ renders) and hands it in. It copies both trees
// into the output directory and writes /output/dossier.json with the vendored
// make.fun library — the dossier is what the judge reads: the screenshots, the
// first load's files and bytes, and the source. vendor/makefun-frontend.ts is
// the kit's copy, byte for byte; the scorer rebuilds the dossier with its own
// copy and the two must match.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Caps the scorer enforces (reference/gate.json): the dossier text cap shapes
// the bytes; the rest refuse an entry the scorer would refuse.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 50331648;

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source: string, target: string): void {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function handIn(): void {
  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    app_max_files: APP_MAX_FILES,
    app_max_bytes: APP_MAX_BYTES,
  });
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  verifyHandoff(dossierPath);
}

// Read the dossier back and parse it: a corrupt or empty handoff must fail
// loudly here, not surface later as a rejected entry.
function verifyHandoff(dossierPath: string): void {
  const bytes = readFileSync(dossierPath, 'utf8');
  const parsed = JSON.parse(bytes) as { images?: unknown[] };
  const shots = Array.isArray(parsed.images) ? parsed.images.length : 0;
  if (bytes.length === 0 || shots === 0) {
    throw new Error(`handoff verification failed: dossier ${bytes.length} bytes, ${shots} screenshots`);
  }
  console.log(`handed in: dossier.json ${bytes.length} bytes, ${shots} screenshots`);
}

handIn();
