/**
 * One-shot: rewrite <nav class="primary-nav"> in every handbook page
 * so the top nav is identical across the site. The canonical item list
 * lives in this file; per-page diffs reduce to which link gets
 * `is-active` and whether in-page anchors resolve locally (on index)
 * or cross-page (everywhere else).
 *
 * Run: node tools/sync-nav.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\//, '').replace(/\//g, '\\');

// Each entry: [label, href-relative-to-any-page, optional className, optional id]
const NAV_ITEMS = [
  ['Overview',          'index.html'],
  ['Sessions',          'index.html#sessions'],
  ['Deliverables',      'index.html#deliverables'],
  ['Rubrics',           'rubrics.html'],
  ['Worked Examples',   'examples.html'],
  ['Alignment',         'alignment.html'],
  ['Portfolio',         'portfolio.html'],
  ['Credential',        'credential.html'],
  ['Verify',            'verifier.html'],
  ['Facilitator',       'facilitator.html',  'instructor-only'],
  ['Calibration',       'calibration.html',  'instructor-only'],
  ['Analytics',         'analytics.html',    'instructor-only'],
  ['Resource Library',  'resources.html'],
  ['Register',          '#',                  null, 'register-link'],
  ['Begin Session 01',  'session-01.html'],
];

function buildNav(currentFile) {
  const lines = ['  <nav class="primary-nav">'];
  for (const [label, href, cls, id] of NAV_ITEMS) {
    // "Overview" is active on index.html; every other non-anchor page is
    // active only on its own file. Anchor items (#sessions, #deliverables,
    // #register) never get is-active.
    const baseHref = href.split('#')[0];
    const isActive = baseHref && baseHref === currentFile;
    const classes = [cls, isActive ? 'is-active' : ''].filter(Boolean).join(' ');
    // On index.html, collapse "index.html#sessions" to bare "#sessions" so
    // the anchor stays in-page instead of forcing a reload.
    const finalHref = currentFile === 'index.html' && href.startsWith('index.html#')
      ? href.slice('index.html'.length)
      : href;
    const attrs = [
      `href="${finalHref}"`,
      classes ? `class="${classes}"` : '',
      id ? `id="${id}"` : '',
    ].filter(Boolean).join(' ');
    lines.push(`    <a ${attrs}>${label}</a>`);
  }
  lines.push('  </nav>');
  return lines.join('\n');
}

const NAV_RE = /<nav class="primary-nav">[\s\S]*?<\/nav>/;

const repoRoot = process.cwd();
const targets = readdirSync(repoRoot)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => {
    // Skip auth / self-contained pages — they intentionally don't show
    // the handbook chrome.
    const skip = new Set([
      'admin.html', 'claim.html', 'progress.html', 'verifier.html',
      'read.html',
    ]);
    if (skip.has(f)) return false;
    if (f.startsWith('session-')) return false; // session pages use a
    // different layout (sidebar-driven) and their own minimal top bar.
    return true;
  });

let touched = 0, skipped = 0;
for (const f of targets) {
  const path = join(repoRoot, f);
  const src = readFileSync(path, 'utf8');
  if (!NAV_RE.test(src)) { skipped++; console.log(`skip ${f} (no primary-nav)`); continue; }
  const replaced = src.replace(NAV_RE, buildNav(f));
  if (replaced === src) { skipped++; continue; }
  writeFileSync(path, replaced);
  touched++;
  console.log(`wrote ${f}`);
}
console.log(`\ndone — ${touched} updated, ${skipped} skipped`);
