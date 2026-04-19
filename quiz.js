// quiz.js — elaborative-feedback MCQ renderer for the TeachPlay handbook.
//
// API: Quiz.mount(containerEl, questions)
// questions: Array of { lo, q, opts: [A,B,C,D], ans: 0-3, feedback: [4 strings] }
//
// Choices lock on first click (formative only). Correct answer is revealed when
// a wrong choice is made. xAPI 'answered' verb is emitted per item; 'scored' is
// emitted when all items are answered.

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
`;
    document.head.appendChild(el);
  }

  const LETTERS = ['A', 'B', 'C', 'D'];

  function _buildItem(question, index, onAnswered) {
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
    let answered = false;

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

        const isCorrect = (i === ans);
        const allBtns = optionsEl.querySelectorAll('.quiz__opt');

        allBtns.forEach(function (b, j) {
          b.setAttribute('disabled', '');
          if (j === i) {
            b.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
          } else if (j === ans && !isCorrect) {
            b.classList.add('is-revealed');
          }
        });

        // show feedback for chosen option only
        const fbEl = item.querySelector('[data-fb="' + i + '"]');
        if (fbEl) {
          fbEl.classList.add('is-visible');
          fbEl.classList.add(isCorrect ? 'quiz__feedback--correct' : 'quiz__feedback--wrong');
        }

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

        onAnswered(isCorrect);
      });

      optionsEl.appendChild(btn);

      // per-option feedback div (hidden until this option is chosen)
      const fbEl = document.createElement('div');
      fbEl.className = 'quiz__feedback';
      fbEl.setAttribute('data-fb', String(i));
      fbEl.innerHTML = (feedback && feedback[i]) ? feedback[i] : '';
      optionsEl.appendChild(fbEl);
    });

    item.appendChild(optionsEl);
    return item;
  }

  function mount(containerEl, questions) {
    if (!containerEl || !questions || !questions.length) return;
    _injectStyles();

    const quizEl = document.createElement('div');
    quizEl.className = 'quiz';

    let answeredCount = 0;
    let correctCount = 0;
    const total = questions.length;

    const summaryEl = document.createElement('div');
    summaryEl.className = 'quiz__summary';

    questions.forEach(function (question, index) {
      const item = _buildItem(question, index, function (isCorrect) {
        answeredCount++;
        if (isCorrect) correctCount++;

        if (answeredCount === total) {
          const allCorrect = (correctCount === total);
          summaryEl.className = 'quiz__summary is-visible ' + (allCorrect ? 'quiz__summary--pass' : 'quiz__summary--fail');
          summaryEl.innerHTML = allCorrect
            ? '<strong>All correct.</strong> You are ready to move on.'
            : '<strong>' + correctCount + ' of ' + total + ' correct.</strong> Review the highlighted answers before continuing.';

          // xAPI session-level score
          if (window.xapi) {
            window.xapi.emit(
              'scored',
              window.xapi.activities.obj('quiz', containerEl.id || 'quiz', 'Quiz \u00B7 ' + (containerEl.id || 'quiz')),
              {
                result: {
                  score: { raw: correctCount, min: 0, max: total, scaled: correctCount / total },
                  success: allCorrect,
                },
              }
            );
          }
        }
      });
      quizEl.appendChild(item);
    });

    quizEl.appendChild(summaryEl);
    containerEl.appendChild(quizEl);
  }

  return { mount };
})();
