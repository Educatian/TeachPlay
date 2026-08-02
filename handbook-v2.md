# Educational Game Design Micro-Credential: Course Handbook (v2)

**Subtitle:** A research-informed, operationally ready curriculum for instructional designers, teachers, teacher educators, and learning experience professionals

**Revised:** 2026-04-18
**Revision basis:** This edition responds to a structured critique of v1. Major revisions include: (a) replacing "research-based" claims with traceable "research-informed + practitioner-judgment" language wherever empirical grounding is weak; (b) adding a Learning-Objective × Game-Mechanic crosswalk; (c) rubrics per deliverable (not a single shared rubric); (d) explicit generative-AI use policy; (e) reduction of per-session load from 180 to 160 effective minutes; (f) a week-by-week synchronous/asynchronous timeline; (g) explicit external playtest block; (h) principle-to-citation traceability table; (i) instructor workload estimates by cohort size; (j) revised framing of the "minimum sessions" claim as a practitioner recommendation, not an empirical finding.

---

## How to read this handbook

This document has four parts.

**Part 1 — Foundations.** Literature landscape, stance on "minimum sessions," program-level outcomes, and course architecture.

**Part 2 — Design Toolkits.** The Learning-Objective × Mechanic crosswalk, cognitive-load guidance, motivation-transfer tensions, and the AI-use policy. These are the substantive design instruments the course relies on and they are referenced from inside the session plans.

**Part 3 — Delivery.** Twelve-session plan at 160 effective minutes per block, a mapped 8-session compression, a full 12-week timeline showing synchronous sessions, asynchronous work, and the external playtest window, plus common templates and the instructor guide.

**Part 4 — Assessment and operations.** Per-deliverable rubrics, reviewer calibration, program-level grading policy, instructor workload estimates, cohort-size operations, credential and badge structure, references, and methodological notes.

A reader planning to run the course should read Parts 1 and 4 first, then Part 3, then consult Part 2 as reference material when teaching.

---

# PART 1 — FOUNDATIONS

---

## 1. Literature landscape and the "minimum sessions" question

### 1.1 What the evidence actually supports

There is no globally agreed minimum number of sessions, credits, or hours for a micro-credential. Policy and scholarship converge on four criteria — learning outcomes, workload, assessability, and stackability — and diverge on numeric bands.

A short survey of the numeric landscape as of April 2026:

| Source | Numeric guidance | Notes |
|---|---|---|
| European Union, *Council Recommendation on a European approach to micro-credentials* (2022) | No fixed minimum | Defines micro-credentials as certifying learning outcomes of short learning experiences, assessed against transparent standards |
| MicroHE Consortium (European project, 2019–2021) | Minimum 5 ECTS for higher-education micro-credentials | MicroHE's own Users' Guide also uses a 1–5 ECTS band for "micro-credential modules" alongside the 5-ECTS floor for formal HE micro-credentials |
| MICROBOL common framework (Bologna process, 2022) | 1–59 ECTS possible; 1–15 ECTS typical | Widest formal band in European policy guidance |
| New Zealand Qualifications Authority (current public page, verified 2026-04-18) | 1 to 40 credits; 1 credit ≈ 10 notional learning hours | Earlier NZQA guidance (pre-2023) used a 5–40 range, still quoted in many reviews |
| OECD (2021, 2023) | No minimum specified | Emphasizes quality assurance and labor-market signaling rather than size |

Two implications follow:

First, the number of sessions for this course cannot be derived from policy. Policy constrains credit value and quality assurance; it does not prescribe session count.

Second, an educational-game-design micro-credential that wants to be credible under *any* of these regimes must carry enough workload to let learners move through analysis, design, prototyping, playtesting, and revision at least once, and must produce assessable artifacts at each stage.

### 1.2 A transparent stance on "minimum 8 sessions"

The v1 handbook called its 8-session minimum "research-based." That was an overstatement. There is no empirical study showing 8 three-hour sessions is the threshold below which educational-game-design competencies cannot be credentialed. The 8-session figure is a practitioner judgment, derived as follows:

The five required activities — problem and learner analysis, learning-objective to mechanic alignment, low-fidelity prototyping, at least one external playtest, and documented revision — each need working time with adults new to game design. Our teaching experience with this population suggests roughly one three-hour session per activity plus one integration and one assessment session, which lands at eight. This is defensible as a lower bound but it is not evidence-derived.

This handbook therefore treats 8 sessions as a **practitioner lower bound** and 12 sessions as the **recommended delivery**. Institutions seeking formal ECTS recognition (5 ECTS or more) will need to extend total workload to approximately 125–150 hours, which this handbook's extended studio model supports.

### 1.3 What the research actually converges on

Where research on serious and educational game design does produce stable findings, they are methodological rather than numeric:

- Teacher facilitation and curriculum guides are decisive for whether game-based learning transfers to classroom outcomes (Jong, Dong, & Luk, 2017; Nousiainen, Kangas, Rikala, & Vesisenaho, 2018; Sharma et al., 2024).
- Alignment between learning objectives and game mechanics is the single most consistent predictor in framework literature (Plass, Homer, & Kinzer, 2015; Annetta, 2010; Arnab et al., 2015).
- Gamification effects on learning are modest and highly moderated by design quality and context (Sailer & Homner, 2020).
- Meta-analyses on game-based learning report moderate-to-large effects on specific outcomes such as critical thinking and computational thinking (Mao, Cui, Chiu, & Lei, 2022; Lu, Chiu, Cui, Mao, & Lei, 2023).
- Playtesting with target learners, not proxy users, is the most frequent recommendation in stakeholder-centered design frameworks (Bunt, Greeff, & Taylor, 2024; Silva, 2020).

This handbook is built from these five findings outward. Every design tool in Part 2 and every required deliverable in Part 3 is traceable to one or more of them; see the traceability table in Section 3.2.

---

## 2. Program-level learning outcomes

On completion, learners will be able to:

1. Judge whether a given educational problem is a good candidate for a game-based, gamified, or simulation-based solution, and articulate the judgment against specific criteria.
2. Distinguish game-based learning, gamification, serious games, and simulations, and choose among them on the basis of the learning problem rather than aesthetic preference.
3. Produce a design brief that aligns learning objectives, evidence of learning, and game mechanics using the crosswalk introduced in Section 5.
4. Select challenge, feedback, progression, narrative, role, and collaboration structures with explicit justification tied to objective type and learner characteristics.
5. Draft a facilitator guide that makes the experience runnable by a colleague who was not part of the design team.
6. Produce at least one low-fidelity prototype and one medium-fidelity specification that a developer could implement.
7. Design and run a playtest with target learners (not proxy users), and revise the design on the basis of observed evidence.
8. Audit a design for cognitive load, accessibility, data ethics, and over-competitive pressure.
9. Specify a build-ready interaction specification suitable for later implementation in a 3D environment such as Three.js.
10. Reflect on the design decisions taken and on the limits of the resulting artifact.

Outcomes 1–4 are cognitive. Outcomes 5–9 are productive. Outcome 10 is metacognitive. The deliverable map in Section 4 and the rubrics in Part 4 are aligned to this distinction.

These ten program outcomes are operationalized by the 54 session-level learning objectives mapped on the platform's alignment page (alignment.html); every session LO traces up to one or more of the outcomes above. In compact form: outcomes 1–2 → Sessions 1–2; outcome 3 → Sessions 2–3; outcome 4 → Sessions 3–5; outcome 5 → Session 6; outcome 6 → Sessions 7–8; outcome 7 → Session 9 plus the week-10 playtest window; outcome 8 → Session 10; outcome 9 → Sessions 8 and 12; outcome 10 → Sessions 11–12.

---

## 3. Design principles and their sources

### 3.1 Principles

This course is built on six working principles. They are stated in plain language first, then traced to their sources.

1. **Separate but couple two loops.** The game's core loop (what the player does moment-to-moment) and the learning loop (what the learner is supposed to come to know or do) are distinct. Good design couples them; weak design conflates them.
2. **Design from the objective, not from the mechanic.** The mechanic is chosen to serve a specific type of learning objective; the objective is not back-rationalized from a mechanic the team likes.
3. **Design the teacher, not only the game.** In classroom and training contexts, the facilitator's role determines whether the design produces learning.
4. **Prototype before polishing.** Decisions about core loop, feedback, and failure states are tested at low fidelity before any visual or code investment.
5. **Playtest with target learners, not peers.** A peer playtest catches usability problems; only target learners reveal learning problems.
6. **Treat constraints — cognitive, accessibility, ethical, data — as design inputs, not afterthoughts.** They are introduced early and audited explicitly at a dedicated stage.

### 3.2 Principle-to-source traceability

| Principle | Primary sources | Role of source |
|---|---|---|
| 1. Separate but couple two loops | Plass, Homer, & Kinzer (2015); Arnab et al. (2015) | Distinguish game mechanics and learning mechanics and propose mapping |
| 2. Design from the objective | Annetta (2010); Silva (2020); Wiggins & McTighe backward-design tradition | Objective-first sequencing; "six I's" framework emphasizes instructional intent |
| 3. Design the teacher | Jong, Dong, & Luk (2017); Nousiainen et al. (2018); Sharma et al. (2024) | Teacher facilitation and curriculum guide impact on enactment and self-efficacy |
| 4. Prototype before polishing | Silva (2020); Bunt, Greeff, & Taylor (2024) | Iterative low-fidelity design cycle in serious-game methodology |
| 5. Playtest with target learners | Bunt, Greeff, & Taylor (2024); Alaswad & Nadolny (2015) | Stakeholder-centered playtesting; design-based research traditions |
| 6. Constraints as inputs | Sailer & Homner (2020); accessibility and cognitive-load traditions (CLT, WCAG) | Design quality moderates gamification effects; constraints shape outcomes |

