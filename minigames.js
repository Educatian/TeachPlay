/* Minigame injector — called from session pages that include this file.
   Each session page must have a placeholder <div id="minigame-mount" data-minigame="s02"></div>
   inside the desired section (we also build a full <section> for consistency). */

(function() {
  'use strict';

  // ─── Shared helpers ──────────────────────────────────────
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function shell(mount, opts) {
    // Build the classic .minigame shell and return the body element.
    var sec = el('section', 'block');
    sec.id = 'minigame';
    sec.innerHTML =
      '<div class="block__kicker">' + opts.kicker + '</div>' +
      '<h2 class="block__title">' + opts.title + '</h2>' +
      '<p class="block__subtitle">' + opts.subtitle + '</p>';

    var mg = el('div', 'minigame');
    mg.innerHTML =
      '<div class="minigame__head">' +
        '<span class="minigame__tag">Minigame</span>' +
        '<h3 class="minigame__title">' + opts.mgTitle + '</h3>' +
        '<span class="minigame__hint">' + opts.hint + '</span>' +
      '</div>';
    var body = el('div', 'minigame__body');
    mg.appendChild(body);
    sec.appendChild(mg);
    mount.replaceWith(sec);
    return body;
  }

  // ─── S02: Persona vs. stereotype sorter ─────────────────
  function buildS02(mount) {
    var body = shell(mount, {
      kicker: '08 · Minigame — 5 min',
      title: 'Persona, stereotype, or unfalsifiable?',
      subtitle: 'Eight one-sentence learner descriptions pulled from real design briefs. For each, decide whether it is an evidence-based persona, a stereotype, or a claim that cannot be tested. Answers lock on first click.',
      mgTitle: 'Learner-description triage',
      hint: '~4 min · click to answer'
    });

    body.innerHTML =
      '<p class="minigame__lede">A <strong>persona</strong> names specific, observable traits (context, prior knowledge, constraints). A <strong>stereotype</strong> asserts a group trait as given. An <strong>unfalsifiable</strong> claim cannot be checked by any evidence.</p>' +
      '<div class="classifier" id="s02-classifier"></div>' +
      '<div class="minigame__score" id="s02-score" style="display:none;"><span class="score-label">Score</span><span class="score-value"><span id="s02-correct">0</span> / <span id="s02-total">0</span></span><span class="score-note" id="s02-note"></span></div>' +
      '<div class="minigame__verdict" id="s02-verdict" style="display:none;"><div class="verdict-label">Takeaway</div><div class="verdict-body" id="s02-verdict-body"></div></div>';

    var ITEMS = [
      { prompt: '“Gen-Z learners have short attention spans and prefer TikTok-style content.”', answer: 'stereotype', why: 'A group trait assigned by age cohort, with no source or observable behavior. Design from stereotypes and you design for no one.' },
      { prompt: '“Third-year nursing students at Regional Medical, most with 60+ clinical hours, report freezing when an attending questions their handoff.”', answer: 'persona', why: 'Specific population, specific context, specific observable behavior. Every claim is testable by shadowing a handoff.' },
      { prompt: '“Our learners want an engaging, immersive, meaningful experience.”', answer: 'unfalsifiable', why: 'No test could show this is false. It is aspiration language disguised as analysis.' },
      { prompt: '“Introverted students learn better alone; extroverts learn better in groups.”', answer: 'stereotype', why: 'A learning-styles myth that has been repeatedly debunked. Personality-to-modality mappings do not survive replication.' },
      { prompt: '“Seventh-grade algebra students at Title I schools in our district score 22 points below state average on rate-and-ratio items.”', answer: 'persona', why: 'Named population, named constraint (Title I), named gap tied to specific item type. A designer can test whether a prototype closes that gap.' },
      { prompt: '“Adult learners value autonomy in their learning journey.”', answer: 'unfalsifiable', why: 'Drawn from pop-Knowles. “Value autonomy” is too vague to operationalize; which autonomy, over what, compared to what?' },
      { prompt: '“New hires in the call center, three weeks in, escalate 40% of billing disputes that peers resolve on the first call.”', answer: 'persona', why: 'Concrete population, time-window, observable gap against a peer baseline. This is what D1 is supposed to produce.' },
      { prompt: '“Visual learners need visual content; kinesthetic learners need hands-on activities.”', answer: 'stereotype', why: 'Learning styles are a persistent myth. Meta-analyses find no benefit from style-matched instruction. Design for variability, not fixed types.' }
    ];

    var host = document.getElementById('s02-classifier');
    var scoreEl = document.getElementById('s02-score');
    var correctEl = document.getElementById('s02-correct');
    var totalEl = document.getElementById('s02-total');
    var noteEl = document.getElementById('s02-note');
    var verdict = document.getElementById('s02-verdict');
    var verdictBody = document.getElementById('s02-verdict-body');
    totalEl.textContent = ITEMS.length;
    var answered = 0, correct = 0;

    ITEMS.forEach(function(item, i) {
      var row = el('div', 'classifier-item');
      var p = el('p', 'classifier-prompt', '<strong>' + (i+1) + '.</strong> ' + item.prompt);
      row.appendChild(p);
      var choices = el('div', 'classifier-choices');
      [
        { key: 'persona', label: 'Persona' },
        { key: 'stereotype', label: 'Stereotype' },
        { key: 'unfalsifiable', label: 'Unfalsifiable' }
      ].forEach(function(opt) {
        var b = el('button', 'chip');
        b.type = 'button';
        b.textContent = opt.label;
        b.addEventListener('click', function() {
          if (row.classList.contains('is-answered')) return;
          row.classList.add('is-answered');
          b.classList.add('is-picked');
          if (opt.key === item.answer) { b.classList.add('is-correct'); correct++; }
          else {
            b.classList.add('is-wrong');
            Array.prototype.forEach.call(choices.children, function(c) {
              if (c.textContent.toLowerCase() === item.answer) c.classList.add('is-correct');
            });
          }
          answered++;
          correctEl.textContent = correct;
          scoreEl.style.display = 'flex';
          if (answered === ITEMS.length) {
            var pct = Math.round(100 * correct / ITEMS.length);
            noteEl.textContent = pct >= 87 ? 'Sharp eye — you screen briefs like an editor.' :
                                pct >= 62 ? 'Solid. Reread the ones you missed before drafting D1.' :
                                            'This is the most common D1 failure mode. Spend time here.';
            verdict.style.display = 'block';
            verdictBody.innerHTML = '<strong>What this exposes:</strong> most weak learner analyses hide a stereotype or an unfalsifiable claim inside what looks like a persona. Before you lock D1, highlight every sentence and ask: <em>which category is this, really?</em>';
          }
        });
        choices.appendChild(b);
      });
      row.appendChild(choices);
      var fb = el('div', 'classifier-feedback', '<strong>Why:</strong> ' + item.why);
      row.appendChild(fb);
      host.appendChild(row);
    });
  }

  // ─── S05: Feedback-loop tuner ───────────────────────────
  function buildS05(mount) {
    var body = shell(mount, {
      kicker: '07 · Minigame — 5 min',
      title: 'Tune the loop.',
      subtitle: 'A broken feedback loop on the left. Three dials on the right: delay, specificity, stakes. Move them until the simulated learner actually learns. Watch the behavior graph update.',
      mgTitle: 'Feedback-loop tuner',
      hint: '~5 min · interactive'
    });

    body.innerHTML =
      '<p class="minigame__lede">The simulated learner gets 12 attempts at a task. Their score on attempt N is a function of loop quality, not of their effort. Your job is to find a loop configuration where they actually improve.</p>' +
      '<div class="loop-tuner">' +
        '<div class="loop-tuner__dials">' +
          '<div class="dial"><label>Feedback delay<output id="s05-v-delay">8 turns</output></label><input type="range" id="s05-delay" min="0" max="10" step="1" value="8"/><div class="dial-scale"><span>Immediate</span><span>End of unit</span></div></div>' +
          '<div class="dial"><label>Specificity<output id="s05-v-spec">Grade only</output></label><input type="range" id="s05-spec" min="0" max="3" step="1" value="0"/><div class="dial-scale"><span>Grade only</span><span>Diagnostic</span></div></div>' +
          '<div class="dial"><label>Stakes<output id="s05-v-stakes">High</output></label><input type="range" id="s05-stakes" min="0" max="2" step="1" value="2"/><div class="dial-scale"><span>Low</span><span>High</span></div></div>' +
        '</div>' +
        '<div class="loop-tuner__viz">' +
          '<div class="loop-chart"><canvas id="s05-chart" width="420" height="200"></canvas></div>' +
          '<div class="loop-tuner__readout"><div class="readout-label">Final mastery</div><div class="readout-value" id="s05-mastery">—</div><div class="readout-verdict" id="s05-verdict">Move the dials.</div></div>' +
        '</div>' +
      '</div>';

    var delay = document.getElementById('s05-delay');
    var spec = document.getElementById('s05-spec');
    var stakes = document.getElementById('s05-stakes');
    var vDelay = document.getElementById('s05-v-delay');
    var vSpec = document.getElementById('s05-v-spec');
    var vStakes = document.getElementById('s05-v-stakes');
    var canvas = document.getElementById('s05-chart');
    var ctx = canvas.getContext('2d');
    var masteryEl = document.getElementById('s05-mastery');
    var verdictEl = document.getElementById('s05-verdict');

    var specLabels = ['Grade only', 'What was wrong', 'What + why', 'Diagnostic cue'];
    var stakesLabels = ['Low', 'Medium', 'High'];

    function simulate(d, s, k) {
      // Learning gain per attempt is a function of:
      // - immediacy (1 - d/10)^0.7
      // - specificity (s+1)/4 boosted non-linearly
      // - stakes: inverted-U — medium best
      var imm = Math.pow(1 - d / 10, 0.7);
      var spc = Math.pow((s + 1) / 4, 0.8);
      var stakesCurve = [0.55, 0.95, 0.6][k];
      var perStep = 0.07 + 0.85 * imm * spc * stakesCurve;
      perStep = Math.max(0.01, perStep);
      var pts = [0]; var cur = 18;
      for (var i = 1; i <= 12; i++) {
        // Diminishing returns
        var headroom = 100 - cur;
        cur += headroom * perStep * 0.22;
        // Add small noise by deterministic wobble
        cur += Math.sin(i * (s + d + k + 1)) * 1.2;
        pts.push(Math.max(0, Math.min(100, cur)));
      }
      return pts;
    }

    function draw() {
      var d = +delay.value, s = +spec.value, k = +stakes.value;
      vDelay.textContent = d === 0 ? 'Immediate' : d === 10 ? 'End of unit' : d + ' turns';
      vSpec.textContent = specLabels[s];
      vStakes.textContent = stakesLabels[k];

      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      // Axes grid
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
      for (var y = 0; y <= 4; y++) {
        var yy = 20 + y * ((H - 40) / 4);
        ctx.beginPath(); ctx.moveTo(40, yy); ctx.lineTo(W - 10, yy); ctx.stroke();
      }
      // Y labels
      ctx.fillStyle = '#6b7280'; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right';
      [100, 75, 50, 25, 0].forEach(function(v, i) {
        ctx.fillText(v, 36, 24 + i * ((H - 40) / 4));
      });
      ctx.textAlign = 'center';
      ctx.fillText('Attempt →', W / 2, H - 4);
      // Simulate
      var pts = simulate(d, s, k);
      var N = pts.length - 1;
      // Line
      ctx.strokeStyle = '#9E1B32'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach(function(p, i) {
        var x = 40 + (i / N) * (W - 50);
        var y = H - 20 - (p / 100) * (H - 40);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Dots
      pts.forEach(function(p, i) {
        var x = 40 + (i / N) * (W - 50);
        var y = H - 20 - (p / 100) * (H - 40);
        ctx.fillStyle = '#9E1B32'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI*2); ctx.fill();
      });

      var final = pts[pts.length - 1];
      masteryEl.textContent = Math.round(final) + '%';

      var v;
      if (final < 40) v = '<strong>Flat or regressing.</strong> The loop is too slow, too vague, or stakes are suppressing risk-taking. Tune until the curve climbs.';
      else if (final < 65) v = '<strong>Modest learning.</strong> One dial is still fighting you. The single biggest lever is usually specificity — learners can\'t correct what they can\'t see.';
      else if (final < 85) v = '<strong>Good loop.</strong> Immediate + diagnostic + moderate stakes. This is the zone where feedback actually teaches.';
      else v = '<strong>Tight loop.</strong> Your design now has the ingredients. Next: make sure the feedback is legible <em>during</em> play, not buried in a post-round screen.';
      verdictEl.innerHTML = v;
    }

    [delay, spec, stakes].forEach(function(r) { r.addEventListener('input', draw); });
    draw();
  }

  // ─── S07: Paper prototype stress test ───────────────────
  function buildS07(mount) {
    var body = shell(mount, {
      kicker: '06 · Minigame — 5 min',
      title: '90 seconds. Build the prototype.',
      subtitle: 'A playtest starts in 90 seconds. Drag the parts you need onto the table. You can only fit seven. Miss a critical part and the playtest fails — but over-engineer and you run out of time.',
      mgTitle: 'Paper prototype stress test',
      hint: '90-sec timer · drag & drop'
    });

    body.innerHTML =
      '<p class="minigame__lede">Parts are below. Drag <strong>exactly seven</strong> onto the table before the timer runs out. Then click <em>Start playtest</em>. Each part is scored by whether it was essential for the test you were about to run.</p>' +
      '<div class="paper-proto">' +
        '<div class="paper-proto__bar"><div class="timer"><div class="timer__fill" id="s07-timer-fill"></div><div class="timer__label" id="s07-timer-label">90</div></div><div class="pp-count"><span id="s07-count">0</span> / 7 on table</div><button class="btn" id="s07-start" disabled>Start playtest</button></div>' +
        '<div class="paper-proto__table" id="s07-table"><div class="pp-empty">Drag parts here</div></div>' +
        '<div class="paper-proto__tray" id="s07-tray"></div>' +
        '<div class="pp-verdict" id="s07-verdict" style="display:none;"></div>' +
      '</div>';

    var PARTS = [
      // essentials (pick these)
      { id: 'cards', label: 'Index cards (rules)', essential: true, weight: 2, note: 'Without these the facilitator improvises rules; data is not comparable across testers.' },
      { id: 'board', label: 'Paper play surface', essential: true, weight: 2, note: 'Shared reference for state. The single most skipped essential.' },
      { id: 'pen', label: 'Pen + notebook', essential: true, weight: 2, note: 'Observation capture. You think you will remember what happened. You will not.' },
      { id: 'tokens', label: 'Tokens / counters', essential: true, weight: 1, note: 'Anything that represents game state. Coins, paper clips, sticky notes — fine.' },
      { id: 'timer', label: 'Physical timer', essential: true, weight: 1, note: 'You will lose track of time, and so will the playtester. Put it on the table.' },
      { id: 'consent', label: 'Consent / observation script', essential: true, weight: 2, note: 'Explains what you are doing and what you will record. Non-optional for any playtest with humans.' },
      { id: 'plan', label: 'One-page test plan', essential: true, weight: 2, note: 'The hypothesis you are testing. Without it you will answer the wrong question with perfect data.' },
      // decoys (avoid)
      { id: 'laptop', label: 'Laptop', essential: false, weight: -2, note: 'You do not need a laptop for a paper playtest. It signals “watch me type” and breaks the low-fi contract.' },
      { id: 'polish', label: 'Graphic-design flourishes', essential: false, weight: -3, note: 'Polished art on a paper proto makes testers comment on aesthetics, not mechanics. Counterproductive.' },
      { id: 'phone', label: 'Phone for social posts', essential: false, weight: -3, note: 'Unrelated to the test.' },
      { id: 'rulebook', label: 'Fully-formatted rulebook', essential: false, weight: -1, note: 'Over-engineered. Cards with bullet points is the right fidelity at this stage.' },
      { id: 'swag', label: 'Participant swag', essential: false, weight: -1, note: 'Nice later, irrelevant now, and a distraction during the 90 seconds.' }
    ];
    // shuffle deterministically by id length to keep output stable but mixed
    PARTS.sort(function(a, b) { return (a.id.length - b.id.length) || a.id.localeCompare(b.id); });

    var tray = document.getElementById('s07-tray');
    var table = document.getElementById('s07-table');
    var emptyMsg = table.querySelector('.pp-empty');
    var timerFill = document.getElementById('s07-timer-fill');
    var timerLabel = document.getElementById('s07-timer-label');
    var countEl = document.getElementById('s07-count');
    var startBtn = document.getElementById('s07-start');
    var verdictEl = document.getElementById('s07-verdict');

    PARTS.forEach(function(p) {
      var t = el('div', 'pp-part');
      t.dataset.id = p.id;
      t.textContent = p.label;
      t.addEventListener('click', function() { togglePart(p.id, t); });
      tray.appendChild(t);
    });

    var onTable = new Set();
    function togglePart(id, node) {
      if (finished) return;
      if (onTable.has(id)) {
        onTable.delete(id);
        node.classList.remove('is-on-table');
        tray.appendChild(node);
      } else {
        if (onTable.size >= 7) return;
        onTable.add(id);
        node.classList.add('is-on-table');
        if (emptyMsg.parentNode) emptyMsg.remove();
        table.appendChild(node);
      }
      countEl.textContent = onTable.size;
      startBtn.disabled = onTable.size !== 7;
    }

    var TIMER_MAX = 90;
    var remaining = TIMER_MAX;
    var finished = false;
    var tick = setInterval(function() {
      if (finished) return;
      remaining--;
      if (remaining <= 0) { remaining = 0; endGame(true); }
      timerLabel.textContent = remaining;
      timerFill.style.width = (100 * remaining / TIMER_MAX) + '%';
    }, 1000);

    startBtn.addEventListener('click', function() { endGame(false); });

    function endGame(outOfTime) {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      startBtn.disabled = true;
      var score = 0, picked = [], missed = [], bad = [];
      PARTS.forEach(function(p) {
        if (onTable.has(p.id)) { score += p.weight; picked.push(p); if (!p.essential) bad.push(p); }
        else if (p.essential) { missed.push(p); }
      });
      var pct = Math.max(0, Math.min(100, Math.round((score / 14) * 100)));
      var headline = outOfTime
        ? 'Time up. Table had ' + onTable.size + ' parts.'
        : 'Playtest started with ' + picked.length + ' parts.';
      var detail = '';
      if (missed.length) detail += '<p><strong>Missed essentials:</strong> ' + missed.map(function(m){return '<em>'+m.label+'</em>';}).join(', ') + '. ' + missed[0].note + '</p>';
      if (bad.length) detail += '<p><strong>Over-engineered:</strong> ' + bad.map(function(m){return '<em>'+m.label+'</em>';}).join(', ') + '. ' + bad[0].note + '</p>';
      if (!missed.length && !bad.length) detail += '<p>Clean table. This is what a disciplined low-fi prototype looks like.</p>';
      detail += '<p class="pp-score">Readiness score: <strong>' + pct + '%</strong></p>';
      verdictEl.innerHTML = '<div class="verdict-label">' + headline + '</div>' + detail;
      verdictEl.style.display = 'block';
    }
  }

  // ─── S11: Revision cut list triage ───────────────────────
  function buildS11(mount) {
    var body = shell(mount, {
      kicker: '06 · Minigame — 5 min',
      title: 'Twelve revisions. Keep four.',
      subtitle: 'You have one revision sprint left. Twelve candidates from your audit and playtest. Scope discipline says you ship four, defer or drop the rest. Choose — the consequence panel shows what the cut costs you.',
      mgTitle: 'Revision triage',
      hint: '~5 min · choose 4 of 12'
    });

    body.innerHTML =
      '<p class="minigame__lede">Click a card to promote it to the <strong>Next sprint</strong> column. Click again to drop. You can only keep four. The right column tallies the consequences of what you chose <em>not</em> to do.</p>' +
      '<div class="revision-triage">' +
        '<div class="rt-col rt-col--backlog"><div class="rt-col__head">Backlog · <span id="s11-backlog-count">12</span></div><div class="rt-list" id="s11-backlog"></div></div>' +
        '<div class="rt-col rt-col--keep"><div class="rt-col__head">Next sprint · <span id="s11-keep-count">0</span> / 4</div><div class="rt-list" id="s11-keep"></div></div>' +
        '<div class="rt-col rt-col--consequences"><div class="rt-col__head">Consequences of cuts</div><div class="rt-cons" id="s11-cons"><em>Start choosing to see tradeoffs.</em></div></div>' +
      '</div>';

    var ITEMS = [
      { id:'a11y', label:'Fix color-only signaling in scoring UI', impact:{ learning:3, equity:5, shipability:4 }, cost:2, tag:'Audit · Accessibility' },
      { id:'tut',  label:'Rewrite the 8-minute tutorial to 2 minutes', impact:{ learning:4, equity:3, shipability:4 }, cost:3, tag:'Playtest · Onboarding' },
      { id:'fb',   label:'Add diagnostic feedback on wrong answers', impact:{ learning:5, equity:2, shipability:3 }, cost:3, tag:'Playtest · Loop' },
      { id:'log',  label:'Instrument event logging for next playtest', impact:{ learning:2, equity:0, shipability:5 }, cost:2, tag:'Audit · Evidence' },
      { id:'perf', label:'Fix 6-second load time on target device', impact:{ learning:1, equity:3, shipability:5 }, cost:2, tag:'Audit · Performance' },
      { id:'art',  label:'Replace placeholder art in hero scene', impact:{ learning:0, equity:0, shipability:1 }, cost:3, tag:'Polish · Visual' },
      { id:'dbrf', label:'Add 3-question post-play debrief screen', impact:{ learning:4, equity:1, shipability:3 }, cost:2, tag:'Design · Facilitation' },
      { id:'diff', label:'Add adjustable difficulty / timing', impact:{ learning:2, equity:4, shipability:3 }, cost:3, tag:'Audit · Accessibility' },
      { id:'ip',   label:'Audit asset licenses + attribution list', impact:{ learning:0, equity:1, shipability:4 }, cost:1, tag:'Audit · Rights' },
      { id:'ach',  label:'Add achievement badges / XP system', impact:{ learning:0, equity:0, shipability:1 }, cost:3, tag:'Polish · Engagement' },
      { id:'save', label:'Add save-state for multi-session play', impact:{ learning:1, equity:2, shipability:2 }, cost:4, tag:'Scope · Infra' },
      { id:'mus',  label:'Commission original soundtrack', impact:{ learning:0, equity:0, shipability:0 }, cost:4, tag:'Polish · Audio' }
    ];

    var backlogEl = document.getElementById('s11-backlog');
    var keepEl = document.getElementById('s11-keep');
    var consEl = document.getElementById('s11-cons');
    var bCount = document.getElementById('s11-backlog-count');
    var kCount = document.getElementById('s11-keep-count');

    function render() {
      backlogEl.innerHTML = '';
      keepEl.innerHTML = '';
      var keepIds = new Set();
      ITEMS.forEach(function(it) { if (it._keep) keepIds.add(it.id); });
      kCount.textContent = keepIds.size;
      bCount.textContent = ITEMS.length - keepIds.size;

      ITEMS.forEach(function(it) {
        var card = el('div', 'rt-card' + (it._keep ? ' is-keep' : ''));
        card.innerHTML =
          '<div class="rt-card__tag">' + it.tag + '</div>' +
          '<div class="rt-card__label">' + it.label + '</div>' +
          '<div class="rt-card__bars">' +
            bar('Learning', it.impact.learning) +
            bar('Equity', it.impact.equity) +
            bar('Ship', it.impact.shipability) +
          '</div>';
        card.addEventListener('click', function() {
          if (it._keep) { it._keep = false; render(); return; }
          if (keepIds.size >= 4) return;
          it._keep = true; render();
        });
        (it._keep ? keepEl : backlogEl).appendChild(card);
      });

      // Compute consequences: sum of high-impact (>=4) items that were cut
      var cutHigh = ITEMS.filter(function(it) { return !it._keep && (it.impact.learning >= 4 || it.impact.equity >= 4 || it.impact.shipability >= 4); });
      var lowCostKept = ITEMS.filter(function(it) { return it._keep && (it.impact.learning + it.impact.equity + it.impact.shipability) < 3; });
      if (!ITEMS.some(function(it){return it._keep;})) { consEl.innerHTML = '<em>Start choosing to see tradeoffs.</em>'; return; }

      var msg = '';
      if (keepIds.size < 4) msg += '<p><strong>Keep choosing.</strong> You have ' + (4 - keepIds.size) + ' slots left.</p>';
      if (cutHigh.length) {
        msg += '<p><strong>High-impact items you cut:</strong></p><ul>';
        cutHigh.slice(0, 4).forEach(function(it) {
          var why = it.impact.learning >= 4 ? 'biggest lever on learning' :
                    it.impact.equity   >= 4 ? 'biggest lever on who can play' :
                                              'biggest lever on shipability';
          msg += '<li>' + it.label + ' — <em>' + why + '</em></li>';
        });
        msg += '</ul>';
      }
      if (lowCostKept.length) {
        msg += '<p><strong>Low-impact items you kept</strong> (consider swapping):</p><ul>';
        lowCostKept.slice(0, 3).forEach(function(it) {
          msg += '<li>' + it.label + '</li>';
        });
        msg += '</ul>';
      }
      if (keepIds.size === 4) {
        var totalLearn = ITEMS.filter(function(it){return it._keep;}).reduce(function(s,it){return s+it.impact.learning;},0);
        var totalEq = ITEMS.filter(function(it){return it._keep;}).reduce(function(s,it){return s+it.impact.equity;},0);
        var totalShip = ITEMS.filter(function(it){return it._keep;}).reduce(function(s,it){return s+it.impact.shipability;},0);
        msg += '<p class="rt-totals">Your sprint · Learning <b>' + totalLearn + '</b> · Equity <b>' + totalEq + '</b> · Ship <b>' + totalShip + '</b></p>';
        var verdict;
        if (totalLearn >= 12 && totalEq >= 8) verdict = '<strong>Strong discipline.</strong> You chose for the learner and the deadline, not for polish.';
        else if (totalShip >= 15 && totalLearn < 8) verdict = '<strong>You optimized for shipping.</strong> This sprint lowers risk but may not move learning. Defensible if the playtest evidence already shows good learning.';
        else if (totalLearn >= 10 && totalShip < 8) verdict = '<strong>Learning-heavy sprint.</strong> Real impact, but will it ship? Check that your remaining scope is actually buildable in one cycle.';
        else verdict = '<strong>Mixed basket.</strong> Ask: does this sprint have a single thesis, or four unrelated fixes?';
        msg += '<p class="rt-verdict">' + verdict + '</p>';
      }
      consEl.innerHTML = msg;
    }
    function bar(label, val) {
      var pct = val * 20;
      return '<div class="rt-bar"><span>'+label+'</span><div class="rt-bar__track"><div class="rt-bar__fill" style="width:'+pct+'%"></div></div></div>';
    }
    render();
  }

  // ─── S12: Defense room (AI-scored) ───────────────────────
  function buildS12(mount) {
    var body = shell(mount, {
      kicker: '07 · Minigame — 8 min',
      title: 'The defense room.',
      subtitle: 'Five evaluator questions, asked the way your committee will ask them. Type a 2–3 sentence answer to each. Submit the round and the AI evaluator scores you against the rubric and gives you one sharp piece of advice per question.',
      mgTitle: 'Defense-room rehearsal',
      hint: 'Typing · AI-scored'
    });

    body.innerHTML =
      '<p class="minigame__lede">Answer as if you were standing in the room. If you do not know, write what you would say if you did not know. The rubric is looking for: specificity, evidence, and acknowledgement of the weakest part of your design.</p>' +
      '<div class="defense-room">' +
        '<div id="s12-questions"></div>' +
        '<div class="defense-actions"><button class="btn" id="s12-submit">Submit for evaluation</button><span class="defense-hint">Answers stay on this page; no data leaves the session.</span></div>' +
        '<div class="defense-result" id="s12-result" style="display:none;"></div>' +
      '</div>';

    var QUESTIONS = [
      { id:'q1', prompt:'In one sentence: what specific behavior does a learner leave your game able to do, that they could not do before?' },
      { id:'q2', prompt:'What evidence from your playtests tells you this actually happened — and what evidence tells you it did not?' },
      { id:'q3', prompt:'Which learner variability did your design fail? Name a real user type your playtest excluded or disadvantaged.' },
      { id:'q4', prompt:'If you had another sprint, what is the single change you would make, and what tradeoff does it force?' },
      { id:'q5', prompt:'What is the part of this work you are least proud of, and what would you do differently if you started over?' }
    ];

    var host = document.getElementById('s12-questions');
    QUESTIONS.forEach(function(q, i) {
      var block = el('div', 'defense-q');
      block.innerHTML =
        '<label class="defense-q__label"><span class="defense-q__num">' + (i+1) + '</span>' + q.prompt + '</label>' +
        '<textarea class="defense-q__input" id="'+q.id+'" rows="3" placeholder="Type your answer..."></textarea>';
      host.appendChild(block);
    });

    document.getElementById('s12-submit').addEventListener('click', async function() {
      var answers = QUESTIONS.map(function(q) { return { q: q.prompt, a: (document.getElementById(q.id).value || '').trim() }; });
      var allBlank = answers.every(function(a){ return a.a.length === 0; });
      var result = document.getElementById('s12-result');
      if (allBlank) {
        result.style.display = 'block';
        result.innerHTML = '<div class="verdict-label">Nothing to evaluate</div><p>Answer at least one question before submitting.</p>';
        return;
      }

      result.style.display = 'block';
      result.innerHTML = '<div class="verdict-label">Evaluator thinking…</div><div class="defense-loading">Reading your defense…</div>';

      var prompt = 'You are an expert evaluator for an educational-game-design microcredential portfolio defense. Five questions were asked. A student has answered. For EACH question, produce a JSON object with keys: "score" (0-5 integer; rubric: specificity of behavior/evidence/tradeoff, realism, acknowledgement of limits), "strength" (≤20 words: the single strongest thing in the answer, or "No answer provided." if blank), "advice" (≤25 words: one pointed piece of advice for a stronger defense). Return ONLY valid JSON, an array of 5 objects in order. No commentary.\n\n' +
        answers.map(function(a, i) { return '[Q' + (i+1) + '] ' + a.q + '\n[A' + (i+1) + '] ' + (a.a || '(no answer)'); }).join('\n\n');

      try {
        var text = await window.claude.complete(prompt);
        // Try to extract JSON array
        var m = text.match(/\[[\s\S]*\]/);
        var data = m ? JSON.parse(m[0]) : null;
        if (!Array.isArray(data) || data.length !== 5) throw new Error('Bad evaluator output');
        var total = data.reduce(function(s,d){ return s + (+d.score || 0); }, 0);
        var verdict = total >= 20 ? 'Defense-ready. Tighten any 4-point answer to a 5.'
                    : total >= 14 ? 'Defensible but has soft spots. Rehearse the two lowest-scoring questions before the real defense.'
                    : total >= 8  ? 'Needs work. Each question below 3 is a place the committee will push — get specific before you walk in.'
                                  : 'Start over on specificity. Most answers read as aspiration; the committee needs evidence.';
        var html = '<div class="verdict-label">Evaluator verdict · ' + total + ' / 25</div><p class="defense-verdict">' + verdict + '</p>';
        html += '<div class="defense-items">';
        data.forEach(function(d, i) {
          var score = +d.score || 0;
          html += '<div class="defense-item"><div class="defense-item__head"><span class="defense-item__num">Q' + (i+1) + '</span><span class="defense-item__score" data-s="'+score+'">' + score + '/5</span></div>' +
                  '<div class="defense-item__q">' + QUESTIONS[i].prompt + '</div>' +
                  '<div class="defense-item__strength"><b>Strength:</b> ' + (d.strength||'—') + '</div>' +
                  '<div class="defense-item__advice"><b>Advice:</b> ' + (d.advice||'—') + '</div></div>';
        });
        html += '</div>';
        result.innerHTML = html;
      } catch (err) {
        result.innerHTML = '<div class="verdict-label">Evaluator unavailable</div><p>The AI evaluator did not return a usable response this time. You can still self-score: ' +
          'for each question, did you give a <em>specific</em> behavior, <em>specific</em> evidence, and acknowledge a <em>specific</em> limit? Rerun submission to try again.</p>' +
          '<p class="defense-error"><small>' + (err.message || err) + '</small></p>';
      }
    });
  }

  // ─── Dispatch ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-minigame]').forEach(function(node) {
      var kind = node.getAttribute('data-minigame');
      try {
        if (kind === 's02') buildS02(node);
        else if (kind === 's05') buildS05(node);
        else if (kind === 's07') buildS07(node);
        else if (kind === 's11') buildS11(node);
        else if (kind === 's12') buildS12(node);
      } catch (e) {
        console.error('Minigame failed:', kind, e);
      }
    });
  });
})();
