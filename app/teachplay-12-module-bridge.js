(() => {
  const modules = [
    {
      n: '01',
      title: 'Framing: the engagement trap',
      outcome: 'Name the learning behavior before choosing a game genre.',
      deliverable: 'D1 learning problem statement',
      caseUse: 'Use Space Invaders only to see how a familiar arcade form can be reframed around physics reasoning.',
      prompt: 'I am a beginner. Help me turn one real learning problem into a game-design brief with learner, context, constraint, target behavior, and evidence.',
      href: '/session-01.html'
    },
    {
      n: '02',
      title: 'Learner, context, and constraints',
      outcome: 'Describe the learner and setting tightly enough to guide design decisions.',
      deliverable: 'D1 learner and context profile',
      caseUse: 'Scope the game around one learner group, one setting, and one constraint.',
      prompt: 'Ask me five concrete questions about my learners and constraints, then draft a one-page learner profile for my educational game.',
      href: '/session-02.html'
    },
    {
      n: '03',
      title: 'Objectives and crosswalk',
      outcome: 'Map objective, player action, feedback, evidence, and claim.',
      deliverable: 'D2 objective-to-mechanic crosswalk',
      caseUse: 'Use Space Invaders Physics Lab for trajectory, gravity, vector reasoning, and telemetry evidence.',
      prompt: 'Build one crosswalk row for my game: learning objective, player action, system feedback, observable evidence, and reviewer claim.',
      href: '/session-03.html'
    },
    {
      n: '04',
      title: 'Mechanics I: challenge and feedback',
      outcome: 'Design failure so it teaches the learner what to revise.',
      deliverable: 'D2 feedback loop sketch',
      caseUse: 'Use shot prediction, miss feedback, and retry logic as the smallest teachable loop.',
      prompt: 'Help me design a predict, act, feedback, revise loop where wrong answers produce useful information rather than punishment.',
      href: '/session-04.html'
    },
    {
      n: '05',
      title: 'Mechanics II: role and narrative',
      outcome: 'Use role as a design constraint, not as decoration.',
      deliverable: 'D2 role-as-mechanic rationale',
      caseUse: 'Use Chalk and Chance to study how teacher moves, classroom roles, and AI students create practice pressure.',
      prompt: 'Help me write a role card for my game: what the learner can do, what the role prevents, and what decisions become visible.',
      href: '/session-05.html'
    },
    {
      n: '06',
      title: 'Facilitator design',
      outcome: 'Make the activity runnable by someone other than the designer.',
      deliverable: 'D3 facilitation guide',
      caseUse: 'Document setup, timing, materials, recovery moves, and debrief questions.',
      prompt: 'Turn my game idea into a run-ready facilitator guide with setup, timing, instructions, troubleshooting, and debrief.',
      href: '/session-06.html'
    },
    {
      n: '07',
      title: 'Low-fi prototyping',
      outcome: 'Prototype the core learning loop before building the full game.',
      deliverable: 'D3 paper or low-code prototype',
      caseUse: 'Keep only the playable slice that proves the learning loop.',
      prompt: 'Help me scope a five-minute playable slice with only the minimum screens, rules, choices, and feedback needed for a test.',
      href: '/session-07.html'
    },
    {
      n: '08',
      title: 'Interaction specification',
      outcome: 'Specify states, events, feedback, and data traces before coding.',
      deliverable: 'D3 interaction spec',
      caseUse: 'Use Space Invaders and Chalk and Chance as state-machine examples at a reduced learner-buildable scope.',
      prompt: 'Write a beginner-friendly state machine for my game: states, player actions, system responses, failure states, and saved evidence.',
      href: '/session-08.html'
    },
    {
      n: '09',
      title: 'Playtest design',
      outcome: 'Test the riskiest learning claim with a small but useful protocol.',
      deliverable: 'D4 playtest protocol',
      caseUse: 'Collect traces, one explanation, and one breakdown signal instead of a large dashboard.',
      prompt: 'Create a small playtest plan with task, participant, three traces, one debrief question, and a decision rule for revision.',
      href: '/session-09.html'
    },
    {
      n: '10',
      title: 'Audit: access, ethics, and data',
      outcome: 'Audit load, accessibility, incentives, AI risk, and data use.',
      deliverable: 'D4 audit memo',
      caseUse: 'Check whether the game rewards the intended learning behavior and whether AI use is bounded.',
      prompt: 'Audit my prototype for cognitive load, accessibility, AI risk, privacy, and reward alignment. Give me fixes ranked by severity.',
      href: '/session-10.html'
    },
    {
      n: '11',
      title: 'Revision studio',
      outcome: 'Rank revisions by learning impact, effort, and evidence strength.',
      deliverable: 'D5 revision rationale',
      caseUse: 'Connect each revision to a trace, learner explanation, or observed breakdown.',
      prompt: 'Turn my playtest notes into a revision table with problem, evidence, fix, expected learning impact, and effort.',
      href: '/session-11.html'
    },
    {
      n: '12',
      title: 'Final defense and portfolio',
      outcome: 'Make a defensible claim about what was built, why it teaches, and what evidence supports it.',
      deliverable: 'D5 final implementation packet',
      caseUse: 'Assemble the blueprint, prototype, AI provenance, playtest evidence, audit, and revision story.',
      prompt: 'Help me prepare a final defense: claim, evidence, limits, AI disclosure, implementation plan, and next revision.',
      href: '/session-12.html'
    }
  ];

  const root = document.getElementById('root');
  if (!root) return;

  const moduleSupport = {
    '01': {
      reading: 'Read Session 01 first, then write the learning-problem statement before choosing a game genre.',
      video: 'Watch the learning-problem concept primer in the guided course.',
      connects: 'This module creates the problem frame that Module 02 turns into a learner/context profile.',
      reference: '/references.html'
    },
    '02': {
      reading: 'Read Session 02 and use the constraint questions to describe one learner group, setting, time limit, and access condition.',
      video: 'Use the learning-problem concept primer as the video anchor, then apply it to your own learner context.',
      connects: 'Your learner/context profile becomes the boundary condition for the Module 03 crosswalk.',
      reference: '/facilitator.html'
    },
    '03': {
      reading: 'Read Session 03 and the worked examples before drafting the objective-to-mechanic crosswalk.',
      video: 'Watch the objective-to-mechanic concept primer in the guided course.',
      connects: 'The crosswalk becomes the design spine for Modules 04 and 05.',
      reference: '/examples.html'
    },
    '04': {
      reading: 'Read Session 04 to decide what learners predict, what feedback they receive, and what they revise.',
      video: 'Use the objective-to-mechanic concept primer as the video anchor for feedback alignment.',
      connects: 'The feedback loop gives Module 05 a role and narrative purpose instead of decoration.',
      reference: '/cognitive-load.html'
    },
    '05': {
      reading: 'Read Session 05 and compare your role design with the Chalk and Chance teacher-simulation case.',
      video: 'Use the AI provenance concept primer as the video anchor when role or AI behavior shapes the interaction.',
      connects: 'The role card tells Module 06 what a facilitator must set up, monitor, and debrief.',
      reference: '/ai-use-policy.html'
    },
    '06': {
      reading: 'Read Session 06 and turn the activity into instructions another instructor could run.',
      video: 'Use the five-minute-loop concept primer as the video anchor for keeping facilitation practical.',
      connects: 'The facilitation guide defines the minimum playable conditions for Module 07.',
      reference: '/facilitator.html'
    },
    '07': {
      reading: 'Read Session 07 and reduce the game to one playable slice that proves the learning loop.',
      video: 'Watch the five-minute-loop concept primer in the guided course.',
      connects: 'The prototype slice becomes the state/event system specified in Module 08.',
      reference: '/examples.html'
    },
    '08': {
      reading: 'Read Session 08 and specify states, player actions, system responses, failure states, and saved evidence.',
      video: 'Use the prototype/provenance-log concept primer as the video anchor for making implementation decisions reviewable.',
      connects: 'The interaction spec tells Module 09 what traces the playtest must collect.',
      reference: '/portfolio.html'
    },
    '09': {
      reading: 'Read Session 09 and design a small playtest around the riskiest learning claim.',
      video: 'Watch the playtest-evidence concept primer in the guided course.',
      connects: 'The playtest evidence becomes the raw material for the Module 10 audit and Module 11 revision plan.',
      reference: '/rubrics.html'
    },
    '10': {
      reading: 'Read Session 10 and audit cognitive load, accessibility, privacy, AI use, and reward alignment.',
      video: 'Use the playtest-evidence concept primer as the video anchor when interpreting breakdowns and risks.',
      connects: 'The audit identifies which problems Module 11 should revise first.',
      reference: '/cognitive-load.html'
    },
    '11': {
      reading: 'Read Session 11 and rank revisions by evidence strength, learning impact, and effort.',
      video: 'Use the final-defense concept primer as the video anchor for turning changes into a defensible design story.',
      connects: 'The revision rationale becomes part of the final defense in Module 12.',
      reference: '/rubrics.html'
    },
    '12': {
      reading: 'Read Session 12 and assemble the blueprint, prototype, AI disclosure, playtest evidence, audit, and revision story.',
      video: 'Watch the final-defense concept primer in the guided course before submitting the portfolio packet.',
      connects: 'This module closes the pathway by preparing the evidence packet for review and certificate handoff.',
      reference: '/guides/student-completion-guide.html'
    }
  };

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const hasText = (text) => normalize(document.body.textContent).includes(text);

  const findElement = (predicate) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (predicate(node)) return node;
    }
    return null;
  };

  const makeModuleCard = (module) => {
    const support = moduleSupport[module.n] || {};
    const article = document.createElement('article');
    article.className = 'tp12-module-card';
    article.id = `tp12-module-${module.n}`;
    article.innerHTML = `
      <div class="tp12-module-topline">
        <span>${module.n}</span>
        <a href="#tp12-module-${module.n}" aria-label="Focus module ${module.n}: ${module.title}">Focus module</a>
      </div>
      <h3>${module.title}</h3>
      <p class="tp12-outcome">${module.outcome}</p>
      <dl>
        <div><dt>Evidence</dt><dd>${module.deliverable}</dd></div>
        <div><dt>Case use</dt><dd>${module.caseUse}</dd></div>
        <div><dt>Reading</dt><dd>${support.reading}</dd></div>
        <div><dt>Video anchor</dt><dd>${support.video} The written session is the primary instruction; the avatar clip is a one-minute concept primer.</dd></div>
        <div><dt>Connection</dt><dd>${support.connects}</dd></div>
      </dl>
      <details>
        <summary>Beginner Codex or Claude Code prompt</summary>
        <p>${module.prompt}</p>
      </details>
      <div class="tp12-reference-row">
        <a class="tp12-reference-link" href="${module.href}" target="_blank" rel="noopener" aria-label="Open handbook reference for module ${module.n}: ${module.title}">Module reading</a>
        <a class="tp12-reference-link" href="${support.reference}" target="_blank" rel="noopener" aria-label="Open supporting reference for module ${module.n}: ${module.title}">Supporting reference</a>
      </div>
    `;
    return article;
  };

  const buildPathway = (variant = 'default') => {
    const section = document.createElement('section');
    section.className = `tp12-pathway tp12-${variant}`;
    section.setAttribute('aria-labelledby', `tp12-heading-${variant}`);
    section.dataset.teachplayBridge = '12-module-pathway';

    const header = document.createElement('div');
    header.className = 'tp12-header';
    header.innerHTML = `
      <p>Microcredential curriculum</p>
      <h2 id="tp12-heading-${variant}">AI-Enhanced Educational Game Design, embedded 12-module sequence</h2>
      <div class="tp12-summary">
        <span>12 modules</span>
        <span>Grouped into portfolio milestones</span>
        <span>Space Invaders and Chalk and Chance case studies</span>
        <span>Beginner-ready AI build prompts</span>
      </div>
    `;

    const intro = document.createElement('p');
    intro.className = 'tp12-intro';
    intro.textContent = 'Students move through these twelve modules as the main learning sequence. The existing portfolio milestones stay in place as checkpoints for evidence submission, completion review, and certificate readiness.';

    const grid = document.createElement('div');
    grid.className = 'tp12-grid';
    modules.forEach((module) => grid.appendChild(makeModuleCard(module)));

    section.append(header, intro, grid);
    return section;
  };

  const buildSidebarNote = () => {
    const note = document.createElement('div');
    note.className = 'tp12-sidebar-note';
    note.dataset.teachplayBridge = '12-module-sidebar-note';
    note.innerHTML = `
      <p class="tp12-sidebar-kicker">Course structure</p>
      <h2>12 modules drive the learning. Milestones collect the evidence.</h2>
      <p>Use the module sequence in the main panel for weekly learning work. Use the milestone checkpoints for portfolio submission and completion review.</p>
      <button class="tp12-sidebar-start" type="button" data-tp12-start-first>Start Session 01</button>
      <nav class="tp12-sidebar-modules" aria-label="12-module curriculum sequence">
        ${modules.map((module) => `<a href="#tp12-module-${module.n}"><span>${module.n}</span>${module.title}</a>`).join('')}
      </nav>
      <p class="tp12-sidebar-checkpoint">The three items below are portfolio checkpoints, not the full curriculum.</p>
      <a class="tp12-sidebar-guide-link" href="/guides/student-completion-guide.html" aria-label="Open student completion guide">Open student guide</a>
    `;
    return note;
  };

  const wireSidebarStart = () => {
    const start = document.querySelector('[data-tp12-start-first]');
    if (!start || start.dataset.tp12Wired === 'true') return;
    start.dataset.tp12Wired = 'true';
    start.addEventListener('click', () => {
      const firstLesson = [...document.querySelectorAll('aside button')]
        .find((button) => /Start with the Learning Problem/i.test(normalize(button.textContent)));
      firstLesson?.click();
      const hideSidebar = [...document.querySelectorAll('main button[aria-label]')]
        .find((button) => /hide course sidebar/i.test(button.getAttribute('aria-label') || ''));
      if (window.innerWidth < 768) hideSidebar?.click();
      window.setTimeout(() => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 60);
    });
  };

  const relabelPortfolioCheckpoints = () => {
    if (!hasText('COURSE PROGRESS') && !hasText('Course Progress')) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const replacements = [
      ['Module 1', 'Checkpoint 1'],
      ['Module 2', 'Checkpoint 2'],
      ['Module 3', 'Checkpoint 3']
    ];
    let node;
    while ((node = walker.nextNode())) {
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => {
        value = value.replaceAll(from, to);
      });
      if (value !== node.nodeValue) {
        node.nodeValue = value;
      }
    }
  };

  const formatCheckpointGroups = () => {
    if (!hasText('COURSE PROGRESS') && !hasText('Course Progress')) return;
    const groups = [...document.querySelectorAll('aside .flex-grow.overflow-y-auto > div.relative')].slice(0, 3);
    groups.forEach((group, index) => {
      group.classList.add('tp12-checkpoint-group');
      group.dataset.teachplayCheckpoint = String(index + 1);

      const badge = group.querySelector('.w-6.h-6.rounded-full');
      if (badge) {
        const badgeText = `C${index + 1}`;
        if (badge.textContent !== badgeText) {
          badge.textContent = badgeText;
        }
        badge.setAttribute('aria-label', `Portfolio checkpoint ${index + 1}`);
      }

      const heading = group.querySelector('h3');
      if (heading && !heading.querySelector('.tp12-checkpoint-label')) {
        const label = document.createElement('span');
        label.className = 'tp12-checkpoint-label';
        label.textContent = `Portfolio checkpoint ${index + 1}`;
        heading.prepend(label);
      }
    });
  };

  const injectHomeOrCredential = () => {
    if (document.querySelector('.tp12-default')) return;
    const body = normalize(document.body.textContent);
    const isRelevant =
      body.includes('Build serious learning games educators can actually defend') ||
      body.includes('TeachPlay: AI-Enhanced Educational Game Design') ||
      body.includes('Student Access Guide');
    if (!isRelevant) return;

    const anchor =
      findElement((node) => normalize(node.textContent) === 'A professional credential, not a loose collection of activities.') ||
      findElement((node) => normalize(node.textContent) === 'Competencies');

    const section = buildPathway('default');
    if (anchor) {
      const container = anchor.closest('section, div');
      container?.insertAdjacentElement('beforebegin', section);
    } else {
      root.appendChild(section);
    }
  };

  const injectGuidedCourse = () => {
    if (!hasText('COURSE PROGRESS') && !hasText('Course Progress')) return;

    if (!document.querySelector('.tp12-course')) {
      const mainPanel = document.querySelector('main.flex-grow .max-w-4xl') || document.querySelector('main .max-w-4xl');
      if (mainPanel) {
        mainPanel.insertAdjacentElement('beforeend', buildPathway('course'));
      }
    }

    if (!document.querySelector('.tp12-sidebar-note')) {
      const asideList = document.querySelector('aside .flex-grow.overflow-y-auto');
      if (asideList) {
        asideList.insertAdjacentElement('afterbegin', buildSidebarNote());
      }
    }
  };

  const injectStyles = () => {
    if (document.getElementById('tp12-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp12-styles';
    style.textContent = `
      .tp12-pathway {
        width: min(1120px, calc(100% - 32px));
        margin: 40px auto;
        padding: 28px;
        border: 1px solid #d7dee8;
        border-radius: 8px;
        background: #ffffff;
        color: #172033;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .tp12-course {
        width: 100%;
        margin: 0 0 32px;
        box-shadow: none;
      }
      .tp12-header {
        display: grid;
        gap: 10px;
        border-bottom: 1px solid #e7edf5;
        padding-bottom: 18px;
      }
      .tp12-header p {
        margin: 0;
        color: #9e1b32;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .tp12-header h2 {
        margin: 0;
        color: #111827;
        font-size: clamp(24px, 3vw, 38px);
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: 0;
      }
      .tp12-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tp12-summary span {
        border: 1px solid #dbe4ee;
        border-radius: 999px;
        padding: 7px 10px;
        background: #f8fafc;
        color: #344054;
        font-size: 12px;
        font-weight: 700;
      }
      .tp12-intro {
        margin: 18px 0 22px;
        max-width: 880px;
        color: #475467;
        font-size: 15px;
        line-height: 1.7;
      }
      .tp12-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .tp12-module-card {
        display: grid;
        gap: 12px;
        align-content: start;
        min-height: 320px;
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: #fbfcfe;
        padding: 16px;
      }
      .tp12-module-topline {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .tp12-module-topline span {
        display: inline-grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #9e1b32;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
      }
      .tp12-module-topline a {
        color: #7f1024;
        font-size: 12px;
        font-weight: 800;
        text-decoration: none;
      }
      .tp12-reference-row {
        display: grid;
        gap: 7px;
        align-self: end;
      }
      .tp12-reference-link {
        align-self: end;
        margin-top: 2px;
        color: #1f3a5f;
        font-size: 12px;
        font-weight: 800;
        text-decoration: none;
      }
      .tp12-reference-link::after {
        content: " (opens)";
        color: #667085;
        font-weight: 700;
      }
      .tp12-module-card:target {
        border-color: #9e1b32;
        box-shadow: 0 0 0 3px rgba(158, 27, 50, 0.12);
      }
      .tp12-module-card h3 {
        margin: 0;
        color: #111827;
        font-size: 18px;
        line-height: 1.25;
        font-weight: 800;
        letter-spacing: 0;
      }
      .tp12-outcome,
      .tp12-module-card dd,
      .tp12-module-card details p {
        margin: 0;
        color: #475467;
        font-size: 13px;
        line-height: 1.55;
      }
      .tp12-module-card dl {
        display: grid;
        gap: 9px;
        margin: 0;
      }
      .tp12-module-card dt {
        margin: 0 0 2px;
        color: #667085;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .tp12-module-card details {
        margin-top: 2px;
        border-top: 1px solid #e7edf5;
        padding-top: 10px;
      }
      .tp12-module-card summary {
        color: #1f3a5f;
        cursor: pointer;
        font-size: 12px;
        font-weight: 800;
      }
      .tp12-module-card details[open] summary {
        margin-bottom: 8px;
      }
      .tp12-sidebar-note {
        margin-bottom: 16px;
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: #ffffff;
        padding: 14px;
        color: #344054;
      }
      .tp12-sidebar-kicker {
        margin: 0 0 6px;
        color: #9e1b32;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .tp12-sidebar-note h2 {
        margin: 0 0 8px;
        color: #111827;
        font-size: 14px;
        line-height: 1.25;
        font-weight: 800;
      }
      .tp12-sidebar-note p {
        margin: 0 0 10px;
        font-size: 12px;
        line-height: 1.5;
      }
      .tp12-sidebar-modules {
        display: grid;
        gap: 6px;
        margin: 12px 0;
        border-top: 1px solid #e7edf5;
        border-bottom: 1px solid #e7edf5;
        padding: 10px 0;
      }
      .tp12-sidebar-modules a {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        border-radius: 6px;
        padding: 7px 8px;
        color: #344054;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.25;
        text-decoration: none;
      }
      .tp12-sidebar-modules a:hover,
      .tp12-sidebar-modules a:focus {
        background: #f8fafc;
        color: #7f1024;
      }
      .tp12-sidebar-modules span {
        display: inline-grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #f1f5f9;
        color: #7f1024;
        font-size: 10px;
        font-weight: 900;
      }
      .tp12-sidebar-note .tp12-sidebar-checkpoint {
        margin: 0 0 12px;
        border-left: 3px solid #9e1b32;
        padding-left: 10px;
        color: #475467;
        font-weight: 700;
      }
      .tp12-sidebar-start {
        width: 100%;
        min-height: 42px;
        border: 1px solid #9e1b32;
        border-radius: 8px;
        background: #9e1b32;
        color: #ffffff;
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
      }
      .tp12-sidebar-start:hover,
      .tp12-sidebar-start:focus {
        background: #7f1024;
      }
      .tp12-sidebar-guide-link {
        color: #7f1024;
        font-size: 12px;
        font-weight: 800;
        text-decoration: none;
      }
      .tp12-checkpoint-group {
        border: 1px solid #e7edf5;
        border-radius: 8px;
        background: #fbfcfe;
        padding: 10px;
      }
      .tp12-checkpoint-group h3 {
        display: grid;
        gap: 2px;
      }
      .tp12-checkpoint-label {
        color: #7f1024;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.1em;
        line-height: 1.1;
        text-transform: uppercase;
      }
      @media (max-width: 980px) {
        .tp12-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 640px) {
        .tp12-pathway {
          width: calc(100% - 20px);
          margin: 24px auto;
          padding: 18px;
        }
        .tp12-grid {
          grid-template-columns: 1fr;
        }
        .tp12-module-card {
          min-height: 0;
        }
        aside:has(.tp12-sidebar-note) {
          width: 100vw !important;
          max-width: 100vw;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const run = () => {
    injectStyles();
    injectHomeOrCredential();
    injectGuidedCourse();
    relabelPortfolioCheckpoints();
    formatCheckpointGroups();
    wireSidebarStart();
  };

  window.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true });
})();
