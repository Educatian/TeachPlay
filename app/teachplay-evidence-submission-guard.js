(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const draftKey = 'tp:evidence-submission-draft-v2';
  const submittedKey = 'tp:evidence-submitted-v1';
  const pendingNoticeKey = 'tp:evidence-pending-notice';
  const evidenceButtonLabel = 'Submit Evidence Packet';
  const sections = ['Context', 'Alignment', 'GenAI Design', 'Evidence', 'Reflection'];
  const fieldLabels = {
    'e.g., 7th Grade Biology Students, Corporate Trainees...': 'targetAudience',
    'The learning will take place in a hybrid classroom...': 'contextBrief',
    'https://...': 'prototypeLink',
    'Summary of feedback from at least 2 playtesters...': 'testingNotes',
    '## Prompt 1\nAct as a...': 'promptDocumentation',
  };

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const isEditor = () => normalize(document.body.textContent).includes('Evidence Submission');
  const isSubmitted = () => Boolean(localStorage.getItem(submittedKey));
  const learnerIdentity = () => window.TeachPlayLearnerIdentity?.current?.() || null;

  const readDraft = () => {
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}'); }
    catch (_) { return {}; }
  };

  const writeDraft = (next) => {
    localStorage.setItem(draftKey, JSON.stringify({ ...readDraft(), ...next, updatedAt: new Date().toISOString() }));
  };

  const activeSection = () => {
    const heading = [...document.querySelectorAll('h3')]
      .find((node) => ['Context Setting', 'Constructive Alignment', 'GenAI Design', 'Prototype & Evidence', 'Final Reflection']
        .includes(normalize(node.textContent)));
    const title = normalize(heading?.textContent);
    if (title === 'Context Setting') return 'Context';
    if (title === 'Constructive Alignment') return 'Alignment';
    if (title === 'Prototype & Evidence') return 'Evidence';
    if (title === 'Final Reflection') return 'Reflection';
    return sections.includes(title) ? title : readDraft().activeSection || 'Context';
  };

  const buttonByText = (text) =>
    [...document.querySelectorAll('button')].find((button) => normalize(button.textContent) === text);

  const fieldKey = (field, index) => {
    const placeholder = field.getAttribute('placeholder') || '';
    return fieldLabels[placeholder] || `${activeSection()}:${placeholder || field.name || field.id || index}`;
  };

  const setNativeValue = (field, value) => {
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const collectFields = () => {
    if (!isEditor()) return;
    const draft = readDraft();
    const fields = { ...(draft.fields || {}) };
    [...document.querySelectorAll('input:not([type="file"]), textarea')].forEach((field, index) => {
      fields[fieldKey(field, index)] = field.value;
    });
    writeDraft({ activeSection: activeSection(), fields });
  };

  const restoreFields = () => {
    if (!isEditor()) return;
    const fields = readDraft().fields || {};
    [...document.querySelectorAll('input:not([type="file"]), textarea')].forEach((field, index) => {
      const value = fields[fieldKey(field, index)];
      if (typeof value === 'string' && field.value !== value) setNativeValue(field, value);
    });
  };

  const restoreActiveSection = () => {
    if (!isEditor()) return;
    const wanted = readDraft().activeSection;
    if (sections.includes(wanted) && activeSection() !== wanted) buttonByText(wanted)?.click();
    setTimeout(restoreFields, 60);
  };

  const rememberFiles = (files) => {
    const metadata = [...files].map((file) => ({ name: file.name, size: file.size, type: file.type || '' }));
    writeDraft({ activeSection: 'Evidence', files: metadata });
    [80, 300, 900].forEach((delay) => setTimeout(restoreActiveSection, delay));
  };

  const hasEvidencePacket = () => {
    const draft = readDraft();
    const fields = draft.fields || {};
    const textEvidence = ['targetAudience', 'contextBrief', 'prototypeLink', 'testingNotes', 'promptDocumentation']
      .some((key) => normalize(fields[key]).length > 0);
    return textEvidence || (draft.files || []).length > 0;
  };

  const showNotice = (message, tone = 'error') => {
    const heading = [...document.querySelectorAll('h2,h3')].find((node) => normalize(node.textContent).includes('Evidence Submission'))
      || [...document.querySelectorAll('h3')].find((node) => normalize(node.textContent).includes('Context'));
    if (!heading) return;
    document.querySelector('[data-tp-evidence-notice]')?.remove();
    const notice = document.createElement('div');
    notice.dataset.tpEvidenceNotice = 'true';
    notice.className = `tp-evidence-notice tp-evidence-notice--${tone}`;
    notice.textContent = message;
    heading.insertAdjacentElement('afterend', notice);
  };

  const markSubmitted = () => {
    collectFields();
    if (!hasEvidencePacket()) return false;
    localStorage.setItem(submittedKey, JSON.stringify({
      submittedAt: new Date().toISOString(),
      learner: learnerIdentity(),
      draft: readDraft(),
    }));
    showNotice('Evidence packet saved for instructor review. You can now continue to certificate handoff.', 'success');
    return true;
  };

  const guardCertificateButton = () => {
    const button = buttonByText('Get Certificate') || buttonByText(evidenceButtonLabel);
    if (!button) return;
    if (isSubmitted()) {
      if (normalize(button.textContent) === evidenceButtonLabel) button.textContent = 'Get Certificate';
      return;
    }
    if (normalize(button.textContent) === 'Get Certificate') button.textContent = evidenceButtonLabel;
    button.setAttribute('aria-describedby', 'tp-evidence-required');
    let note = document.getElementById('tp-evidence-required');
    if (!note) {
      note = document.createElement('p');
      note.id = 'tp-evidence-required';
      note.className = 'tp-evidence-required';
      note.textContent = 'Submit the evidence packet for instructor review before opening the certificate preview.';
      button.insertAdjacentElement('afterend', note);
    }
  };

  document.addEventListener('input', (event) => {
    if (event.target?.matches?.('input:not([type="file"]), textarea')) collectFields();
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!button) return;
    const label = normalize(button.textContent);
    if (sections.includes(label)) {
      writeDraft({ activeSection: label });
      setTimeout(restoreFields, 80);
    }
    if (label === 'Submit for Review' && isEditor() && !markSubmitted()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showNotice('Add at least one evidence field or file before submitting for review.');
    }
    if ((label === 'Get Certificate' || label === evidenceButtonLabel) && !isSubmitted()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const message = 'Submit your evidence packet first. The certificate preview opens after the evidence packet is saved for review.';
      localStorage.setItem(pendingNoticeKey, message);
      showNotice(message);
      buttonByText('Open final submission')?.click();
    }
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target?.matches?.('input[type="file"]')) rememberFiles(event.target.files || []);
  }, true);

  const injectStyles = () => {
    if (document.getElementById('tp-evidence-guard-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-evidence-guard-styles';
    style.textContent = `
      .tp-evidence-notice, .tp-evidence-required {
        margin: 12px 0;
        border: 1px solid #f0c7cf;
        border-radius: 8px;
        background: #fff5f7;
        color: #7f1024;
        padding: 12px 14px;
        font-size: 14px;
        line-height: 1.45;
      }
      .tp-evidence-notice--success {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #166534;
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    restoreActiveSection();
    guardCertificateButton();
    const pendingNotice = localStorage.getItem(pendingNoticeKey);
    if (pendingNotice && isEditor()) {
      showNotice(pendingNotice);
      localStorage.removeItem(pendingNoticeKey);
    } else if (isEditor() && !isSubmitted() && !document.querySelector('[data-tp-evidence-notice]')) {
      showNotice('Submit your evidence packet here. The certificate preview opens after the packet is saved for review.');
    }
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