Where a principle draws on a tradition rather than a specific paper (such as backward design or cognitive load theory), the tradition is named rather than pseudo-cited.

---

## 4. Course architecture at a glance

### 4.1 Three operating tiers

The course runs in one of three configurations depending on institutional needs.

| Tier | Synchronous | Asynchronous | Total | Best for |
|---|---:|---:|---:|---|
| Compressed (8 sessions) | 8 × 160 min ≈ 21 h | ~29 h | ~50 h | Professional workshop, practitioner lower bound |
| Standard (12 sessions) | 12 × 160 min = 32 h | ~52 h | ~84 h | Recommended delivery |
| Extended (12 + studio) | 32 h | 93–118 h | 125–150 h | Formal recognition, 5 ECTS target |

Every tier produces the same five core deliverables; the tiers differ in the depth of iteration and in the time allowed for external playtesting.

### 4.2 Deliverable map

Five core deliverables are required for credential award. Each is tied to specific program outcomes, has a five-criterion rubric in Part 4, and is due in a fixed week of the standard timeline (§11).

| # | Deliverable | Produced in | Due | Maps to outcomes | Rubric in |
|---|---|---|---|---|---|
| D1 | Design Problem Statement | Session 02 | End of week 2 | 1, 2 | §12.1 |
| D2 | Objective × Mechanic Crosswalk | Session 03 | End of week 5 | 2, 3, 4 | §12.2 |
| D3 | Paper Prototype + Facilitator Guide | Session 07 | End of week 8 | 5, 6 | §12.3 |
| D4 | Playtest Report + recording | Session 09 | End of week 10 | 7, 8 | §12.4 |
| D5 | Implementation Spec | Session 12 | Week 12, at presentation | 6, 9, 10 | §12.5 |

### 4.3 Credential award requirements

The credential is pass-bar based, not point based. There is no weighting, no averaging, and no compensation between criteria: a strong score on one criterion cannot rescue a weak score on another. To be awarded the credential, a learner must:

- Complete all 12 sessions. Session completion is a **prerequisite to submit** the portfolio; it is not itself a scored criterion.
- Submit all five deliverables (D1–D5) to the portfolio server by the published deadlines, each accompanied by a complete GenAI Provenance Log (a submission-completeness requirement, not a scored dimension — see §7.3 and §12).
- Reach **Proficient or better on every one of the 25 rubric criteria** (five criteria per deliverable, §12). This floor is non-compensatory: Exemplary on 24 criteria does not offset Developing on the 25th.
- Base D4 on a playtest with at least three target learners (or an approved alternative arrangement described in Section 15.3 for learners without classroom or training-site access) — this is enforced through the D4 *Protocol design* criterion.
- Complete the post-program survey. Survey completion is a **claim-time condition** on releasing the credential, not a scored criterion.

Why non-compensatory? Each deliverable certifies a distinct, non-substitutable competency in the design chain (problem framing → alignment → prototyping → evidence → specification). Averaging would allow a credential to be issued to someone who cannot, for example, run a defensible playtest — exactly the certification failure a microcredential exists to prevent. This is the structural property that distinguishes a microcredential from a course grade.

---

# PART 2 — DESIGN TOOLKITS

The tools in this part are the course's substantive content. They are referenced from session plans in Part 3 rather than re-explained each time.

---

## 5. The Learning-Objective × Mechanic Crosswalk

This is the instrument Session 3 teaches and Sessions 4–5 deepen. It answers the question the v1 handbook only gestured at: *given this kind of objective, which mechanics are likely to serve it, and which are likely to undermine it?*

### 5.1 Objective taxonomy used

We use a five-category collapse of Bloom's revised taxonomy, chosen because it is actionable for game-mechanic selection.

| Objective type | Examples | Evidence of achievement |
|---|---|---|
| Retrieval | Recall vocabulary, facts, formulas, procedures by rote | Correct recall under time pressure, across contexts |
| Discrimination | Distinguish cases, classify examples, identify errors | Accurate sorting of novel examples |
| Procedural fluency | Execute a multi-step procedure, adapt it to variant cases | Correct execution, including edge cases |
| Conceptual reasoning | Explain why, predict consequences, relate principles | Coherent explanations; accurate prediction |
| Judgment under uncertainty | Weigh trade-offs, decide with incomplete information, evaluate | Defensible decisions; articulated rationale |

### 5.2 Crosswalk: what each objective wants from mechanics

| Mechanic family | Retrieval | Discrimination | Procedural fluency | Conceptual reasoning | Judgment under uncertainty |
|---|---|---|---|---|---|
| **Spaced retrieval / flashcard loops** | Strong fit | Weak | Weak | Weak | Weak |
| **Matching / sorting / classification** | Fair | Strong fit | Weak | Fair | Weak |
| **Timed execution / drill** | Fair | Fair | Strong fit | Weak | Risky |
| **Branching decision / dialog trees** | Weak | Fair | Fair | Strong fit | Strong fit |
| **Simulation with hidden variables** | Weak | Weak | Fair | Strong fit | Strong fit |
| **Resource management** | Weak | Weak | Fair | Fair | Strong fit |
| **Collaborative role play** | Weak | Fair | Fair | Strong fit | Strong fit |
| **Open exploration / discovery** | Weak | Fair | Weak | Strong fit | Fair |
| **Competitive leaderboard** | Fair | Weak | Fair | Weak | Risky |
| **Narrative framing (not a mechanic alone)** | Amplifier | Amplifier | Amplifier | Amplifier | Amplifier |

"Risky" means the mechanic can measurably harm the target objective if used dominantly — for example, a timed drill on a judgment task trains the learner to shortcut the reasoning the objective is meant to develop; a leaderboard on the same task rewards speed over deliberation. These are not prohibited; they are used with caution and in combination with slower mechanics.

### 5.3 How to use the crosswalk in a design brief

For each learning objective in the brief, the team is required to:

1. State the objective type (one of the five categories above).
2. Name the primary mechanic and justify it against the crosswalk row.
3. Name any secondary or amplifying mechanics.
4. Name any mechanic explicitly rejected and state why.
5. Identify risks if a "Risky" combination is proposed, and describe the mitigation.

Session 3's workshop ends with each team having this mapping completed for their top three objectives. The D2 rubric (§12.2) awards credit specifically for explicit justifications against this crosswalk, not for aesthetic fit.

### 5.4 Worked micro-example

*Objective:* "Given a patient's history, the learner weighs risks and selects one of three treatment paths, articulating rationale."

*Objective type:* Judgment under uncertainty.

*Primary mechanic:* Branching decision tree with delayed consequence feedback and a required written rationale step.

*Amplifying mechanic:* Narrative framing as an attending-physician role.

*Rejected mechanic:* Timed execution. The crosswalk flags this as Risky because the objective is deliberation; adding a clock trains the opposite behavior.

*Risk check:* A visible leaderboard would be an additional Risky combination. Any social comparison, if used, is confined to post-round debrief rather than in-run.

---

## 6. Cognitive load, motivation, and the engagement–transfer tension

### 6.1 Cognitive load in game design

Cognitive load theory distinguishes three contributions to working-memory load: intrinsic (inherent to the content), extraneous (introduced by presentation or interaction), and germane (invested in schema construction). In educational games, extraneous load routinely comes from three places: decorative visuals and animations unrelated to the learning objective, unfamiliar interaction grammars, and a mismatch between the pace the game demands and the pace the objective allows.

**Design heuristics used in this course:**

- Every screen element is asked a single question: does it carry intrinsic load, extraneous load, or germane load? Decorative elements without germane function are candidates for removal before the first playtest.
- For novel interaction grammars, a 60-to-90-second onboarding is designed as a mechanic in its own right, not as a tutorial screen.
- For judgment objectives, the pace is set to permit deliberation; for fluency objectives, the pace is set to compress rehearsal cycles.

### 6.2 Motivation and the engagement–transfer tension

Engagement without transfer is a recurring design risk in educational games. The symptoms are a game that playtests well (learners stay engaged, report enjoyment) but produces no measurable learning gain. Treat this as a hypothesis to test, not a universal diagnosis.

The tension has three frequent sources:

**Reward substitution.** Visual, auditory, or point-based rewards become the thing the learner is playing for, displacing the cognitive work the objective requires. Remediation: decouple rewards from the cognitive act and reward the cognitive act itself (for example, reward the articulation of a rationale, not the correctness of the outcome).

**Competition flattening.** Competitive framings compress the time learners spend on each decision, which is helpful for fluency objectives and harmful for judgment objectives. Remediation: move competition, if used at all, to post-round framing rather than in-run pressure.

**Narrative capture.** A compelling narrative can so thoroughly capture the learner's attention that the objective-relevant actions become background. Remediation: ensure that the pivotal narrative choice points are also the objective-relevant decisions.

This course's Session 4 introduces these tensions explicitly. Session 10 audits each team's design against them.

### 6.3 Why this course does not require a motivational framework to be adopted

The v1 handbook named motivation theories (self-determination theory, flow, expectancy-value) as "important" without using them. The revised course takes the opposite stance: it teaches the *tensions* these theories surface, without requiring learners to commit to a single theoretical framework. Adopting SDT or flow as the course's official theory would exceed what the evidence supports for this learner population and would not improve the quality of deliverables. Teams are free to use whichever motivational frame they find productive; they are required to demonstrate that they have considered the three tensions above.

---

## 7. Generative-AI use policy

