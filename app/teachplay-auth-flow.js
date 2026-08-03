// teachplay-auth-flow.js — connect the learner account surface to the
// email-based recovery path without editing the frozen React bundle.
//
// Registration remains the explicit /api/enroll path. Existing learners use
// the sign-in form to request a one-time email link through /api/progress;
// the link returns to /app/?lid=...&t=..., where this bridge consumes it and
// stores the same learner token used by evidence, xAPI, and survey endpoints.
(() => {
  'use strict';
  if (window.__tpAuthFlow) return;
  window.__tpAuthFlow = true;

  const get = (key) => { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } };
  const set = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };
  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  function ensureAuthStyles() {
    if (document.getElementById('tp-auth-flow-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-auth-flow-styles';
    style.textContent =
      '.tp-auth-email-link-submit{font-size:0!important}' +
      '.tp-auth-email-link-submit::after{content:attr(data-tp-auth-label);font-size:1rem}' +
      '.tp-auth-connected{font-size:0!important}' +
      '.tp-auth-connected::after{content:attr(data-tp-auth-label);font-size:.875rem}';
    document.head.appendChild(style);
  }

  function markConnected() {
    if (!get('hb:learner_id') || !get('hb:learner_token')) return;
    const button = document.querySelector('button[aria-label*="learner account"], button[aria-label*="learner"]');
    if (!button || /sign out|signed in/i.test(button.textContent || '')) return;
    // Keep React-owned children intact. CSS exposes the state label without
    // replacing the icon/text nodes that the bundle reconciles.
    button.classList.add('tp-auth-connected');
    button.dataset.tpAuthLabel = 'Signed in';
    button.setAttribute('aria-label', 'Signed in to your TeachPlay learner account');
    button.dataset.tpAuthConnected = 'true';
  }

  function status(form, message, isError = false) {
    let node = form.querySelector('[data-tp-auth-status]');
    if (!node) {
      node = document.createElement('p');
      node.setAttribute('data-tp-auth-status', '');
      node.setAttribute('role', 'status');
      node.style.cssText = 'margin:12px 0 0;font-size:0.86rem;line-height:1.45;color:#1a7f37;';
      form.appendChild(node);
    }
    node.style.color = isError ? '#9e1b32' : '#1a7f37';
    node.textContent = message;
  }

  function syncSignInPresentation() {
    const title = normalize(document.querySelector('#auth-modal-title')?.textContent);
    const form = document.querySelector('form:has(#auth-email)');
    const password = document.querySelector('#auth-password');
    if (!form || !password) return;
    const signIn = /welcome back|sign in/i.test(title) && !/create account/i.test(title);
    const group = password.closest('div')?.parentElement;
    if (group) {
      group.hidden = signIn;
      group.setAttribute('aria-hidden', signIn ? 'true' : 'false');
    }
    password.required = !signIn;
    password.disabled = signIn;
    const submit = form.querySelector('button[type="submit"]');
    if (signIn && submit) {
      ensureAuthStyles();
      submit.dataset.tpAuthLabel = 'Send sign-in link';
      submit.classList.add('tp-auth-email-link-submit');
      submit.setAttribute('aria-label', 'Send sign-in link');
    }
  }

  function consumeRecoveryLink() {
    const params = new URLSearchParams(window.location.search);
    const learnerId = normalize(params.get('lid'));
    const token = normalize(params.get('t'));
    if (!learnerId || !token) return;
    set('hb:learner_id', learnerId);
    set('hb:learner_token', token);
    try { history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (_) {}
    window.dispatchEvent(new CustomEvent('tp:learner-session', { detail: { source: 'email-recovery' } }));
    markConnected();
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.querySelector('#auth-email')) return;
    const title = normalize(document.querySelector('#auth-modal-title')?.textContent);
    if (!/welcome back|sign in/i.test(title) || /create account/i.test(title)) return;

    // Stop the bundle handler before it can imply that an unconfigured
    // password service is in use. Existing learners authenticate by mailbox.
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = normalize(form.querySelector('#auth-email')?.value).toLowerCase();
    if (!validEmail(email)) {
      status(form, 'Enter the enrollment email you want to use for sign-in.', true);
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Sending secure link…'; }
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.recovery) throw new Error(data.error || 'Unable to send the sign-in link.');
      status(form, 'Check your email for a one-time sign-in link. It will return you to TeachPlay on this device.');
      form.querySelector('#auth-password')?.setAttribute('aria-hidden', 'true');
    } catch (error) {
      status(form, error.message || 'Unable to send the sign-in link. Try again.', true);
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.dataset.tpAuthLabel = 'Send sign-in link';
        submit.classList.add('tp-auth-email-link-submit');
      }
    }
  }, true);

  consumeRecoveryLink();
  window.addEventListener('tp:learner-session', markConnected);
  const observer = new MutationObserver(() => {
    syncSignInPresentation();
    markConnected();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  syncSignInPresentation();
})();
