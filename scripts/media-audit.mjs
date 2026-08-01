import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const base = process.env.BASE_URL || 'http://127.0.0.1:8787';
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => `/${f}`).concat(['/app/', '/module-video.html?m=3']);
const browser = await chromium.launch({ headless: true });
const failures = [];
let media = 0;
for (const route of pages) {
  const page = await browser.newPage();
  page.on('requestfailed', r => { if (/\.(mp4|webm|mov|png|jpe?g|webp|svg|gif|wav|mp3|vtt)(\?|$)/i.test(r.url())) failures.push(`${route} ${r.url()} ${r.failure()?.errorText || 'failed'}`); });
  page.on('response', r => { if (/\.(mp4|webm|mov|png|jpe?g|webp|svg|gif|wav|mp3|vtt)(\?|$)/i.test(r.url())) { media++; if (r.status() >= 400) failures.push(`${route} ${r.url()} HTTP ${r.status()}`); } });
  try { await page.goto(base + route, { waitUntil: 'networkidle', timeout: 20000 }); } catch (e) { failures.push(`${route} NAV ${e.message}`); }
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ pages: pages.length, mediaRequests: media, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
