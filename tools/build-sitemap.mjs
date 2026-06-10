/**
 * Generate sitemap.xml + robots.txt from the public HTML pages in repo root.
 * Run: node tools/build-sitemap.mjs
 *
 * Excludes the same utility pages the search index excludes.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const SITE = 'https://teachplay.dev';

const SKIP = new Set([
  'admin.html',
  'claim.html',
  'progress.html',
  'read.html',
  'module-video.html',
  'The Crosswalk.html',
  'The Engagement Trap.html',
  '404.html',
  'eval-build-walkthrough.html', // internal Codex doc, low SEO value
]);

const root = process.cwd();
const files = readdirSync(root)
  .filter(f => f.endsWith('.html'))
  .filter(f => !SKIP.has(f))
  .sort();

const today = new Date().toISOString().slice(0, 10);

function priorityFor(file) {
  if (file === 'index.html') return '1.0';
  if (file.startsWith('session-')) return '0.8';
  if (['rubrics.html', 'examples.html', 'handbook.html', 'credential.html'].includes(file)) return '0.9';
  return '0.6';
}

// Derive lastmod from git commit history so the sitemap is reproducible across
// checkouts (filesystem mtime is the clone time on a fresh git checkout, which
// would claim every page changed today and churn the file on every CI run).
// Falls back to mtime then today for untracked files.
function lastmod(file) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (_) { /* not a git repo / untracked — fall through */ }
  try {
    return new Date(statSync(join(root, file)).mtime).toISOString().slice(0, 10);
  } catch (_) { return today; }
}

const urls = files.map(f => {
  const path = f === 'index.html' ? '' : f;
  return `  <url>
    <loc>${SITE}/${path}</loc>
    <lastmod>${lastmod(f)}</lastmod>
    <priority>${priorityFor(f)}</priority>
  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(root, 'sitemap.xml'), sitemap);

const robots = `# robots.txt for teachplay.dev
User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /claim.html
Disallow: /progress.html
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;

writeFileSync(join(root, 'robots.txt'), robots);

console.log(`Wrote sitemap.xml — ${files.length} URLs`);
console.log(`Wrote robots.txt`);
