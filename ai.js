/* ai.js — BYOK Gemini client for handbook AI touchpoints.
 *
 * Pedagogical stance: we don't proxy an institutional key. Each learner
 * pastes their own Google AI Studio API key (stored in localStorage on
 * their machine only), pays their own cost, and controls their own data.
 * This mirrors the credential stance elsewhere in the handbook: the
 * learner owns their evidence, we do not hold it.
 *
 * A "touchpoint" is any element marked `data-ai-touchpoint` with:
 *   data-ai-prompt-system   — baseline prompt that frames the task
 *   data-ai-temperature     — optional, default 0.3
 *   data-ai-model           — optional, default gemini-2.5-flash
 *   data-ai-session         — session id (emitted in xAPI)
 *   data-ai-lo              — optional learning-outcome id the interaction targets
 *
 * Call ai.attachTouchpoint(el) on load (shell.js does this).
 */

(function (global) {
  'use strict';

  const KEY_STORAGE = 'hb:ai:gemini-key';
  const DEFAULT_MODEL = 'gemini-2.5-flash';
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  function getKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
  }
  function setKey(k) {
    try { localStorage.setItem(KEY_STORAGE, k); } catch {}
  }
  function clearKey() {
    try { localStorage.removeItem(KEY_STORAGE); } catch {}
  }

  async function generate({ model, apiKey, systemPrompt, userPrompt, temperature }) {
    const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt || '' }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt || '' }] }],
      generationConfig: { temperature: typeof temperature === 'number' ? temperature : 0.3 }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Gemini API ${res.status}${detail ? ' — ' + detail : ''}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || 'EMPTY';
      throw new Error(`No response (finishReason: ${reason})`);
    }
    return { text, raw: data };
  }

  function render(el, { systemPrompt, userPlaceholder, sessionId, loId }) {
    const uid = 'ai-' + Math.random().toString(36).slice(2, 8);
    el.classList.add('aitry');
    el.innerHTML = `
      <div class="aitry__hdr">
        <span class="aitry__tag">Run it with your key</span>
        <span class="aitry__hint">Your key stays in your browser. We do not proxy.</span>
      </div>
      <div class="aitry__keyrow" data-keyrow>
        <input type="password" class="aitry__key" placeholder="Paste your Google AI Studio API key" aria-label="Gemini API key" id="${uid}-key" />
        <button class="btn btn--ghost aitry__savekey" type="button" data-save>Save key</button>
        <button class="btn btn--ghost aitry__clearkey" type="button" data-clear style="display:none;">Clear saved key</button>
        <a class="aitry__getkey" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Get a key →</a>
      </div>
      <label class="aitry__label" for="${uid}-input">Your input</label>
      <textarea class="aitry__input" id="${uid}-input" rows="4" placeholder="${userPlaceholder || ''}"></textarea>
      <div class="aitry__actions">
        <button class="btn aitry__run" type="button" data-run>Run</button>
        <span class="aitry__status" data-status></span>
      </div>
      <div class="aitry__out" data-out hidden></div>
    `;

    const keyInput = el.querySelector('[id$="-key"]');
    const saveBtn = el.querySelector('[data-save]');
    const clearBtn = el.querySelector('[data-clear]');
    const userInput = el.querySelector('[id$="-input"]');
    const runBtn = el.querySelector('[data-run]');
    const status = el.querySelector('[data-status]');
    const out = el.querySelector('[data-out]');

    function refreshKeyUi() {
      const k = getKey();
      if (k) {
        keyInput.value = '';
        keyInput.placeholder = `Saved · ${k.slice(0, 4)}…${k.slice(-4)}`;
        clearBtn.style.display = '';
      } else {
        keyInput.placeholder = 'Paste your Google AI Studio API key';
        clearBtn.style.display = 'none';
      }
    }
    refreshKeyUi();

    saveBtn.addEventListener('click', () => {
      const v = keyInput.value.trim();
      if (!v) { status.textContent = 'Paste a key first.'; return; }
      setKey(v);
      status.textContent = 'Key saved locally.';
      refreshKeyUi();
    });
    clearBtn.addEventListener('click', () => {
      clearKey();
      status.textContent = 'Key cleared.';
      refreshKeyUi();
    });

    runBtn.addEventListener('click', async () => {
      const key = getKey() || keyInput.value.trim();
      if (!key) { status.textContent = 'Paste or save a key first.'; return; }
      const user = userInput.value.trim();
      if (!user) { status.textContent = 'Type an input first.'; return; }

      runBtn.disabled = true;
      status.textContent = 'Calling Gemini…';
      out.hidden = true;

      const started = performance.now();
      try {
        const { text } = await generate({
          model: DEFAULT_MODEL,
          apiKey: key,
          systemPrompt,
          userPrompt: user,
          temperature: 0.3
        });
        out.textContent = text;
        out.hidden = false;
        const ms = Math.round(performance.now() - started);
        status.textContent = `✓ Response in ${ms}ms`;
        emitXapi({ sessionId, loId, inputLen: user.length, outputLen: text.length, ms, ok: true });
      } catch (e) {
        status.textContent = `✗ ${e.message}`;
        emitXapi({ sessionId, loId, inputLen: user.length, outputLen: 0, ms: 0, ok: false, err: e.message });
      } finally {
        runBtn.disabled = false;
      }
    });
  }

  function emitXapi({ sessionId, loId, inputLen, outputLen, ms, ok, err }) {
    try {
      if (!global.xapi || typeof global.xapi.send !== 'function') return;
      global.xapi.send({
        verb: 'responded',
        object: {
          id: `https://teachplay.dev/ai/touchpoint/${sessionId || 'unknown'}`,
          definition: { name: { 'en-US': `AI touchpoint · ${sessionId || 'unknown'}` } }
        },
        result: { success: !!ok, duration: ms ? `PT${(ms / 1000).toFixed(1)}S` : undefined },
        context: {
          extensions: {
            'https://teachplay.dev/ext/ai-model': DEFAULT_MODEL,
            'https://teachplay.dev/ext/ai-input-len': inputLen,
            'https://teachplay.dev/ext/ai-output-len': outputLen,
            'https://teachplay.dev/ext/ai-lo': loId || null,
            'https://teachplay.dev/ext/ai-error': err || null
          }
        }
      });
    } catch {}
  }

  function attachTouchpoint(el) {
    if (!el || el.dataset.aiMounted === '1') return;
    el.dataset.aiMounted = '1';
    render(el, {
      systemPrompt: el.dataset.aiPromptSystem || '',
      userPlaceholder: el.dataset.aiPlaceholder || '',
      sessionId: el.dataset.aiSession || '',
      loId: el.dataset.aiLo || ''
    });
  }

  function init() {
    document.querySelectorAll('[data-ai-touchpoint]').forEach(attachTouchpoint);
  }

  global.ai = { init, attachTouchpoint, getKey, clearKey };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
