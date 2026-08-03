(() => {
  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

  const refine = () => {
    const heading = [...document.querySelectorAll('h1')].find((node) =>
      normalize(node.textContent) === 'Professional credentials for AI-era learning design');
    if (!heading) return;
    const main = heading.closest('main');
    if (!main) return;
    if (!main.dataset.tpCatalogRefined) {
      main.dataset.tpCatalogRefined = 'true';
      main.classList.add('tp-catalog-refined');
      const hero = heading.parentElement?.parentElement;
      hero?.classList.add('tp-catalog-hero');
      ['background:#fff', 'color:#161616', 'border-radius:0px', 'box-shadow:none', 'padding:0 0 48px'].forEach((rule) => {
        const [property, value] = rule.split(':');
        hero?.style.setProperty(property, value, 'important');
      });
      hero?.style.setProperty('border-radius', '0px', 'important');
      hero?.style.setProperty('box-shadow', 'none', 'important');
    }

    const stats = [...main.querySelectorAll('div')].find((node) => {
      const text = normalize(node.textContent);
      return /1\.5 CEU/.test(text) && /5 Artifacts/.test(text) && /3-4 Weeks/.test(text);
    });
    stats?.classList.add('tp-catalog-stats');

    // The catalog wrapper itself also contains the image and CTA. Selecting
    // the first matching div accidentally turned the whole React shell into
    // the card grid and compressed the page to a narrow column. Target the
    // actual interactive credential card instead.
    const card = [...main.querySelectorAll('article, section, div')].find((node) => {
      const text = normalize(node.textContent);
      return text.includes('TeachPlay: AI-Enhanced Educational Game Design') &&
        text.includes('Review credential requirements') &&
        node.querySelector('img') &&
        node.querySelector('button') &&
        node.className.toString().includes('cursor-pointer') &&
        node.className.toString().includes('group');
    });
    card?.classList.add('tp-catalog-card');
    card?.parentElement?.parentElement?.classList.add('tp-catalog-feature-grid');

    const categoryLabels = new Set(['All', 'Game-Based Learning', 'XR/VR', 'GenAI', 'STEM']);
    const categoryButtons = [...main.querySelectorAll('button')].filter((button) => categoryLabels.has(normalize(button.textContent)));
    categoryButtons[0]?.parentElement?.classList.add('tp-catalog-filter-strip');
    main.querySelector('input[placeholder^="Search credentials"]')?.classList.add('tp-catalog-search');
    main.querySelector('select')?.classList.add('tp-catalog-level');
    categoryButtons.forEach((button) => {
      button.style.setProperty('border-radius', '0', 'important');
      button.style.setProperty('box-shadow', 'none', 'important');
      button.style.setProperty('background', 'transparent', 'important');
      button.style.setProperty('color', button.className.toString().includes('bg-ua-crimson') ? '#9e1b32' : '#62676b', 'important');
      button.style.setProperty('border-bottom', button.className.toString().includes('bg-ua-crimson') ? '2px solid #9e1b32' : '2px solid transparent', 'important');
    });
  };

  const inject = () => {
    if (document.getElementById('tp-catalog-refine-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-catalog-refine-styles';
    style.textContent = `
      .tp-catalog-refined {
        position: relative !important;
        width: min(1180px, calc(100% - 64px)) !important;
        max-width: 1312px !important;
        margin: 0 auto !important;
        padding: 84px 0 56px !important;
        color: #161616 !important;
        font-family: Inter, Arial, sans-serif !important;
      }
      .tp-catalog-refined::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 50% !important;
        width: 100vw !important;
        height: 6px !important;
        transform: translateX(-50%) !important;
        background: #9e1b32 !important;
      }
      .tp-catalog-refined > p:first-of-type {
        margin: 0 0 14px !important;
        color: #9e1b32 !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        letter-spacing: .04em !important;
        text-transform: uppercase !important;
      }
      .tp-catalog-refined p:first-of-type {
        margin-bottom: 14px !important;
        color: #9e1b32 !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        letter-spacing: .04em !important;
        text-transform: uppercase !important;
      }
      .tp-catalog-refined h1 {
        max-width: 760px !important;
        margin: 0 !important;
        color: #161616 !important;
        font-family: Inter, Arial, sans-serif !important;
        font-size: 44px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        letter-spacing: -.02em !important;
      }
      .tp-catalog-refined h1 + p {
        max-width: 760px !important;
        margin: 10px 0 28px !important;
        color: #4a4a4a !important;
        font-size: 17px !important;
        line-height: 1.4 !important;
      }
      .tp-catalog-hero {
        background: #fff !important;
        color: #161616 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 0 48px !important;
      }
      .tp-catalog-hero h1 { color: #161616 !important; }
      .tp-catalog-hero h1 + p { color: #4a4a4a !important; }
      /* The live hero wraps the heading two levels deep. */
      .tp-catalog-refined > div > div:has(> div > h1) {
        background: #fff !important;
        color: #161616 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 0 48px !important;
      }
      .tp-catalog-refined > div > div:has(> div > h1) h1 { color: #161616 !important; }
      .tp-catalog-refined > div > div:has(> div > h1) h1 + p { color: #4a4a4a !important; }
      .tp-catalog-refined > div:first-of-type,
      .tp-catalog-refined h1 ~ div[class*="bg-slate-950"] {
        background: #fff !important;
        color: #161616 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .tp-catalog-refined h1 ~ div[class*="bg-slate-950"] * {
        color: inherit !important;
      }
      .tp-catalog-refined > h1 {
        max-width: 760px !important;
        margin: 0 !important;
        color: #161616 !important;
        font-family: Inter, Arial, sans-serif !important;
        font-size: 44px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        letter-spacing: -.02em !important;
      }
      .tp-catalog-refined > h1 + p {
        max-width: 760px !important;
        margin: 12px 0 40px !important;
        color: #4a4a4a !important;
        font-size: 20px !important;
        line-height: 1.4 !important;
      }
      .tp-catalog-stats {
        display: flex !important;
        max-width: 100% !important;
        margin: 0 0 20px !important;
        border: 0 !important;
        border-top: 1px solid #c9ccce !important;
        border-bottom: 1px solid #c9ccce !important;
        border-radius: 0 !important;
        background: transparent !important;
        overflow: hidden !important;
      }
      .tp-catalog-stats > div {
        flex: 1 !important;
        min-width: 0 !important;
        padding: 10px 16px !important;
        border-right: 1px solid #eceeef !important;
      }
      .tp-catalog-stats > div:last-child { border-right: 0 !important; }
      .tp-catalog-refined input,
      .tp-catalog-refined select,
      .tp-catalog-refined button {
        border-radius: 4px !important;
        box-shadow: none !important;
      }
      .tp-catalog-refined input {
        height: 40px !important;
        min-height: 40px !important;
        padding-top: 8px !important;
        padding-bottom: 8px !important;
        border-color: #c9ccce !important;
      }
      .tp-catalog-refined button {
        min-height: 34px !important;
        padding: 6px 10px !important;
        font-size: 12px !important;
      }
      .tp-catalog-refined .tp-catalog-filter-strip {
        display: flex !important;
        justify-content: flex-start !important;
        gap: 0 !important;
        margin: 0 0 18px !important;
        border-bottom: 1px solid #c9ccce !important;
      }
      .tp-catalog-refined .tp-catalog-filter-strip button {
        min-height: 36px !important;
        padding: 7px 12px !important;
        border: 0 !important;
        border-bottom: 2px solid transparent !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #62676b !important;
        font-weight: 600 !important;
      }
      .tp-catalog-refined .tp-catalog-filter-strip button:hover {
        color: #9e1b32 !important;
        background: #faf7f8 !important;
      }
      .tp-catalog-refined .tp-catalog-filter-strip button[class*="bg-ua-crimson"] {
        color: #9e1b32 !important;
        border-bottom-color: #9e1b32 !important;
        background: transparent !important;
      }
      .tp-catalog-refined .tp-catalog-feature-grid {
        grid-template-columns: minmax(0, 1fr) 280px !important;
        gap: 24px !important;
      }
      .tp-catalog-refined .tp-catalog-level {
        height: 36px !important;
        min-height: 36px !important;
        padding: 6px 28px 6px 10px !important;
        border-radius: 4px !important;
      }
      .tp-catalog-card {
        display: grid !important;
        grid-template-columns: 260px minmax(0, 1fr) !important;
        gap: 0 !important;
        margin-top: 0 !important;
        border: 1px solid #eceeef !important;
        border-radius: 4px !important;
        background: #fff !important;
        overflow: hidden !important;
      }
      .tp-catalog-card img {
        width: 100% !important;
        height: 100% !important;
        min-height: 220px !important;
        object-fit: cover !important;
      }
      .tp-catalog-card > *:not(img) { padding: 22px !important; }
      .tp-catalog-card h3,
      .tp-catalog-card p,
      .tp-catalog-card span,
      .tp-catalog-card strong { color: #161616 !important; }
      .tp-catalog-refined [class*="shadow"],
      .tp-catalog-refined [class*="rounded-2xl"],
      .tp-catalog-refined [class*="rounded-xl"] {
        box-shadow: none !important;
        border-radius: 8px !important;
      }
      .tp-catalog-refined [class*="rounded-full"],
      .tp-catalog-refined button { border-radius: 4px !important; }
      .tp-catalog-refined > div > div:has(.tp-catalog-filter-strip) { gap: 12px !important; }
      .tp-catalog-refined a { color: #9e1b32 !important; }
      .tp-catalog-refined .grid.gap-8 { gap: 18px !important; }
      .tp-catalog-refined .grid.gap-8.lg\:grid-cols-\[minmax\(0\,430px\)_1fr\] { grid-template-columns: minmax(0, 1fr) !important; }
      .tp-catalog-refined .tp-catalog-card .mt-5 { margin-top: 14px !important; }
      .tp-catalog-refined [role="complementary"] { margin-top: 18px !important; padding: 20px !important; border: 1px solid #eceeef !important; border-radius: 4px !important; background: #fafafa !important; }
      @media (max-width: 720px) {
        .tp-catalog-refined { width: calc(100% - 36px) !important; padding: 72px 0 52px !important; }
        .tp-catalog-refined > h1 { font-size: 36px !important; }
        .tp-catalog-refined > h1 + p { font-size: 18px !important; }
        .tp-catalog-stats { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; }
        .tp-catalog-stats > div { border-bottom: 0 !important; }
        .tp-catalog-card { grid-template-columns: 1fr !important; }
        .tp-catalog-card img { min-height: 190px !important; max-height: 230px !important; }
        .tp-catalog-refined .tp-catalog-feature-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => { inject(); refine(); };
  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  const root = document.getElementById('root');
  if (root) new MutationObserver(run).observe(root, { childList: true, subtree: true });
})();
