const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEXT_PATH = path.join(ROOT, 'docs', 'videos', 'teachplay-student-completion-walkthrough-narration.txt');
const OUT_PATH = path.join(ROOT, 'docs', 'videos', 'teachplay-student-completion-walkthrough-narration.mp3');
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

function readApiKey() {
  const fromEnv = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  const candidates = [
    path.join(process.env.USERPROFILE || '', 'Desktop', 'elevenlabs_API.txt'),
    path.join(process.env.USERPROFILE || '', 'Desktop', 'elevanlabs_API.txt'),
    path.join(process.env.USERPROFILE || '', 'Desktop', 'elevenlabs_api.txt'),
  ];
  for (const file of candidates) {
    if (file && fs.existsSync(file)) {
      const key = fs.readFileSync(file, 'utf8').trim();
      if (key) return key;
    }
  }
  throw new Error('ElevenLabs API key not found in env or Desktop key files.');
}

async function main() {
  const apiKey = readApiKey();
  const text = fs.readFileSync(TEXT_PATH, 'utf8').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error(`Narration script is empty: ${TEXT_PATH}`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.82,
          style: 0.28,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${body.slice(0, 500)}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`ElevenLabs returned too little audio: ${bytes.length} bytes`);
  fs.writeFileSync(OUT_PATH, bytes);
  console.log(`${OUT_PATH} (${bytes.length} bytes)`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