This policy is binding from 2026 onward. It applies to all five deliverables.

### 7.1 What is permitted

- Using AI tools to brainstorm mechanics, generate candidate design ideas, or critique drafts, provided every use is disclosed.
- Using AI to draft boilerplate sections of the teacher guide (for example, risk-mitigation language) provided the team reviews and revises the output and discloses it.
- Using AI coding assistants for prototype scaffolding (for example, Twine templates, early Three.js scaffolds) provided the learner can explain every line they submit.
- Using AI image tools for placeholder assets in low- and medium-fidelity prototypes.

### 7.2 What is not permitted

- Submitting AI-generated learning objectives without the learner's own analysis step.
- Submitting AI-generated playtest observations as if they were observed data.
- Submitting AI-generated reflections as Deliverable 5.
- Submitting a prototype whose interaction design the learner cannot explain or modify.

### 7.3 Required disclosure

Operationally, disclosures are captured as entries in the platform's GenAI Provenance Log (provenance.html), each declared on the AIAS five-level scale.

Each deliverable includes a short appendix titled *AI Use Disclosure* with three items:

1. Which tool(s) were used.
2. On which sections.
3. What the learner changed after the tool's contribution.

The three items may be assembled directly from your Provenance Log entries.

A complete GenAI Provenance Log (provenance.html) — every substantive AI interaction logged with an AIAS level — is a **submission-completeness requirement** for every deliverable. Submissions without it are returned for completion before scoring (not scored lower). Disclosure is therefore not one of the 25 scored rubric criteria; a future cohort may promote disclosure to scored criteria, but the current 25-criterion gate is unchanged. A disclosure shown to be fabricated is handled as an academic-integrity matter under institutional policy, outside the rubric.

### 7.4 Rationale

The distinction above tracks the course's program outcomes. Outcomes 1, 2, 7, and 10 require the learner's own judgment and observation and are the outcomes where AI substitution most damages credentialing validity. Outcomes 4, 5, 6, and 9 involve production work where AI assistance, if disclosed, does not undermine what the credential is certifying.

---

## 8. The Three.js bridge module

This course is preparation for a later implementation phase in Three.js. The bridge module is a specification document produced alongside the medium-fidelity prototype. It exists to make the handoff from design to implementation cheap.

### 8.1 What the bridge document contains

| Section | Content |
|---|---|
| Scene inventory | Every distinct visual object the scene contains, with approximate scale |
| Camera model | Fixed, orbit, first-person, or scripted; justification in learning terms |
| Player actions | Every input the player can produce (click, drag, keyboard, voice) |
| Pickable objects | The subset of scene objects the player can interact with, and what happens on interaction |
| State machine | States of the game, transitions, and triggers |
| Feedback events | When the player acts, what visual, auditory, or textual feedback fires, and on what delay |
| Scoring / progression | Internal model of success, failure, and progress, independent of surface presentation |
| Data logging points | Which learner actions are recorded, at what granularity, and how long retained |

### 8.2 Why this section exists in the design course, not the implementation course

Three.js works on a small set of primitives — scene, camera, renderer, raycasting for pickable objects, and an animation loop — that map directly onto game-design primitives. If the design brief is vague about "what happens when the player clicks X," the implementation cost of resolving that ambiguity later is much higher than resolving it now. The bridge document is the cheapest place to pay that cost.

### 8.3 Note on scope

The bridge module produces a specification, not code. Learners who wish to continue into implementation take a separate follow-on course; the spec they leave this course with is designed to be that follow-on course's entry artifact.

---

# PART 3 — DELIVERY

---

## 9. Session design conventions

Every standard session is scheduled for a 180-minute block but is planned as **160 minutes of effective instructional time** plus 20 minutes of built-in buffer (transitions between activities, late arrivals, group set-up, and unplanned extensions of discussion). The v1 handbook's 180-minute plans compressed all 180 minutes into scheduled activities with no buffer, which produced chronic over-run.

Each session follows the same internal template:

- **Opening (15 min):** return on prior session's assignment, frame the session's question, state the takeaway the learner should leave with.
- **Core block A (40–45 min):** concept input or case analysis.
- **Transition and break (15 min):** included in the 160 minutes, not added.
- **Core block B (45–50 min):** workshop activity on the learner's own project.
- **Peer exchange (25–30 min):** structured feedback on the workshop output.
- **Closing and exit ticket (10 min):** written reflection; handoff to asynchronous work.

Deviations from this template are noted in individual session plans when they occur.

---

## 10. The twelve sessions

### Session 1 — Framing: what is, and is not, an educational game

**Session-level outcomes.** Learners distinguish educational games, serious games, simulations, gamification, and game-based learning. Learners make a first-pass judgment about whether their chosen educational problem is a good game candidate.

**Pre-work (approx. 90 min asynchronous).** Read a short framing paper and one case analysis. Bring one educational problem the learner would like to work on for the full course. Bring one "game for learning" the learner has used or observed, successful or otherwise.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Course framing and credential requirements | Orient; surface anxieties about workload |
| 0:15–1:00 | Concept input: five terms, with examples | Disambiguate vocabulary the field conflates |
| 1:00–1:15 | Transition and break | — |
| 1:15–2:00 | Case workshop: analyze two contrasting cases in pairs | Apply the distinctions |
| 2:00–2:30 | Workshop: first-pass "is my problem a game candidate?" judgment using a five-question checklist | Begin project |
| 2:30–2:40 | Exit ticket | Reflection |

**Artifacts produced.** One-page project candidate statement. The five-question checklist completed for the learner's problem.

**Assessment link.** Inputs to D1.

**Asynchronous follow-up (approx. 90 min).** Draft the project candidate statement. Read the Design Problem Statement template (§17.2) and rubric (§12.1) and begin D1.

---

### Session 2 — Learner and context analysis

**Session-level outcomes.** Learners complete a structured analysis of who the learners are, what the context allows and constrains, and what the success criteria will be.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on project candidate statements; one-minute peer reactions | Narrow candidates |
| 0:15–0:50 | Concept input: learner analysis, context analysis, constraint mapping | Provide vocabulary |
| 0:50–1:30 | Workshop A: persona construction with constraints | Apply |
| 1:30–1:45 | Transition and break | — |
| 1:45–2:20 | Workshop B: problem statement writing — one page | Crystallize |
| 2:20–2:40 | Peer exchange on problem statements | Surface weak spots |

**Artifacts produced.** Persona sheet, constraint map, one-page problem statement. The scored artifact is the one-page **D1 — Design Problem Statement**; the persona sheet and constraint map travel with it as its evidence pack, alongside the tracked-changes workshop version and one quoted peer-review comment (§12.1).

**Assessment link.** D1 due end of week 2.

---

### Session 3 — Objectives, evidence, and the crosswalk

**Session-level outcomes.** Learners write learning objectives in a form that names objective *type* (Section 5.1). Learners choose primary and amplifying mechanics for each objective using the crosswalk (§5.2), with explicit justifications and at least one documented rejection.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Open with the v1 course's most common mistake: "mechanic first" design. Worked counter-example. | Counter a habit |
| 0:15–0:50 | Concept input: backward design, evidence-of-learning, objective types (§5.1) | Core content |
| 0:50–1:30 | Workshop A: rewrite each objective in the form "Type: [type]. By the end, the learner will be able to [verb + object + condition], evidenced by [artifact]." | Apply |
| 1:30–1:45 | Transition and break | — |
| 1:45–2:25 | Workshop B: crosswalk application — each team fills out the mapping from §5.3 for their top three objectives | Apply the course's signature instrument |
| 2:25–2:40 | Exit ticket: one objective whose mechanic you had to change after doing the crosswalk | Surface learning |

**Artifacts produced.** Objectives list in crosswalk format — the first full draft of **D2 — Objective × Mechanic Crosswalk** itself.

**Assessment link.** D2 is produced in this session and due at the end of week 5; the D2 rubric (§12.2) scores exactly this workshop's output — objective specificity, mechanic rationale, risk identification, the declined alternative, and traceability to D1.

---

### Session 4 — Mechanic literacy I: challenge, feedback, progression, failure

**Session-level outcomes.** Learners design the feedback and failure structures for their project. Learners demonstrate awareness of the engagement–transfer tensions from §6.2.

**Note on scope.** The v1 handbook tried to cover *challenge, feedback, progression, reward, failure states* in one session and overloaded learners. This revision treats *challenge + feedback + failure* as the core, and moves *reward* into Session 10 as part of the ethics audit where the risks of reward substitution are already being discussed.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on crosswalk homework | Consolidate |
| 0:15–1:00 | Concept input + cases: goal–action–feedback chains; feedback timing; productive failure | Core content |
| 1:00–1:15 | Transition and break | — |
| 1:15–2:00 | Workshop: design feedback for the three primary mechanics chosen in Session 3 | Apply |
| 2:00–2:30 | Workshop: design the failure state — what happens, what the learner retains, how restart works | Apply |
| 2:30–2:40 | Exit ticket | Reflection |

**Artifacts produced.** Feedback specification table. Failure-state specification.

**Assessment link.** D2.

---

### Session 5 — Mechanic literacy II: narrative, role, collaboration (core only)

**Session-level outcomes.** Learners choose narrative framing, role structure, and collaboration/competition structure for their project, justified against objective type and learner characteristics.

