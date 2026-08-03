import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sessions = ['03', '04', '05', '07', '08', '09', '10'];

test('AI touchpoints declare the model and temperature they actually use', () => {
  for (const session of sessions) {
    const file = path.join(root, `session-${session}.html`);
    const html = fs.readFileSync(file, 'utf8');
    const match = html.match(/<div\s+data-ai-touchpoint[\s\S]*?<\/div>/);
    assert.ok(match, `${path.basename(file)} should contain an AI touchpoint`);
    assert.match(match[0], /data-ai-model="gemini-2\.5-flash"/);
    const temperature = match[0].match(/data-ai-temperature="([0-9]+(?:\.[0-9]+)?)"/);
    assert.ok(temperature, `${path.basename(file)} should declare a temperature`);
    assert.ok(Number(temperature[1]) >= 0 && Number(temperature[1]) <= 2);
  }
});

test('AI client renders and emits the configured temperature instead of a hidden constant', () => {
  const source = fs.readFileSync(path.join(root, 'ai.js'), 'utf8');
  assert.match(source, /const temperature = Number\.isFinite\(parsedTemperature\)/);
  assert.match(source, /generationConfig: \{ temperature: typeof temperature === 'number' \? temperature : 0\.3 \}/);
  assert.match(source, /ai-temperature': temperature/);
  assert.match(source, /aitry__config/);
});
