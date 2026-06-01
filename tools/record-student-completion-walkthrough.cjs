const { chromium } = require('../node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'videos');
const BASE = 'http://127.0.0.1:8765';

const cues = [
  [0, 5, 'Here is the basic student path in TeachPlay. Everything starts from the same learner workspace.'],
  [5, 12, 'If this is for real course credit, students should sign in first so progress and certificate records can be saved.'],
  [12, 18, 'From the credential card, students review the expectations, then enter the guided course.'],
  [18, 27, 'Inside the course, the 12 modules are the main learning path. The portfolio checkpoints are where students collect evidence for review.'],
  [27, 36, 'Students work through the lessons, use the case studies, try the beginner AI prompts, and mark progress as they go.'],
  [36, 44, 'When the portfolio is ready, students open the final submission, add their context and evidence, and send it for review.'],
  [44, 52, 'After completion, the certificate handoff shows what was earned and where the downloadable credential evidence lives.']
];

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function vttTime(seconds) {
  const totalMs = Math.floor(seconds * 1000);
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function writeTextAssets() {
  const vtt = ['WEBVTT', '']
    .concat(cues.flatMap(([start, end, text], index) => [
      String(index + 1),
      `${vttTime(start)} --> ${vttTime(end)}`,
      text,
      ''
    ]))
    .join('\n');

  const transcript = [
    'TeachPlay Student Completion Walkthrough',
    '',
    ...cues.map(([start, end, text], index) => `${index + 1}. ${vttTime(start)} - ${vttTime(end)}: ${text}`)
  ].join('\n');

  fs.writeFileSync(path.join(OUT_DIR, 'teachplay-student-completion-walkthrough.vtt'), vtt);
  fs.writeFileSync(path.join(OUT_DIR, 'teachplay-student-completion-walkthrough-transcript.txt'), transcript);
  fs.writeFileSync(path.join(OUT_DIR, 'teachplay-student-completion-walkthrough-narration.txt'), cues.map(([, , text]) => text).join('\n'));
}

async function pause(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function setCaption(page, text) {
  await page.evaluate((captionText) => {
    let caption = document.querySelector('[data-recording-caption]');
    if (!caption) {
      caption = document.createElement('div');
      caption.dataset.recordingCaption = 'true';
      caption.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:28px',
        'transform:translateX(-50%)',
        'z-index:2147483647',
        'max-width:min(980px,calc(100vw - 48px))',
        'border:1px solid rgba(255,255,255,.35)',
        'border-radius:8px',
        'background:rgba(8,18,36,.92)',
        'color:#fff',
        'padding:14px 18px',
        'font:700 18px/1.45 Inter,Arial,sans-serif',
        'box-shadow:0 20px 50px rgba(0,0,0,.28)',
        'text-align:center'
      ].join(';');
      document.body.appendChild(caption);
    }
    caption.textContent = captionText;
  }, text);
}

async function click(page, name, timeout = 5000) {
  const button = page.getByRole('button', { name: new RegExp(name, 'i') }).first();
  await button.waitFor({ state: 'visible', timeout });
  await button.click({ force: true });
}

async function main() {
  mkdirp(OUT_DIR);
  writeTextAssets();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 1000 } }
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await setCaption(page, cues[0][2]);
  await pause(4500);

  await setCaption(page, cues[1][2]);
  await click(page, '^Sign In$');
  await page.waitForTimeout(600);
  await page.locator('input[type="email"]').fill('student@example.edu');
  await page.locator('input[type="password"]').fill('course-password');
  await pause(3000);
  await page.keyboard.press('Escape');
  const closeSignIn = page.getByRole('button', { name: /Close sign in dialog/i }).first();
  if (await closeSignIn.count()) await closeSignIn.click();
  await page.waitForTimeout(800);

  await setCaption(page, cues[2][2]);
  await click(page, 'Start learning');
  await page.waitForTimeout(1000);
  await click(page, 'Enter guided course');
  await page.waitForTimeout(1200);

  await setCaption(page, cues[3][2]);
  await page.mouse.wheel(0, 820);
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1600);
  await page.mouse.wheel(0, -1200);
  await page.waitForTimeout(1000);

  await setCaption(page, cues[4][2]);
  for (let i = 0; i < 7; i += 1) {
    const complete = page.getByRole('button', { name: /Mark Complete|Next Lesson/i }).first();
    if (!(await complete.count())) break;
    await complete.click();
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1200);

  await setCaption(page, cues[5][2]);
  await click(page, 'Open final submission');
  await page.waitForTimeout(1000);
  await page.locator('input[placeholder*="7th Grade"]').fill('Graduate educators designing AI-supported learning games');
  await page.locator('textarea[placeholder*="hybrid classroom"]').fill('A 3-4 week online studio where learners build a serious-game prototype, document AI use, collect playtest evidence, and prepare a final credential packet.');
  await pause(1200);
  await click(page, 'Next Section');
  await page.waitForTimeout(900);
  await click(page, 'Evidence');
  await page.waitForTimeout(900);
  await click(page, 'Submit for Review');
  await page.waitForTimeout(1300);

  await setCaption(page, cues[6][2]);
  await click(page, 'My Dashboard');
  await page.waitForTimeout(900);
  await click(page, 'Continue Learning');
  await page.waitForTimeout(900);
  await click(page, 'Get Certificate');
  await page.waitForTimeout(3200);

  const video = page.video();
  await context.close();
  await browser.close();

  const tempVideo = await video.path();
  const target = path.join(OUT_DIR, 'teachplay-student-completion-walkthrough.webm');
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(tempVideo, target);
  console.log(target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
