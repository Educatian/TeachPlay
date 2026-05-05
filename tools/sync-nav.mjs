/**
 * One-shot: rewrite <nav class="primary-nav"> in every handbook page
 * so the top nav is identical across the site. The canonical structure
 * lives in this file and uses a 3-group mega-menu + instructor group
 * + single context-aware CTA.
 *
 * Groups (task-based, not file-based):
 *   - Course      — what you're learning
 *   - Resources   — reference material
 *   - Credential  — the outcome
 *   - Instructor  — role-gated teaching tools
 *   - [CTA]       — Register / Resume / View Credential (state-driven)
 *
 * Also syncs session-01…12.html and verifier.html — they previously had
 * no handbook nav and that's the "each page looks different" bug the
 * user reported.
 *
 * Run: node tools/sync-nav.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ─── Canonical nav structure ─────────────────────────────────────────
// Each group: { label, items: [[label, href, sub?]] }
// Leaf hrefs are relative to any page; sync-nav rewrites "index.html#x"
// to "#x" when the current page IS index.html, so in-page anchors stay.

const GROUPS = [
  {
    key: 'course',
    label: 'Course',
    pages: ['index.html'],
    items: [
      ['Overview',      'index.html',               'The handbook at a glance'],
      ['Sessions',      'index.html#sessions',      'Twelve weekly units'],
      ['Deliverables',  'index.html#deliverables',  'Five artifacts you ship'],
    ],
  },
  {
    key: 'resources',
    label: 'Resources',
    pages: ['rubrics.html', 'examples.html', 'cognitive-load.html', 'ai-use-policy.html', 'alignment.html', 'resources.html', 'references.html'],
    items: [
      ['Rubrics',          'rubrics.html',        'Non-compensatory criteria'],
      ['Worked Examples',  'examples.html',       'Annotated exemplars'],
      ['Cognitive Load',   'cognitive-load.html', 'Engagement vs. transfer'],
      ['AI Use Policy',    'ai-use-policy.html',  'Binding from 2026'],
      ['Alignment',        'alignment.html',      'Standards crosswalk'],
      ['Resource Library', 'resources.html',      'Companion handouts'],
      ['References',       'references.html',     '29 sources, APA 7'],
    ],
  },
  {
    key: 'credential',
    label: 'Credential',
    pages: ['credential.html', 'portfolio.html', 'verifier.html'],
    items: [
      ['About the Credential', 'credential.html', 'Open Badges 3.0 / VC'],
      ['Portfolio',            'portfolio.html',  'Your five deliverables'],
      ['Verify a Credential',  'verifier.html',   'For employers & registrars'],
    ],
  },
  {
    key: 'instructor',
    label: 'Instructor',
    pages: ['facilitator.html', 'calibration.html', 'analytics.html'],
    instructorOnly: true,
    items: [
      ['Facilitator Guide', 'facilitator.html', 'Run each session'],
      ['Calibration',       'calibration.html', 'Norm your rubric scores'],
      ['Analytics',         'analytics.html',   'Cohort dashboards'],
    ],
  },
];

// CTA is rendered by enroll.js at runtime based on localStorage; nav emits
// a placeholder anchor with id="primary-cta" so JS can target it.
const CTA_PLACEHOLDER_LABEL = 'Register →';

// ─── Markup builder ──────────────────────────────────────────────────

function resolveHref(href, currentFile) {
  // On index.html, collapse "index.html#foo" → "#foo" so anchors stay in-page.
  if (currentFile === 'index.html' && href.startsWith('index.html#')) {
    return href.slice('index.html'.length);
  }
  return href;
}

function buildNav(currentFile) {
  const out = [];
  out.push('  <nav class="primary-nav" data-primary-nav>');

  for (const g of GROUPS) {
    const isActiveGroup = g.pages.includes(currentFile);
    const groupClasses = ['primary-nav__group'];
    if (isActiveGroup) groupClasses.push('is-active');
    if (g.instructorOnly) groupClasses.push('instructor-only');

    out.push(`    <div class="${groupClasses.join(' ')}" data-nav-group>`);
    out.push(`      <button type="button" class="primary-nav__trigger" aria-expanded="false" aria-haspopup="true">${g.label} <span class="caret" aria-hidden="true">▾</span></button>`);
    out.push(`      <div class="primary-nav__panel" role="menu">`);

    for (const [label, href, sub] of g.items) {
      const baseHref = href.split('#')[0];
      const isActive = baseHref && baseHref === currentFile;
      const cls = isActive ? ' class="is-active"' : '';
      const finalHref = resolveHref(href, currentFile);
      const subHtml = sub ? `<span class="sub">${sub}</span>` : '';
      out.push(`        <a href="${finalHref}"${cls} role="menuitem">${label}${subHtml}</a>`);
    }

    out.push(`      </div>`);
    out.push(`    </div>`);
  }

  out.push(`    <a href="#" class="primary-nav__cta" id="primary-cta" data-primary-cta>${CTA_PLACEHOLDER_LABEL}</a>`);
  out.push('  </nav>');
  return out.join('\n');
}

// ─── File rewrite strategies ─────────────────────────────────────────

const NAV_RE = /<nav class="primary-nav"[^>]*>[\s\S]*?<\/nav>/;

/** Handbook pages: replace the existing <nav class="primary-nav"> in-place. */
function rewriteHandbookPage(src, file) {
  if (!NAV_RE.test(src)) return null;
  return src.replace(NAV_RE, buildNav(file));
}

