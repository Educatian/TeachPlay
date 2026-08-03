import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

test('alignment page keeps static and interactive framework scopes explicit', () => {
  const html = read('alignment.html');
  assert.match(html, /Reference frameworks/);
  assert.match(html, /six reference frameworks/);
  assert.match(html, /five direct filters/);
  assert.match(html, /Source \/ version/);
  assert.match(html, /csteachers\.org\/2017standards\/interactive/);
  assert.match(html, /nextgenscience\.org\/standards/);
  assert.match(html, /imsglobal\.org\/spec\/ob\/v3p0/);
});

test('privacy page exposes the deployment-specific AI provider boundary', () => {
  const html = read('privacy.html');
  assert.match(html, /Deployment-specific AI processing notice/);
  assert.match(html, /OpenRouter/);
  assert.match(html, /google\/gemini-3\.5-flash/);
  assert.match(html, /OPENROUTER_MODEL/);
});

test('accessibility page links the current manual review record', () => {
  const html = read('accessibility.html');
  assert.match(html, /manual-accessibility-review-2026-08-01\.md/);
  assert.match(html, /Statement last reviewed 2026-08-01/);
});

test('canvas shell keeps overview and evidence controls uniquely targetable', () => {
  const js = read('app/teachplay-canvas-shell.js');
  assert.match(js, /aria-label="Workspace overview"/);
  assert.match(js, /Progress &amp; evidence/);
  assert.match(js, /tp-landing-polished \.tp-hero-actions button/);
  assert.match(js, /tp-beginner-start__actions button/);
  assert.doesNotMatch(js, /border-radius:\s*6px/);
});
