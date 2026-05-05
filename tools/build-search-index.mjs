/**
 * Walk every public HTML page in the repo root, extract the title,
 * heading text, and prose body, and write a flat JSON search index
 * to search-index.json at the repo root. The runtime search.js fetches
 * this once and runs an in-memory ranked search.
 *
 * Run: node tools/build-search-index.mjs
 *
 * Excludes: utility/legacy pages that aren't navigated by users (admin,
 * claim, progress, read, module-video, the old two-host primer pages).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set([
  'admin.html',
  'claim.html',
  'progress.html',
  'read.html',
  'module-video.html',
  'The Crosswalk.html',
  'The Engagement Trap.html',
]);

// Drop everything inside <script>, <style>, <nav>, <footer>, and within
// elements marked role-hidden or aria-hidden.
function stripChrome(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header class="site-header"[\s\S]*?<\/header>/gi, ' ')
    .replace(/<div class="utility"[\s\S]*?<\/div>/gi, ' ');
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (!m) return '';
  return m[1].replace(/\s+·\s+AI-enhanced.*$/i, '').trim();
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
  return out;
}

function extractText(html) {
  return stripChrome(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const root = process.cwd();
const files = readdirSync(root).filter(f => f.endsWith('.html') && !SKIP.has(f));

const index = [];
for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const title = extractTitle(html);
  const description = extractDescription(html);
  const headings = extractHeadings(html);
  const body = extractText(html);
  // Cap body to ~6 KB per page to keep the index compact (still plenty for
  // matching). Headings + description carry the most weight in search.js.
  index.push({
    url: file,
    title,
    description,
    headings,
    body: body.slice(0, 6000),
  });
}

writeFileSync(join(root, 'search-index.json'), JSON.stringify(index));
console.log(`Wrote search-index.json — ${index.length} pages, ${(JSON.stringify(index).length / 1024).toFixed(1)} KB`);