**Note on scope.** The v1 handbook covered *narrative, role-play, collaboration, systems thinking, simulation fidelity* in one session. This revision keeps the first three as core and moves systems thinking and simulation fidelity to an optional Session 8 extension for teams whose projects use simulation mechanics (most teams will not need this content).

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on feedback specs | Consolidate |
| 0:15–0:55 | Concept input: narrative as amplifier; role as constraint; collaboration vs. competition | Core content |
| 0:55–1:10 | Transition and break | — |
| 1:10–1:50 | Workshop: name the role the learner takes in the game and what that role constrains | Apply |
| 1:50–2:25 | Workshop: choose collaboration / competition / solo structure, with justification | Apply |
| 2:25–2:40 | Peer exchange | Surface blind spots |

**Artifacts produced.** Role definition. Collaboration/competition structure statement with justification — this statement is appended to the crosswalk and counts as part of D2's evidence pack.

**Assessment link.** D2 due at end of week 5.

---

### Session 6 — Facilitator design

**Session-level outcomes.** Learners produce a facilitator guide for their design: pre-brief, in-play moves, debrief, and risk mitigation. A colleague not on the design team could run the experience from this guide.

**Why this session matters.** Evidence across game-based learning studies repeatedly points to implementation conditions, teacher facilitation, and curriculum support as important moderators of classroom use and learning. This session makes those conditions explicit; it does not claim that facilitation alone determines outcomes.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on crosswalks (D2) | Consolidate |
| 0:15–1:00 | Concept input + case: two facilitator guides compared, one weak, one strong | Core content |
| 1:00–1:15 | Transition and break | — |
| 1:15–2:00 | Workshop: write the pre-brief (what the facilitator says before play) and debrief (what questions the facilitator asks after) | Apply |
| 2:00–2:30 | Workshop: risk mitigation — what does the facilitator do if the technology fails, if a learner dominates, if a learner disengages, if a learner is upset by the content | Apply |
| 2:30–2:40 | Exit ticket | Reflection |

**Artifacts produced.** Facilitator guide v1: pre-brief script, debrief questions, risk-mitigation table.

**Assessment link.** Feeds D3 — the facilitator guide is scored inside D3's *Facilitator guide completeness* criterion (§12.3) — and informs the facilitator-enactment segment of the Session 12 presentation.

---

### Session 7 — Low-fidelity prototyping

**Session-level outcomes.** Learners produce a low-fidelity prototype that exercises the core loop at least once end-to-end.

**Note on scope.** The v1 handbook confused the boundary between Sessions 7 and 8. This revision makes the distinction explicit. Session 7 produces a prototype that can be peer-tested at the table in under five minutes: paper cards, flow on a whiteboard, clickable wireframe with placeholder assets. Session 8 produces a spec, not a new prototype.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on facilitator guides | Consolidate |
| 0:15–0:45 | Concept input + demos: paper, flow, clickable wire; the "minimum loop" heuristic | Core content |
| 0:45–1:00 | Transition and break | — |
| 1:00–2:00 | Build studio: the team builds a playable-at-table prototype | Apply |
| 2:00–2:30 | Peer table-test rounds (two five-minute plays, two five-minute debriefs) | First feedback |
| 2:30–2:40 | Revision plan: what the team will change before Session 8 | Plan |

**Artifacts produced.** Low-fidelity (paper) prototype. Revision plan one page.

**Assessment link.** This session produces the core of **D3 — Paper Prototype + Facilitator Guide** (due end of week 8). D3 combines this session's prototype and iteration log with the Session 6 facilitator guide (§12.3).

---

### Session 8 — Interaction specification and build-readiness

**Session-level outcomes.** Learners convert the revised low-fidelity prototype into an interaction specification with a state machine, event-feedback mapping, and the Three.js bridge document (§8).

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on Session 7 revision plans | Consolidate |
| 0:15–0:50 | Concept input: interaction flow, state transitions, event-feedback mapping, the bridge document (§8) | Core content |
| 0:50–1:05 | Transition and break | — |
| 1:05–2:00 | Workshop: state machine on whiteboard or digital canvas, for the full minimum loop | Apply |
| 2:00–2:30 | Workshop: event-feedback matrix and bridge-document draft | Apply |
| 2:30–2:40 | Exit ticket | Reflection |

**Optional extension (post-session, asynchronous, for simulation-heavy teams only).** Session 5 deferred *systems thinking and simulation fidelity* content; teams whose projects use simulation mechanics complete a 60-minute asynchronous module on modeling decisions: what to simulate, at what fidelity, and what to abstract.

**Artifacts produced.** State machine, event-feedback matrix, Three.js bridge document. These three become the core of **D5 — Implementation Spec** (due week 12, at presentation), which absorbs and cites D1–D4.

**Assessment link.** Inputs to D5 (§12.5). Separately, D3 — Paper Prototype + Facilitator Guide — is due at the end of week 8.

---

### Session 9 — Playtest design

**Session-level outcomes.** Learners design a playtest with at least three target learners, distinguishing usability data from learning-evidence data, and produce a runnable protocol.

**Why this session precedes the playtest window.** The course's asynchronous week 10 (Section 11) is the external playtest window. Session 9 is where the protocol is made runnable before that window begins.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on D3 status | Consolidate |
| 0:15–0:55 | Concept input: usability vs. learnability; observation protocols; think-aloud; target-learner recruitment; ethics and consent | Core content |
| 0:55–1:10 | Transition and break | — |
| 1:10–1:50 | Workshop: draft the playtest protocol — who, when, where, how long, what you observe, what you ask | Apply |
| 1:50–2:25 | Dry run with a peer team acting as naive users; revise protocol on the basis of what broke in the dry run | Apply |
| 2:25–2:40 | Playtest-recruitment plan confirmation | Commit |

**Artifacts produced.** Playtest protocol ready to run in week 10. Observation sheet. Consent text.

**Assessment link.** Inputs to D4.

---

### Session 10 — Audit: reward, cognitive load, accessibility, ethics, data

**Session-level outcomes.** Learners audit their design against four hazards: reward substitution, extraneous cognitive load, accessibility failures, and data-ethics failures. Learners revise the design in at least one of these four dimensions.

**Note on scope.** This session absorbs the *reward* content deferred from Session 4 (because reward problems are hazards, not features to be added) and integrates it with accessibility and ethics.

**Effective time plan (160 min).**

| Time | Activity | Purpose |
|---|---|---|
| 0:00–0:15 | Return on playtest window; first pass on observations | Consolidate |
| 0:15–1:00 | Concept input + cases: four hazard types with real examples | Core content |
| 1:00–1:15 | Transition and break | — |
| 1:15–2:00 | Workshop: team audits own design against each of the four using the provided checklist | Apply |
| 2:00–2:30 | Workshop: prioritize findings; name the two most important revisions | Decide |
| 2:30–2:40 | Exit ticket | Reflection |

**Artifacts produced.** Hazard audit sheet. Prioritized revision list.

**Assessment link.** Feeds D4 and D5.

---

### Session 11 — Revision studio

**Session-level outcomes.** Learners complete revisions on the basis of playtest observations and hazard audit.

**Effective time plan (160 min).** This session is deliberately unstructured. The standard template is suspended. Teams work on their revisions; instructors rotate for short clinic conversations. A 15-minute midpoint check-in and a 10-minute closing status check are the only scheduled interruptions.

**Artifacts produced.** Revised crosswalk, revised prototype, revised facilitator guide. The revisions this session executes come from the D4 revision backlog and feed directly into D5's spec decisions and Known Limits annex.

**Assessment link.** D4 was due at the end of week 10, at the close of the playtest window; Session 11's revisions feed D5 (due week 12).

---

### Session 12 — Final presentations and credential review

**Session-level outcomes.** Learners present their designs against a standard nine-point frame and respond to one instructor question and two peer questions.

**Presentation frame.** Each team has 12 minutes plus 6 minutes of question time. The frame is:

1. The educational problem, in one sentence
2. Learner and context, in one minute
3. The three top learning objectives with type labels
4. The chosen mechanics and the rejected mechanic
5. The minimum loop, demonstrated
6. What the playtest revealed
7. What changed as a result
8. Facilitator enactment plan — how a classroom teacher uses this tomorrow
9. The next step toward implementation

**Effective time plan (160 min).** For a cohort of 6 teams:

| Time | Activity |
|---|---|
| 0:00–0:15 | Credential review standards briefing |
| 0:15–2:10 | Presentations: 6 × (12 min present + 6 min questions + 1 min reset) |
| 2:10–2:30 | Cross-team peer assessment writing |
| 2:30–2:40 | Closing reflection writing (advisory — see note below) |

For cohorts larger than 6 teams, Session 12 is extended or split across two blocks; see Section 16.1 for cohort-size operational guidance.

**Presentation and reflection guidance (advisory, not scored).** The scored artifact of this session is D5 — Implementation Spec (§12.5). The presentation itself and the closing written reflection are not among the 25 scored criteria, but both remain required session activities because they reliably improve the D5 that is scored. Presentations should be clear, evidence-anchored, and responsive to questions; the strongest ones name specific design decisions that were wrong or uncertain, explain how they were revised, and say what the team would still change with more time. That same material belongs in D5's *Coherence with D1–D4* citations and *Known Limits* annex — the reflection is the cheapest way to draft it. A design a teacher outside the team could run tomorrow (facilitator usability) is the standard the facilitator-enactment segment of the presentation should be held to.

**Artifacts produced.** D5 — Implementation Spec, submitted at presentation.

---

## 11. Week-by-week timeline

The v1 handbook did not show how asynchronous work was distributed across the 12 weeks and did not reserve a playtest window. This section supplies both for the standard 12-session tier.

