/**
 * Ensure every page with <nav class="primary-nav"> also loads nav.js
 * (for dropdown behavior) and enroll.js (for the context-aware CTA).
 *
 * Strategy: insert missing scripts right before </body>. Idempotent.
 *
 * Run: node tools/ensure-nav-scripts.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const files = readdirSync(repoRoot).filter((f) => f.endsWith('.html'));

const SKIP = new Set([
  'admin.html', 'claim.html', 'progress.html', 'read.html',
  'The Crosswalk.html', 'The Engagement Trap.html',
]);

let touched = 0, skipped = 0;

for (const f of files) {
  if (SKIP.has(f)) { skipped++; continue; }
  const path = join(repoRoot, f);
  let src = readFileSync(path, 'utf8');
  if (!/<nav class="primary-nav"/.test(src)) { skipped++; continue; }

  const toInsert = [];
  if (!/src="nav\.js"/.test(src))    toInsert.push('<script src="nav.js"></script>');
  if (!/src="enroll\.js"/.test(src)) toInsert.push('<script src="enroll.js"></script>');

  if (toInsert.length === 0) { skipped++; continue; }

  // Insert right before </body>. Use the last </body> in case of quirks.
  const idx = src.lastIndexOf('</body>');
  if (idx === -1) { skipped++; console.log(`skip ${f} (no </body>)`); continue; }
  src = src.slice(0, idx) + toInsert.join('\n') + '\n' + src.slice(idx);

  writeFileSync(path, src);
  touched++;
  console.log(`wrote ${f}  (+ ${toInsert.length} script${toInsert.length === 1 ? '' : 's'})`);
}

console.log(`\ndone — ${touched} updated, ${skipped} skipped`);
