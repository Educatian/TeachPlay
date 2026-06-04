// quiz.js — elaborative-feedback MCQ renderer for the TeachPlay handbook.
//
// API: Quiz.mount(containerEl, questions, options?)
// questions: Array of { lo, q, opts: [A,B,C,D], ans: 0-3, feedback: [4 strings] }
// options:
//   shuffle: true  — Fisher-Yates shuffle per question (opts+feedback in sync, ans recalculated)
//   gate: 'attempt' — disables [data-mark-done] and .session-nav__next until all questions answered

const Quiz = (() => {
  'use strict';

  let _styleInjected = false;

  function _injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;
    const el = document.createElement('style');
    el.setAttribute('data-source', 'quiz.js');
    el.textContent = `
.quiz { display: flex; flex-direction: column; gap: 20px; }
.quiz__item { border: 1px solid var(--gray-80, #e0e0e0); border-radius: 10px; overflow: hidden; }
.quiz__question { padding: 16px 20px 14px; font-size: 15px; font-weight: 600; line-height: 1.5; color: #111; border-bottom: 1px solid var(--gray-80, #e0e0e0); background: var(--gray-05, #f4f4f4); }
.quiz__lo-tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--crimson, #be1a2f); margin-bottom: 6px; }
.quiz__options { display: flex; flex-direction: column; }
.quiz__opt { display: flex; align-items: flex-start; gap: 12px; padding: 13px 20px; cursor: pointer; background: #fff; border: none; border-top: 1px solid var(--gray-80, #e0e0e0); text-align: left; width: 100%; font-family: var(--font-sans, inherit); font-size: 14px; line-height: 1.5; color: #222; transition: background 0.12s; }
.quiz__opt:first-child { border-top: none; }
.quiz__opt:hover:not([disabled]) { background: var(--gray-05, #f4f4f4); }
.quiz__opt[disabled] { cursor: default; }
.quiz__badge { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: var(--gray-80, #c6c6c6); color: #fff; margin-top: 1px; }
.quiz__opt.is-correct .quiz__badge { background: #2f855a; }
.quiz__opt.is-wrong .quiz__badge { background: var(--crimson, #be1a2f); }
.quiz__opt.is-revealed .quiz__badge { background: #2f855a; }
.quiz__opt.is-correct { background: #f0fff4; }
.quiz__opt.is-wrong { background: #fff5f5; }
.quiz__opt.is-revealed { background: #f0fff4; }
.quiz__feedback { display: none; padding: 12px 20px 14px; font-size: 13px; line-height: 1.6; border-top: 1px solid var(--gray-80, #e0e0e0); color: #333; }
.quiz__feedback.is-visible { display: block; }
.quiz__feedback--correct { background: #f0fff4; border-left: 4px solid #2f855a; }
.quiz__feedback--wrong { background: #fff5f5; border-left: 4px solid var(--crimson, #be1a2f); }
.quiz__summary { display: none; margin-top: 4px; padding: 16px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; }
.quiz__summary.is-visible { display: block; }
.quiz__summary--pass { background: #f0fff4; border: 1px solid #2f855a; color: #22543d; }
.quiz__summary--fail { background: #fff5f5; border: 1px solid var(--crimson, #be1a2f); color: #742a2a; }
.quiz__summary--progress { background: #fffaf0; border: 1px solid #d69e2e; color: #744210; }
.quiz__attempt-meta { display: block; margin-top: 8px; font-size: 12px; font-weight: 500; line-height: 1.5; }
.quiz__complete-btn { margin-top: 12px; border: 0; border-radius: 6px; background: var(--crimson, #be1a2f); color: #fff; font: 700 13px/1.2 var(--font-sans, inherit); padding: 10px 12px; cursor: pointer; }
.quiz__complete-btn:hover { background: #8f1527; }
.quiz__complete-btn[disabled] { background: #767676; cursor: default; }
.quiz__gate-notice { margin-top: 10px; font-size: 12px; color: var(--gray-40, #888); text-align: center; font-family: var(--font-sans, inherit); }
/* WCAG AA: opacity-based dimming made foreground text composite to colors
   that fail 4.5:1. Use full-strength gray instead so disabled cells stay
   readable while still visually distinct from active links. */
.quiz-gated { pointer-events: none; user-select: none; filter: grayscale(0.6); }
.quiz-gated, .quiz-gated * { color: #4f4f4f !important; }
.quiz-gated-btn { background: #767676 !important; border-color: #767676 !important; color: #fff !important; pointer-events: none; cursor: not-allowed; opacity: 1; }
.quiz-gated[aria-disabled="true"] { cursor: not-allowed; }
`;
    document.head.appendChild(el);
  }

  const LETTERS = ['A', 'B', 'C', 'D'];
  const STORAGE_VERSION = 1;

  // Fisher-Yates in-place shuffle
  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function _questionSignature(question) {
    return [question.lo || '', question.q || '', (question.opts || []).join('||')].join('::');
  }

  function _quizStorageKey(containerEl, options) {
    if (options && options.storageKey) return options.storageKey;
    var id = containerEl.id || 'quiz';
    var page = location.pathname.split('/').pop() || 'index';
    return 'hb:quiz:' + page + ':' + id + ':v' + STORAGE_VERSION;
  }

  function _loadState(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function _saveState(key, state) {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch (_) {}
  }

  function _defaultOrder(question) {
    return (question.opts || []).map(function (_, i) { return i; });
  }

  // Returns a new question object with opts+feedback ordered and ans recalculated
  function _orderQuestion(question, indices) {
    const correctText = question.opts[question.ans];
    const newOpts = indices.map(function (i) { return question.opts[i]; });
    const newFeedback = indices.map(function (i) { return question.feedback[i]; });
    const newAns = newOpts.indexOf(correctText);
    return Object.assign({}, question, { opts: newOpts, feedback: newFeedback, ans: newAns });
  }

  function _buildItem(question, index, priorSelected, onAnswered) {
    const { lo, q, opts, ans, feedback } = question;

    const item = document.createElement('div');
    item.className = 'quiz__item';

    // question header
    const header = document.createElement('div');
    header.className = 'quiz__question';
    if (lo) {
      const tag = document.createElement('div');
      tag.className = 'quiz__lo-tag';
      tag.textContent = lo;
      header.appendChild(tag);
    }
    const qText = document.createElement('div');
    qText.innerHTML = q;
    header.appendChild(qText);
    item.appendChild(header);

    // options + per-option feedback (interleaved in DOM)
    const optionsEl = document.createElement('div');
    optionsEl.className = 'quiz__options';
    let answered = priorSelected !== null && priorSelected !== undefined && priorSelected >= 0;

    function renderAnswer(selectedIndex) {
      const isCorrect = (selectedIndex === ans);
      const allBtns = optionsEl.querySelectorAll('.quiz__opt');

      allBtns.forEach(function (b, j) {
        b.setAttribute('disabled', '');
        if (j === selectedIndex) {
          b.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
        } else if (j === ans && !isCorrect) {
          b.classList.add('is-revealed');
        }
      });

      const fbEl = item.querySelector('[data-fb="' + selectedIndex + '"]');
      if (fbEl) {
        fbEl.classList.add('is-visible');
        fbEl.classList.add(isCorrect ? 'quiz__feedback--correct' : 'quiz__feedback--wrong');
      }

      return isCorrect;
    }

    opts.forEach(function (optText, i) {
      const btn = document.createElement('button');
      btn.className = 'quiz__opt';
      btn.type = 'button';

      const badge = document.createElement('span');
      badge.className = 'quiz__badge';
      badge.textContent = LETTERS[i];
      btn.appendChild(badge);

      const label = document.createElement('span');
      label.innerHTML = optText;
      btn.appendChild(label);

      btn.addEventListener('click', function () {
        if (answered) return;
        answered = true;

        const isCorrect = renderAnswer(i);

        // xAPI statement
        if (window.xapi) {
          window.xapi.emit(
            'answered',
            window.xapi.activities.obj('quiz-item', lo || ('q' + index), 'Quiz \u00B7 ' + (lo || ('Q' + (index + 1)))),
            {
              result: { success: isCorrect, response: optText },
              contextExt: { 'https://teachplay.dev/ext/quiz-lo': lo || '' },
            }
          );
        }

        onAnswered(isCorrect, i);
      });

      optionsEl.appendChild(btn);

      // per-option feedback div (hidden until this option is chosen).
      // aria-live: empty + in-DOM at build time, so revealing it on answer
      // is announced politely to screen readers (WCAG 4.1.3 status messages).
      const fbEl = document.createElement('div');
      fbEl.className = 'quiz__feedback';
      fbEl.setAttribute('data-fb', String(i));
      fbEl.setAttribute('aria-live', 'polite');
      fbEl.setAttribute('aria-atomic', 'true');
      fbEl.innerHTML = (feedback && feedback[i]) ? feedback[i] : '';
      optionsEl.appendChild(fbEl);
    });

    if (answered) renderAnswer(priorSelected);

    item.appendChild(optionsEl);
    return item;
  }

  function _applyGate(gatedEls, message) {
    gatedEls.forEach(function (el) {
      if (!el.dataset.quizGateOriginalTitle) {
        el.dataset.quizGateOriginalTitle = el.getAttribute('title') || '';
      }
      el.setAttribute('title', message);
      el.setAttribute('aria-disabled', 'true');
      if (el.tagName === 'BUTTON') {
        el.classList.add('quiz-gated-btn');
        el.disabled = true;
      } else {
        el.classList.add('quiz-gated');
        if (!el.dataset.quizGateOriginalTabindex) {
          el.dataset.quizGateOriginalTabindex = el.getAttribute('tabindex') || '';
        }
        el.setAttribute('tabindex', '-1');
        if (!el.__quizGateHandler) {
          el.__quizGateHandler = function (e) {
            e.preventDefault();
            e.stopPropagation();
          };
          el.addEventListener('click', el.__quizGateHandler);
        }
      }
    });
  }

  function _releaseGate(gatedEls) {
    gatedEls.forEach(function (el) {
      el.classList.remove('quiz-gated', 'quiz-gated-btn');
      el.removeAttribute('aria-disabled');
      if (el.dataset.quizGateOriginalTitle !== undefined) {
        if (el.dataset.quizGateOriginalTitle) el.setAttribute('title', el.dataset.quizGateOriginalTitle);
        else el.removeAttribute('title');
        delete el.dataset.quizGateOriginalTitle;
      }
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      } else {
        if (el.dataset.quizGateOriginalTabindex !== undefined) {
          if (el.dataset.quizGateOriginalTabindex) el.setAttribute('tabindex', el.dataset.quizGateOriginalTabindex);
          else el.removeAttribute('tabindex');
          delete el.dataset.quizGateOriginalTabindex;
        }
        if (el.__quizGateHandler) {
          el.removeEventListener('click', el.__quizGateHandler);
          delete el.__quizGateHandler;
        }
      }
    });
  }

  function mount(containerEl, questions, options) {
    if (!containerEl || !questions || !questions.length) return;
    options = options || {};
    _injectStyles();

    var storageKey = _quizStorageKey(containerEl, options);
    var signatures = questions.map(_questionSignature);
    var state = _loadState(storageKey);
    var shouldReset = !state ||
      state.version !== STORAGE_VERSION ||
      state.total !== questions.length ||
      JSON.stringify(state.signatures || []) !== JSON.stringify(signatures);

    if (shouldReset) {
      state = {
        version: STORAGE_VERSION,
        total: questions.length,
        signatures: signatures,
        order: [],
        selections: {},
        completed: false,
        startedAt: new Date().toISOString(),
      };
    }

    // apply shuffle once, then persist the order so refresh cannot create a new attempt
    var processedQuestions = questions.map(function (q, index) {
      var order = state.order[index];
      if (!Array.isArray(order) || order.length !== q.opts.length) {
        order = options.shuffle ? _shuffle(_defaultOrder(q)) : _defaultOrder(q);
        state.order[index] = order;
      }
      return _orderQuestion(q, order);
    });
    _saveState(storageKey, state);

    const quizEl = document.createElement('div');
    quizEl.className = 'quiz';

    let answeredCount = 0;
    let correctCount = 0;
    const total = processedQuestions.length;
    processedQuestions.forEach(function (question, index) {
      var selected = state.selections[index];
      if (selected !== null && selected !== undefined && selected >= 0) {
        answeredCount++;
        if (selected === question.ans) correctCount++;
      }
    });

    const summaryEl = document.createElement('div');
    summaryEl.className = 'quiz__summary';
    // aria-live: this element persists in the DOM and only its text changes
    // on each answer, so screen readers announce progress/score updates
    // politely (WCAG 4.1.3 status messages).
    summaryEl.setAttribute('aria-live', 'polite');
    summaryEl.setAttribute('aria-atomic', 'true');

    // gate: 'attempt' — lock next-nav and mark-done until all answered
    var gatedEls = [];
    if (options.gate === 'attempt') {
      var markDoneBtn = document.querySelector('[data-mark-done]');
      var nextNavLink = document.querySelector('.session-nav__next');
      if (markDoneBtn) gatedEls.push(markDoneBtn);
      if (nextNavLink) gatedEls.push(nextNavLink);
      if (answeredCount < total) {
        _applyGate(gatedEls, 'Answer all quiz questions to unlock session completion and the next session.');
      }
    }

    function updateCompletionButton(btn) {
      var markDone = document.querySelector('[data-mark-done]');
      var isDone = !!(markDone && markDone.classList.contains('is-done'));
      btn.textContent = isDone ? 'Session already marked complete' : 'Mark this session complete';
      btn.disabled = isDone;
    }

    function renderSummary() {
      summaryEl.innerHTML = '';
      if (answeredCount <= 0) {
        summaryEl.className = 'quiz__summary';
        if (options.gate === 'attempt') {
          var noticeEl = document.createElement('p');
          noticeEl.className = 'quiz__gate-notice';
          noticeEl.textContent = 'Answer all ' + total + ' questions once to unlock session completion and the next session. Your first attempt is saved, so refreshing will not reset it.';
          summaryEl.appendChild(noticeEl);
        }
        return;
      }

      if (answeredCount < total) {
        summaryEl.className = 'quiz__summary is-visible quiz__summary--progress';
        summaryEl.innerHTML = '<strong>' + answeredCount + ' of ' + total + ' answered.</strong>';
        var progressMeta = document.createElement('span');
        progressMeta.className = 'quiz__attempt-meta';
        progressMeta.textContent = 'Your selections are saved in this browser. Finish the remaining questions to unlock completion and Next.';
        summaryEl.appendChild(progressMeta);
        return;
      }

      const allCorrect = (correctCount === total);
      summaryEl.className = 'quiz__summary is-visible ' + (allCorrect ? 'quiz__summary--pass' : 'quiz__summary--fail');
      var msg = document.createElement('span');
      msg.innerHTML = allCorrect
        ? '<strong>All correct.</strong> You are ready to move on.'
        : '<strong>' + correctCount + ' of ' + total + ' correct.</strong> Review the highlighted answers before continuing.';
      summaryEl.appendChild(msg);

      var meta = document.createElement('span');
      meta.className = 'quiz__attempt-meta';
      meta.textContent = 'Attempt saved. Refreshing this page will restore this result instead of starting a new attempt.';
      summaryEl.appendChild(meta);

      if (options.gate === 'attempt') {
        var completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.className = 'quiz__complete-btn';
        updateCompletionButton(completeBtn);
        completeBtn.addEventListener('click', function () {
          var markDone = document.querySelector('[data-mark-done]');
          if (markDone && !markDone.classList.contains('is-done')) markDone.click();
          updateCompletionButton(completeBtn);
        });
        window.addEventListener('hb:progress-updated', function () {
          updateCompletionButton(completeBtn);
        }, { once: true });
        summaryEl.appendChild(completeBtn);
      }
    }

    processedQuestions.forEach(function (question, index) {
      var priorSelected = state.selections[index];
      const item = _buildItem(question, index, priorSelected, function (isCorrect, selectedIndex) {
        answeredCount++;
        if (isCorrect) correctCount++;
        state.selections[index] = selectedIndex;
        state.updatedAt = new Date().toISOString();
        _saveState(storageKey, state);

        if (answeredCount === total) {
          state.completed = true;
          state.completedAt = state.completedAt || new Date().toISOString();
          _saveState(storageKey, state);
          if (options.gate === 'attempt') {
            _releaseGate(gatedEls);
          }
          renderSummary();

          // xAPI session-level score
          if (window.xapi) {
            try {
              window.xapi.emit(
                'scored',
                window.xapi.activities.obj('quiz', containerEl.id || 'quiz', 'Quiz \u00B7 ' + (containerEl.id || 'quiz')),
                {
                  result: {
                    score: { raw: correctCount, min: 0, max: total, scaled: correctCount / total },
                    success: correctCount === total,
                  },
                }
              );
            } catch (_) {}
          }
          return;
        }
        renderSummary();
      });
      quizEl.appendChild(item);
    });

    if (answeredCount >= total && options.gate === 'attempt') {
      _releaseGate(gatedEls);
    }
    renderSummary();

    quizEl.appendChild(summaryEl);
    containerEl.appendChild(quizEl);
  }

  return { mount };
})();