| Week | Synchronous (180-min block) | Asynchronous work due | Notes |
|---|---|---|---|
| 1 | Session 1 | Project candidate statement | — |
| 2 | Session 2 | **D1 due end of week 2** | First deliverable gate |
| 3 | Session 3 | Crosswalk applied to top 3 objectives | — |
| 4 | Session 4 | Feedback + failure specifications | — |
| 5 | Session 5 | **D2 due end of week 5** | Second deliverable gate |
| 6 | Session 6 | Facilitator guide v1 | — |
| 7 | Session 7 | Revision plan for low-fi prototype | — |
| 8 | Session 8 | **D3 due end of week 8** | Third deliverable gate |
| 9 | Session 9 | Playtest protocol finalized, recruitment confirmed | — |
| 10 | **No synchronous session — external playtest window** | Playtest conducted with at least 3 target learners; **D4 due end of week 10** | Fourth deliverable gate; mandatory window |
| 11 | Session 10 + Session 11 back-to-back (6 hours, one day) OR Session 10 (week 11a) + Session 11 (week 11b) | Audit sheet; revisions drafted | Two scheduling variants |
| 12 | Session 12 | **D5 due at presentation** | Credential review |

**Variants.**

- *Accelerated (10 weeks).* Compress weeks 7 and 8, merging the low-fi prototype and interaction spec work into a single fuller session; keep the week-10 playtest window inviolate.
- *Extended (14 weeks for the 5-ECTS tier).* Insert an additional studio week between weeks 8 and 9 for build-readiness work, and a second playtest window for iteration two.
- *Compressed 8-session tier.* See §14.

---

## 12. Per-deliverable rubrics

These rubrics replace the single shared rubric in the v1 handbook. Each deliverable is judged against **five criteria** — 25 criteria across the portfolio — at four performance levels: **Emerging, Developing, Proficient, Exemplary**. The full rubric text below is identical to the platform's rubric viewer (rubrics.html), which is the canonical published version.

**How the levels work (all rubrics).** The levels are not grades and are never converted to points or percentages. **Proficient is the credential floor on every criterion.** Criterion scores are not averaged within or across deliverables, and no criterion compensates for another: Exemplary on four rows cannot rescue a Developing on the fifth. An artifact scored below Proficient on any criterion returns to the learner with one revision path and a clear resubmission deadline; a revision that reaches Proficient earns the credit, and the original is not averaged in. Exemplary is recognized but never required.

**AI-use disclosure (submission completeness, not a scored criterion).** A complete GenAI Provenance Log (provenance.html) — every substantive AI interaction logged with an AIAS level — is a submission-completeness requirement for every deliverable. Submissions without it are returned for completion before scoring (not scored lower). A future cohort may promote disclosure to scored criteria; the current 25-criterion gate is unchanged.

### 12.1 Deliverable 1 — Design Problem Statement (5 criteria)

A one-page statement of learner, context, constraint, and the measurable shift the design intends to produce. Everything downstream cites D1.

| Criterion | Emerging | Developing | Proficient (floor) | Exemplary |
|---|---|---|---|---|
| Learner specificity — named, not "students" | "Students" or a whole course; no differentiation | A population (e.g., "first-year residents") with one trait | A named population with role, prior knowledge, and at least one motivational condition | Proficient plus named variation within the population that changes design decisions |
| Context constraints — observable, not inferred | No constraints named, or only generic ones ("busy," "limited time") | Two constraints named but without source or observable trigger | Three or more context constraints, each observable and each one that will force a design decision | Proficient plus the constraint most likely to be violated by a naive design, flagged |
| Measurable shift — verb, baseline, target | Outcome is a feeling or attitude with no measurement path | Observable verb, but baseline or target is missing | Observable verb, stated baseline, stated target, and a realistic window for the shift | Proficient plus the discrimination this shift tests (performance ≠ understanding) |
| Evidence of the problem — why now, not invented | No evidence; the problem is assumed | Anecdote or one secondary source; could be generalized | At least one primary-source data point (observation, artifact, interview) that the problem exists in this context | Proficient plus a disconfirming check — what would make this not the problem? |
| Revision response — log + rationale | No revision log, or cosmetic edits only | One revision with what changed but not why | One revision based on specific peer feedback; what changed and why, in ≤3 sentences | Proficient plus one piece of feedback the author chose not to apply and the reason |

*Evidence required.* The one-page D1 artifact, the tracked-changes version from the Session 02 workshop, and one peer-review comment quoted in the change log. The Session 02 persona sheet and constraint map travel with D1 as its evidence pack.

*Advisory (not scored in D1).* Ethical and access risks — data handling, accessibility, power dynamics — are introduced in Session 2 and belong in the D1 evidence pack as working notes. They are audited explicitly in Session 10 and scored where they bite: consent inside D4's *Protocol design* criterion, and accessibility inside D5's device-floor and fallback specifications.

### 12.2 Deliverable 2 — Objective × Mechanic Crosswalk (5 criteria)

Two to four objectives mapped to mechanics with rationale, risks, and a declined alternative. D2 is the spine of the design — every session from S4 onward cites it.

| Criterion | Emerging | Developing | Proficient (floor) | Exemplary |
|---|---|---|---|---|
| Objective specificity — verb, condition, criterion | Objectives are topics, not behaviors ("fractions," "triage") | Observable verbs but no condition or criterion | Every objective has verb + condition + success criterion; types are named (skill / concept / judgment / disposition) | Proficient plus objectives tagged to Bloom or equivalent taxonomy with justification for the tag |
| Mechanic rationale — why this, not another | Mechanic named without rationale; "it will be fun" | Rationale is generic (e.g., "engaging") without link to the objective type | Each row explains why this mechanic fits this objective type and this learner context | Proficient plus a citation to a worked case (Casebook handout or external) supporting the choice |
| Risk identification — named, specific | No risks, or "might not work" | Generic risks (too hard, too long) | Each row names at least one risk specific to the mechanic–objective pair and how it would show up in play | Proficient plus the leading indicator that would tell you the risk is materializing during playtest |
| Declined alternative — the honesty column | No declined row | A declined row exists but reads as a straw man | At least one objective the author was tempted to include, named, with a one-sentence reason for exclusion | Proficient plus the condition under which the declined row would re-enter scope |
| Traceability to D1 — constraint-linked | D2 does not reference D1 | One row references a D1 element | Every row cites at least one specific D1 context constraint that shaped the mechanic choice | Proficient plus a row where a D1 constraint forced the author to reject their first mechanic choice |

*Evidence required.* The crosswalk table (markdown or .csv), version-stamped in the repo. The Session 5 collaboration-structure appendix counts as part of D2.

*Advisory (not scored in D2).* The design work that surrounds the crosswalk still happens and still matters: the Session 4 feedback and failure-state specifications, and the Session 5 role / collaboration / narrative choices, travel as D2 appendices. They are scored where they become load-bearing — the facilitator guide inside D3, and the event → feedback map inside D5. Feedback specified by event, modality, and delay, with a pedagogically productive failure state, remains the standard those appendices should meet.

### 12.3 Deliverable 3 — Paper Prototype + Facilitator Guide (5 criteria)

A paper prototype playable at the table in five minutes, plus the facilitator guide that lets a colleague run it without you. Playability is the rubric bar.

| Criterion | Emerging | Developing | Proficient (floor) | Exemplary |
|---|---|---|---|---|
| Playability — colleague-run, 5 min to loop | Author must explain to start; loop not reached | Runs with author present; stalls on one rule | A colleague picks it up from the guide and reaches the full loop within 5 minutes, no author present | Proficient plus two independent runners reach consistent decisions on the same scenario |
| Loop fidelity — matches the D2 row | Prototype demonstrates a different mechanic than D2 | Core mechanic present but the feedback channel differs from D2 | Prototype implements the mechanic, feedback kind, and one risk case named in the chosen D2 row | Proficient plus the prototype reveals a D2 assumption the author did not know they were making |
| Facilitator guide completeness — setup · rules · edges · debrief | No guide, or rules only | Setup + rules; no edge cases or debrief prompts | Setup, rules, at least three edge cases with resolutions, and three debrief prompts targeting the learning objective | Proficient plus a facilitator calibration note — the one rule runners disagree on and how to hold the line |
| Artifact quality — no placeholder play | Cards/boards have "TBD" or lorem text in play area | Real content but inconsistent (one theme, many voices) | All play-area text is real content at final voice; art placeholders clearly marked and do not block play | Proficient plus content audited for accuracy by a domain expert or a cited source |
| Iteration log — 3+ cycles | No log; one pass only | Two cycles logged; changes not tied to observations | Three or more cycles; each entry names what was observed, what changed, and what the next test will check | Proficient plus one cycle where the author reverted a change after evidence against it |

*Evidence required.* Photographs of the prototype, a PDF of the facilitator guide, the iteration log, and one 2-minute video of a non-author running the loop.

*Advisory (not scored beyond the criterion).* The facilitator guide criterion operationalizes the course's strongest research finding (§3.1, principle 3): a teacher not on the design team should be able to run this tomorrow. Hold the guide to that standard, not just to the four-part completeness checklist.

### 12.4 Deliverable 4 — Playtest Report (5 criteria)

Protocol, three or more target-learner sessions, observations separated from interpretation, and an evidence-ranked revision plan. Not peers. Target learners.

