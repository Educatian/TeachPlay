(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const completionKey = 'tp:preview-completion-earned';
  const evidenceSubmittedKey = 'tp:evidence-submitted-v1';
  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const learnerIdentity = () => window.TeachPlayLearnerIdentity?.current?.() || null;
  const readEvidenceSubmission = () => {
    try { return JSON.parse(localStorage.getItem(evidenceSubmittedKey) || 'null'); }
    catch (_) { return null; }
  };
  const evidenceMatchesLearner = (learner) => {
    const submission = readEvidenceSubmission();
    const submittedLearnerId = normalize(submission?.learner?.id);
    return Boolean(submission) && (!submittedLearnerId || submittedLearnerId === learner.id);
  };
  const escapeHtml = (text) => String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const findButton = (label) =>
    [...document.querySelectorAll('button')].find((button) => normalize(button.textContent) === label);

  const findHeading = (text) =>
    [...document.querySelectorAll('h1,h2,h3')].find((heading) => normalize(heading.textContent) === text);

  const today = () =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  const showIdentityNotice = (button, message = 'Sign in with your real learner account before opening the certificate preview.') => {
    document.querySelector('[data-tp-cert-identity-notice]')?.remove();
    const notice = document.createElement('p');
    notice.dataset.tpCertIdentityNotice = 'true';
    notice.className = 'tp-cert-identity-notice';
    notice.textContent = message;
    button.insertAdjacentElement('afterend', notice);
  };

  const stampCompletion = () => {
    const certificateButton = findButton('Get Certificate');
    if (!certificateButton || certificateButton.dataset.tpCompletionBound === 'true') return;
    certificateButton.dataset.tpCompletionBound = 'true';
    certificateButton.addEventListener('click', (event) => {
      if (!localStorage.getItem(evidenceSubmittedKey)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const learner = learnerIdentity();
      if (!learner) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showIdentityNotice(certificateButton);
        return;
      }
      if (!evidenceMatchesLearner(learner)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        localStorage.removeItem(completionKey);
        showIdentityNotice(certificateButton, 'This evidence packet belongs to a different learner account. Return to Evidence Submission and submit under the current account.');
        return;
      }
      localStorage.setItem(completionKey, 'true');
      localStorage.setItem('tp:preview-completion-date', today());
      localStorage.setItem('tp:preview-learner-id', learner.id);
    });
  };

  const showIdentityRequired = (target) => {
    target.innerHTML = `
      <section class="tp-certificate-preview tp-certificate-preview--blocked" aria-labelledby="tp-certificate-title">
        <div class="tp-cert-card">
          <p class="tp-cert-kicker">Certificate handoff</p>
          <h1 id="tp-certificate-title">Sign in with your real learner account</h1>
          <p class="tp-cert-body">Certificates are assigned only after TeachPlay can match the evidence submission to a registered learner name, email, and learner ID.</p>
          <div class="tp-cert-actions">
            <button type="button" data-tp-return-dashboard>Return to Dashboard</button>
          </div>
        </div>
      </section>
    `;
    target.querySelector('[data-tp-return-dashboard]')?.addEventListener('click', () => {
      findButton('My Dashboard')?.click();
    });
  };

  const showEvidenceOwnerRequired = (target) => {
    target.innerHTML = `
      <section class="tp-certificate-preview tp-certificate-preview--blocked" aria-labelledby="tp-certificate-title">
        <div class="tp-cert-card">
          <p class="tp-cert-kicker">Certificate handoff</p>
          <h1 id="tp-certificate-title">Evidence belongs to a different learner account</h1>
          <p class="tp-cert-body">Return to the evidence packet and submit it while signed in as the learner who should receive the certificate.</p>
          <div class="tp-cert-actions">
            <button type="button" data-tp-return-dashboard>Return to Dashboard</button>
          </div>
        </div>
      </section>
    `;
    target.querySelector('[data-tp-return-dashboard]')?.addEventListener('click', () => {
      findButton('My Dashboard')?.click();
    });
  };

  const showCertificatePreview = () => {
    if (!normalize(document.body.textContent).includes('Certificate Not Found')) return;
    if (document.querySelector('.tp-certificate-preview')) return;

    const heading = findHeading('Certificate Not Found');
    const target = heading?.closest('main, section, div');
    if (!target) return;

    const learner = learnerIdentity();
    if (!learner) {
      showIdentityRequired(target);
      return;
    }
    if (!evidenceMatchesLearner(learner)) {
      showEvidenceOwnerRequired(target);
      return;
    }

    const completionDate = localStorage.getItem('tp:preview-completion-date') || today();
    const isCompleted = localStorage.getItem(completionKey) === 'true'
      && Boolean(localStorage.getItem(evidenceSubmittedKey))
      && localStorage.getItem('tp:preview-learner-id') === learner.id;
    const statusText = isCompleted
      ? 'Preview completion confirmed for the signed-in learner and evidence packet.'
      : 'Preview certificate shown for orientation. Sign in and pass review for official issuance.';

    target.innerHTML = `
      <section class="tp-certificate-preview" aria-labelledby="tp-certificate-title">
        <div class="tp-cert-ribbon">TeachPlay Credential</div>
        <div class="tp-cert-card">
          <p class="tp-cert-kicker">Certificate of Completion</p>
          <h1 id="tp-certificate-title">TeachPlay: AI-Enhanced Educational Game Design</h1>
          <p class="tp-cert-awarded">Awarded to</p>
          <p class="tp-cert-name">${escapeHtml(learner.name)}</p>
          <p class="tp-cert-body">for completing the guided microcredential pathway, assembling the portfolio evidence packet, and reaching the certificate handoff step.</p>
          <dl class="tp-cert-meta">
            <div><dt>Issue date</dt><dd>${completionDate}</dd></div>
            <div><dt>Credential ID</dt><dd>${escapeHtml(learner.credentialId)}</dd></div>
            <div><dt>Learner email</dt><dd>${escapeHtml(learner.email)}</dd></div>
            <div><dt>Status</dt><dd>${isCompleted ? 'Ready for instructor review' : 'Orientation preview'}</dd></div>
          </dl>
          <div class="tp-cert-note">
            <strong>${statusText}</strong>
            <span>The official certificate is issued after authenticated submission review. This preview keeps the learner journey coherent during orientation and screen-recorded demos.</span>
          </div>
          <div class="tp-cert-actions">
            <a href="/guides/post-completion-survey.html?source=certificate-preview" target="_blank" rel="noopener">Complete post-credential survey ↗</a>
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

  const run = () => {
    stampCompletion();
    showCertificatePreview();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
