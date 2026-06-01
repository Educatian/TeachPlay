(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const completionKey = 'tp:preview-completion-earned';
  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const findButton = (label) =>
    [...document.querySelectorAll('button')].find((button) => normalize(button.textContent) === label);

  const findHeading = (text) =>
    [...document.querySelectorAll('h1,h2,h3')].find((heading) => normalize(heading.textContent) === text);

  const today = () =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  const stampCompletion = () => {
    const certificateButton = findButton('Get Certificate');
    if (!certificateButton || certificateButton.dataset.tpCompletionBound === 'true') return;
    certificateButton.dataset.tpCompletionBound = 'true';
    certificateButton.addEventListener('click', () => {
      localStorage.setItem(completionKey, 'true');
      localStorage.setItem('tp:preview-completion-date', today());
    });
  };

  const showCertificatePreview = () => {
    if (!normalize(document.body.textContent).includes('Certificate Not Found')) return;
    if (document.querySelector('.tp-certificate-preview')) return;

    const heading = findHeading('Certificate Not Found');
    const target = heading?.closest('main, section, div');
    if (!target) return;

    const completionDate = localStorage.getItem('tp:preview-completion-date') || today();
    const isCompleted = localStorage.getItem(completionKey) === 'true';
    const statusText = isCompleted
      ? 'Preview completion confirmed from the guided course progress state.'
      : 'Preview certificate shown for orientation. Sign in and pass review for official issuance.';

    target.innerHTML = `
      <section class="tp-certificate-preview" aria-labelledby="tp-certificate-title">
        <div class="tp-cert-ribbon">TeachPlay Credential</div>
        <div class="tp-cert-card">
          <p class="tp-cert-kicker">Certificate of Completion</p>
          <h1 id="tp-certificate-title">TeachPlay: AI-Enhanced Educational Game Design</h1>
          <p class="tp-cert-awarded">Awarded to</p>
          <p class="tp-cert-name">Demo Learner</p>
          <p class="tp-cert-body">for completing the guided microcredential pathway, assembling the portfolio evidence packet, and reaching the certificate handoff step.</p>
          <dl class="tp-cert-meta">
            <div><dt>Issue date</dt><dd>${completionDate}</dd></div>
            <div><dt>Credential ID</dt><dd>TP-PREVIEW-${new Date().getFullYear()}</dd></div>
            <div><dt>Status</dt><dd>${isCompleted ? 'Ready for instructor review' : 'Orientation preview'}</dd></div>
          </dl>
          <div class="tp-cert-note">
            <strong>${statusText}</strong>
            <span>The official certificate is issued after authenticated submission review. This preview keeps the learner journey coherent during orientation and screen-recorded demos.</span>
          </div>
          <div class="tp-cert-actions">
            <a href="/guides/post-completion-survey.html?source=certificate-preview">Complete post-credential survey</a>
            <a href="/credential/assertion-example-v3.json" download>Download sample credential JSON</a>
            <a href="/credential.html">Open credential standard</a>
            <button type="button" data-tp-return-dashboard>Return to Dashboard</button>
          </div>
        </div>
      </section>
    `;

    target.querySelector('[data-tp-return-dashboard]')?.addEventListener('click', () => {
      findButton('My Dashboard')?.click();
    });
  };

  const injectStyles = () => {
    if (document.getElementById('tp-certificate-preview-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-certificate-preview-styles';
    style.textContent = `
      .tp-certificate-preview {
        min-height: 70vh;
        display: grid;
        place-items: center;
        padding: 64px 20px;
        background: #f6f8fb;
        color: #111827;
      }
      .tp-cert-ribbon {
        margin-bottom: -18px;
        z-index: 1;
        border-radius: 999px;
        background: #9e1b32;
        color: #ffffff;
        padding: 10px 18px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        box-shadow: 0 14px 32px rgba(127, 16, 36, 0.22);
      }
      .tp-cert-card {
        width: min(920px, 100%);
        border: 1px solid #d8e0eb;
        border-radius: 8px;
        background:
          linear-gradient(135deg, rgba(158, 27, 50, 0.08), transparent 36%),
          linear-gradient(315deg, rgba(31, 58, 95, 0.08), transparent 34%),
          #ffffff;
        padding: clamp(28px, 5vw, 58px);
        text-align: center;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
      }
      .tp-cert-kicker,
      .tp-cert-awarded {
        margin: 0;
        color: #9e1b32;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .tp-cert-card h1 {
        margin: 12px auto 28px;
        max-width: 760px;
        color: #081224;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(32px, 5vw, 56px);
        line-height: 1.06;
        letter-spacing: 0;
      }
      .tp-cert-name {
        margin: 8px 0 14px;
        color: #081224;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(30px, 4vw, 46px);
        font-weight: 800;
      }
      .tp-cert-body {
        max-width: 680px;
        margin: 0 auto 28px;
        color: #475467;
        font-size: 16px;
        line-height: 1.7;
      }
      .tp-cert-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 24px;
      }
      .tp-cert-meta div {
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.78);
        padding: 14px;
      }
      .tp-cert-meta dt {
        color: #667085;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .tp-cert-meta dd {
        margin: 6px 0 0;
        color: #172033;
        font-size: 14px;
        font-weight: 800;
      }
      .tp-cert-note {
        display: grid;
        gap: 6px;
        margin: 0 auto 24px;
        max-width: 720px;
        border: 1px solid #f0c7cf;
        border-radius: 8px;
        background: #fff5f7;
        padding: 16px;
        color: #7f1024;
        text-align: left;
        font-size: 14px;
        line-height: 1.55;
      }
      .tp-cert-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
      }
      .tp-cert-actions a,
      .tp-cert-actions button {
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: #ffffff;
        color: #7f1024;
        cursor: pointer;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 800;
        text-decoration: none;
      }
      .tp-cert-actions a:first-child {
        border-color: #9e1b32;
        background: #9e1b32;
        color: #ffffff;
      }
      @media (max-width: 720px) {
        .tp-cert-meta {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    stampCompletion();
    showCertificatePreview();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