| Criterion | Emerging | Developing | Proficient (floor) | Exemplary |
|---|---|---|---|---|
| Protocol design — target learners, consent | Peers playtested; no protocol document | Mix of peers and target learners; protocol thin | Three or more target-learner sessions; written protocol with consent language, task brief, capture method, and debrief script | Proficient plus the protocol evolved between sessions and the change is documented |
| Evidence base — capture + traceability | Notes from memory; no raw capture | One capture mode (notes only, or video only) | At least two capture modes (e.g., observation notes + artifacts + recording); every finding traceable to a specific capture moment | Proficient plus structured event logging against the S10 taxonomy |
| Observation vs. interpretation — separated, labeled | Observations and interpretations mixed; no labels | Labels present but inconsistent; interpretations imported as observations | Every finding is written as an observation first (what was seen/heard), then one interpretation, with the boundary visible on the page | Proficient plus at least one observation the author cannot yet interpret — flagged as open |
| Finding taxonomy — severity × domain | Findings as a flat list; no severity or domain | One dimension (severity or domain), not both | Every finding tagged with severity (stopper / major / minor) and domain (mechanic / UX / content / ethics / tech) | Proficient plus inter-rater check — a peer tagged a sample of findings and disagreements are discussed |
| Revision plan — impact × effort, cut line | "Fix everything" or no plan | Ranked list; no explicit cut line; effort not estimated | Backlog with impact (1–5) and effort (1–5) per item, a drawn cut line for S11, and a one-sentence reason for each decline | Proficient plus the item the author most wanted to do but cut, and the condition that would bring it above the line |

*Evidence required.* Protocol PDF, consent records (scrubbed), raw capture (notes and/or recording links), tagged findings table, and the ranked backlog. Consent, data retention, and de-identification documentation lives inside the protocol and its data appendix — thin ethics handling blocks Proficient on *Protocol design*.

### 12.5 Deliverable 5 — Implementation Spec (5 criteria)

State machine, event map, asset list, and a Three.js bridge for one hero scene. D5 is what a developer could build from. It absorbs D1–D4 into a single implementation artifact.

| Criterion | Emerging | Developing | Proficient (floor) | Exemplary |
|---|---|---|---|---|
| State machine — one page, fully guarded | Prose description; no diagram | Diagram exists; states or transitions unguarded | Single-page diagram; every state has entry and exit; every transition has event + guard; two designers reading it produce the same mental model | Proficient plus a runnable reference (Codex-generated state-machine runtime) passing the included assertions |
| Event → feedback map — every cell specified | Prose; no table | Table exists; >20% of cells blank | All cells filled or marked "none" intentionally; events tagged with reward_kind against the S4 taxonomy | Proficient plus a gap audit (Codex lint or manual) showing zero silent cells |
| Three.js bridge — scene purpose, graph, budget | 3D gestured at; no spec | Scene graph present; no camera, input, or perf budget | One hero scene fully specified: purpose, graph, camera, input, entry/exit, assets with budgets, and a named 2D fallback condition | Proficient plus a scaffold produced from the spec with the bridge handout's prompt, running on a device-floor target |
| Coherence with D1–D4 — cited, not restated | D5 reads as if D1–D4 do not exist | Prior deliverables cited once or twice | Every major spec decision cites the D1 constraint, D2 row, D3 iteration, or D4 finding that forced it; divergences are called out | Proficient plus a "changed my mind" annex — one D2 decision the author reversed between D3 and D5 and why |
| Known limits — above-the-line honesty | No limits section, or "no known issues" | Limits list is generic ("needs more testing") | A "Known Limits" annex drawn from the S11 backlog items above the line; each with the condition under which it would be resolved | Proficient plus a limit the author considers disqualifying for a next audience the game should not yet be used with |

*Evidence required.* The spec document (PDF or web), state-machine diagram file, event map table, Three.js bridge document, and links to any Codex scaffolds produced from the spec.

*Advisory (not scored beyond the criteria).* D5 is a compound artifact that carries its history visibly — learners who treat it as a fresh start reliably miss the *Coherence with D1–D4* floor. The Session 12 written reflection and presentation (see Session 12 guidance) are the working method for producing honest *Coherence* citations and a credible *Known Limits* annex.

### 12.6 Reviewer calibration

Before assessing learner work, reviewers (instructor and any co-assessors) calibrate on two past exemplars — one strong, one weak — for each deliverable type. Where more than one reviewer scores a deliverable, any criterion on which the reviewers differ by two or more levels — or on which they disagree about whether the Proficient floor is reached — is discussed and resolved before the final score is recorded. The v1 handbook did not have this step and its rubric did not require it; the revised rubric does.

---

# PART 4 — ASSESSMENT AND OPERATIONS

---

## 13. Grading and credential award

### 13.1 The pass bar

There are no deliverable weights and no course percentage. The credential is awarded when the submitted D1–D5 portfolio reaches **Proficient or better on all 25 rubric criteria** (§12) under instructor review. Every criterion is a floor; every floor is required. Criterion levels are never averaged, and no criterion compensates for another — an Exemplary on D4 does not cover a Developing on D2.

Participation and peer-feedback quality are not separately scored. Peer feedback is a required input to revision; its quality surfaces in the criteria that depend on it (D1 *Revision response*, D3 *Iteration log*, D4 *Revision plan*).

### 13.2 Conditions that are not scored criteria

Three requirements sit outside the 25-criterion rubric:

- **Session completion.** Completing all 12 sessions is a prerequisite to submit the portfolio. It makes the learner eligible for scoring; it is not itself a credential criterion.
- **GenAI Provenance Log.** A complete Provenance Log is a submission-completeness requirement for every deliverable (§7.3, §12). Submissions without it are returned for completion before scoring — not scored lower.
- **Post-program survey.** Completing the post-program survey is a claim-time condition on releasing the credential.

The D4 target-learner requirement (three or more target-learner sessions, or an approved §15.3 alternative) is enforced *inside* the rubric, through the D4 *Protocol design* criterion.

### 13.3 Revision and resubmission

Any artifact scored below Proficient on one or more criteria returns to the learner with the reviewer's written comments, one revision path, and a clear resubmission deadline. Resubmission is available once per deliverable within the course window; a revision that reaches Proficient on every criterion earns the credit, and the original score is not averaged in. A learner whose portfolio still misses the floor after the available resubmissions is not awarded the credential on that run and may re-enroll.

---

## 14. The 8-session compressed tier

The compressed tier is for professional-development contexts that cannot commit to 12 sessions. It preserves all five required activities but reduces depth.

### 14.1 What must be preserved

All five deliverables are still required. The external playtest window is still inviolate. The crosswalk (§5) is still the central design instrument.

### 14.2 What is cut, and what that cut costs

| Cut | What it costs |
|---|---|
| Session 5 core content on narrative/role/collaboration is folded into an asynchronous reading | Learners make less-informed choices on non-mechanic design elements |
| Session 10 audit is shortened from full session to 60 asynchronous minutes plus 30 synchronous | Hazard audit relies more on learner self-discipline; instructor sees the audit only in D4 |
| Session 11 revision studio is replaced by a one-week asynchronous revision period | Less in-class coaching during the revision push; learners who fall behind this week generally miss the credential |
| Session 8 Three.js bridge content is shortened | Bridge documents are thinner; suitable if no implementation phase is planned |

### 14.3 Session-to-session mapping (revised)

This mapping replaces the v1 mapping, which was unrealistic about what survives compression.

| Standard session | Compressed session | What actually moves |
|---|---|---|
| 1 | 1 (full) | Framing preserved |
| 2 | 2 (full) | Analysis preserved |
| 3 | 3 (full) | Crosswalk preserved |
| 4 | 4 (shortened by ~40 min) | Feedback and failure content preserved; reward content dropped to async reading |
| 5 | Async only | Narrative/role/collab content becomes 90-min async module |
| 6 | 5 (full) | Facilitator design preserved — this is the session most likely to get cut under time pressure, and must not be |
| 7 | 6 (full) | Low-fi prototyping preserved |
| 8 | 6 extension + async | State machine drafted at end of session; event-feedback matrix as homework |
| 9 | 7 (full) | Playtest design preserved |
| 10 | Async + synch closing of Session 8 | Hazard audit shortened |
| 11 | Async | Revision in async week |
| 12 | 8 (full) | Final presentation preserved |

---

## 15. Operating the course

### 15.1 Instructor workload estimates

The v1 handbook did not estimate instructor workload. This omission is operationally significant: institutions budgeting for this credential need a defensible number. The estimates below assume a single primary instructor, standard tier, and the per-deliverable rubrics in §12.

**Per-cohort, per-deliverable assessment time (median, hours):**

| Deliverable | Length of typical artifact | Time per submission |
|---|---|---:|
| D1 — Design Problem Statement | 1 page + evidence pack | 0.5 h |
| D2 — Objective × Mechanic Crosswalk | Crosswalk table + appendices | 1.0 h |
| D3 — Paper Prototype + Facilitator Guide | Photos + guide PDF + iteration log + run video | 1.0 h |
| D4 — Playtest Report + recording | 5–8 pages with appendices | 0.5 h |
| D5 — Implementation Spec | Spec + diagrams + bridge document + presentation | 1.0 h |
| **Per-learner-or-team total** | — | **4.0 h** |

**Total instructor assessment time by cohort configuration:**

| Cohort | Teaming | Units to assess | Assessment hours | Teaching hours (12 × 180-min scheduled blocks = 36 h; 32 h effective) | Prep + office hours | Estimated total |
|---|---|---:|---:|---:|---:|---:|
| 10 learners | Individual | 10 | 40 | 36 | 24 | **≈ 100 h** |
| 20 learners | Pairs (10 units) | 10 | 40 | 36 | 24 | **≈ 100 h** |
| 30 learners | Triads (10 units) | 10 | 40 | 36 | 30 | **≈ 106 h** |
| 30 learners | Pairs (15 units) | 15 | 60 | 36 | 30 | **≈ 126 h** |
| 40 learners | Quads (10 units) | 10 | 40 | 36 | 36 | **≈ 112 h** |

### 15.2 Cohort-size operational guidance

