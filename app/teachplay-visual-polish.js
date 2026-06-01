(() => {
  const root = document.getElementById('root');
  if (!root) return;

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const findByText = (selector, pattern, scope = document) => (
    [...scope.querySelectorAll(selector)].find((node) => pattern.test(normalize(node.textContent)))
  );

  const smallestMatchingBlock = (scope, tests) => {
    const candidates = [...scope.querySelectorAll('div, section, article')]
      .filter((node) => {
        const text = normalize(node.textContent);
        if (!tests.every((pattern) => pattern.test(text))) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 260 && rect.height > 120;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.width * ar.height) - (br.width * br.height);
      });
    return candidates[0] || null;
  };

  const injectStyles = () => {
    if (document.getElementById('tp-visual-polish-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-visual-polish-styles';
    style.textContent = `
      body.tp-bespoke-home {
        background: #f6f8fb;
      }
      .tp-landing-polished {
        min-height: 100svh;
        overflow: hidden;
        background:
          linear-gradient(180deg, rgba(255,255,255,.96), rgba(246,248,251,.98)),
          url('/app/images/case-studies/space-invaders-orbital-gunner-card.png') right 12% top 76px / min(42vw, 560px) auto no-repeat;
        color: #101828;
        border-bottom: 1px solid #d9e1ec;
      }
      .tp-landing-polished::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(90deg, rgba(246,248,251,.98) 0%, rgba(246,248,251,.94) 42%, rgba(246,248,251,.72) 100%),
          repeating-linear-gradient(90deg, rgba(16,24,40,.045) 0 1px, transparent 1px 96px);
      }
      .tp-landing-polished .tp-hero-bg-layer {
        display: none;
      }
      .tp-landing-polished nav,
      .tp-landing-polished [class*="fixed"],
      .tp-landing-polished [class*="absolute"] {
        color: inherit;
      }
      .tp-landing-polished .tp-hero-grid {
        width: min(1180px, calc(100% - 48px));
        min-height: 900px;
        margin: 0 auto;
        padding: 116px 0 64px;
        display: grid;
        grid-template-columns: minmax(0, .94fr) minmax(430px, .78fr);
        gap: clamp(28px, 4vw, 70px);
        align-items: center;
      }
      .tp-landing-polished .tp-hero-copy {
        max-width: 670px;
      }
      .tp-landing-polished .tp-hero-title {
        max-width: 660px;
        color: #0b1220;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(46px, 5.25vw, 68px);
        line-height: 1.02;
        letter-spacing: 0;
      }
      .tp-landing-polished .tp-hero-lede {
        max-width: 620px;
        margin-top: 24px;
        color: #344054;
        font-size: clamp(17px, 1.55vw, 20px);
        line-height: 1.58;
      }
      .tp-landing-polished .tp-hero-actions {
        margin-top: 30px;
        gap: 10px;
      }
      .tp-landing-polished .tp-hero-actions button,
      .tp-landing-polished nav button,
      .tp-landing-polished header button {
        border-radius: 8px !important;
        box-shadow: none !important;
        transform: none !important;
      }
      .tp-landing-polished .tp-hero-actions button:first-child {
        background: #a0152b !important;
        color: #ffffff !important;
        border: 1px solid #a0152b !important;
      }
      .tp-landing-polished .tp-hero-actions button:nth-child(2) {
        background: #ffffff !important;
        color: #172033 !important;
        border: 1px solid #c9d4e2 !important;
        backdrop-filter: none !important;
      }
      .tp-landing-polished .tp-beginner-hero-cue {
        width: min(640px, 100%);
        margin-top: 16px;
        border: 1px solid #ccd6e3;
        border-left: 4px solid #a0152b;
        background: #ffffff;
        color: #344054;
        box-shadow: none;
      }
      .tp-landing-polished .tp-beginner-hero-cue strong {
        color: #0b1220;
      }
      .tp-landing-polished .tp-beginner-hero-cue button {
        border-color: #a0152b;
        background: #a0152b;
        color: #ffffff;
      }
      .tp-landing-polished .tp-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0;
        margin-top: 28px;
        border: 1px solid #d7dee8;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
      }
      .tp-landing-polished .tp-stat-chip {
        min-height: 86px;
        padding: 18px 16px !important;
        border: 0 !important;
        border-right: 1px solid #e4eaf2 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #101828 !important;
        box-shadow: none !important;
      }
      .tp-landing-polished .tp-stat-chip:last-child {
        border-right: 0 !important;
      }
      .tp-landing-polished .tp-workspace-card {
        position: relative;
        border: 1px solid #c8d3e0 !important;
        border-radius: 8px !important;
        background: rgba(255,255,255,.94) !important;
        color: #101828 !important;
        box-shadow: 0 24px 60px rgba(16,24,40,.13) !important;
        backdrop-filter: blur(10px);
      }
      .tp-landing-polished .tp-topbar,
      .tp-landing-polished .tp-topbar button,
      .tp-landing-polished .tp-topbar .tp-brand-text,
      .tp-landing-polished .tp-topbar .tp-brand-subtitle {
        color: #101828 !important;
      }
      .tp-landing-polished .tp-topbar .tp-brand-subtitle {
        color: #5b6678 !important;
      }
      .tp-landing-polished .tp-topbar button[aria-label*="Sign in"] {
        color: #a0152b !important;
        background: #ffffff !important;
        border: 1px solid #e0e6ef !important;
      }
      .tp-landing-polished .tp-workspace-card * {
        letter-spacing: 0;
      }
      .tp-bespoke-topnav {
        background: rgba(246,248,251,.88) !important;
        border-bottom: 1px solid rgba(201,212,226,.72);
        backdrop-filter: blur(14px);
      }
      .tp-bespoke-topnav button,
      .tp-bespoke-topnav [class*="text-white"] {
        color: #172033 !important;
      }
      .tp-bespoke-topnav [class*="bg-ua-crimson"],
      .tp-bespoke-topnav [class*="bg-ua-crimson"] * {
        color: #ffffff !important;
      }
      .tp-bespoke-topnav button[aria-label*="Sign in"] {
        color: #a0152b !important;
        background: #ffffff !important;
        border: 1px solid #e0e6ef !important;
      }
      .tp-bespoke-topnav button[aria-label="Toggle color theme"] {
        background: #ffffff !important;
        border: 1px solid #e0e6ef !important;
      }
      .tp-bespoke-topnav svg {
        color: #172033 !important;
      }
      .tp-workspace-media {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 18px 20px 4px;
      }
      .tp-workspace-media figure {
        margin: 0;
        min-width: 0;
        overflow: hidden;
        border: 1px solid #d9e1ec;
        border-radius: 8px;
        background: #111827;
      }
      .tp-workspace-media img {
        display: block;
        width: 100%;
        height: 108px;
        object-fit: cover;
      }
      .tp-workspace-media figcaption {
        padding: 9px 10px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        line-height: 1.25;
      }
      .tp-landing-polished .tp-workspace-row {
        border: 0 !important;
        border-top: 1px solid #e3e9f1 !important;
        border-radius: 6px !important;
        background: #ffffff !important;
      }
      .tp-landing-polished .tp-workspace-card [class*="rounded-xl"],
      .tp-landing-polished .tp-workspace-card [class*="rounded-2xl"],
      .tp-landing-polished .tp-workspace-card [class*="rounded-3xl"] {
        border-radius: 6px !important;
      }
      .tp-landing-polished .tp-workspace-row:first-of-type {
        border-top: 0 !important;
      }
      .tp-landing-polished .tp-workspace-footer {
        border-radius: 8px !important;
        background: #0b1220 !important;
      }
      @media (max-width: 980px) {
        .tp-landing-polished {
          background:
            linear-gradient(180deg, rgba(255,255,255,.97), rgba(246,248,251,.98)),
            url('/app/images/case-studies/space-invaders-orbital-gunner-card.png') center top 92px / 680px auto no-repeat;
        }
        .tp-landing-polished::before {
          background: linear-gradient(180deg, rgba(246,248,251,.96), rgba(246,248,251,.94));
        }
        .tp-landing-polished .tp-hero-grid {
          width: min(100% - 28px, 720px);
          min-height: 0;
          grid-template-columns: 1fr;
          padding-top: 104px;
        }
        .tp-landing-polished .tp-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .tp-landing-polished .tp-stat-chip:nth-child(2) {
          border-right: 0 !important;
        }
        .tp-landing-polished .tp-stat-chip:nth-child(-n+2) {
          border-bottom: 1px solid #e4eaf2 !important;
        }
      }
      @media (max-width: 640px) {
        .tp-landing-polished .tp-hero-title {
          font-size: clamp(40px, 12vw, 54px);
        }
        .tp-landing-polished .tp-hero-actions {
          display: grid;
        }
        .tp-landing-polished .tp-stat-grid,
        .tp-workspace-media {
          grid-template-columns: 1fr;
        }
        .tp-landing-polished .tp-stat-chip {
          border-right: 0 !important;
          border-bottom: 1px solid #e4eaf2 !important;
        }
        .tp-landing-polished .tp-stat-chip:last-child {
          border-bottom: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const polishLanding = () => {
    const heroTitle = findByText('h1', /Build serious learning games educators can actually defend/i, root);
    if (!heroTitle) return;

    const hero = heroTitle.closest('header');
    if (!hero) return;

    document.body.classList.add('tp-bespoke-home');
    const topNav = document.querySelector('nav');
    if (topNav && normalize(topNav.textContent).includes('TeachPlay')) {
      topNav.classList.add('tp-bespoke-topnav');
    }
    hero.classList.add('tp-landing-polished');
    hero.firstElementChild?.classList.add('tp-hero-bg-layer');

    const topbar = [...hero.querySelectorAll('div')]
      .filter((node) => {
        const text = normalize(node.textContent);
        const rect = node.getBoundingClientRect();
        return text.includes('TeachPlay') && text.includes('Catalog') && rect.top <= 24 && rect.height <= 84 && rect.width > 600;
      })
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
    topbar?.classList.add('tp-topbar');
    findByText('div, span, p', /^TeachPlay$/, topbar || hero)?.classList.add('tp-brand-text');
    findByText('div, span, p', /AI Game Design Microcredential/i, topbar || hero)?.classList.add('tp-brand-subtitle');

    const heroGrid = heroTitle.closest('.container') || heroTitle.parentElement?.parentElement;
    heroGrid?.classList.add('tp-hero-grid');
    heroTitle.classList.add('tp-hero-title');

    const copyBlock = heroTitle.parentElement;
    copyBlock?.classList.add('tp-hero-copy');
    copyBlock?.querySelector('p')?.classList.add('tp-hero-lede');

    const startButton = [...hero.querySelectorAll('button')]
      .find((button) => normalize(button.textContent) === 'Start learning');
    startButton?.parentElement?.classList.add('tp-hero-actions');

    const statNodes = [...hero.querySelectorAll('div')]
      .filter((node) => /3-4 weeks|5 artifacts|1\.5 CEU|Online, self-paced/.test(normalize(node.textContent)))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 120 && rect.width < 360 && rect.height > 48 && rect.height < 140;
      });
    const statParent = statNodes[0]?.parentElement;
    if (statParent && statNodes.length >= 4) {
      statParent.classList.add('tp-stat-grid');
      statNodes.slice(0, 4).forEach((node) => node.classList.add('tp-stat-chip'));
    }

    const workspace = smallestMatchingBlock(hero, [
      /Credential Workspace/i,
      /Map the learning problem/i,
      /Prototype with governance/i,
      /Playtest and defend/i,
    ]);
    workspace?.classList.add('tp-workspace-card');

    if (workspace && !workspace.querySelector('.tp-workspace-media')) {
      const media = document.createElement('div');
      media.className = 'tp-workspace-media';
      media.innerHTML = `
        <figure>
          <img src="/app/images/case-studies/space-invaders-orbital-gunner-card.png" alt="Space Invaders physics learning game screenshot">
          <figcaption>Physics learning loop</figcaption>
        </figure>
        <figure>
          <img src="/app/images/case-studies/chalk-and-chance-card.png" alt="Chalk and Chance teaching simulation screenshot">
          <figcaption>Teacher simulation case</figcaption>
        </figure>
      `;
      const firstRow = findByText('div', /Map the learning problem/i, workspace);
      if (firstRow) firstRow.insertAdjacentElement('beforebegin', media);
      else workspace.appendChild(media);
    }

    ['Map the learning problem', 'Prototype with governance', 'Playtest and defend'].forEach((label) => {
      const row = smallestMatchingBlock(workspace || hero, [new RegExp(label, 'i')]);
      row?.classList.add('tp-workspace-row');
    });
    const footer = findByText('div', /Credential evidence packet/i, workspace || hero);
    footer?.classList.add('tp-workspace-footer');
  };

  const run = () => {
    injectStyles();
    polishLanding();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
