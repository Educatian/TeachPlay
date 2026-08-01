/* Learner-facing link submission for the bounded portfolio pre-review queue. */
(() => {
  'use strict';
  if (window.__tpPortfolioReviewMounted) return;
  window.__tpPortfolioReviewMounted = true;
  const get = (key) => { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } };
  const authHeaders = () => ({ 'Content-Type': 'application/json', 'X-Learner-ID': get('hb:learner_id'), 'X-Learner-Token': get('hb:learner_token') });
  const inject = () => {
    if (document.getElementById('tp-portfolio-review')) return;
    const style = document.createElement('style');
    style.textContent = '#tp-portfolio-review{width:min(760px,calc(100% - 32px));margin:24px auto;padding:20px;border:1px solid #d9e1ec;border-radius:12px;background:#fff;color:#101828;box-shadow:0 8px 24px rgba(16,24,40,.06)}#tp-portfolio-review h2{margin:0 0 8px;font-size:20px}#tp-portfolio-review p{margin:0 0 14px;color:#475467;line-height:1.55}#tp-portfolio-review form{display:flex;gap:10px;flex-wrap:wrap}#tp-portfolio-review input{flex:1 1 420px;min-height:44px;padding:10px 12px;border:1px solid #98a2b3;border-radius:8px;font:inherit}#tp-portfolio-review button{min-height:44px;padding:10px 16px;border:0;border-radius:8px;background:#9e1b32;color:#fff;font-weight:800;cursor:pointer}#tp-portfolio-review [role=status]{margin-top:12px;font-size:14px}';
    document.head.appendChild(style);
    const panel = document.createElement('section');
    panel.id = 'tp-portfolio-review';
    panel.setAttribute('aria-labelledby', 'tp-portfolio-review-title');
    panel.innerHTML = '<h2 id="tp-portfolio-review-title">Portfolio link review</h2><p>Submit a Google AI Studio or hosted prototype link. The review agent can summarize evidence and risks, but an instructor must make the final approval before a credential is issued.</p><form><label for="tp-portfolio-url" class="sr-only">Prototype URL</label><input id="tp-portfolio-url" type="url" required placeholder="https://aistudio.google.com/..." autocomplete="url"><button type="submit">Submit for review</button></form><div role="status" aria-live="polite"></div>';
    const root = document.getElementById('root');
    (root?.parentElement || document.body).appendChild(panel);
    const status = panel.querySelector('[role=status]');
    const form = panel.querySelector('form');
    const show = (message) => { status.textContent = message; };
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const url = panel.querySelector('input').value.trim();
      if (!get('hb:learner_id') || !get('hb:learner_token')) { show('Please sign in or enroll before submitting a portfolio link.'); return; }
      show('Submitting and starting the automated pre-review…');
      try {
        const res = await fetch('/api/portfolio-review', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ url }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || `Submission failed (${res.status})`);
        show('Link received. The agent will prepare a pre-review; instructor final approval is still required.');
        form.reset();
      } catch (error) { show(error.message || 'Could not submit the link.'); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();
})();
