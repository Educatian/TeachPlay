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
    style.textContent = '#tp-portfolio-review{width:min(760px,calc(100% - 32px));margin:24px auto;padding:20px;border:1px solid #d9e1ec;border-radius:12px;background:#fff;color:#101828;box-shadow:0 8px 24px rgba(16,24,40,.06)}#tp-portfolio-review h2{margin:0 0 8px;font-size:20px}#tp-portfolio-review p{margin:0 0 14px;color:#475467;line-height:1.55}#tp-portfolio-review form{display:flex;gap:10px;flex-wrap:wrap}#tp-portfolio-review input{flex:1 1 420px;min-height:44px;padding:10px 12px;border:1px solid #98a2b3;border-radius:8px;font:inherit}#tp-portfolio-review button{min-height:44px;padding:10px 16px;border:0;border-radius:8px;background:#9e1b32;color:#fff;font-weight:800;cursor:pointer}#tp-portfolio-review [role=status]{margin-top:12px;font-size:14px}#tp-portfolio-review-results{display:grid;gap:12px;margin-top:16px}#tp-portfolio-review-results article{padding:14px;border:1px solid #d9e1ec;border-radius:10px;background:#f8fafc}#tp-portfolio-review-results h3{margin:0 0 6px;font-size:15px}#tp-portfolio-review-results p,#tp-portfolio-review-results ul{margin:6px 0;color:#475467;font-size:14px;line-height:1.5}#tp-portfolio-review-results ul{padding-left:20px}#tp-portfolio-review-results .tp-review-status{display:inline-block;padding:3px 8px;border-radius:999px;background:#fff5f7;color:#7f1024;font-size:12px;font-weight:800}';
    document.head.appendChild(style);
    const panel = document.createElement('section');
    panel.id = 'tp-portfolio-review';
    panel.setAttribute('aria-labelledby', 'tp-portfolio-review-title');
    panel.innerHTML = '<h2 id="tp-portfolio-review-title">Portfolio link review</h2><p>Submit a Google AI Studio or hosted prototype link. The review agent can summarize evidence and risks, but an instructor must make the final approval before a credential is issued.</p><form><label for="tp-portfolio-url" class="sr-only">Prototype URL</label><input id="tp-portfolio-url" type="url" required placeholder="https://aistudio.google.com/..." autocomplete="url"><button type="submit">Submit for review</button></form><div role="status" aria-live="polite"></div><div id="tp-portfolio-review-results" aria-live="polite"></div>';
    const root = document.getElementById('root');
    (root?.parentElement || document.body).appendChild(panel);
    const status = panel.querySelector('[role=status]');
    const results = panel.querySelector('#tp-portfolio-review-results');
    const form = panel.querySelector('form');
    const show = (message) => { status.textContent = message; };
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const renderList = (items) => Array.isArray(items) && items.length ? `<ul>${items.slice(0, 5).map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : '<p>No additional evidence was returned.</p>';
    const renderReviews = (reviews) => {
      results.innerHTML = (reviews || []).map((review) => {
        const analysis = review.analysis || {};
        const summary = analysis.computational_artifact_summary || analysis.summary || review.error_message || 'Analysis is still being prepared.';
        return `<article><span class="tp-review-status">${escape(review.status || 'pending')}</span><h3>${escape(review.provider || 'Portfolio')} · ${escape(review.url)}</h3><p>${escape(summary)}</p>${analysis.risks?.length ? `<strong>Risks to review</strong>${renderList(analysis.risks)}` : ''}${analysis.evidence_questions?.length ? `<strong>Evidence questions</strong>${renderList(analysis.evidence_questions)}` : ''}</article>`;
      }).join('');
    };
    const refresh = async () => {
      const res = await fetch('/api/portfolio-review', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      renderReviews(data.reviews || []);
      return data.reviews || [];
    };
    refresh().catch(() => {});
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const url = panel.querySelector('input').value.trim();
      if (!get('hb:learner_id') || !get('hb:learner_token')) { show('Please sign in or enroll before submitting a portfolio link.'); return; }
      show('Submitting and starting the automated pre-review…');
      try {
        const res = await fetch('/api/portfolio-review', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ url }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || `Submission failed (${res.status})`);
        show('Link received. Preparing the computational artifact pre-review…');
        form.reset();
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const reviews = await refresh();
          const latest = reviews?.[0];
          if (latest && latest.status !== 'analyzing') {
            show(latest.status === 'needs_review' ? 'Pre-review is ready. Instructor final approval is still required.' : 'Review status updated.');
            break;
          }
          show(`Analysis in progress… (${attempt + 1}/8)`);
        }
      } catch (error) { show(error.message || 'Could not submit the link.'); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();
})();
