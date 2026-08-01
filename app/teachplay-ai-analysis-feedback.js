(function () {
  'use strict';
  const ROOT_ID = 'tp-ai-analysis-fallback';
  function install() {
    if (!document.body || document.getElementById(ROOT_ID)) return;
    const heading = Array.from(document.querySelectorAll('h3,h2')).find((el) => /AI Formative Analysis/i.test(el.textContent || ''));
    if (!heading) return;
    const card = heading.closest('div');
    if (!card) return;
    const button = Array.from(card.querySelectorAll('button')).find((el) => /Analyze Content|Regenerate Analysis/i.test(el.textContent || ''));
    if (!button) return;
    button.addEventListener('click', () => {
      window.setTimeout(() => {
        const hasResult = card.querySelector('.prose, [class*="whitespace-pre-wrap"]');
        if (hasResult || document.getElementById(ROOT_ID)) return;
        const notice = document.createElement('div');
        notice.id = ROOT_ID;
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');
        notice.style.cssText = 'margin-top:12px;padding:12px 14px;border:1px solid #f5c26b;border-radius:8px;background:#fff8e6;color:#7a4b00;font-size:12px;line-height:1.5';
        notice.innerHTML = '<strong>Analysis status</strong><br>인공지능 분석 결과가 아직 반환되지 않았습니다. 제출 데이터는 저장되어 있으며, 네트워크·모델 응답을 확인한 뒤 다시 시도하거나 수동 검토를 진행하세요.';
        card.appendChild(notice);
      }, 3000);
    });
  }
  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();