The v1 handbook's rule of thumb ("≤15 individual, 16–30 teams") is retained with two additions:

- Above 24 learners, one teaching assistant or co-assessor is required for calibrated assessment (§12.6).
- Above 30 learners, Session 12 (final presentations) is split across two blocks; six teams per block is the ceiling for useful question time.

### 15.3 Playtest access — alternatives for learners without classroom or training-site access

Not every learner on this course has a standing group of target learners to test with. The playtest requirement (D4) is non-negotiable, but the arrangements are flexible. Approved alternatives include:

1. **Partner arrangement.** Pair with a learner who does have access; each pair of learners playtests both designs with one group. This is the most common arrangement.
2. **Institutional partnership.** Course-provided partnerships with local schools, libraries, museums, or community education programs, negotiated by the program coordinator at the start of the cohort.
3. **Remote playtest.** Synchronous remote playtests are acceptable when target learners cannot meet in person. Recording consent and observation protocol adaptations are required.
4. **Target-adjacent substitute.** For learners whose target audience is a restricted population (for example, a specific clinical group), a target-adjacent substitute — people similar in role and prior knowledge, not in diagnosis — is acceptable with prior instructor approval. This must be declared in the playtest plan and discussed in D4's reflection.

A peer-only playtest is *not* an approved alternative and does not reach Proficient on D4's *Protocol design* criterion.

### 15.4 Delivery modes

The course runs in-person, hybrid, or fully online. The 160-minute effective-time budget and the week-10 playtest window apply to all modes. The fully online mode substitutes a shared digital canvas (Miro, FigJam, Figma, or equivalent) for physical paper in Sessions 7 and 8; all other activities translate without modification.

---

## 16. Instructor guide

### 16.1 Instructor competencies expected

- Practical experience in instructional design or a related discipline.
- Familiarity with at least three educational games and ability to conduct a structured case analysis.
- Facilitation skills adequate for adult-learner studio formats.
- Ability to coach low-fidelity prototyping.
- Willingness to defer aesthetic judgments in favor of objective-mechanic alignment.

### 16.2 The six most common instructor failures, and their remedies

1. **Letting teams start building before Session 3 is complete.** Remedy: enforce a no-build rule until the crosswalk has been applied for at least three objectives.
2. **Praising engagement without checking learning.** Remedy: every time a team shows an engaging prototype, ask the mechanic-to-objective question before anything else.
3. **Neglecting facilitator design.** Remedy: never allow D3 to be accepted without a facilitator guide, even a weak one, so the iteration conversation exists — the guide is a scored D3 criterion (§12.3).
4. **Allowing a peer-only playtest.** Remedy: the playtest window is the week-10 instructional expectation; target-learner access is checked in Session 9 recruitment confirmation.
5. **Grading for aesthetic completeness rather than rubric criteria.** Remedy: use the per-deliverable rubrics (§12) and the calibration step (§12.6).
6. **Under-investing in the revision studio (Session 11).** Remedy: treat Session 11 as the highest-value coaching session of the course and plan rotation schedule accordingly.

### 16.3 Instructor moves that reliably produce better work

- "Show me the minimum loop playing out, not the interface."
- "Which objective is this mechanic serving, and which row of the crosswalk justifies it?"
- "What would the facilitator say in the sixty seconds before play begins?"
- "Which of your playtest observations contradicts a design decision you made two weeks ago?"
- "What is the thing you wish you had more time to fix? Write that into the reflection."

---

## 17. Templates

### 17.1 Common session closing template

Every session closes with a two-minute written exit ticket. Three prompts rotate:

- "What is the design decision you are now most uncertain about?"
- "Where is the objective–mechanic tension in your current design?"
- "What is the smallest assumption you need to test before next session?"

Exit tickets are not graded. They are read by the instructor before the next session and inform the opening of that session.

### 17.2 D1 template (Design Problem Statement)

1. Problem statement — one page: learner, context, constraint, measurable shift (verb + baseline + target + window), and the evidence the problem exists. This page is the scored artifact.
2. Persona — one page (evidence pack).
3. Constraint map — time, equipment, setting, facilitator, prior knowledge, one row each (evidence pack).
4. Revision log — the tracked-changes workshop version plus one quoted peer-review comment, with what changed and why.
5. Ethical and access risk notes (advisory working notes; audited in Session 10, scored later via D4 and D5).
6. Provenance Log entries tagged D1 — completeness requirement for submission.

### 17.3 D2 template (Objective × Mechanic Crosswalk)

1. Project title and one-sentence problem restatement.
2. The crosswalk table — two to four objectives, one row each: objective (verb + condition + criterion, typed per §5.1), primary mechanic with rationale against the crosswalk row (§5.2–5.3), amplifying mechanics, at least one named risk per row, and a D1 constraint citation per row.
3. The declined alternative — at least one objective you were tempted to include, with the one-sentence reason for exclusion.
4. Appendices (advisory, travel with D2): feedback and failure specification (Session 4); role, collaboration/competition, and narrative statement (Session 5 — this appendix counts as part of D2).
5. Provenance Log entries tagged D2 — completeness requirement for submission.

### 17.4 D3 template (Paper Prototype + Facilitator Guide)

1. Paper prototype — playable at the table in five minutes; photographs submitted.
2. Minimum-loop description — what happens in one play, step by step, and which D2 row it implements.
3. Facilitator guide — setup, rules, at least three edge cases with resolutions, three debrief prompts targeting the learning objective, plus pre-brief and risk-mitigation material from Session 6.
4. Iteration log — three or more cycles: observed, changed, next check.
5. Run video — one 2-minute video of a non-author running the loop.
6. Provenance Log entries tagged D3 — completeness requirement for submission.

### 17.5 D4 template (Playtest Report)

1. Playtest goals — what was being learned about the design.
2. Participant description (de-identified).
3. Protocol as run, with consent language, task brief, capture method, debrief script, and any deviations from the Session 9 plan.
4. Observations — written as observations first, each with one labeled interpretation; the boundary visible on the page.
5. Findings table — every finding tagged with severity (stopper / major / minor) and domain (mechanic / UX / content / ethics / tech), traceable to a capture moment.
6. Revision backlog — impact (1–5) × effort (1–5) per item, a drawn cut line for Session 11, and a one-sentence reason for each decline.
7. Data and ethics appendix (consent, retention, de-identification).
8. Provenance Log entries tagged D4 — completeness requirement for submission.

### 17.6 D5 template (Implementation Spec)

1. Executive summary — one page.
2. State-machine diagram — single page, every state with entry/exit, every transition with event + guard.
3. Event → feedback matrix — all cells filled or intentionally marked "none", tagged with reward_kind (S4 taxonomy).
4. Three.js bridge document (eight sections per §8.1) — one hero scene with purpose, graph, camera, input, entry/exit, asset budgets, and a 2D fallback condition.
5. Coherence citations — every major spec decision cites the D1 constraint, D2 row, D3 iteration, or D4 finding that forced it; divergences called out.
6. Known Limits annex — drawn from the Session 11 backlog items above the line, each with its resolution condition.
7. Reflective statement (advisory annex, not scored) — what the team got right, got wrong, would change with more time, and learned; the raw material for items 5 and 6 and for the Session 12 presentation.
8. Provenance Log entries consolidated across D1–D5 — completeness requirement for submission.

---

## 18. Credential structure and badges

### 18.1 Single-badge form

One badge, titled *Educational Game Design Practitioner*, awarded on satisfaction of all credential-award requirements (§4.3 and §13.2). This is the default form.

### 18.2 Stackable form (optional institutional configuration)

Where the hosting institution wishes to signal intermediate progress, the credential may be decomposed into four stackable badges, each tied to a subset of deliverables:

