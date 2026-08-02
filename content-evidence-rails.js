/* Session-level claim/evidence/limit rails.
 * These are instructional prompts, not claims that the learner has achieved an outcome.
 */
(() => {
  const rails = {
    '01': {
      claim: 'A learning problem is worth designing for when the population, context, and desired change are specific enough to test.',
      evidence: 'Save the one-sentence problem frame, one baseline or primary observation, the first falsifiable hypothesis, and the reason a game is or is not a fit.',
      limit: 'A plausible problem statement is not evidence that a game will improve learning; the claim remains provisional until later artifact and playtest evidence.'
    },
    '02': {
      claim: 'A design becomes defensible when the learner, performance gap, and use constraints force visible design decisions.',
      evidence: 'Save the D1, the source or observation behind the gap, the constraint map, one peer critique, and a tracked revision showing what changed.',
      limit: 'A persona or anecdote cannot represent a whole population; name the sample, context, uncertainty, and the disconfirming observation you still need.'
    },
    '03': {
      claim: 'An objective-to-mechanic crosswalk is useful only when each objective has an observable success criterion and a reasoned mechanic choice.',
      evidence: 'Save the D2 table, objective verb/condition/criterion, evidence artifact, mechanic rationale, named risk, and one row deliberately marked out of scope.',
      limit: 'A taxonomy label does not validate a mechanic; alignment is a design hypothesis until the resulting behavior and evidence are observed.'
    },
    '04': {
      claim: 'A failure loop can support learning when retry, feedback, cost, and recovery make a different next action possible.',
      evidence: 'Save the state or loop sketch, feedback copy, one failed path, the learner-visible cue, and the change made after observing the retry.',
      limit: 'Difficulty, frustration, and learning are not interchangeable outcomes; a successful retry still needs evidence that the intended reasoning changed.'
    },
    '05': {
      claim: 'Role and collaboration structure should make the target behavior more likely, not merely add narrative or social activity.',
      evidence: 'Save the role brief, turn/participation rule, decision rights, collaboration risk, and an observation showing who acted, explained, or was excluded.',
      limit: 'A role description cannot prove identity change or equitable participation; those claims require observation across more than one play session.'
    },
    '06': {
      claim: 'A facilitator guide is runnable when another person can enact the loop, recover from predictable failures, and debrief toward the objective.',
      evidence: 'Save the guide version, table-read notes, exact intervention language, observed questions, and the revision that removed an author-dependent explanation.',
      limit: 'A complete guide does not guarantee good facilitation; enactment depends on training, time, setting, and the facilitator’s judgment.'
    },
    '07': {
      claim: 'Low-fidelity prototyping is valuable when each cycle tests a risky assumption before visual polish hides it.',
      evidence: 'Save dated prototype images, the tested assumption, observation notes, the change, and the next test for at least three cycles.',
      limit: 'A paper or clickable prototype cannot establish technical performance, accessibility, or transfer; those require later implementation and target-user evidence.'
    },
    '08': {
      claim: 'An implementation spec makes learning-relevant behavior buildable when states, events, feedback, inputs, and exit conditions are explicit.',
      evidence: 'Save the state machine, event→feedback map, input/output contract, accessibility fallback, and a runnable scaffold or trace for the highest-risk scene.',
      limit: 'A precise specification is not a working implementation; runtime behavior, device constraints, and content accuracy still require verification.'
    },
    '09': {
      claim: 'A playtest can test a learning design only when the protocol distinguishes usability observations from evidence of learning.',
      evidence: 'Save consent language, target-learner sampling rationale, preregistered hypotheses, raw observations or recordings, event traces, and the revision budget.',
      limit: 'A small convenience sample cannot establish effectiveness or generalizability; it can reveal specific usability and design risks for the next iteration.'
    },
    '10': {
      claim: 'An audit improves a design when rewards, cognitive load, accessibility, ethics, and data flows are tied to concrete decisions.',
      evidence: 'Save the reward inventory, load/accessibility/data-risk findings, affected populations, mitigations, and the unresolved risk that remains after revision.',
      limit: 'A checklist is not a legal, clinical, or accessibility certification; high-stakes decisions require domain review and manual testing.'
    },
    '11': {
      claim: 'Revision is evidence-based when the cut line is explicit and each change can be traced to an observation, risk, or criterion.',
      evidence: 'Save the ranked backlog, impact×effort scores, before/after diff, reverted decision if any, and the next test that could falsify the revision.',
      limit: 'More revisions do not necessarily mean more learning; a polished change without a tested rationale is still an unsupported claim.'
    },
    '12': {
      claim: 'A defensible portfolio connects the design journey, computational artifact, evidence, reviewer judgment, and known limits in one traceable argument.',
      evidence: 'Save the D1–D5 citations, two-minute high-risk demo, reviewer questions and answers, rubric scores, final repository snapshot, and limitations statement.',
      limit: 'Presentation quality is not evidence of learning or implementation quality; credential approval remains dependent on the rubric and instructor review.'
    }
  };

  const mount = () => {
    const outcomes = document.querySelector('section#outcomes');
    const number = document.querySelector('.session-header__session-num')?.textContent?.match(/Session\s+(\d{2})/)?.[1];
    const item = number && rails[number];
    if (!outcomes || !item || document.querySelector('.content-evidence-rail')) return;
    const rail = document.createElement('aside');
    rail.className = 'content-evidence-rail';
    rail.setAttribute('aria-labelledby', `content-evidence-title-${number}`);
    rail.innerHTML = `
      <div class="content-evidence-rail__kicker">Claim discipline · session ${number}</div>
      <h2 id="content-evidence-title-${number}">Claim / Evidence / Limit</h2>
      <div class="content-evidence-rail__grid">
        <div><strong>Claim</strong><p>${item.claim}</p></div>
        <div><strong>Evidence to save</strong><p>${item.evidence}</p></div>
        <div><strong>Limit</strong><p>${item.limit}</p></div>
      </div>`;
    outcomes.insertAdjacentElement('afterend', rail);
  };

  const style = document.createElement('style');
  style.textContent = `
    .content-evidence-rail { margin: 28px 0 48px; padding: 22px 24px; border: 1px solid #e4e6e8; border-left: 4px solid #9e1b32; border-radius: 8px; background: #fafafa; }
    .content-evidence-rail__kicker { color: #9e1b32; font: 700 11px/1.2 Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
    .content-evidence-rail h2 { margin: 8px 0 16px; color: #161616; font: 750 24px/1.15 Inter, sans-serif; letter-spacing: -.025em; }
    .content-evidence-rail__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .content-evidence-rail__grid > div { min-width: 0; padding-top: 12px; border-top: 1px solid #e4e6e8; }
    .content-evidence-rail strong { color: #161616; font: 700 12px/1.2 Inter, sans-serif; letter-spacing: .06em; text-transform: uppercase; }
    .content-evidence-rail p { margin: 8px 0 0; color: #4a4a4a; font: 400 14px/1.55 Inter, sans-serif; }
    @media (max-width: 720px) { .content-evidence-rail { padding: 18px; } .content-evidence-rail__grid { grid-template-columns: 1fr; gap: 14px; } }
  `;
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
