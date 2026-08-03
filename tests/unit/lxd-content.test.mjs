import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mediaDir = join(root, 'app', 'media');

test('LXD media has a complete accessible bundle for every primer', () => {
  const names = readdirSync(mediaDir);
  const stems = names
    .filter((name) => name.endsWith('.webm'))
    .map((name) => name.slice(0, -5));

  assert.equal(stems.length, 8);
  for (const stem of stems) {
    assert.ok(names.includes(`${stem}.wav`), `${stem} is missing audio fallback`);
    assert.ok(names.includes(`${stem}.vtt`), `${stem} is missing captions`);
    assert.ok(names.includes(`${stem}-transcript.txt`), `${stem} is missing transcript`);
  }

  const bridge = readFileSync(join(root, 'app', 'teachplay-12-module-bridge.js'), 'utf8');
  assert.equal((bridge.match(/activity:/g) || []).length, 12);
  assert.equal((bridge.match(/feedback:/g) || []).length, 12);
  assert.match(bridge, /Video anchor/);
  assert.match(bridge, /The written session is the primary instruction/);
});
