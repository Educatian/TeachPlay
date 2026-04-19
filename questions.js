// questions.js — Quiz question data for Sessions 01–06
// AI-enhanced Educational Game Design · University of Alabama College of Education
//
// Format: { lo, q, opts: [A,B,C,D], ans: 0-indexed, feedback: [4 strings] }
// Used by Quiz.mount() in quiz.js.

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 01 · Framing: what is/is not an educational game
// ─────────────────────────────────────────────────────────────────────────────
const S01_QUESTIONS = [
  {
    lo: 'LO 1.1',
    q: 'A history professor builds a game where players collect resource cards themed with historical trade goods, score points by building routes across a stylized map, and unlock "Did You Know?" pop-ups when they reach certain cities. After playing, students score higher on a quiz about trade routes — but only while the pop-ups are active. When the pop-ups are removed, scores return to baseline. Which category does this artifact most precisely occupy?',
    opts: [
      'A game with educational content, because the mechanic driving engagement (route-building) is not the same as the competency being measured (trade-route knowledge)',
      'A learning game, because demonstrable score gains confirm that learning occurred during play',
      'A simulation, because the map models real causal relationships between geography and trade',
      'A gamified worksheet, because extrinsic rewards (pop-ups) are attached to an otherwise academic task',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the engagement–transfer test: when the mechanic (route-building strategy) is separated from the content vehicle (pop-ups), performance collapses. The moment-to-moment decisions that earn points do not require or develop trade-route knowledge.',
      'Incorrect. Score gains tied exclusively to an active content delivery mechanism (the pop-ups) indicate the pop-ups are doing the teaching, not the mechanic. Transfer is absent when the mechanism is removed — the defining failure of this category.',
      'Incorrect. A simulation requires a causal model of a real system that the player can test and falsify. A route-building game with a historical theme and pop-ups does not expose or require reasoning about causal trade dynamics — it imposes a game loop on top of facts.',
      'Incorrect. Reward substitution (a gamified worksheet failure mode) occurs when players optimize extrinsic rewards instead of domain behavior. Here the issue is more fundamental: the loop driver (route strategy) and the content are in separate channels entirely. That is narrative capture, not reward substitution.',
    ],
  },
  {
    lo: 'LO 1.2',
    q: 'A design team adds a global leaderboard to a nursing simulation. Within two weeks, the average time-per-patient-assessment drops by 40% and error rates rise. The team interprets this as a difficulty-calibration problem and shortens assessment tasks. Which failure mode is actually operating, and why does the proposed fix make it worse?',
    opts: [
      'Competition flattening: the leaderboard pushes all players toward the lowest-cognitive-load strategy (speed), collapsing the reasoning variety the simulation was designed to develop; shortening tasks amplifies this pressure',
      'Reward substitution: players are optimizing for the leaderboard badge rather than clinical accuracy; removing the leaderboard would restore baseline performance',
      'Narrative capture: the competitive framing overwrites the clinical narrative, so players no longer identify with the practitioner role; the fix fails because narrative is not addressed',
      'Competition flattening: the fix works in principle but is implemented incorrectly — tasks should be lengthened, not shortened, to restore the intended cognitive load',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is that leaderboards impose a single dominant strategy — minimize time — regardless of domain demands. Shortening tasks reduces the cognitive load of the correct path and the incorrect one equally, making speed-over-accuracy even more advantageous.',
      'Incorrect. Reward substitution describes optimizing the reward shell instead of domain behavior, and stripping rewards returns performance to baseline. Here performance was acceptable before the leaderboard was added — the mechanism is competitive ranking, not a badge or point total. The category is competition flattening.',
      'Incorrect. Narrative capture occurs when players are absorbed in a story world but the mechanic is too thin to require domain decisions. Here the mechanic (assessment) was previously working; the leaderboard introduced a new optimization target, not a narrative wrapper.',
      'Incorrect. The failure mode identification is right (competition flattening), but the proposed direction is wrong. Lengthening tasks increases real-time cost of the speed strategy, but does not address that the ranking system itself rewards it. The correct fix is to change what the leaderboard measures, or remove it.',
    ],
  },
  {
    lo: 'LO 1.3',
    q: 'A designer says: "Players love our game — session length averages 22 minutes and retention week-over-week is 87%. That proves the design is working." What does the engagement–transfer problem predict about this claim, and which evidence would actually validate the design?',
    opts: [
      'High engagement metrics are necessary but not sufficient; the design is validated only when learners demonstrate the target behavior outside the game context in conditions that cannot be explained by game-skill transfer alone',
      'The metrics are sufficient for formative validation; summative evidence (pre/post tests) would be needed only at the end of the course, not at this stage',
      'The claim is correct because sustained voluntary engagement is the strongest available proxy for intrinsic motivation, which causes learning',
      'The metrics are misleading because retention measures habituation, not learning; a pre/post quiz measuring in-game content recall would be the correct validation instrument',
    ],
    ans: 0,
    feedback: [
      'Correct. The engagement–transfer problem is precisely the gap between engagement metrics and learning transfer. Validation requires evidence that the decisions players make inside the game map onto domain competence outside it — measured in a context where game-specific heuristics do not apply.',
      'Incorrect. The stage of the course does not change what constitutes evidence. The engagement–transfer problem is a design claim, not a timeline claim. Pre/post tests measuring content recall are also insufficient on their own — they must test the competency, not the content, and in a transfer context.',
      'Incorrect. The causal chain from intrinsic motivation to learning is contested, and engagement metrics do not even reliably measure intrinsic motivation. More importantly, the engagement–transfer problem asserts that these two dimensions are orthogonal — high engagement can coexist with zero transfer.',
      'Incorrect. Pre/post quiz measuring in-game content recall only tests whether players remember what was shown to them during play — not whether they can apply domain reasoning. A quiz that could be passed by reading the content outside the game does not distinguish game-driven learning from exposure-driven learning.',
    ],
  },
  {
    lo: 'LO 1.4',
    q: 'Two designers are framing their capstone projects. Designer A says: "My game is about antibiotic stewardship — I want players to understand the stakes." Designer B says: "My game will teach emergency nurses to sequence triage decisions for three patients simultaneously under time pressure." Which framing is crosswalkable to a learning objective, and what makes the other one inadequate for that purpose?',
    opts: [
      'B is crosswalkable because it names an observable behavior (sequencing triage decisions), a population (emergency nurses), and a condition (multiple simultaneous patients, time pressure); A commits only to a topic and an affect, neither of which specifies what the learner will be able to do differently',
      'Both are crosswalkable: A can be crosswalked by adding an assessment, and B already has one implicit in its scenario description',
      'A is crosswalkable because affective objectives (understanding stakes) are valid Bloom\'s targets; B is too narrow and will produce a simulation rather than a learning game',
      'Neither is crosswalkable at this stage; both require a formal task analysis before any learning objective can be written',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is that a learning objective must specify observable behavior. Designer B\'s framing names the action (sequence decisions), the population, and the constraining conditions — all of which can be tested. Designer A\'s "understand the stakes" is an experience promise (the "is-about" or "experience" frame), not a behavior commitment.',
      'Incorrect. Adding an assessment to A does not make the framing crosswalkable — it only moves the problem downstream. Crosswalkability requires that the framing itself specifies what observable behavior will be practiced during play. A\'s framing does not constrain mechanic selection in any direction.',
      'Incorrect. "Understand the stakes" is not a well-formed Bloom\'s objective — it uses an unobservable mental state verb. Affective objectives are legitimate but must also name an observable indicator behavior. B is not automatically a simulation just because it describes a scenario; a simulation lacks explicit win states and consequence feedback, which B does not preclude.',
      'Incorrect. Task analysis deepens a crosswalk but is not a prerequisite for identifying whether a framing is crosswalkable in principle. B\'s framing already passes the crosswalkability test at the framing stage; A\'s does not, regardless of what task analysis would later reveal.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 02 · Learner & context analysis; D1 Design Problem Statement
// ─────────────────────────────────────────────────────────────────────────────
const S02_QUESTIONS = [
  {
    lo: 'LO 2.1',
    q: 'A D1 draft reads: "Learners are healthcare students who lack confidence in clinical decision-making." A peer reviewer flags this as inadequate. Which revision best satisfies the D1 population and capability requirements?',
    opts: [
      '"Second-year BSN students at a commuter campus who, during simulated rapid-assessment drills, consistently perform the correct vitals sequence but cannot prioritize which patient to assess first when three patients present simultaneously"',
      '"Nursing students who struggle with triage — they know the steps but freeze under pressure, which is a common problem in clinical education"',
      '"Healthcare students in their clinical rotation year who have not yet developed the decision-making confidence needed for real patient scenarios"',
      '"BSN students who score below 70% on standardized triage assessments and report high anxiety during clinical simulations"',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating features are: specific population (second-year BSN, commuter campus), current observable capability (can perform vitals sequence), and a concrete, verifiable gap (cannot prioritize among simultaneous patients). A colleague who was not present at the analysis can verify all three claims independently.',
      'Incorrect. "Struggle with triage" and "freeze under pressure" are interpretations, not observations. "Common problem in clinical education" is a generalization that produces a generic solution. The gap is not stated in terms of what the learner cannot yet do — it is stated as an emotional state.',
      'Incorrect. "Healthcare students" is not a named population — it describes a category. "Decision-making confidence" is not an observable capability gap; it is an internal state. D1 requires what learners cannot do (behavior), not what they do not feel (affect).',
      'Incorrect. A test score and a self-report anxiety rating are closer to measurable than options B or C, but they still do not specify what the learner actually cannot do in observable terms. A score below 70% on a triage assessment does not tell a designer what mechanic to build — "cannot prioritize among simultaneous patients under time pressure" does.',
    ],
  },
  {
    lo: 'LO 2.2',
    q: 'Two D1 drafts describe learner gaps. Draft 1: "Paramedic trainees lack motivation to study pharmacology." Draft 2: "Paramedic trainees, when presented with a multi-drug overdose scenario, cannot identify which of three administered drugs is causing the current symptom cluster — they default to treating all symptoms separately rather than reasoning from mechanism." Which gap is measurable in the D1 sense, and what is the precise deficiency in the other?',
    opts: [
      'Draft 1 is measurable because motivation can be assessed via validated instruments (e.g., ARCS surveys); Draft 2 describes a scenario that is too specific to be a general design target',
      'Both are measurable: motivation affects performance, so addressing Draft 1\'s gap will close Draft 2\'s gap as well',
      'Draft 2 is measurable because it describes a specific decision error (defaulting to symptom-by-symptom treatment) that a trained observer can verify; Draft 1 names a cause (low motivation) rather than a performance gap',
      'Neither is fully measurable: Draft 2 requires a clinical observation that is too resource-intensive, and Draft 1 requires a psychological instrument — both exceed what a D1 document should commit to',
    ],
    ans: 2,
    feedback: [
      'Incorrect. Motivation instruments measure a learner\'s self-reported internal state, which is not the same as a performance gap. Even if motivation were low and measurable, it would not tell a game designer what the learner is failing to do — and therefore what to design. Draft 2\'s specificity is a strength, not a limitation; D1 is supposed to anchor one project, not generalize.',
      'Incorrect. Motivation and performance are correlated in some conditions but the causal direction is contested and context-dependent. More importantly, a D1 that names motivation as the gap commits the designer to a motivational solution (e.g., points, narrative) rather than a competency solution. Draft 2\'s gap requires a different mechanic family entirely.',
      'Correct. The discriminating feature is observability. Draft 2\'s gap can be verified by presenting the scenario to a trainee and watching which decision they make — no inference about internal states required. Draft 1\'s "lack of motivation" is a hypothesized cause; a designer cannot build a mechanic against a cause, only against an observable behavior gap.',
      'Incorrect. D1 does not require that the gap be measured within the document — it requires that the gap be stated in terms that a colleague could verify if they had access to learners. Draft 2 meets this standard. Draft 1 does not, but the reason is not resource intensity — it is that "motivation" is not a behavior.',
    ],
  },
  {
    lo: 'LO 2.3',
    q: 'A designer is building a triage game for rural first-responders. D1 notes: "Context of use: played during training sessions." A peer reviewer says this context description will produce a generic design. Which revision most concretely constrains the design?',
    opts: [
      '"Played on a personal Android phone during 20-minute breaks between field rotations, without a facilitator present, on a network that may be 3G or offline"',
      '"Played during monthly department training sessions, supervised by a training officer, with access to department tablets"',
      '"Played in a low-stakes practice context before live drills, allowing learners to experiment without real consequences"',
      '"Played during training sessions at rural stations, where internet connectivity and device availability vary"',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating features are: specific device (Android), specific time window (20-minute breaks), specific supervision condition (none), and specific connectivity constraint (3G/offline possible). Each of these eliminates design options — no facilitator means no debrief mechanics; offline-possible means no server-dependent content; 20 minutes means session length is a hard constraint.',
      'Incorrect. "Monthly," "supervised," and "department tablets" are more specific than "training sessions," but they do not constrain the design tightly enough. What happens if the training officer is absent? What tablet model? What is the session time budget? Each unanswered question leaves a design decision unmade at the D1 stage.',
      'Incorrect. "Low-stakes practice context" and "experiment without consequences" are design framings, not context-of-use descriptions. D1 should describe the physical, temporal, and social setting where the game will actually be used — not the emotional valence the designer hopes that setting carries.',
      'Incorrect. Acknowledging variability ("connectivity and device availability vary") is honest but does not resolve the design. D1 should name the worst-case constraints the design must survive. A game that works when connectivity is good but fails when it is poor has not been designed for its context.',
    ],
  },
  {
    lo: 'LO 2.4',
    q: 'During peer critique of a D1, a reviewer says: "Your population is specific, your gap is observable, but your context of use is a paragraph about why the problem matters — not where and how the game will be played." The designer responds: "The context section explains why rural first-responders are underserved, which is the real design motivation." What is the reviewer identifying, and why does the designer\'s response not address it?',
    opts: [
      'The reviewer is identifying that motivation for the problem is not the same as a constraint on the solution; a context-of-use statement must specify where, on what device, and under what supervision the game will run — facts that eliminate design options, not justify them',
      'The reviewer is correct that context is missing, and the designer should replace the motivation paragraph with a user journey map showing the learner\'s full workflow',
      'The designer\'s response is valid: documenting the underserved context is a legitimate equity framing that belongs in D1 alongside the deployment constraints',
      'The reviewer is being too prescriptive; context of use in D1 is intentionally broad to avoid over-constraining early-stage design',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the difference between a rationale (why this problem is worth solving) and a constraint (what the solution must be able to do). Context of use in D1 exists to anchor downstream mechanic and technical decisions. "Rural first-responders are underserved" tells a designer nothing about screen size, session length, or facilitation model.',
      'Incorrect. A user journey map is a legitimate UX tool but is not what D1 requires. D1 requires a concrete deployment context — device, setting, time, supervision — not a process diagram. A journey map might inform that, but does not substitute for it.',
      'Incorrect. Equity framing is appropriate in a project rationale section but it is not a substitute for deployment context. D1 is a design anchor document, not a grant proposal. Both can coexist, but the reviewer\'s critique is that the deployment context is absent — not that the equity framing is wrong.',
      'Incorrect. D1 is intentionally precise about context, not intentionally broad. Broad context descriptions produce generic solutions — which is exactly what the session warns against. The point of D1 is to eliminate design options early, not to preserve flexibility.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 03 · Learning objectives & crosswalk; D2 document
// ─────────────────────────────────────────────────────────────────────────────
const S03_QUESTIONS = [
  {
    lo: 'LO 3.1',
    q: 'A nursing educator writes this objective: "Students will appreciate the importance of proper hand hygiene in preventing hospital-acquired infections." A course designer asks them to rewrite it for inclusion in D2. Which rewrite correctly moves the objective to a Bloom\'s Revised Taxonomy level that is observable and crosswalkable to a mechanic?',
    opts: [
      '"Given a patient handoff scenario with four depicted contact points, students will identify which two contacts require glove change versus hand wash and justify their choice using the CDC contact-type framework"',
      '"Students will understand the rationale behind hand hygiene protocols and be able to explain them to a patient"',
      '"Students will demonstrate awareness of hand hygiene compliance requirements in clinical settings"',
      '"Students will value hand hygiene as a professional norm and apply it consistently in clinical rotations"',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating features are: observable action verb (identify, justify), specified condition (four depicted contact points in a handoff scenario), and a named criterion (CDC contact-type framework). A game designer can build a branching scenario from this — the contact points are decision nodes. None of the other options afford a specific mechanic.',
      'Incorrect. "Understand the rationale" is a mental state verb that cannot be directly observed. "Explain to a patient" adds an observable behavior, but it targets a communication skill rather than the clinical discrimination task. The objective conflates two different competencies.',
      'Incorrect. "Demonstrate awareness" is unobservable — awareness is an internal state. "Compliance requirements" points toward recall of rules, which is a lower Bloom\'s level (Remember) and affords a quiz mechanic, not a scenario-based judgment mechanic. The objective also lacks a condition.',
      'Incorrect. "Value" is an affective domain verb (Krathwohl), not a cognitive domain verb (Bloom\'s Revised). Affective objectives require a different crosswalk approach and are not measurable in the same way as cognitive objectives. "Apply it consistently" adds a behavioral element, but "consistently in clinical rotations" is not a condition a game can simulate directly.',
    ],
  },
  {
    lo: 'LO 3.2',
    q: 'A D2 crosswalk maps a "judgment under uncertainty" objective — "Given ambiguous vital signs and two possible diagnoses, determine which diagnosis to treat first" — to a flashcard-loop mechanic that presents correct and incorrect answers for recall. What is the signature mismatch, and which mechanic family would better fit?',
    opts: [
      'Flashcard loops require a single retrievable correct answer; judgment under uncertainty requires weighing incomplete evidence with no guaranteed right answer — branching scenarios with delayed consequences better match the objective because the consequence structure can model probabilistic outcomes',
      'Flashcard loops are too fast for complex objectives; slowing the loop with longer reading time and adding a confidence rating would align it to judgment under uncertainty',
      'The mismatch is a difficulty calibration problem: the flashcards should present ambiguous answer options rather than clear correct/incorrect pairs',
      'Flashcard loops are appropriate for all Bloom\'s levels if feedback is elaborative rather than verification-only; the fix is to rewrite the feedback strings',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the structure of the decision. Judgment under uncertainty involves weighing incomplete information where the consequence of a wrong choice plays out over time — a structure that requires branching with delayed feedback. Flashcard loops presuppose a retrievable right answer and deliver immediate verification, which trains recall, not probabilistic reasoning.',
      'Incorrect. Adding time or a confidence rating modifies the challenge knobs of the flashcard loop but does not change its fundamental decision structure. The loop still requires selecting a single answer that is pre-coded as correct or incorrect, which does not model the ambiguity of the objective.',
      'Incorrect. Making flashcard options ambiguous creates a confusing flashcard, not a judgment task. The problem is not in how answer options look — it is that a flashcard loop has no world state that changes as a result of the choice, which is essential for modeling uncertainty and consequence.',
      'Incorrect. Elaborative feedback improves learning from any mechanic, but it cannot substitute for the appropriate mechanic type. If the game loop is still "answer → right/wrong → next card," learners are practicing retrieval, not judgment, regardless of how informative the feedback strings are.',
    ],
  },
  {
    lo: 'LO 3.3',
    q: 'A D2 crosswalk contains this row: "LO: Students will analyze a patient chart to identify three contraindications for a proposed medication — Mechanic: Drag-and-drop chart elements into a \'contraindication\' bin — Rationale: Interactive, keeps learners engaged." A reviewer rejects the row. What is the most precise reason?',
    opts: [
      'The rationale names an engagement property (interactive, keeps learners engaged) rather than a cognitive alignment argument — a valid D2 rationale must explain why the mechanic demands the same reasoning the objective requires',
      'Drag-and-drop is a lower-order mechanic unsuitable for an Analyze-level objective; the mechanic should be replaced with a written justification task',
      'The rationale is too brief; expanding it to include references to cognitive load theory and dual coding would satisfy the D2 requirement',
      'The mechanic is mismatched because it requires learners to act on visible chart elements, whereas the objective requires them to generate contraindications from memory',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is what a D2 rationale must justify. Engagement is a property of a mechanic, not an argument for alignment. A valid rationale explains the cognitive demand chain: the learner must read chart values, hold a contraindication criterion in working memory, compare, and decide — and that chain matches the objective\'s analyze-level demand. "Interactive" justifies nothing about whether the mechanic produces the target thinking.',
      'Incorrect. Drag-and-drop can support Analyze-level cognition if the items being sorted require discrimination based on underlying criteria — which this task does. The issue is not the motor interaction (drag-and-drop) but the rationale provided for choosing it. A written justification would target a different objective type (evaluation/synthesis), not a better version of this one.',
      'Incorrect. Length is not the standard for a D2 rationale. Cognitive load theory citations would add authority but not substance if the argument remains "this mechanic is engaging." The criterion is whether the rationale names the cognitive demand the mechanic exercises and links it to the objective.',
      'Incorrect. The mechanic does require learners to read and evaluate chart elements — it does not require recalling contraindications from scratch, but neither does the objective. "Identify contraindications" in a chart-analysis context is an analysis task applied to presented information, which the drag-and-drop mechanic can support. The problem is in the rationale, not the mechanic.',
    ],
  },
  {
    lo: 'LO 3.4',
    q: 'A designer defends choosing a real-time strategy (RTS) mechanic for an objective targeting "procedural fluency" in sequencing patient discharge steps. A peer argues that a turn-based checklist game would better fit. The designer responds: "RTS builds speed and automaticity, which is part of procedural fluency." Which criterion should arbitrate this dispute, and what does it reveal?',
    opts: [
      'The arbitrating criterion is whether the target context requires fluency under time pressure; if discharge sequencing in the real setting is paced and reflective rather than time-critical, the RTS mechanic imposes a challenge structure that mismeasures competence and risks teaching speed over accuracy',
      'The designer is correct: procedural fluency by definition includes speed, so any mechanic that rewards faster execution is aligned to the objective type',
      'The peer is correct: turn-based mechanics always provide cleaner formative data because they isolate each procedural step, which RTS obscures',
      'The dispute cannot be resolved at the D2 stage; prototype testing is required to determine which mechanic produces better learning outcomes',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the context of use from D1. Procedural fluency means accurate and efficient execution of a sequence — but "efficient" is defined relative to the demands of the real setting. If discharge sequencing is a reflective, checklist-driven task in practice, an RTS mechanic measures a skill (rapid real-time decision under pressure) that is adjacent but not identical to the target competency. The mechanic must be crosswalked to the actual performance conditions, not to an abstract definition of the objective type.',
      'Incorrect. Speed is a component of procedural fluency in some contexts but not all. A surgeon\'s suturing and a pharmacist\'s discharge counseling are both procedural, but the time constraint differs fundamentally. Accepting "RTS builds speed = fluency" would make RTS the default for all procedural objectives regardless of real-world pacing, which D2 explicitly guards against.',
      'Incorrect. Turn-based mechanics do isolate steps and can produce cleaner process data, but "always cleaner" is not a valid design rule. If the real task is time-pressured, a turn-based mechanic undersamples the relevant demand. The peer\'s argument is correct only if D1 establishes that the target context is paced and deliberative.',
      'Incorrect. Prototype testing should validate a choice made at D2 for good reasons — it should not substitute for the reasoning. D2 exists precisely to force the designer to state a rationale before building. Deferring to prototyping without a rationale means the prototype has no hypothesis to test.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 04 · Mechanics I: challenge, feedback, failure
// ─────────────────────────────────────────────────────────────────────────────
const S04_QUESTIONS = [
  {
    lo: 'LO 4.1',
    q: 'A medical education game is failing playtesters: novices quit in frustration after the first scenario, while experienced clinicians report the game is "too easy to be useful." The design team\'s first instinct is to create two separate difficulty modes. Which diagnosis and intervention better addresses the underlying design problem?',
    opts: [
      'The game is not scaffolded; adding a tutorial mode for novices and an expert mode with more content for experienced clinicians solves both populations simultaneously',
      'The game\'s content is too advanced for novices and too familiar for experts; splitting the scenario library by proficiency level addresses both complaints',
      'The game has a motivation problem, not a difficulty problem; novices quit because they cannot see progress, so adding a visible progress bar and milestone rewards would help both groups',
      'The game has a single fixed difficulty point rather than a zone; the intervention is to identify the four challenge knobs (time pressure, information completeness, distractor similarity, stake level) and tune each independently for different learner entry points rather than creating parallel game versions',
    ],
    ans: 3,
    feedback: [
      'Incorrect. Tutorial modes address onboarding but do not solve difficulty calibration. "More content for experts" adds breadth, not appropriate challenge level. Both interventions treat difficulty as a content-volume problem rather than a cognitive-demand calibration problem.',
      'Incorrect. Splitting the scenario library by proficiency creates a content-maintenance burden and still does not address the calibration mechanism. If each scenario remains a fixed difficulty point, experienced novices will hit the same cliff when they advance, and the underlying problem recurs.',
      'Incorrect. Conflating motivation with difficulty calibration is a common error. Novices quit because the challenge exceeds their current capability — a cognitive load mismatch. A progress bar makes the gap visible but does not close it. Milestone rewards may briefly sustain engagement but do not change whether the decisions in the game are achievable.',
      'Correct. The discriminating feature is that difficulty is not a single dial — it is the product of at least four independent knobs. Two separate modes double the maintenance burden and still produce fixed difficulty points. Tuning knobs like information completeness (show all vs. partial vitals) or distractor similarity (clearly wrong vs. nearly identical options) lets a single scenario serve a wide entry-level range without forking the game.',
    ],
  },
  {
    lo: 'LO 4.2',
    q: 'A debrief reveals that learners who chose the wrong diagnosis in a branching scenario felt they had played correctly — they had no sense that a mistake occurred. The game displayed a "Scenario complete" message and advanced to the next case. Which feedback type was used, which feedback type was missing, and what is the specific learning cost of the gap?',
    opts: [
      'The game used no feedback beyond completion signaling (not even verification); the missing type is consequence feedback — a change in world state (e.g., patient deterioration) that makes the cost of the wrong diagnosis visceral and attributable to the specific choice',
      'The game used verification feedback (completion = implicit correct); the missing type is elaborative feedback, which would name the discriminating feature the learner missed',
      'The game used reflection feedback implicitly (advancing to the next case invites comparison); the missing type is verification feedback to confirm whether the choice was right or wrong before moving on',
      'The game used consequence feedback (advancing the story is a world-state change); the missing type is elaborative feedback explaining why the wrong diagnosis leads to that outcome',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is that learners felt they had played correctly — which means the game emitted no signal that a wrong choice had occurred. "Scenario complete" is not verification (it does not indicate right or wrong) and not consequence (no world state changed). Without consequence feedback, the causal link between the wrong diagnosis and a patient outcome is invisible, which is precisely the reasoning chain this scenario type is supposed to train.',
      'Incorrect. Verification feedback signals right or wrong. "Scenario complete" does not — it signals completion regardless of choice quality. If it were verification feedback, learners would at least know their answer was wrong; the debrief finding is that they did not. The verification type is absent, not present.',
      'Incorrect. Advancing to the next case is not reflection feedback. Reflection feedback asks the learner to articulate their own reasoning — it is an active, prompted metacognitive move, not a passive scene transition. Comparison between cases requires that learners know a comparison is warranted, which presupposes some signal that something went wrong.',
      'Incorrect. Advancing the story is a narrative transition, not a consequence. Consequence feedback requires that a world state that the learner cares about changes in a way that is attributable to the specific choice. A new scenario does not constitute a consequence of the prior decision — it resets context entirely.',
    ],
  },
  {
    lo: 'LO 4.3',
    q: 'A game\'s failure loop works as follows: when a player makes a wrong triage call, the scenario resets completely to the opening state, all prior progress is lost, and a pop-up explains the correct answer. Playtesting shows learners disengage after a second or third reset. Which of the four failure loop criteria is violated, and how does each violation contribute to disengagement?',
    opts: [
      'Recoverability is violated (restart from zero destroys what was earned, so the cost of failure exceeds what learning can recover) and instructiveness is partially violated (a pop-up names the answer but not the mental move that was wrong); together they make failure feel punitive rather than formative',
      'The loop violates the "short" criterion — resets are long because the entire scenario replays — and the "instructive" criterion because pop-ups are a passive delivery method that does not require the learner to apply the corrected reasoning',
      'The loop violates only the recoverability criterion; the pop-up satisfies instructiveness, the reset satisfies costliness, and the immediacy of the pop-up satisfies the short criterion',
      'All four criteria are violated equally; the correct fix is to remove the failure state entirely and allow learners to explore consequences without penalty',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the difference between recoverability and costliness. A failure loop must cost something real (so failure matters) but must be recoverable (retry with better understanding, not restart from zero). Full reset destroys both the earned progress and the context in which the wrong choice was made — eliminating the learner\'s ability to test a revised mental model in the same situation. The pop-up names the answer but not the reasoning error, violating instructiveness.',
      'Incorrect. A complete scenario reset is not the same as a "long" failure loop in the relevant sense. "Short" means the feedback reveal occurs close in time to the choice — which it does (the pop-up appears immediately). The problem is not temporal length but the scope of what is lost. Calling pop-ups non-instructive because they are passive is partly right but conflates delivery format with content quality.',
      'Incorrect. A pop-up that names the correct answer does not satisfy instructiveness if it does not name which mental move was wrong. Knowing the right answer after failure does not explain to the learner what reasoning led them to the wrong one — and without that, the retry is guesswork, not improved reasoning.',
      'Incorrect. Removing failure states entirely violates costliness — if nothing is lost when the learner is wrong, there is no signal that the decision mattered. The problem is not that failure exists but that its cost-to-recoverability ratio is wrong. Calibrating that ratio (lose the current patient outcome, not all prior progress) is the correct fix.',
    ],
  },
  {
    lo: 'LO 4.4',
    q: 'A D2 annotation for a judgment-under-uncertainty row reads: "Risk: distractor similarity may be too high, causing frustration." A reviewer says this risk identification is incomplete for D2 purposes. What is missing, and what would a complete annotation include?',
    opts: [
      'The annotation identifies a challenge-knob risk but does not name the highest-risk row in the crosswalk, does not specify which feedback type would reveal the discriminating feature when the wrong distractor is chosen, and does not propose a failure-loop criterion that would prevent the frustration from becoming disengagement',
      'The annotation is missing a specific example of a high-similarity distractor pair so a reviewer can evaluate whether "too high" is a calibration judgment or a speculative concern',
      'The annotation needs to quantify the risk — specifying the percentage of playtesters expected to choose each distractor — to distinguish a design risk from a usability problem',
      'The risk statement is complete; D2 annotations are expected to flag risks, not resolve them — resolution is the role of the prototype phase',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is what a D2 annotation must accomplish: it must name the risk, link it to a specific feedback or failure-loop response, and identify which row carries the highest risk so the designer prioritizes. Flagging "distractor similarity may frustrate" without saying what feedback type corrects the confusion (elaborative, naming the feature that separates the options) and without ranking the risk relative to other rows leaves the annotation unactionable.',
      'Incorrect. A concrete example of a distractor pair is useful for illustration but not what D2 requires. D2 is a design document, not a content specification. The reviewer\'s concern is that the annotation does not connect the risk to a design response — a sample distractor pair does not address that.',
      'Incorrect. D2 is not a quantitative risk assessment. Playtester percentages would require data that does not exist at the D2 stage. The annotation should propose a design response to the identified risk — not a measurement protocol for confirming the risk exists.',
      'Incorrect. D2 annotations exist precisely to connect risk identification to design responses before prototyping. If risks are only flagged and not linked to responses, the D2 document cannot guide prototype decisions. The prototype phase validates whether the response worked — it should not be the place where the designer first figures out what to do.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 05 · Mechanics II: narrative, role, collaboration
// ─────────────────────────────────────────────────────────────────────────────
const S05_QUESTIONS = [
  {
    lo: 'LO 5.1',
    q: 'A game for pharmacy students uses a rich narrative: players are apprentices in a 19th-century apothecary whose master has gone missing. Each puzzle requires identifying the correct compound from historical case notes. Playtesting shows high immersion but poor performance on a post-game drug interaction quiz. The designer says the narrative is the problem and proposes removing it. What does this diagnosis miss?',
    opts: [
      'The diagnosis conflates narrative transportation (immersion in the story context) with mechanic design; the problem is that the historical puzzle structure does not require learners to reason about modern drug interaction mechanisms — narrative removal would not fix the mechanic mismatch between compound identification and interaction prediction',
      'The designer is correct: narrative transportation reduces critical distance, making learners less likely to interrogate the content rigorously; removing narrative and replacing it with direct scenario presentation will improve transfer',
      'The diagnosis misidentifies immersion as the cause; the real issue is that historical case notes are too unfamiliar, so updating the setting to a modern pharmacy context (while keeping the same mechanic) would improve performance',
      'The diagnosis is partially correct: the narrative is appropriate for affective objectives but should be removed for the drug interaction objective and replaced with a pure judgment task',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the difference between narrative transportation (the affective immersion effect) and mechanic design. Narrative transportation is risky for conceptual discrimination tasks because it reduces critical distance — but the performance gap here is not caused by immersion per se. The mechanic (matching compounds from historical notes) does not require reasoning about modern pharmacokinetics or interaction mechanisms. Removing the story leaves the mechanic mismatch intact.',
      'Incorrect. Narrative transportation does reduce critical distance, which the session identifies as a risk for conceptual discrimination tasks. But the proposed fix (removing narrative) addresses only the transportation effect, not the mechanic structure. If the mechanic after removal still requires compound matching rather than interaction reasoning, quiz performance will not improve.',
      'Incorrect. Historical unfamiliarity may add surface-level cognitive load, but updating the setting does not change the reasoning demand. The interaction quiz tests a predictive, mechanism-based judgment — the mechanic would need to require that judgment (e.g., presenting two drugs and asking the learner to predict and explain the interaction) regardless of whether the setting is historical or modern.',
      'Incorrect. The logic that narrative is appropriate for affective but not cognitive objectives is too blunt. Narrative can support conceptual objectives if it creates a context that requires the target reasoning — the session specifies that the risk arises when narrative reduces critical distance in tasks that require discrimination. The solution is to redesign the mechanic to require interaction reasoning within the narrative, not to remove the narrative.',
    ],
  },
  {
    lo: 'LO 5.2',
    q: 'Two role designs for a social work training game: Role A assigns the player as "a client navigating the benefits system." Role B assigns the player as "a case manager deciding which of three clients gets an emergency housing voucher with one available." Which role better serves a learning objective targeting professional judgment, and what is the mechanism by which role adoption produces the learning effect?',
    opts: [
      'Role A, because experiential perspective-taking (living the client\'s experience) produces stronger empathy than abstract decision-making, and empathy is a prerequisite for competent case management judgment',
      'Role A, because first-person client experience generates authentic emotional data that a case manager role cannot; this data is transferable to professional judgment in ways that simulated managerial decisions are not',
      'Role B, because placing the learner in the case manager\'s decision seat makes the cognitive demands of the role isomorphic to the target professional judgment — the player must weigh client needs, resource constraints, and policy criteria, which are the same mental moves the objective requires; the learning mechanism is that role demands substitute for explicit instruction',
      'Role B, because it creates higher stakes — one voucher for three clients — and higher stakes increase engagement and motivation to learn',
    ],
    ans: 2,
    feedback: [
      'Incorrect. Empathy is a legitimate affective objective and client-perspective role-play is a reasonable tool for it. But the objective stated is professional judgment — a cognitive, decision-making competency. A client role generates experience of the system\'s effects, not practice of the manager\'s decision criteria. The mechanism of empathy production does not transfer to judgment-skill development.',
      'Incorrect. "Authentic emotional data" from the client experience is a real phenomenon, but the claim that it is "transferable to professional judgment" is not supported by the session\'s account of how role adoption produces learning. The mechanism requires that the role\'s cognitive demands match the objective\'s demands — emotional data from a different role does not substitute for practicing the target decision structure.',
      'Correct. The discriminating feature is isomorphism between role demands and objective demands. When the player occupies the case manager role, the decisions required to succeed in the game (weighing criteria, prioritizing among constrained resources) are the same decisions the objective targets. Role adoption works as a learning mechanism because the cognitive demands of the role can substitute for explicit instruction — the player reasons like the practitioner to survive in the game.',
      'Incorrect. Stake level is a challenge knob that affects difficulty and engagement, not the learning mechanism of role adoption. Role B may indeed create higher stakes, but that is independent of whether the role places the learner in the decision seat the objective targets. A high-stakes client role would not produce better judgment training than a lower-stakes case manager role.',
    ],
  },
  {
    lo: 'LO 5.3',
    q: 'A game for conflict resolution training uses a fully cooperative structure: all four players share information openly and must reach unanimous agreement before any action is taken. A reviewer argues this collaboration structure is mismatched to the D1 context, which describes real workplace conflicts where parties hold private interests and asymmetric information. What is the precise mismatch, and which structure would better fit?',
    opts: [
      'The cooperative structure eliminates the hidden-information condition that defines real workplace conflict, so players practice consensus-building in a full-information environment — a hidden-information role structure (each player holds private interests the others cannot see) would require the reasoning the objective actually targets',
      'The cooperative structure is too cognitively simple for the objective; a competitive structure where players try to win the conflict for their own side would better reproduce the adversarial dynamics of workplace disagreement',
      'The cooperative structure reduces individual accountability; a solo-play structure would ensure each player practices the full conflict resolution sequence independently rather than relying on teammates',
      'The cooperative structure is appropriate for teaching the process of conflict resolution; the mismatch is that unanimous agreement is too rigid a win condition — replacing it with a majority vote would better model real negotiation dynamics',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is what cognitive demands each collaboration structure makes possible. The D1 context establishes that real workplace conflicts involve asymmetric information and private interests — conditions that cannot exist in a fully cooperative, full-information structure. Hidden-information roles force players to reason about what others know and want, which is isomorphic to the target competency.',
      'Incorrect. A competitive structure where each player tries to win for their own side would reproduce adversarial conflict but not the resolution skill. Conflict resolution requires managing competing interests toward an outcome — which requires understanding others\' positions, not just defending one\'s own. Pure competition may generate the right emotional conditions but trains the wrong decisions.',
      'Incorrect. Solo play would allow each learner to practice the full sequence, but conflict resolution is inherently interactive — the decisions depend on what the other party does. Removing the other party removes the variable that makes the skill difficult. The D1 context specifically involves multiple parties, so solo play is context-invalid.',
      'Incorrect. The problem is not the win condition\'s rigidity but the information structure. Unanimous vs. majority vote both operate within a full-information frame — all players still know everything. The mismatch identified in the question is that real conflicts involve hidden information and private interests, which the win condition type does not address.',
    ],
  },
  {
    lo: 'LO 5.4',
    q: 'A designer adds a richly written narrator character to a game that already has a well-calibrated failure loop (short, costly, recoverable, instructive). During playtesting, learners start listening to the narrator\'s commentary instead of analyzing their failure. The designer proposes adding a "skip narrator" button. What does this symptom reveal about Mechanics II\'s relationship to Mechanics I, and is the proposed fix sufficient?',
    opts: [
      'The symptom reveals that the narrative element (narrator commentary) is sabotaging the failure loop by providing an easier cognitive path — learners outsource analysis to the narrator rather than doing it themselves; the skip button reduces exposure but does not fix the underlying issue, which is that the narrator\'s instructional content competes with the loop\'s own instructiveness',
      'The symptom reveals that the failure loop is too costly — learners are retreating into passive listening because the emotional weight of repeated failure is too high; adding a skip button and reducing failure costs together would fix both issues',
      'The symptom reveals that the narrator is performing the reflection step that the learner should be performing; replacing the narrator with a text log that records each choice would shift reflection back to the learner',
      'The skip button is sufficient; once learners can bypass the narrator, the failure loop will resume its instructive function, and the narrative wrapper can be preserved for learners who prefer it',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the Mechanics II principle that narrative amplifies or sabotages Mechanics I — it does not replace it. The narrator is providing the cognitive work (analysis of the failure) that the loop was designed to require the learner to do. Learners rationally offload to the easier channel. A skip button removes the distraction without addressing that the narrator\'s content was duplicating the loop\'s instructive function — the designer must decide whether to remove the narrator\'s analytical commentary or redesign it so it prompts without answering.',
      'Incorrect. Emotional retreat from failure is a real phenomenon, but the symptom described — listening to commentary rather than analyzing failure — indicates cognitive offloading, not emotional avoidance. Reducing failure costs would reduce the loop\'s costliness criterion and weaken the learning mechanism. The narrator is the issue, not the cost level.',
      'Incorrect. A text log is closer to the right direction (it could function as reflection prompt rather than delivered analysis) but "records each choice" does not specify whether it requires the learner to interpret the record. If the log simply shows what happened without demanding explanation, it shifts format but not cognitive demand. The core principle — Mechanics II must not do the cognitive work Mechanics I is designed to require — is correct, but the fix needs more precision.',
      'Incorrect. Removing the narrator from the learner\'s path does not change the fact that, when learners do listen, the narrator performs the analysis for them. It also does not address learners who prefer to listen — the skip button is opt-in, so the problem persists for the population that most needs to do the analysis themselves.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SESSION 06 · Facilitator guide design
// ─────────────────────────────────────────────────────────────────────────────
const S06_QUESTIONS = [
  {
    lo: 'LO 6.1',
    q: 'A facilitator guide contains: (1) a 2-page section on the game\'s design rationale and learning theory; (2) a role assignment procedure with materials checklist; (3) a debrief guide with 8 open-ended questions. A colleague who was not involved in the design reads it cold and stops after the role assignment section — she cannot tell whether the session has begun or whether she should wait for something else. Which of the three non-negotiable guide components is missing, and what failure does its absence cause?',
    opts: [
      'Pre-session setup instructions are present (the materials checklist) but the guide lacks a clear session-launch signal — a "when to begin" trigger — which is a sub-component of setup that tells the facilitator when the play phase is active; without it, a cold reader cannot distinguish preparation from facilitation',
      'Facilitation moves are missing: the guide contains debrief questions but no mid-play intervention prompts, so the facilitator has no direction for what to do if the game stalls, players are confused, or a productive error occurs during play',
      'The debrief component is technically present but fails the non-negotiable criterion because 8 questions is too many for a cold reader to prioritize; a compliant debrief section would have 2–3 questions ranked by LO priority',
      'The what-to-do-if table is missing: the guide cannot be run cold because it does not specify what the facilitator should do when the most common failure modes occur during setup or play',
    ],
    ans: 1,
    feedback: [
      'Incorrect. The pre-session setup section is present (role assignment procedure and materials checklist). The stopping point described — unable to tell if the session has begun — is a symptom of missing facilitation moves, not missing setup. Setup instructions end at "materials are distributed and roles are assigned." What happens next (launching the game, monitoring play, intervening) is the facilitation moves section.',
      'Correct. The discriminating feature is what facilitation moves are: they are the in-play guidance for what to do after setup is complete and before debrief begins. The guide has setup (materials checklist) and debrief (8 questions) but nothing that tells a cold reader how to launch play, when to intervene, or how to handle productive errors. The colleague stops because she has no instruction for what to do once players have their roles.',
      'Incorrect. Question count is not the criterion for whether a debrief section satisfies the non-negotiable. The question design standard — that debrief questions name the learning objective without revealing the answer — is more relevant. The stopping point described occurs before the debrief section is even reached, so the debrief\'s adequacy is not the cause of the problem.',
      'Incorrect. The what-to-do-if table addresses failure mode recovery and is a key component, but its absence would cause problems during play, not at the transition from setup to play. The stopping point described — the colleague cannot tell whether to proceed — occurs at the moment the game should launch, which is a facilitation moves problem.',
    ],
  },
  {
    lo: 'LO 6.2',
    q: 'Two debrief question designs for a triage game. Question A: "How did you feel during the simulation?" Question B: "Walk me through the moment you decided Patient 3 was lower priority than Patient 1 — what information were you using, and what would have had to be different for you to reverse that order?" Which question satisfies the D6 debrief standard, and what is the specific deficiency in the other?',
    opts: [
      'Question B satisfies the standard: it names a specific decision moment, requires the learner to reconstruct their reasoning process, and leaves the evaluative judgment (whether the priority was correct) to the learner — it points at LO-relevant cognition without revealing the answer; Question A elicits affect rather than reasoning, which cannot generate the LO-aligned reflection the session requires',
      'Question A satisfies the standard because affect and cognition are intertwined in clinical judgment; starting with emotional processing clears the way for cognitive reflection, and Question B\'s specificity may prime learners to rationalize rather than genuinely reconstruct',
      'Both questions are valid at different debrief stages: Question A belongs at the open (surface emotional data) and Question B belongs at the analytic phase; a complete debrief uses both in sequence',
      'Question B is too leading because it assumes the learner did deprioritize Patient 3; a learner who made a different triage decision cannot answer it, making it a poor cold-runnable question',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the D6 standard: debrief questions must name the learning objective without revealing the answer. Question B does this — it identifies the specific decision the LO targets (prioritization under incomplete information) and asks the learner to reconstruct their reasoning without indicating what the correct answer was. Question A produces affect data that may be therapeutically valuable but cannot drive LO-aligned reflection.',
      'Incorrect. The claim that affect clears the way for cognition is a common facilitation heuristic, not the D6 standard. The D6 standard requires that debrief questions name the learning objective — which means they must point at the cognitive content of the LO. An affect question does not do this. The rationalization concern about Question B is real but is addressed by the facilitator\'s follow-up probes, not by replacing the question.',
      'Incorrect. Using both questions in sequence is a defensible facilitation practice, but it does not answer which question satisfies the D6 debrief standard. The standard requires that questions name the LO without revealing the answer — and only Question B does that. Question A at the "open" phase is not a debrief question in the D6 sense; it is a warm-up.',
      'Incorrect. "Walk me through the moment you decided Patient 3 was lower priority" is easily adapted by the facilitator to any decision the learner actually made — "Walk me through your prioritization sequence." The specificity in the written question is illustrative, not prescriptive. Cold-runnable means a colleague can facilitate without asking the designer questions, not that every learner must have made an identical decision.',
    ],
  },
  {
    lo: 'LO 6.3',
    q: 'During a cold-run table-read, a peer facilitating a game for the first time encounters this situation: three of four players have completed their round, but the fourth player has not moved in 6 minutes and has not asked for help. The facilitator guide contains a debrief section and a setup section but no what-to-do-if table. What does the guide\'s silence force the facilitator to do, and what is the design failure this illustrates?',
    opts: [
      'The facilitator must improvise an intervention, relying on personal judgment rather than designer intent — this illustrates that a game whose facilitation depends on the designer\'s tacit knowledge was not designed but performed; the guide must anticipate stalled-player failure and provide a specific recovery line',
      'The facilitator should wait, because intervening during play risks disrupting the other players\' experience; the guide\'s silence on this point is appropriate — facilitators should use professional discretion for edge cases',
      'The facilitator should end the session early and note the failure for the designer; the cold-run protocol exists precisely to surface these gaps before real deployment',
      'The guide\'s silence forces the facilitator to consult the game\'s learning objectives and improvise a Socratic prompt; this is an acceptable outcome because facilitators are educational professionals',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the "runnable cold" standard. A game that requires a facilitator to improvise based on tacit designer knowledge was performed by its designer, not designed for deployment. The stalled-player scenario is a predictable failure mode — it belongs in the what-to-do-if table with a specific facilitator line (e.g., "I notice you\'ve been considering your options — can you tell me what information you\'re weighing?") that any cold reader can deliver.',
      'Incorrect. Waiting 6 minutes while one player is stuck and three have finished is not a neutral facilitation choice — it allows the session to stall, which is a facilitation failure mode. More importantly, the question is not what the correct intervention is but what the guide\'s silence forces the facilitator to do. That answer is: improvise. Whether improvisation is sometimes appropriate does not change the design failure.',
      'Incorrect. Ending the session early surfaces the gap correctly but also ends the game experience for three players who were progressing normally, which imposes an unnecessary cost. The cold-run table-read protocol is designed to surface these gaps in a low-stakes rehearsal, not during actual deployment. The correct action at the table-read is to note the gap — but the design failure is that the gap exists at all.',
      'Incorrect. A Socratic prompt improvised from LO reading is better than no intervention, but "acceptable outcome" depends on whether the improvised prompt matches the designer\'s intent. A facilitator without prior knowledge of the game may construct a prompt that inadvertently reveals the answer, introduces an irrelevant frame, or escalates the learner\'s anxiety. The guide exists to prevent these variations.',
    ],
  },
  {
    lo: 'LO 6.4',
    q: 'A designer\'s game passes a cold-run table-read successfully: a peer reads the guide aloud, end to end, without stopping to ask questions. The designer then says the guide is finished. A program director responds: "Passing the table-read is necessary but not sufficient." What condition must also hold for the guide to be considered complete?',
    opts: [
      'The guide must be runnable not just readable — a cold facilitator must be able to execute the setup, manage in-play interventions, run the debrief, and recover from the three named failure modes without consulting anyone; a table-read tests comprehension of the text, not the operational completeness of the instructions',
      'The guide must also pass a live pilot with actual learners before it can be considered complete; table-reads test text coherence, not whether the game itself works as designed',
      'The guide must be approved by a subject-matter expert who can verify that the debrief questions are factually correct and aligned to the discipline\'s professional standards',
      'The guide is complete once it passes the table-read; the program director\'s objection is about scope creep — the guide is a facilitation document, not a game validation instrument',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the gap between reading comprehension and operational execution. A table-read confirms that no clarifying questions were needed to parse the text — it does not confirm that the instructions are complete enough to execute under real conditions. A cold facilitator may understand every sentence and still lack the procedural specificity needed to launch the game, manage a stalled player, or run a debrief without anchoring to the wrong LO.',
      'Incorrect. A live pilot is a validation step for the game, not the guide. The guide can be complete as a document before a pilot occurs — the pilot may surface game design issues (challenge calibration, mechanic clarity) but is a separate evaluation from guide completeness. The program director\'s concern is about the guide, not the game.',
      'Incorrect. Subject-matter expert review of debrief question accuracy is appropriate for a content-heavy course but is not the standard D6 identifies for guide completeness. The standard is operational: can a cold colleague run the session end-to-end without stopping? Factual accuracy of debrief questions is a content quality issue, not a guide completeness issue.',
      'Incorrect. The table-read standard is stated in the session as a necessary condition, not a sufficient one. The program director\'s objection is substantive — operational completeness (the ability to execute, not just read) is a separate criterion. Dismissing it as scope creep misreads what a facilitator guide is for.',
    ],
  },
];