/** Session pages: currently have .utility followed by .shell.
 *  Insert the nav (wrapped in .handbook-topbar) right after .utility. */
const SESSION_INSERT_RE = /(<div class="utility">[\s\S]*?<\/div>)\s*\n\s*(<div class="shell">)/;

function rewriteSessionPage(src, file) {
  if (NAV_RE.test(src)) {
    // Already has a nav — just refresh it.
    return src.replace(NAV_RE, buildNav(file));
  }
  if (!SESSION_INSERT_RE.test(src)) return null;
  const navBlock = `$1\n\n<div class="handbook-topbar">\n${buildNav(file)}\n</div>\n\n$2`;
  return src.replace(SESSION_INSERT_RE, navBlock);
}

/** Verifier page: standalone, no .utility bar. Inject at top of <body>. */
const BODY_OPEN_RE = /(<body[^>]*>)\s*\n/;

function rewriteVerifierPage(src, file) {
  if (NAV_RE.test(src)) return src.replace(NAV_RE, buildNav(file));
  // Inject utility + nav at body start. Also inject handbook.css link if missing.
  let out = src;
  if (!/href="handbook\.css"/.test(out)) {
    out = out.replace(/<\/head>/, '  <link rel="stylesheet" href="handbook.css" />\n</head>');
  }
  const topStrip = [
    '',
    '<div class="utility">',
    '  <a href="index.html" class="utility__brand">THE UNIVERSITY OF ALABAMA<span class="reg">®</span></a>',
    '  <div class="utility__right"><span data-role-switch></span><a href="index.html">Handbook</a></div>',
    '</div>',
    '<div class="handbook-topbar">',
    buildNav(file),
    '</div>',
    '',
  ].join('\n');
  return out.replace(BODY_OPEN_RE, `$1\n${topStrip}\n`);
}

// ─── Runner ─────────────────────────────────────────────────────────

const HANDBOOK_SKIP = new Set([
  'admin.html', 'claim.html', 'progress.html', 'read.html',
]);

const repoRoot = process.cwd();
const files = readdirSync(repoRoot).filter((f) => f.endsWith('.html'));

let touched = 0, skipped = 0;

function tryWrite(file, rewriter) {
  const path = join(repoRoot, file);
  const src = readFileSync(path, 'utf8');
  const out = rewriter(src, file);
  if (out == null) { skipped++; console.log(`skip ${file} (no anchor)`); return; }
  if (out === src) { skipped++; return; }
  writeFileSync(path, out);
  touched++;
  console.log(`wrote ${file}`);
}

for (const f of files) {
  if (HANDBOOK_SKIP.has(f)) { skipped++; continue; }
  if (f.startsWith('session-')) {
    tryWrite(f, rewriteSessionPage);
  } else if (f === 'verifier.html') {
    tryWrite(f, rewriteVerifierPage);
  } else {
    tryWrite(f, rewriteHandbookPage);
  }
}

console.log(`\ndone — ${touched} updated, ${skipped} skipped`);
