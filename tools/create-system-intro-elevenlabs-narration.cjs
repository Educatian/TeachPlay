const fs = require('node:fs');

const [, , inputPath, outputPath, voiceId = '21m00Tcm4TlvDq8ikWAM'] = process.argv;
if (!inputPath || !outputPath) {
  throw new Error('Usage: node create-system-intro-elevenlabs-narration.cjs <input.txt> <output.mp3> [voice_id]');
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
  if (!apiKey || !apiKey.trim()) throw new Error('ELEVENLABS_API_KEY is not set.');

  const text = fs.readFileSync(inputPath, 'utf8').replace(/\s+/g, ' ').trim();
  if (!text) throw new Error(`Narration script is empty: ${inputPath}`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey.trim(),
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
  fs.writeFileSync(outputPath, bytes);
  console.log(`${outputPath} (${bytes.length} bytes)`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
