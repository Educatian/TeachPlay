(() => {
  'use strict';

  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const icon = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>',
    award: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="5"></circle><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5"></path></svg>',
    notes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v16l-4-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"></path><path d="M8 8h8M8 12h6"></path></svg>',
  };

  function upgradeBrand() {
    const brand = document.querySelector('.utility__brand');
    if (!brand || brand.dataset.tpPolished) return;
    brand.dataset.tpPolished = 'true';
    brand.setAttribute('aria-label', 'TeachPlay microcredential home');
    brand.innerHTML = `
      <span class="tp-shell-mark" aria-hidden="true">UA</span>
      <span class="tp-shell-brand-copy">
        <strong>TeachPlay</strong>
        <span>AI Game Design Microcredential</span>
      </span>
    `;
  }

  function upgradeHeader() {
    const headerTitle = document.querySelector('.site-header__section');
    if (headerTitle) headerTitle.textContent = 'AI-Enhanced Educational Game Design';

    const searchButton = document.querySelector('.site-header__search-btn');
    if (searchButton && !searchButton.dataset.tpIconified) {
      searchButton.dataset.tpIconified = 'true';
      searchButton.innerHTML = icon.search;
      searchButton.setAttribute('aria-label', 'Search handbook');
    }
  }

  function iconifyUtilityControls() {
    document.querySelectorAll('.hb-ach-badge').forEach((button) => {
      if (button.dataset.tpIconified) return;
      button.dataset.tpIconified = 'true';
      const text = button.textContent.replace(/[^\d/]/g, '').trim() || '0/11';
      button.innerHTML = `<span class="tp-utility-icon">${icon.award}</span><span>${text}</span>`;
      button.setAttribute('aria-label', `Open achievement progress, ${text}`);
    });

    const noteButton = document.getElementById('hb-anno-toggle');
    if (noteButton && !noteButton.dataset.tpIconified) {
      noteButton.dataset.tpIconified = 'true';
      const count = noteButton.textContent.match(/\d+/)?.[0] || '0';
      noteButton.innerHTML = `<span class="tp-utility-icon">${icon.notes}</span><span>Notes ${count}</span>`;
    }
  }

  function addBodyFlags() {
    document.body.classList.add('tp-enterprise-shell');
    if (document.querySelector('.hero')) document.body.classList.add('tp-doc-hero-page');
    if (location.pathname.endsWith('/credential.html') || location.pathname.endsWith('credential.html')) {
      document.body.classList.add('tp-credential-page');
    }
  }

  function wireCopyLinks() {
    document.querySelectorAll('[data-copy-link]').forEach((button) => {
      if (button.dataset.tpCopyReady) return;
      button.dataset.tpCopyReady = 'true';
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy-link') || location.href;
        try {
          await navigator.clipboard.writeText(value);
          button.textContent = 'Verification link copied';
        } catch (_) {
          button.textContent = value;
        }
      });
    });
  }

  ready(() => {
    addBodyFlags();
    upgradeBrand();
    upgradeHeader();
    iconifyUtilityControls();
    wireCopyLinks();
    // Re-apply polish when new content is inserted. CRITICAL: the callback
    // mutates the DOM (icons/header/copy-links), so a naive observer re-triggers
    // itself → infinite mutation storm (severe lag, frozen cursor, dead clicks).
    // Guard it: coalesce bursts with rAF, and disconnect while we mutate so our
    // own writes never feed back into the observer.
    var scheduled = false;
    var obs = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        obs.disconnect();
        iconifyUtilityControls();
        upgradeHeader();
        wireCopyLinks();
        obs.observe(document.body, { childList: true, subtree: true });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });
})();