| Stackable badge | Requires |
|---|---|
| Game-Based Learning Foundations | D1 at Proficient or above on all five criteria |
| Educational Mechanics and Prototyping | D2 and D3 at Proficient or above on all criteria |
| Playtesting and Facilitation | D4 at Proficient or above on all criteria (the facilitator guide is already covered by D3's *Facilitator guide completeness* criterion) |
| Educational Game Design Capstone | D5 at Proficient or above on all five criteria |

Awarding all four produces the full credential. The stackable form is not the default because it can encourage learners to treat deliverables as separable when the course's design treats them as a coupled sequence.

---

## 19. References

These are the sources that either (a) ground a claim in Parts 1–2 or (b) are used as case material in Part 3. Cited in-text where relevant.

1. Ahsan, K., Akbar, S., Kam, B., & Abdulrahman, M. D.-A. (2023). Implementation of micro-credentials in higher education: A systematic literature review. *Education and Information Technologies, 28*(10), 13505–13540. https://doi.org/10.1007/s10639-023-11739-z

2. Alaswad, Z., & Nadolny, L. (2015). Designing for game-based learning: The effective integration of technology to support learning. *Journal of Educational Technology Systems, 43*(4), 389–402. https://doi.org/10.1177/0047239515588164

3. Annetta, L. A. (2010). The "I's" have it: A framework for serious educational game design. *Review of General Psychology, 14*(2), 105–112. https://doi.org/10.1037/a0018985

4. Arnab, S., Lim, T., Carvalho, M. B., Bellotti, F., de Freitas, S., Louchart, S., Suttie, N., Berta, R., & De Gloria, A. (2015). Mapping learning and game mechanics for serious games analysis. *British Journal of Educational Technology, 46*(2), 391–411. https://doi.org/10.1111/bjet.12113

5. Bunt, L., Greeff, J., & Taylor, E. (2024). Enhancing serious game design: Expert-reviewed, stakeholder-centered framework. *JMIR Serious Games, 12*, e48099. https://doi.org/10.2196/48099

6. Council of the European Union. (2022). *Council Recommendation of 16 June 2022 on a European approach to micro-credentials for lifelong learning and employability* (2022/C 243/02). Official Journal of the European Union. https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=uriserv:OJ.C_.2022.243.01.0010.01.ENG

7. European Education Area. (current as of 2026). A European approach to micro-credentials. https://education.ec.europa.eu/education-levels/higher-education/micro-credentials

8. European Education Area. (current as of 2026). European Credit Transfer and Accumulation System (ECTS). https://education.ec.europa.eu/education-levels/higher-education/inclusive-and-connected-higher-education/european-credit-transfer-and-accumulation-system

9. European Network for Quality Assurance in Higher Education (ENQA). (2023). *Quality assurance of micro-credentials: Expectations within the context of the Standards and Guidelines for Quality Assurance in the European Higher Education Area.* ENQA. https://www.enqa.eu/wp-content/uploads/ENQA-micro-credentials-report.pdf

10. Jong, M. S. Y., Dong, A., & Luk, E. (2017). Design-based research on teacher facilitation practices for serious gaming in formal schooling. *Research and Practice in Technology Enhanced Learning, 12*, Article 19. https://doi.org/10.1186/s41039-017-0056-6

11. Lu, Z., Chiu, M. M., Cui, Y., Mao, W., & Lei, H. (2023). Effects of game-based learning on students' computational thinking: A meta-analysis. *Journal of Educational Computing Research, 61*(1), 235–256. https://doi.org/10.1177/07356331221100740

12. Mao, W., Cui, Y., Chiu, M. M., & Lei, H. (2022). Effects of game-based learning on students' critical thinking: A meta-analysis. *Journal of Educational Computing Research, 59*(8), 1682–1708. https://doi.org/10.1177/07356331211007098

13. MICROBOL. (2022). *Micro-credentials linked to the Bologna Key Commitments: Common framework.* Bologna Follow-Up Group. https://microbol.microcredentials.eu/

14. MicroHE Consortium. (2020). *The Micro-Credential Users' Guide.* MicroHE. https://microcredentials.eu/wp-content/uploads/sites/20/2021/05/D3_3_MicroHE-Users-Guide.pdf

15. New Zealand Qualifications Authority. (2026, verified 2026-04-18). Micro-credential listing, approval, and accreditation. https://www2.nzqa.govt.nz/tertiary/approval-accreditation-and-registration/micro-credentials/

16. New Zealand Qualifications Authority. (2026). *Micro-credential Approval and Accreditation Rules 2026.* https://www2.nzqa.govt.nz/about-us/rules-fees-policies/nzqa-rules/micro-credential-approval-and-accreditation-rules/

17. Nousiainen, T., Kangas, M., Rikala, J., & Vesisenaho, M. (2018). Teacher competencies in game-based pedagogy. *Teaching and Teacher Education, 74*, 85–97. https://doi.org/10.1016/j.tate.2018.04.012

18. OECD. (2021). *Micro-credential innovations in higher education: Who, what and why?* OECD Publishing. https://doi.org/10.1787/f14ef041-en

19. OECD. (2023). *Micro-credentials for lifelong learning and employability: Uses and possibilities.* OECD Publishing. https://doi.org/10.1787/9c4b7b68-en

20. Perkins, M., Furze, L., Roe, J., & MacVaugh, J. (2024). The Artificial Intelligence Assessment Scale (AIAS): A framework for ethical integration of generative AI in educational assessment. *Journal of University Teaching and Learning Practice, 21*(6). https://doi.org/10.53761/q3azde36

21. Plass, J. L., Homer, B. D., & Kinzer, C. K. (2015). Foundations of game-based learning. *Educational Psychologist, 50*(4), 258–283. https://doi.org/10.1080/00461520.2015.1122533

22. Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://doi.org/10.1007/s10648-019-09498-w

23. Sharma, R., Tan, C., Gomez, D., Xu, C., & Dubé, A. K. (2024). Guiding teachers' game-based learning: How user experience of a digital curriculum guide impacts teachers' self-efficacy and acceptance of educational games. *Teaching and Teacher Education, 155*, 104915. https://doi.org/10.1016/j.tate.2024.104915

24. Silva, F. G. M. (2020). Practical methodology for the design of educational serious games. *Information, 11*(1), 14. https://doi.org/10.3390/info11010014

25. Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review, 31*, 261–292. https://doi.org/10.1007/s10648-019-09465-5

26. Varadarajan, S., Koh, J. H. L., & Daniel, B. K. (2023). A systematic review of the opportunities and challenges of micro-credentials for multiple stakeholders: Learners, employers, higher education institutions and government. *International Journal of Educational Technology in Higher Education, 20*, Article 13. https://doi.org/10.1186/s41239-023-00381-x

27. three.js manual. (accessed 2026-04-18). Creating a scene. https://threejs.org/manual/en/creating-a-scene.html

28. three.js manual. (accessed 2026-04-18). Picking. https://threejs.org/manual/en/picking.html

29. three.js documentation. (accessed 2026-04-18). Raycaster. https://threejs.org/docs/?q=Raycaster#api/en/core/Raycaster

30. Wiggins, G., & McTighe, J. (2005). *Understanding by Design* (2nd ed.). ASCD.

---

## 20. Methodological notes and revisions from v1

This section exists because claims about how a course was designed should be traceable. It lists the substantive revisions this edition makes and why.

### 20.1 Revisions from v1

| v1 position | v2 position | Reason |
|---|---|---|
| "Research-based minimum of 8 sessions" | "Practitioner lower bound of 8 sessions; the recommendation is 12" | v1 language overstated the evidence; no empirical study supports the 8-session threshold |
| Single shared rubric of 7 "common criteria" applied to all deliverables | Per-deliverable rubrics (§12), five criteria each (25 total) at four levels (Emerging / Developing / Proficient / Exemplary), with a non-compensatory Proficient floor on every criterion | Shared rubric could not produce reliable scoring across deliverable types; averaging masked per-competency gaps |
| 180-minute session plans scheduling all 180 minutes | 180-minute blocks planned as 160 effective minutes plus 20 minutes buffer | v1 plans chronically over-ran because transitions were not budgeted |
| "Mechanic literacy I and II" each covering 5 concepts | Mechanic literacy I covers challenge/feedback/failure; II covers narrative/role/collaboration; reward moved to Session 10 audit; systems thinking and simulation fidelity become optional extension | v1 sessions 4 and 5 overloaded learners |
| Sessions 7 and 8 with overlapping artifacts | Session 7 produces a playable low-fi prototype; Session 8 produces specification (no new prototype) | Learners could not tell the sessions apart in v1 |
| No external playtest window | Week 10 is reserved as external playtest window; §15.3 describes alternatives for learners without access | v1 required a playtest but did not schedule time for it |
| No AI-use policy | Section 7 specifies permitted use, prohibited use, and required disclosure; missing or implausible disclosure fails deliverable | v1 predated explicit policy; 2026 delivery requires it |
| Principles listed without source mapping | §3.2 traces each principle to primary sources | v1 listed references but did not map them to design decisions |
| No instructor workload estimate | §15.1 gives hours per cohort configuration | v1 silent on operational feasibility |
| "Cohort ≤15 individual, 16–30 teams" | Same rule plus TA requirement above 24, split presentations above 30 | v1 did not account for assessment calibration |
| Single compression mapping of v1's 12 sessions to 8 | §14 describes what is cut and what each cut costs | v1 suggested compression was lossless |
| Claim that 12 sessions alone suffice for 5 ECTS | 12 sessions produce ~84 hours; 5 ECTS requires 125–150 hours; §4.1 extended tier adds studio time | v1 numbers did not add up |

### 20.2 Claims in this handbook whose evidentiary base remains weak

Honest self-description matters. The following v2 claims are practitioner judgments rather than empirical findings:

- The 8-session lower bound. Defended as a necessary condition for the five required activities; not demonstrated empirically.
- The specific per-learner assessment time estimates in §15.1. These are medians from instructor experience, not measured.
- The "mostly-three-target-learners" floor for D4. This is a workable floor, not a researched minimum.
- The placement of Session 10 as the audit session. Other placements would be defensible.

These are named so that institutions adopting the handbook can make informed local adjustments.

### 20.3 What this handbook does not cover

- Detailed lesson-level scripts for the concept-input blocks in each session. Producing those scripts is a separable instructor preparation task and depends on cohort characteristics.
- Curated case libraries of educational games. Instructors assemble these locally because quality and availability shift quickly.
- Implementation-phase content beyond the Three.js bridge document. A separate follow-on course handles implementation.
- A full study of learner outcomes from prior runs. That would require a dedicated evaluation study and is out of scope here.

---

## 21. One-paragraph summary

Educational game design is the work of aligning a learning objective, a game mechanic, a facilitator's moves, and the cognitive and motivational conditions of real learners. No policy specifies a minimum number of sessions for crediting this work; on practical grounds, eight three-hour sessions is the lowest defensible configuration and twelve is recommended. The course is built around five required deliverables — design problem statement, objective × mechanic crosswalk, paper prototype with facilitator guide, playtest report, and implementation spec — each with its own five-criterion rubric, each tied to specific program outcomes, all gated by a non-compensatory Proficient floor on every criterion and subject to an explicit generative-AI use policy. Sessions run at 160 effective minutes within 180-minute blocks, a week of external playtesting with target learners is reserved in the timeline, and the compressed 8-session tier is described honestly, including what each compression costs. The handbook's claims about what is research-supported, and what is practitioner judgment, are traceable in the text.
