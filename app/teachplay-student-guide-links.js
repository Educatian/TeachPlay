(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const links = [
    {
      href: '/guides/student-completion-guide.html',
      label: 'Open student completion guide',
      note: 'Step-by-step guide from sign-in to learning, evidence submission, completion, and certificate handoff.'
    },
    {
      href: '/media/student-completion/teachplay-student-completion-walkthrough.webm',
      label: 'Watch walkthrough recording',
      note: 'Playwright screen recording with the complete learner journey.'
    },
    {
      href: '/media/student-completion/teachplay-student-completion-walkthrough.vtt',
      label: 'Download captions',
      note: 'English VTT captions for LMS upload or video editing.'
    },
    {
      href: '/media/student-completion/teachplay-student-completion-walkthrough-narration.wav',
      label: 'Download narration',
      note: 'English narration audio for reuse in an edited MP4 or LMS module.'
    }
  ];

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const findExactTextElement = (text) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (normalize(node.textContent) === text) return node;
    }
    return null;
  };

  const isRelevantPage = () => {
    const body = normalize(document.body.textContent);
    return (
      body.includes('How students access, learn, and submit the microcredential.') ||
      body.includes('TeachPlay: AI-Enhanced Educational Game Design') ||
      body.includes('My Dashboard') ||
      body.includes('Certificate of Completion')
    );
  };

  const buildPanel = (variant = 'default') => {
    const section = document.createElement('section');
    section.className = `tp-student-guide-links tp-guide-${variant}`;
    section.dataset.teachplayStudentGuideLinks = 'true';
    section.innerHTML = `
      <div class="tp-guide-copy">
        <p>Student support links</p>
        <h2>Use the completion guide before starting the credential.</h2>
        <span>The guide, recording, captions, and narration are now published as linkable course assets.</span>
      </div>
      <div class="tp-guide-link-grid">
        ${links.map((link) => `
          <a href="${link.href}">
            <strong>${link.label}</strong>
            <span>${link.note}</span>
          </a>
        `).join('')}
      </div>
    `;
    return section;
  };

  const injectPanel = () => {
    if (!isRelevantPage()) return;

    const existing = document.querySelector('.tp-student-guide-links');
    if (existing) return;

    const studentGuideHeading = findExactTextElement('How students access, learn, and submit the microcredential.');
    const certificateHeading = findExactTextElement('Certificate of Completion');
    const dashboardHeading = findExactTextElement('My Dashboard');

    const anchor =
      studentGuideHeading?.closest('section, div') ||
      certificateHeading?.closest('section, div') ||
      dashboardHeading?.closest('section, div');

    const panel = buildPanel(certificateHeading ? 'certificate' : 'default');
    if (anchor) {
      anchor.insertAdjacentElement(certificateHeading ? 'afterend' : 'beforebegin', panel);
    } else {
      root.appendChild(panel);
    }
  };

  const injectStyles = () => {
    if (document.getElementById('tp-student-guide-link-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-student-guide-link-styles';
    style.textContent = `
      .tp-student-guide-links {
        width: min(1120px, calc(100% - 32px));
        margin: 32px auto;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 24px;
        color: #101828;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .tp-guide-certificate {
        margin-top: 24px;
      }
      .tp-guide-copy {
        display: grid;
        gap: 6px;
        margin-bottom: 18px;
      }
      .tp-guide-copy p {
        margin: 0;
        color: #9e1b32;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .tp-guide-copy h2 {
        margin: 0;
        color: #111827;
        font: 900 clamp(24px, 3vw, 34px)/1.12 Georgia, "Times New Roman", serif;
        letter-spacing: 0;
      }
      .tp-guide-copy span {
        color: #475467;
        font-size: 15px;
        line-height: 1.6;
      }
      .tp-guide-link-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .tp-guide-link-grid a {
        display: grid;
        align-content: start;
        min-height: 126px;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fafc;
        padding: 16px;
        color: #101828;
        text-decoration: none;
      }
      .tp-guide-link-grid a:first-child {
        border-color: #9e1b32;
        background: #fff5f7;
      }
      .tp-guide-link-grid strong {
        color: #7f1024;
        font-size: 14px;
        line-height: 1.25;
      }
      .tp-guide-link-grid span {
        color: #475467;
        font-size: 13px;
        line-height: 1.5;
      }
      @media (max-width: 980px) {
        .tp-guide-link-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .tp-student-guide-links {
          width: calc(100% - 20px);
          padding: 18px;
        }
        .tp-guide-link-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    injectPanel();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
