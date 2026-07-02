(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const draftKey = 'tp:evidence-submission-draft-v2';
  const submittedKey = 'tp:evidence-submitted-v1';
  const pendingNoticeKey = 'tp:evidence-pending-notice';
  const evidenceButtonLabel = 'Submit Evidence Packet';
  const sections = ['Context', 'Alignment', 'GenAI Design', 'Evidence', 'Reflection'];
  const headingToSection = {
    'Context Setting': 'Context',
    'Constructive Alignment': 'Alignment',
    'GenAI Design': 'GenAI Design',
    'GenAI Design Process': 'GenAI Design',
    'Prototype & Evidence': 'Evidence',
    'Final Reflection': 'Reflection',
  };
  const fieldLabels = {
    'e.g., 7th Grade Biology Students, Corporate Trainees...': 'targetAudience',
    'The learning will take place in a hybrid classroom...': 'contextBrief',
    'ChatGPT, Midjourney, Claude, Blockade Labs...': 'genAiToolsUsed',
    'https://...': 'prototypeLink',
    'Summary of feedback from at least 2 playtesters...': 'testingNotes',
    '## Prompt 1\nAct as a...': 'promptDocumentation',
  };

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  // Strict: the editor's page header reads exactly "Evidence Submission"
  // (an h2 in the bundle; the heading-refine overlay may promote it to h1).
  // The course view's final-submission promo panel mentions the phrase in
  // body text, so a substring match would treat that view as the editor and
  // replay draft values into its inputs.
  const isEditor = () =>
    [...document.querySelectorAll('h1, h2')].some((h) => normalize(h.textContent) === 'Evidence Submission');
  const isSubmitted = () => Boolean(localStorage.getItem(submittedKey));
  const learnerIdentity = () => window.TeachPlayLearnerIdentity?.current?.() || null;

  const readDraft = () => {
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}'); }
    catch (_) { return {}; }
  };

  const writeDraft = (next) => {
    localStorage.setItem(draftKey, JSON.stringify({ ...readDraft(), ...next, updatedAt: new Date().toISOString() }));
  };

  // The section currently rendered, read from the DOM only. Returns null when
  // no editor heading is on screen (never falls back to the draft — the draft
  // is what we are trying to keep in sync, so a fallback would self-confirm).
  const domSection = () => {
    const heading = [...document.querySelectorAll('h3')]
      .find((node) => headingToSection[normalize(node.textContent)]);
    return heading ? headingToSection[normalize(heading.textContent)] : null;
  };

  const buttonByText = (text) =>
    [...document.querySelectorAll('button')].find((button) => normalize(button.textContent) === text);

  // Stable-ish autosave keys. Named fields keep their label key. Repeated
  // fields (the Alignment rows all share placeholders) get a per-occurrence
  // suffix so row N's value never bleeds into row M.
  const enumerateFields = () => {
    const seen = {};
    const section = domSection();
    // #root only: overlay widgets (e.g. the handbook search pill) append
    // inputs to <body> and must not enter the evidence draft.
    return [...root.querySelectorAll('input:not([type="file"]), textarea')].map((field) => {
      const placeholder = field.getAttribute('placeholder') || '';
      if (fieldLabels[placeholder]) return { field, key: fieldLabels[placeholder] };
      // The Final Reflection textarea has no placeholder; it is the only
      // unmarked textarea rendered in that section.
      if (!placeholder && section === 'Reflection' && field instanceof HTMLTextAreaElement) {
        return { field, key: 'reflectionText' };
      }
      const base = placeholder || field.name || field.id || 'field';
      const occurrence = seen[base] = (seen[base] || 0) + 1;
      return { field, key: `${base}#${occurrence - 1}`, base, occurrence: occurrence - 1 };
    });
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
    enumerateFields().forEach(({ field, key }) => { fields[key] = field.value; });
    const current = domSection();
    writeDraft({ fields, ...(current ? { activeSection: current } : {}) });
  };

  // One-shot restore when the editor mounts (page reload / re-entering the
  // editor view). React owns the live state afterwards — re-running this on
  // every mutation is what used to bounce "Next Section" clicks back and
  // clone Alignment rows, so it must never run continuously.
  const restoreFields = () => {
    const fields = readDraft().fields || {};
    enumerateFields().forEach(({ field, key, occurrence }) => {
      let value = fields[key];
      // Legacy drafts (pre per-occurrence keys) stored one value per section:placeholder.
      if (typeof value !== 'string' && occurrence === 0) {
        const placeholder = field.getAttribute('placeholder') || '';
        const legacy = Object.keys(fields).find((k) => k.endsWith(`:${placeholder}`) && placeholder);
        if (legacy) value = fields[legacy];
      }
      if (typeof value === 'string' && value && field.value !== value) setNativeValue(field, value);
    });
  };

  // Alignment rows: if the draft holds more rows than React rendered, click
  // "Add Alignment Row" until the counts match, then restore.
  const ensureAlignmentRows = (onDone, attempt = 0) => {
    const fields = readDraft().fields || {};
    let wantedRows = 1;
    Object.keys(fields).forEach((key) => {
      const m = key.match(/^(.+)#(\d+)$/);
      if (m && typeof fields[key] === 'string' && fields[key]) wantedRows = Math.max(wantedRows, Number(m[2]) + 1);
    });
    const counts = {};
    enumerateFields().forEach(({ base }) => { if (base) counts[base] = (counts[base] || 0) + 1; });
    const haveRows = Math.max(1, ...Object.values(counts));
    const addButton = buttonByText('Add Alignment Row');
    if (wantedRows > haveRows && addButton && attempt < 12) {
      addButton.click();
      setTimeout(() => ensureAlignmentRows(onDone, attempt + 1), 90);
      return;
    }
    onDone();
  };

  const restoreCurrentSection = () => {
    if (domSection() === 'Alignment') ensureAlignmentRows(restoreFields);
    else restoreFields();
  };

  // Mount restore retries the section-tab click: right after the editor
  // mounts React may not have attached handlers yet, so a single click can be
  // swallowed. While `restoring` is set the DOM→draft section sync is paused,
  // otherwise the still-default section would overwrite the saved one.
  let restoring = false;
  const restoreEditorState = () => {
    restoring = true;
    const wanted = readDraft().activeSection;
    let attempts = 0;
    const attempt = () => {
      if (!isEditor()) { restoring = false; return; } // editor left mid-restore
      const current = domSection();
      if (!sections.includes(wanted) || current === wanted || attempts >= 12) {
        lastSyncedSection = domSection();
        setTimeout(() => {
          restoreCurrentSection();
          restoredSections.add(domSection());
          restoring = false;
        }, 80);
        return;
      }
      attempts += 1;
      buttonByText(wanted)?.click();
      setTimeout(attempt, 250);
    };
    attempt();
  };

  // File picks are metadata-only bookkeeping for the server payload — they
  // must not navigate or replay the draft (that used to yank learners who
  // touched a file input straight to the Evidence tab).
  const rememberFiles = (files) => {
    const metadata = [...files].map((file) => ({ name: file.name, size: file.size, type: file.type || '' }));
    writeDraft({ files: metadata });
  };

  const hasEvidencePacket = () => {
    const draft = readDraft();
    const fields = draft.fields || {};
    const named = ['targetAudience', 'contextBrief', 'genAiToolsUsed', 'prototypeLink', 'testingNotes', 'promptDocumentation', 'reflectionText']
      .some((key) => normalize(fields[key]).length > 0);
    const anyRow = Object.keys(fields).some((key) => key.includes('#') && normalize(fields[key]).length > 0);
    return named || anyRow || (draft.files || []).length > 0;
  };

  // ── Server submission (system of record) ───────────────────────────────────
  // The localStorage draft stays as an autosave; the server (D1) is the system
  // of record. We map the single editor packet onto the five deliverables so the
  // facilitator can review and rubric-score it. Feature-detected: if /api/evidence
  // returns 404/503 (pre-migration), we keep today's localStorage-only behavior
  // so the live class is never blocked.
  const safeGet = (key) => { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } };

  const buildServerPayload = () => {
    const draft = readDraft();
    const fields = draft.fields || {};
    const files = draft.files || [];
    const fileMeta = files[0] ? { name: files[0].name, size: files[0].size, type: files[0].type } : undefined;
    const alignmentRows = Object.keys(fields)
      .filter((key) => key.includes('#') && normalize(fields[key]).length > 0)
      .sort()
      .map((key) => ({ field: key, value: fields[key] }));
    // The current editor collects one cross-deliverable packet. Attach the whole
    // structured packet to each deliverable so the instructor sees the full
    // context per artifact; the instructor scores each deliverable's criteria.
    const content = {
      targetAudience: fields.targetAudience || '',
      contextBrief: fields.contextBrief || '',
      genAiToolsUsed: fields.genAiToolsUsed || '',
      prototypeLink: fields.prototypeLink || '',
      testingNotes: fields.testingNotes || '',
      promptDocumentation: fields.promptDocumentation || '',
      reflectionText: fields.reflectionText || '',
      alignmentRows,
      activeSection: draft.activeSection || '',
      submittedAt: new Date().toISOString(),
    };
    const deliverables = ['D1', 'D2', 'D3', 'D4', 'D5'].map((id) => ({
      deliverable_id: id,
      content,
      file: id === 'D3' && fileMeta ? fileMeta : undefined,
    }));
    return {
      learner_id: safeGet('hb:learner_id'),
      deliverables,
    };
  };

  const postEvidenceToServer = async () => {
    const learnerId = safeGet('hb:learner_id');
    if (!learnerId) return { status: 'skipped' }; // no server row to attach to
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Learner-ID': learnerId,
          'X-Learner-Token': safeGet('hb:learner_token'),
        },
        body: JSON.stringify(buildServerPayload()),
      });
      if (res.ok) return { status: 'ok' };
      if (res.status === 404 || res.status === 503) return { status: 'fallback' }; // pre-migration
      if (res.status === 402) { // paywall: credential path is a paid upgrade
        let detail = '';
        try { detail = (await res.json())?.detail || ''; } catch (_) {}
        return { status: 'payment_required', detail };
      }
      return { status: 'failed', code: res.status };
    } catch (_) {
      return { status: 'failed' };
    }
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
    showNotice('Saving your evidence packet to the server for instructor review…', 'success');
    // Persist to the server (system of record). Best-effort + feature-detected.
    postEvidenceToServer().then((result) => {
      if (result.status === 'ok') {
        showNotice('Evidence packet submitted to the server for instructor review. Your instructor will score all 25 rubric criteria; the credential is awarded only when every criterion reaches Proficient.', 'success');
      } else if (result.status === 'payment_required') {
        // The credential path (evidence review + signed badge) is a paid upgrade;
        // reading the handbook and taking the checks stays free. Don't leave a
        // misleading "submitted" state — surface the upgrade path instead of the
        // generic "click Submit again" retry error.
        localStorage.removeItem(submittedKey);
        showNotice(result.detail || 'Submitting your credential portfolio for instructor review requires an upgrade — reading the handbook and taking the checks stays free. Open the Credential page to upgrade and unlock evidence submission.', 'error');
      } else if (result.status === 'fallback' || result.status === 'skipped') {
        showNotice('Evidence packet saved for instructor review. You can now continue to certificate handoff.', 'success');
      } else {
        showNotice('Saved locally, but the server submission did not go through. Please click Submit for Review again so your instructor receives the portfolio.', 'error');
      }
    });
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

  // The Reflection deliverable is written directly in its text box; the file
  // dropzone lives under Prototype & Evidence. Say so where learners look.
  const reflectionUploadNote = () => {
    if (domSection() !== 'Reflection') return;
    if (document.getElementById('tp-reflection-upload-note')) return;
    const heading = [...document.querySelectorAll('h3')]
      .find((node) => normalize(node.textContent) === 'Final Reflection');
    if (!heading) return;
    const note = document.createElement('div');
    note.id = 'tp-reflection-upload-note';
    note.className = 'tp-evidence-notice tp-evidence-notice--info';
    note.innerHTML = 'Write your reflection directly in the text box below — no file upload is needed here. ' +
      'Screenshots, documents, and other files are attached in the <strong>Evidence</strong> section. ';
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.textContent = 'Go to Evidence uploads →';
    jump.className = 'tp-evidence-jump';
    jump.addEventListener('click', () => buttonByText('Evidence')?.click());
    note.appendChild(jump);
    heading.insertAdjacentElement('afterend', note);
  };

  document.addEventListener('input', (event) => {
    if (event.target?.matches?.('input:not([type="file"]), textarea')) collectFields();
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!button) return;
    const label = normalize(button.textContent);
    if (sections.includes(label)) writeDraft({ activeSection: label });
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
      .tp-evidence-notice--info {
        border-color: #c7d7f0;
        background: #f4f8ff;
        color: #1e3a5f;
      }
      .tp-evidence-jump {
        display: inline-block;
        margin-top: 8px;
        border: 1px solid #1e3a5f;
        border-radius: 6px;
        background: transparent;
        color: #1e3a5f;
        padding: 5px 12px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  };

  let editorWasVisible = false;
  let lastSyncedSection = null;
  let restoredSections = new Set();

  const run = () => {
    injectStyles();
    const editorVisible = isEditor();

    if (editorVisible && !editorWasVisible) {
      // Editor just (re)mounted — restore the saved section, then React owns
      // navigation. Per-section field values restore on first visit below.
      restoredSections = new Set();
      restoreEditorState();
    }
    editorWasVisible = editorVisible;

    if (editorVisible) {
      if (!restoring) {
        // Sync the draft FROM the DOM (never the DOM from the draft): whatever
        // section the learner navigated to — tabs, Next Section, Back — becomes
        // the section restored after a reload.
        const current = domSection();
        if (current && current !== lastSyncedSection) {
          lastSyncedSection = current;
          if (readDraft().activeSection !== current) writeDraft({ activeSection: current });
          // First visit to this section since mount: replay its saved values
          // once (React state starts empty after a remount). Restores only
          // non-empty saved values into differing fields, so live edits and
          // intentional clears are never overwritten.
          if (!restoredSections.has(current)) {
            restoredSections.add(current);
            restoreCurrentSection();
          }
        }
      }
      reflectionUploadNote();
    }

    guardCertificateButton();
    const pendingNotice = localStorage.getItem(pendingNoticeKey);
    if (pendingNotice && editorVisible) {
      showNotice(pendingNotice);
      localStorage.removeItem(pendingNoticeKey);
    } else if (editorVisible && !isSubmitted() && !document.querySelector('[data-tp-evidence-notice]')) {
      showNotice('Submit your evidence packet here. The certificate preview opens after the packet is saved for review.');
    }
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
