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

  const headerAuthButton = () => [...document.querySelectorAll('nav button, header button')]
    .find((button) => /sign in|create account/i.test(normalize(button.textContent))
      || /sign in|create account/i.test(button.getAttribute('aria-label') || ''));

  const openSignup = () => {
    headerAuthButton()?.click();
    window.setTimeout(() => {
      [...document.querySelectorAll('button')]
        .find((button) => normalize(button.textContent) === 'Sign Up')
        ?.click();
    }, 80);
  };

  const startButton = () => [...document.querySelectorAll('button')]
    .find((button) => normalize(button.textContent) === 'Start learning');

  const promoteSignedOutAction = () => {
    const button = startButton();
    if (!button) return;

    if (isSignedIn()) {
      if (button.dataset.tpPrimaryAccountCta === 'true') {
        button.textContent = 'Start learning';
        button.removeAttribute('data-tp-primary-account-cta');
      }
      return;
    }

    button.setAttribute('aria-label', 'Start learning preview. Create an account first for tracked completion and certificate access');
  };

  const buildRail = () => {
    const rail = document.createElement('section');
    rail.dataset.tpCredentialRail = 'true';
    rail.className = 'tp-credential-rail';
    rail.setAttribute('aria-label', 'TeachPlay credential trust signals');
    rail.innerHTML = `
      <div class="tp-credential-rail__lead">
        <p>Credential readiness</p>
        <button type="button" data-tp-primary-account-cta aria-label="Create a TeachPlay learner account">Create account first</button>
      </div>
      <div class="tp-credential-rail__items">
        <div><strong>Identity</strong><span>real learner account</span></div>
        <div><strong>Evidence packet</strong><span>portfolio artifacts saved</span></div>
        <div><strong>Human review</strong><span>instructor handoff</span></div>
        <div><strong>Verifiable badge</strong><span>OB3 / VC-ready record</span></div>
      </div>
    `;
    return rail;
  };

  const injectCredentialRail = () => {
    if (document.querySelector('[data-tp-credential-rail]')) return;
    const button = startButton();
    const actionRow = button?.parentElement;
    if (!actionRow) return;
    const rail = buildRail();
    rail.querySelector('[data-tp-primary-account-cta]')?.addEventListener('click', openSignup);
    actionRow.insertAdjacentElement('beforebegin', rail);
  };

  const injectStyles = () => {
    if (document.getElementById('tp-95-refine-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-95-refine-styles';
    style.textContent = `
      [data-tp-primary-account-cta] {
        background: #a0152b !important;
        border-color: #a0152b !important;
        color: #ffffff !important;
        cursor: pointer !important;
        opacity: 1 !important;
      }
      .tp-credential-rail {
        display: grid;
        gap: 0;
        width: min(680px, 100%);
        margin: 24px 0 18px;
        overflow: hidden;
        border: 1px solid #d7dee8;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 14px 36px rgba(15, 23, 42, 0.07);
      }
      .tp-credential-rail__lead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid #e4eaf2;
      }
      .tp-credential-rail__lead p {
        margin: 0;
        color: #7f1024;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .tp-credential-rail__lead button {
        min-height: 34px;
        border: 1px solid #a0152b;
        border-radius: 8px;
        padding: 7px 12px;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.1;
      }
      .tp-credential-rail__items {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .tp-credential-rail__items div {
        min-width: 0;
        padding: 14px 12px;
        border-right: 1px solid #e4eaf2;
      }
      .tp-credential-rail__items div:last-child {
        border-right: 0;
      }
      .tp-credential-rail strong,
      .tp-credential-rail span {
        display: block;
        letter-spacing: 0;
      }
      .tp-credential-rail strong {
        color: #101828;
        font-size: 13px;
        line-height: 1.2;
      }
      .tp-credential-rail span {
        margin-top: 4px;
        color: #667085;
        font-size: 12px;
        line-height: 1.25;
      }
      @media (max-width: 640px) {
        .tp-landing-polished .tp-hero-title {
          font-size: clamp(42px, 12vw, 48px) !important;
          line-height: 1.04 !important;
        }
        .tp-credential-rail {
          margin: 20px 0 14px;
        }
        .tp-credential-rail__lead {
          align-items: flex-start;
          flex-direction: column;
        }
        .tp-credential-rail__lead button {
          width: 100%;
        }
        .tp-credential-rail__items {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .tp-credential-rail__items div:nth-child(2) {
          border-right: 0;
        }
        .tp-credential-rail__items div:nth-child(-n + 2) {
          border-bottom: 1px solid #e4eaf2;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    promoteSignedOutAction();
    injectCredentialRail();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
