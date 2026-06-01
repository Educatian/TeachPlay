const { chromium } = require('../node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'videos');
const BASE = 'http://127.0.0.1:8765';

const cues = [
  [0, 7, 'Start by creating your TeachPlay learner account. Use the same name and email for the whole credential, because this is how progress and certificate records stay connected.'],
  [7, 16, 'After registration, open Session 01 and begin the learning path. Each session has the same simple rhythm: read, try the activity, save your notes, and mark the session complete.'],
  [16, 27, 'The full credential is twelve modules. The portfolio checkpoints do not replace the modules; they collect the evidence you build across the pathway.'],
  [27, 39, 'As you move through the course, TeachPlay saves local progress immediately and sends completion events to the platform when you are signed in. That means the progress page can pick up where you left off.'],
  [39, 51, 'When all twelve sessions are complete, Session 12 opens the credential request form. Enter the same name and email you used when you registered.'],
  [51, 63, 'Submitting the form does not instantly award an official certificate. It sends your evidence packet to instructor review, which protects the value of the microcredential.'],
  [63, 76, 'After approval, the learner receives the certificate handoff and signed credential evidence. That is the full path: create account, learn, submit evidence, pass review, and claim the certificate.']
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

async function answerVisibleQuiz(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.quiz__item').forEach((item) => {
      const option = item.querySelector('.quiz__opt:not([disabled])');
      if (option) option.click();
    });
  });
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

  const learnerEmail = 'student@example.edu';
  await page.route('**/api/enroll', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        learner_id: 'walkthrough-learner',
        name: 'Demo Learner',
        cohort: '2026-spring',
        cred_status: 'none'
      })
    });
  });
  await page.route('**/api/xapi', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, stored: 1 })
    });
  });
  await page.route('**/api/completion-check?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, complete: false, count: 0, sessions: [] })
    });
  });
  await page.route('**/api/email-request', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        message: 'Request received. Your instructor will review and send your credential link by email.'
      })
    });
  });

  await page.goto(`${BASE}/session-01.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await setCaption(page, cues[0][2]);
  await page.locator('#hb-enroll-name').fill('Demo Learner');
  await page.waitForTimeout(600);
  await page.locator('#hb-enroll-email').fill(learnerEmail);
  await page.waitForTimeout(700);
  await page.locator('#hb-enroll-btn').click();
  await page.waitForTimeout(1200);

  await setCaption(page, cues[1][2]);
  await page.mouse.wheel(0, 760);
  await page.waitForTimeout(1500);
  await answerVisibleQuiz(page);
  await page.locator('[data-mark-done]').first().click({ force: true });
  await page.waitForTimeout(1200);

  await setCaption(page, cues[2][2]);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/session-03.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(1300);

  await setCaption(page, cues[3][2]);
  for (let i = 2; i <= 12; i += 1) {
    const num = String(i).padStart(2, '0');
    await page.goto(`${BASE}/session-${num}.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(260);
    await answerVisibleQuiz(page);
    const complete = page.locator('[data-mark-done]').first();
    if (await complete.count()) await complete.click({ force: true });
  }
  await page.goto(`${BASE}/progress.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);

  await setCaption(page, cues[4][2]);
  await page.evaluate(() => {
    const done = Array.from({ length: 12 }, (_, index) => index + 1);
    localStorage.setItem('hb:done', JSON.stringify(done));
    done.forEach((sessionNumber) => {
      localStorage.setItem(`hb:session_complete:s${String(sessionNumber).padStart(2, '0')}`, 'true');
    });
  });
  await page.goto(`${BASE}/session-12.html#claim-credential`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.locator('#claim-name').fill('Demo Learner');
  await page.waitForTimeout(600);
  await page.locator('#claim-email').fill(learnerEmail);
  await page.waitForTimeout(600);

  await setCaption(page, cues[5][2]);
  await page.locator('#claim-submit').click();
  await page.waitForTimeout(2800);

  await setCaption(page, cues[6][2]);
  await page.goto(`${BASE}/credential.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.goto(`${BASE}/verifier.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);

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
