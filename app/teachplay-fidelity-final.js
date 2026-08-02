(() => {
  const apply = () => {
    if (!document.getElementById('tp-fidelity-final-styles')) {
      const style = document.createElement('style');
      style.id = 'tp-fidelity-final-styles';
      style.textContent = `
        .tp-bespoke-home h1,
        .tp-bespoke-home h2,
        .tp-bespoke-home h3 {
          font-family: Inter, Arial, sans-serif !important;
          letter-spacing: -.025em !important;
        }
        .tp-bespoke-home h1 { line-height: 1.08 !important; }
      /* Final, page-scoped Figma fidelity pass. Keep the existing theme; remove visual noise. */
      .tp-bespoke-home .tp-landing-polished .tp-hero-title {
        font-family: Inter, Arial, sans-serif !important;
        font-size: 64px !important;
        line-height: 1.05 !important;
        letter-spacing: -.03em !important;
      }
        .tp-bespoke-home .tp-landing-polished button,
        .tp-bespoke-home .tp-landing-polished a,
        .tp-bespoke-home .tp-landing-polished [class*="shadow"] {
          border-radius: 4px !important;
          box-shadow: none !important;
      }
      .tp-bespoke-home .tp-landing-polished .tp-workspace-card,
      .tp-bespoke-home .tp-landing-polished .tp-credential-preview {
        border-radius: 8px !important;
        box-shadow: none !important;
      }
      .tp-bespoke-home .tp-landing-polished .tp-hero-kicker,
      .tp-bespoke-home .tp-landing-polished .tp-kicker {
        color: #cbb677 !important;
        font-family: Inter, Arial, sans-serif !important;
      }
      @media (max-width: 720px) {
        .tp-bespoke-home .tp-landing-polished .tp-hero-title { font-size: 42px !important; }
      }
      `;
      document.head.appendChild(style);
    }
    document.querySelectorAll('.tp-bespoke-home .tp-landing-polished button, .tp-bespoke-home .tp-landing-polished a').forEach((el) => {
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('border-radius', '4px', 'important');
    });
  };
  apply();
  setTimeout(apply, 0);
  setTimeout(apply, 250);
  setTimeout(apply, 1000);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
})();
