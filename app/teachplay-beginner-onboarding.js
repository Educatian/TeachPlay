(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const isSignedIn = () => {
    try {
      if (localStorage.getItem('hb:learner_id')) return true;
    } catch (_) {}
    return [...document.querySelectorAll('button')].some((button) => /sign out/i.test(normalize(button.textContent)));
  };

  const findButton = (pattern) => (
    [...document.querySelectorAll('button')].find((button) => pattern.test(normalize(button.textContent)))
  );

  const findHeaderAuthButton = () => (
    [...document.querySelectorAll('nav button, header button')]
      .find((button) => /sign in|create account/i.test(normalize(button.textContent)) || /sign in|create account/i.test(button.getAttribute('aria-label') || ''))
  );

  const openAuthModal = (mode = 'signup') => {
    const signIn = findHeaderAuthButton();
    if (signIn) signIn.click();

    if (mode === 'signup') {
      window.setTimeout(() => {
        const switcher = [...document.querySelectorAll('button')]
          .find((button) => normalize(button.textContent) === 'Sign Up');
        if (switcher) switcher.click();
      }, 80);
    }
  };

  const openCourse = () => {
    const start = findButton(/start learning|review the credential/i);
    if (start) {
      start.click();
      return;
    }
    window.location.href = '/session-01.html';
  };

  const updateHeaderSignInCopy = () => {
    const signIn = [...document.querySelectorAll('nav button, header button')]
      .find((button) => /^sign in$/i.test(normalize(button.textContent)));
    if (!signIn || signIn.dataset.tpBeginnerCopy === 'true') return;
    signIn.dataset.tpBeginnerCopy = 'true';
    signIn.setAttribute('aria-label', 'Sign in or create a TeachPlay learner account');
  };

  const updateHeroStartCue = () => {
    const startButton = [...document.querySelectorAll('button')]
      .find((button) => normalize(button.textContent) === 'Start learning');
    if (!startButton) return;

    const signedIn = isSignedIn();
    startButton.setAttribute(
      'aria-label',
      signedIn
        ? 'Start learning in your TeachPlay credential workspace'
        : 'Start learning preview. Create an account first for tracked completion and certificate access'
    );

    const actionRow = startButton.parentElement;
    if (!actionRow) return;

    let cue = actionRow.parentElement?.querySelector(':scope > .tp-beginner-hero-cue');
    if (!cue) {
      cue = document.createElement('div');
      cue.className = 'tp-beginner-hero-cue';
      actionRow.insertAdjacentElement('afterend', cue);
    }

    const state = signedIn ? 'signed-in' : 'signed-out';
    if (cue.dataset.tpHeroCueState === state) return;
    cue.dataset.tpHeroCueState = state;

    if (signedIn) {
      cue.innerHTML = '<strong>Signed in.</strong> Start learning continues your credential path from the same workspace.';
      return;
    }

    cue.innerHTML = `
      <strong>First time here?</strong>
      <button type="button" data-tp-action="hero-create-account">Create account first</button>
      <span>so progress, module completion, and certificate requests are saved under your name.</span>
    `;
    cue.querySelector('[data-tp-action="hero-create-account"]')?.addEventListener('click', () => openAuthModal('signup'));
  };

  const buildPanel = () => {
    const signedIn = isSignedIn();
    const section = document.createElement('section');
    section.className = signedIn ? 'tp-beginner-start is-signed-in' : 'tp-beginner-start';
    section.dataset.tpBeginnerStart = 'true';
    section.innerHTML = `
      <div class="tp-beginner-start__copy">
        <p>${signedIn ? 'Account ready' : 'New to TeachPlay?'}</p>
        <h2>${signedIn ? 'Continue from the same learner workspace.' : 'Start here: create an account, then begin Session 01.'}</h2>
        <span>${signedIn
          ? 'Your progress is connected to this browser session. Use the guided course, complete each module, and request the credential from Session 12.'
          : 'The account step is what connects your progress, completion evidence, and certificate request. You can still preview the course, but official completion needs a learner account.'}</span>
      </div>
      <div class="tp-beginner-start__steps" aria-label="TeachPlay beginner start steps">
        <article>
          <strong>01</strong>
          <h3>${signedIn ? 'Account connected' : 'Create account'}</h3>
          <p>${signedIn ? 'You are signed in for progress tracking.' : 'Use your real name and school email so certificate records match.'}</p>
        </article>
        <article>
          <strong>02</strong>
          <h3>Begin Session 01</h3>
          <p>Work through the 12 modules in order. Each session has a completion button.</p>
        </article>
        <article>
          <strong>03</strong>
          <h3>Request credential</h3>
          <p>After all sessions are complete, Session 12 opens the certificate request form.</p>
        </article>
      </div>
      <div class="tp-beginner-start__actions">
        ${signedIn
          ? '<button type="button" data-tp-action="start-course">Continue learning</button>'
          : '<button type="button" data-tp-action="create-account">Create account</button><button type="button" data-tp-action="sign-in" class="is-secondary">Sign in</button>'}
        <button type="button" data-tp-action="student-guide" class="is-secondary">Open student guide</button>
        <button type="button" data-tp-action="walkthrough" class="is-secondary">Watch walkthrough</button>
      </div>
    `;
    section.querySelector('[data-tp-action="create-account"]')?.addEventListener('click', () => openAuthModal('signup'));
    section.querySelector('[data-tp-action="sign-in"]')?.addEventListener('click', () => openAuthModal('signin'));
    section.querySelector('[data-tp-action="start-course"]')?.addEventListener('click', openCourse);
    section.querySelector('[data-tp-action="student-guide"]')?.addEventListener('click', () => {
      window.location.href = '/guides/student-completion-guide.html';
    });
    section.querySelector('[data-tp-action="walkthrough"]')?.addEventListener('click', () => {
      window.location.href = '/media/student-completion/teachplay-student-completion-walkthrough.webm';
    });
    return section;
  };

  const injectPanel = () => {
    if (!document.body.textContent.includes('Build serious learning games educators can actually defend.')) return;

    const heroHeading = [...document.querySelectorAll('h1')]
      .find((node) => normalize(node.textContent).includes('Build serious learning games educators can actually defend.'));
    const heroHeader = heroHeading?.closest('header');
    const supportPanel = document.querySelector('.tp-student-guide-links');
    const insertPanel = (panel) => {
      if (supportPanel) supportPanel.insertAdjacentElement('beforebegin', panel);
      else if (heroHeader) heroHeader.insertAdjacentElement('afterend', panel);
      else root.prepend(panel);
    };

    const existing = document.querySelector('[data-tp-beginner-start]');
    const desiredSignedIn = isSignedIn();
    if (existing) {
      const currentlySignedIn = existing.classList.contains('is-signed-in');
      if (currentlySignedIn === desiredSignedIn) {
        if (supportPanel && existing.nextElementSibling !== supportPanel) insertPanel(existing);
        else if (!supportPanel && heroHeader && existing.previousElementSibling !== heroHeader) insertPanel(existing);
        return;
      }
      const panel = buildPanel();
      existing.remove();
      insertPanel(panel);
      return;
    }

    const panel = buildPanel();
    insertPanel(panel);
  };

  const showSignedInHint = () => {
    if (/COURSE PROGRESS|Course Progress/.test(document.body.textContent || '')) {
      document.querySelector('.tp-beginner-toast')?.remove();
      return;
    }
    if (!isSignedIn() || document.querySelector('.tp-beginner-toast')) return;
    try {
      if (sessionStorage.getItem('tp:beginner-toast-shown') === 'true') return;
      sessionStorage.setItem('tp:beginner-toast-shown', 'true');
    } catch (_) {}
    const toast = document.createElement('div');
    toast.className = 'tp-beginner-toast';
    toast.innerHTML = `
      <strong>Account connected.</strong>
      <span>Start Session 01, then complete each module to unlock the credential request.</span>
      <div class="tp-beginner-toast__actions">
        <button type="button" data-tp-toast-continue>Continue</button>
        <button type="button" data-tp-toast-dismiss>Dismiss</button>
      </div>
    `;
    toast.querySelector('[data-tp-toast-continue]').addEventListener('click', openCourse);
    toast.querySelector('[data-tp-toast-dismiss]').addEventListener('click', () => toast.remove());
    document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add('is-open'), 30);
  };

  const injectStyles = () => {
    if (document.getElementById('tp-beginner-onboarding-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-beginner-onboarding-styles';
    style.textContent = `
      .tp-beginner-start {
        width: min(1120px, calc(100% - 32px));
        margin: 32px auto;
        border: 1px solid #d7dee8;
        border-radius: 8px;
        background: #ffffff;
        color: #111827;
        padding: 24px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .tp-beginner-hero-cue {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        width: min(560px, 100%);
        margin-top: 14px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.88);
        padding: 12px 14px;
        font-size: 14px;
        line-height: 1.45;
      }
      .tp-beginner-hero-cue strong {
        color: #ffffff;
        font-weight: 900;
      }
      .tp-beginner-hero-cue button {
        min-height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        background: #ffffff;
        color: #9e1b32;
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.1;
        cursor: pointer;
      }
      .tp-beginner-start__copy {
        display: grid;
        gap: 6px;
        max-width: 820px;
      }
      .tp-beginner-start__copy p {
        margin: 0;
        color: #9e1b32;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .tp-beginner-start__copy h2 {
        margin: 0;
        color: #111827;
        font: 900 clamp(24px, 3vw, 34px)/1.12 Georgia, "Times New Roman", serif;
        letter-spacing: 0;
      }
      .tp-beginner-start__copy span {
        color: #475467;
        font-size: 15px;
        line-height: 1.6;
      }
      .tp-beginner-start__steps {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .tp-beginner-start__steps article {
        border: 1px solid #d7dee8;
        border-radius: 8px;
        background: #f8fafc;
        padding: 16px;
      }
      .tp-beginner-start__steps strong {
        display: inline-flex;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #9e1b32;
        color: #ffffff;
        font-size: 12px;
        font-weight: 900;
      }
      .tp-beginner-start__steps h3 {
        margin: 12px 0 4px;
        color: #111827;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 0;
      }
      .tp-beginner-start__steps p {
        margin: 0;
        color: #475467;
        font-size: 13px;
        line-height: 1.5;
      }
      .tp-beginner-start__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .tp-beginner-start__actions button,
      .tp-beginner-start__actions a {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid #9e1b32;
        padding: 11px 16px;
        font-size: 14px;
        font-weight: 900;
        line-height: 1.2;
        text-decoration: none;
        cursor: pointer;
      }
      .tp-beginner-start__actions button {
        background: #9e1b32;
        color: #ffffff;
      }
      .tp-beginner-start__actions button.is-secondary,
      .tp-beginner-start__actions a {
        background: #ffffff;
        color: #7f1024;
      }
      .tp-beginner-toast {
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 100004;
        display: grid;
        gap: 6px;
        width: min(360px, calc(100vw - 36px));
        border: 1px solid #d7dee8;
        border-left: 5px solid #9e1b32;
        border-radius: 8px;
        background: #ffffff;
        padding: 16px;
        color: #111827;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
        opacity: 0;
        transform: translateY(12px);
        transition: opacity .2s ease, transform .2s ease;
      }
      .tp-beginner-toast.is-open {
        opacity: 1;
        transform: translateY(0);
      }
      .tp-beginner-toast strong {
        font-size: 14px;
        font-weight: 900;
      }
      .tp-beginner-toast span {
        color: #475467;
        font-size: 13px;
        line-height: 1.45;
      }
      .tp-beginner-toast__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }
      .tp-beginner-toast button {
        justify-self: start;
        border: 1px solid #9e1b32;
        border-radius: 8px;
        background: #9e1b32;
        color: #ffffff;
        padding: 9px 12px;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
      }
      .tp-beginner-toast button[data-tp-toast-dismiss] {
        background: #ffffff;
        color: #7f1024;
      }
      @media (max-width: 760px) {
        .tp-beginner-start {
          width: calc(100% - 20px);
          padding: 18px;
        }
        .tp-beginner-start__steps {
          grid-template-columns: 1fr;
        }
        .tp-beginner-start__actions {
          display: grid;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    updateHeaderSignInCopy();
    updateHeroStartCue();
    injectPanel();
    showSignedInHint();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
