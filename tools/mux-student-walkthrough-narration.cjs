const { chromium } = require('../node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const VIDEO_URL = `${BASE}/docs/videos/teachplay-student-completion-walkthrough.webm`;
const AUDIO_URL = `${BASE}/docs/videos/teachplay-student-completion-walkthrough-narration.wav`;
const OUT = path.join(ROOT, 'docs', 'videos', 'teachplay-student-completion-walkthrough.integrated.webm');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });

  const downloadPromise = page.waitForEvent('download', { timeout: 180000 });
  const result = await page.evaluate(async ({ videoUrl, audioUrl }) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const audio = document.createElement('audio');
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    audio.preload = 'auto';

    await Promise.all([
      new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('Video failed to load'));
      }),
      new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = () => reject(new Error('Audio failed to load'));
      })
    ]);

    const width = video.videoWidth || 1440;
    const height = video.videoHeight || 1000;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);

    const stream = canvas.captureStream(30);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 128_000
    });
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };

    const draw = () => {
      if (!video.ended) {
        ctx.drawImage(video, 0, 0, width, height);
        requestAnimationFrame(draw);
      }
    };

    recorder.start(1000);
    await audioContext.resume();
    video.currentTime = 0;
    audio.currentTime = 0;
    await Promise.all([video.play(), audio.play()]);
    draw();

    await new Promise((resolve) => {
      const maxMs = Math.ceil(Math.max(video.duration || 0, audio.duration || 0, 90) * 1000) + 3000;
      const timeout = setTimeout(resolve, maxMs);
      const check = () => {
        if (video.ended && audio.ended) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 250);
        }
      };
      check();
    });

    await new Promise((resolve) => {
      recorder.onstop = resolve;
      if (recorder.state !== 'inactive') recorder.stop();
      else resolve();
    });

    const blob = new Blob(chunks, { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teachplay-student-completion-walkthrough.integrated.webm';
    document.body.appendChild(link);
    link.click();
    return {
      size: blob.size,
      type: blob.type,
      videoDuration: video.duration,
      audioDuration: audio.duration,
      chunks: chunks.length
    };
  }, { videoUrl: VIDEO_URL, audioUrl: AUDIO_URL });

  const download = await downloadPromise;
  await download.saveAs(OUT);
  await context.close();
  await browser.close();
  if (!fs.existsSync(OUT) || fs.statSync(OUT).size < 1024 * 1024) {
    throw new Error(`Integrated video was not written correctly: ${JSON.stringify(result)}`);
  }
  console.log(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
