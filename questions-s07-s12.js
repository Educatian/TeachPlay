// questions-s07-s12.js
// MCQ data for Sessions 07–12 of AI-enhanced Educational Game Design.
// Consumed by: Quiz.mount(containerEl, questions)
// Format: { lo, q, opts: [A,B,C,D], ans: 0-indexed, feedback: [4 strings] }

// SESSION 07 — Paper prototyping: cheapest disproof
const S07_QUESTIONS = [
  {
    lo: 'LO 7.1',
    q: 'A team finishes cycle 1 and finds that their prototype has rough, hand-drawn assets. They pause to redraw the cards neatly before running cycle 2. What has gone wrong?',
    opts: [
      'They confused a production problem (asset appearance) with a design problem (loop validity), spending revision time on something that cannot disprove the loop.',
      'They violated the one-loop rule by focusing on multiple scenes simultaneously during the revision window.',
      'They skipped the "what I cut" paragraph required between every build–play–revise cycle.',
      'They allowed the peer-as-proxy to see the prototype before assets were legible, invalidating the observation data.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the design/production distinction. Rough assets are a production problem; they do not tell you whether the loop is structurally sound. Redrawing them consumes the revision window without testing any design hypothesis.',
      'The one-loop rule is about restricting scope to a single mechanic — it is not violated by attending to asset quality. However, improving assets is still the wrong move because it does not disprove the loop.',
      'The "what I cut" paragraph is a D3 submission requirement, written once at the end of the session, not between every individual cycle.',
      'Observation validity depends on whether the player can read and interact with the prototype — legibility matters — but the team\'s error here is the reason for the redraw (aesthetic preference), not legibility itself.',
    ],
  },
  {
    lo: 'LO 7.2',
    q: 'During cycle 2, the builder notices the peer-as-proxy is about to make a move that will cause the loop to deadlock. The builder says, "Actually, you\'d normally see a reminder card there." Which observation-protocol rule did they violate, and what is the precise cost?',
    opts: [
      'They coached during silent observation, which hides the deadlock from the observation log and removes the evidence needed to decide whether to revise in cycle 3.',
      'They violated the one-change rule by introducing a new artifact (the reminder card) mid-cycle rather than waiting for the revision window.',
      'They broke the recruit-from-actual-population rule by using a peer-as-proxy rather than a target learner, which this intervention then compounded.',
      'They exceeded the 5-minute cycle window by pausing play, making the timing data in the Did/Said log invalid for comparison across cycles.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is evidentiary cost: silent observation exists so that failure events are captured, not prevented. Coaching removes the deadlock from the observable record. The team now has no logged evidence that the deadlock exists, so the cycle-3 revision backlog will not include fixing it.',
      'The one-change rule governs the revision window, not play. Introducing a remedy during play is coaching, not a revision; the rule it violates is silent observation, not the one-change constraint.',
      'Using a peer-as-proxy is explicitly permitted in S07 — the distinction between peer-as-proxy and target learner becomes critical in S09. Compounding that choice with coaching is a secondary error, not the primary one named here.',
      'Pausing play is a timing protocol problem, but the deeper harm is the loss of the failure event from the observation log. Timing invalidity is a consequence; evidentiary loss is the cause.',
    ],
  },
  {
    lo: 'LO 7.3',
    q: 'Between cycles 2 and 3, a team identifies three things that went wrong: the win condition is ambiguous, the token economy is too complex, and the turn order is confusing. Following correct revision discipline, they should:',
    opts: [
      'Pick the single observation that most directly threatens the learning objective and change only that element, logging the other two for consideration after cycle 3.',
      'Fix the win condition and the token economy together, since they interact — changing one without the other will make cycle 3 uninterpretable.',
      'Fix all three to maximize the information gained in cycle 3, because a cycle with multiple simultaneous changes reveals more about the design space.',
      'Fix none of them and instead add an observer to cycle 3 to gather more data on all three issues before committing to any change.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is causal isolation: the one-change rule exists so that cycle 3 can attribute any change in player behavior to a specific revision. Logging the other two items preserves them without contaminating the experiment.',
      'Interaction between elements is real, but it is precisely the argument teams use to justify multi-change revisions. The one-change rule holds even when elements interact; if the interaction matters, it will surface in cycle 3 after the single change.',
      'Multiple simultaneous changes expand the design space explored but destroy the ability to attribute outcomes to causes — the opposite of what is needed at this stage of a tightly-scoped prototype session.',
      'Gathering more data without changing anything is a reasonable strategy for a full research study, but in a 180-minute session it wastes the revision window. The one-change rule presupposes that you will act on one observation per cycle.',
    ],
  },
  {
    lo: 'LO 7.4',
    q: 'A team finishes cycle 3 with a loop that "plays smoothly" and then writes a "what I cut" paragraph that says: "We kept everything from v0.1. Nothing needed to be removed." What does this outcome most likely indicate?',
    opts: [
      'The prototype scope was set too narrowly in v0.1, so the loop had nowhere to grow and nothing exposed redundant elements across the three cycles.',
      'The team ran an unusually rigorous build phase and correctly identified a minimal loop from the start, which is the ideal paper-prototype outcome.',
      'The observation protocol was violated — the peer-as-proxy was coached in at least one cycle, preventing failures from surfacing.',
      'The loop works and the team is ready to translate directly to the D3 spec without further prototyping.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is scope discipline as a revealing test: a prototype that grows or stays flat across three cycles almost always had either an over-constrained scope or observation failures. A loop that genuinely survives three cycles shrinks — because play exposes redundancy that the builder did not anticipate.',
      'A minimal-but-correct v0.1 is theoretically possible, but "we kept everything" across three cycles with different peers is a red flag, not a trophy. Real play almost always surfaces at least one element that adds friction without adding information.',
      'Observation-protocol violations are a possible contributing cause, but the "what I cut" paragraph is the primary diagnostic. Even with coaching, a well-designed observation log will show stalls and misreads that should prompt cuts.',
      'A loop that survived unchanged may be ready to translate — or it may be over-specified, under-tested, or defended rather than tested. Declaring readiness without evidence of iteration is the riskiest interpretation of the outcome.',
    ],
  },
];

// SESSION 08 — Translation to spec; D3 document
const S08_QUESTIONS = [
  {
    lo: 'LO 8.1',
    q: 'A designer presents the following artifact to describe their game: nodes labeled "Tutorial," "Level 1," "Level 2," and "Victory," connected by arrows labeled "completes." A developer reviewing the spec says this is not a state machine. What is the most precise reason the developer is correct?',
    opts: [
      'The artifact describes possible paths between screens, not the complete set of states the system can occupy — it omits intermediate states, concurrent states, and transition conditions beyond "completes."',
      'The artifact uses informal labels rather than Boolean conditions, which means the developer cannot wire the transitions without interpreting the designer\'s intent.',
      'The artifact is a state machine but is incomplete because it lacks an explicit error state and a reset transition.',
      'The artifact describes gameplay progression, which belongs in the facilitator guide rather than the technical specification.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the state-machine vs. flowchart distinction: a flowchart shows paths; a state machine shows every legal state the system can occupy at any instant, the events that trigger transitions, and the guards that constrain them. "Completes" is a path label, not a transition condition.',
      'Informal labels are a presentation problem, not the structural problem. A rigorously labeled flowchart is still a flowchart. The issue is what the artifact represents, not how it is labeled.',
      'Missing error states and reset transitions are common incompleteness problems, but identifying them presupposes the artifact is a state machine with missing states. The prior problem is that the artifact is not a state machine at all.',
      'Gameplay progression belongs in the spec; the distinction is between representing paths (flowchart) and representing states (state machine). The artifact is in the right document but is the wrong artifact type.',
    ],
  },
  {
    lo: 'LO 8.2',
    q: 'A designer\'s event → feedback map has the following row: "Player selects the wrong answer → [blank]." During implementation, the developer makes the wrong-answer button flash red. At launch, the instructional designer argues the feedback should have shown the correct answer, not just a red flash. Which D3 failure does this scenario illustrate?',
    opts: [
      'An empty feedback cell in the event → feedback map left the consequence of the event undefined, so the developer filled the gap with a default behavior that did not reflect the design intent.',
      'The state machine lacked a "wrong answer selected" state, so the developer defaulted to a generic error-handling routine from the engine.',
      'The Three.js bridge did not specify the visual treatment of incorrect responses, so the developer used the engine\'s built-in flash animation.',
      'The event was mapped correctly, but the feedback string was ambiguous — "show corrective feedback" can mean a red flash or a reveal, and the developer chose the cheaper option.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the completeness rule for event → feedback maps: a complete map has no empty feedback cells. An empty cell is not a neutral absence — it is an invitation for the implementer to invent a consequence. The developer\'s red flash is not malicious; it is the predictable result of an incomplete spec.',
      'The state machine governs what states the system can occupy; the event → feedback map governs what happens when an event fires within a state. These are separate artifacts. A missing state machine entry is a different failure from an empty feedback cell.',
      'The Three.js bridge governs 3D scene description (objects, cameras, interactions in the hero scene). Visual feedback on answer correctness is an event → feedback concern, not a Three.js bridge concern.',
      'Ambiguity in a feedback string is a real risk, but the scenario specifies the cell was blank, not ambiguously filled. An ambiguous string is still better than an empty cell — it at least names an intent that can be argued over before implementation.',
    ],
  },
  {
    lo: 'LO 8.3',
    q: 'Two designers are specifying their hero scene. Designer A writes: "The lab scene should feel immersive and three-dimensional, with objects the player can examine." Designer B writes: "Hero scene: one Mesh (bench), one PointLight (ceiling, intensity 0.8), OrbitControls locked to azimuth ±30°; click on beaker triggers \'examine\' event." Which statement best explains why Developer B\'s spec is ready for implementation and Designer A\'s is not?',
    opts: [
      'Designer B\'s spec names concrete Three.js objects, lighting parameters, control constraints, and the event emitted on interaction — leaving no implementation decisions to the developer\'s discretion.',
      'Designer B used technical vocabulary, which signals to the developer that the designer understands Three.js, making the developer more confident and less likely to deviate.',
      'Designer A\'s spec describes an experience rather than a system, which belongs in the design rationale section of D3, not the Three.js bridge.',
      'Designer B\'s spec is more concise, which reduces the chance the developer misreads a longer document and introduces interpretation errors.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is implementability without interpretation: a Three.js-ready bridge spec must name scene graph components, camera and light parameters, control constraints, and the event API surface. Designer B\'s spec leaves no gap a developer must fill by guessing.',
      'Technical vocabulary is a signal of shared understanding, but it is not the mechanism of correctness. A spec written in plain English that names every object, parameter, and event would be equally implementable. Vocabulary is instrumental, not constitutive.',
      'Designer A\'s language does describe experience rather than system, which is a true observation — but framing it as a placement error (wrong section) misidentifies the problem. The problem is that "feel immersive" is not actionable regardless of which section it appears in.',
      'Concision is a quality that reduces reading errors, but length is not the discriminating variable. A 10-line spec with ambiguous parameters is harder to implement than a 40-line spec with every parameter specified.',
    ],
  },
  {
    lo: 'LO 8.4',
    q: 'A team\'s D3 specifies Three.js for every scene in their game — the inventory screen, the dialogue tree, the results summary, and the hero exploration scene — with the reasoning that "consistent 3D treatment makes the game feel cohesive." A senior reviewer flags this as a spec flaw. What is the reviewer\'s most defensible concern?',
    opts: [
      'Applying 3D to scenes where spatial interaction adds nothing to the learning objective increases implementation complexity without increasing instructional value, and a complete spec should explicitly justify or rule out 3D for each scene.',
      'The Three.js bridge section of D3 is intended for a single hero scene; specifying multiple scenes violates the document structure and will confuse the developer about implementation priority.',
      'Cohesion is a UX concern that belongs in the facilitator guide, not the technical spec; mixing UX rationale into D3 produces documents that cannot be handed to a developer.',
      'Three.js cannot support dialogue trees without a custom state-machine integration, so the spec is technically incorrect for the dialogue scene regardless of the cohesion argument.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the "say no explicitly" discipline: the S08 learning outcome requires designers to identify the single scene where 3D matters and to decline 3D for others — in writing, in the spec. A blanket 3D treatment substitutes a stylistic preference for an instructional argument, and it hides the cost of implementation choices that could be avoided.',
      'The document structure argument is real — D3 is designed around a single hero scene — but the deeper flaw is not structural. Even if the document allowed multiple bridge sections, the team would still be specifying 3D where it provides no learning value.',
      'UX rationale does not belong in D3 in place of implementation parameters, but the presence of a rationale is not itself a flaw. The flaw is the rationale\'s content: cohesion is not an instructional argument for 3D.',
      'Technical feasibility of Three.js with dialogue trees is a real implementation question, but it is secondary. The spec flaw precedes the feasibility question: the designer has not established why 3D is needed for a dialogue tree at all.',
    ],
  },
];

// SESSION 09 — Target-learner playtesting; D4 document
const S09_QUESTIONS = [
  {
    lo: 'LO 9.1',
    q: 'A team needs to determine whether the core mechanic in their game is too cognitively demanding for novice learners. They run three playtests with classmates (graduate students in instructional design) and find no confusion. They conclude the mechanic is appropriately scoped. What is the most precise flaw in this conclusion?',
    opts: [
      'Graduate students in instructional design are not the target learner population; they will compensate for design problems through domain knowledge and metacognitive awareness that novice learners lack, so the playtests found bugs but cannot detect design problems.',
      'Three sessions are below the minimum threshold needed to distinguish a pattern from a one-off event, so the sample size invalidates the conclusion regardless of who was recruited.',
      'The team observed behavior rather than collecting think-aloud protocols, so they have no data on cognitive load — only on task completion, which is a different measure.',
      'Cognitive demand can only be assessed with validated instruments; informal playtest observation cannot produce the data needed to evaluate working memory load.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the peer/target-learner distinction: peers are useful for finding bugs (broken links, ambiguous rules, missing feedback states), but design problems — structural issues that prevent the target learner from achieving the learning objective — require the actual target population. A graduate student\'s fluency with abstract systems will mask a mechanic that overwhelms a novice.',
      'Session count is a real validity concern, but it is secondary to population validity. Even ten sessions with the wrong population cannot answer the design question. The sample-size argument presupposes the right population was recruited.',
      'Think-aloud protocols are useful for surfacing cognitive load, but silent behavioral observation can also reveal confusion — through re-reads, repeated wrong inputs, and prolonged pauses. The absence of think-aloud data is a limitation, not the root flaw.',
      'Validated instruments are the gold standard for cognitive load assessment, but informal playtest observation is explicitly the tool used in D4. The question is whether the observation can answer the design question with the recruited population — and the answer depends on who those people are.',
    ],
  },
  {
    lo: 'LO 9.2',
    q: 'An observer\'s D4 log contains the following entry: "Player seemed frustrated with the feedback screen — probably because the icons are too abstract." Which D4 protocol rule does this entry violate, and what evidence would make the entry compliant?',
    opts: [
      'The entry mixes observation and interpretation in a single record: "seemed frustrated" infers an internal state and "probably because" infers a cause. A compliant entry would log the specific behavior (e.g., "clicked the skip button twice in 3 seconds; said \'what does that even mean\'") and defer the cause hypothesis to the interpretation section.',
      'The entry fails to include a timestamp, which is required for all D4 log rows so that behavioral clusters can be identified across the session timeline.',
      'The entry names the interface element (feedback screen, icons) rather than the learner action, reversing the correct D4 log structure, which places the learner\'s action in the primary field.',
      'The entry uses evaluative language ("too abstract") that belongs in the audit memo rather than the playtest report, contaminating the observation record with design critique.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the observation/interpretation boundary: D4 requires separating what was seen (behavior) from what it might mean (interpretation). "Seemed frustrated" is an inferred state, not an observed behavior; "probably because the icons are abstract" is an inferred cause. Compliant entries name specific, externally visible actions and verbatim speech.',
      'Timestamps are a protocol requirement and their absence is a real gap, but it is a completeness problem, not the category error demonstrated here. The entry would still violate the observation/interpretation boundary even with a perfect timestamp.',
      'Naming interface elements is not a reversal of D4 structure — log entries routinely name the screen or component the learner interacted with. The error is the inference of internal state and cause, not the reference to the feedback screen.',
      '"Too abstract" is evaluative, but the deeper violation is not category placement. A D4 entry that says "player clicked skip twice in 3 seconds and said \'what does that even mean\' — icon set may be too abstract" correctly separates observation from interpretation even though the interpretation names a design hypothesis.',
    ],
  },
  {
    lo: 'LO 9.3',
    q: 'After two target-learner playtest sessions, both players completed the game without confusion. The team prepares to write D4 and concludes: "Two successful runs confirm the design works." What is wrong with treating two sessions as confirmation of a pattern?',
    opts: [
      'Two sessions cannot distinguish a design pattern from a one-off event: a behavior (or its absence) observed only twice may reflect individual player characteristics rather than a systematic property of the design.',
      'Two sessions produce insufficient observational data to populate all required D4 fields; the report structure demands a minimum number of behavioral log entries that two sessions cannot generate.',
      'Confirmation of success is not the purpose of playtesting; D4 is designed to surface failure, so sessions that produce no failures should be discarded and replaced with sessions using a harder learner cohort.',
      'The team conflated task completion (finishing the game) with learning (achieving the objective); D4 requires a post-play assessment to distinguish the two, which was not conducted.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the pattern/one-off threshold: the S09 protocol establishes that you need enough sessions to distinguish a recurring pattern from individual variation. Two successful runs could reflect the design, or they could reflect two unusually skilled players. The confidence threshold requires more data points before "works" can be claimed.',
      'The number of log entries is a data-richness concern, not the conceptual error here. Two sessions could theoretically generate dense logs. The problem is not data volume — it is statistical confidence about what the data means.',
      'Sessions that produce no failures are not invalid; they are incomplete evidence. The claim that "success sessions should be discarded" misunderstands the protocol. The problem is treating two sessions, regardless of outcome, as sufficient to confirm a pattern.',
      'Distinguishing task completion from learning is a real and important concern, but D4 is a behavioral observation report, not a learning assessment. Post-play assessment is a valid addition, but its absence is not what makes the two-session conclusion flawed.',
    ],
  },
  {
    lo: 'LO 9.4',
    q: 'During a target-learner playtest, a player gets stuck on a puzzle and asks the observer: "Is this the right thing to do?" The observer wants to be helpful. According to D4 protocol, the observer should:',
    opts: [
      'Stay silent or say only "keep going as you normally would" — any coaching or hint invalidates the observation because it changes the player\'s trajectory from what it would have been without the observer\'s presence.',
      'Answer the question factually but log the coaching event in the D4 record so the interpretation section can account for the observer effect.',
      'End the session and recruit a different player, because a session in which the player breaks the fourth wall cannot produce valid observation data.',
      'Redirect the question by asking "what do you think you should do?" to keep the player active without coaching the correct answer.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the silent-observation requirement: the observer\'s role is to log behavior, not to scaffold it. Any verbal response that helps the player make a decision they would not have made unassisted contaminates the behavioral record. The stuck moment is itself a critical data point — it belongs in the observation log, not in the conversation.',
      'Logging the coaching event partially mitigates the contamination, but it does not remove it. The player\'s post-coaching behavior is no longer representative of how a player without an observer would behave. Logging the event is better than not logging it, but the correct protocol is to not coach.',
      'Ending the session on a single player question is unnecessarily costly. A stuck moment is data; it does not invalidate the session. The observer should log the moment and stay silent.',
      '"What do you think you should do?" is a Socratic prompt, but it is still a coaching intervention — it breaks silence and redirects cognition. A player who might have quit, re-read the instructions, or tried something random will instead reflect on the task. The observer has changed the behavioral trajectory.',
    ],
  },
];

// SESSION 10 — Five audit lenses
const S10_QUESTIONS = [
  {
    lo: 'LO 10.1',
    q: 'A trivia-style educational game awards players five points for each correct answer. The learning objective is for players to identify the structural causes of economic inequality — a skill requiring synthesis and transfer. The reward audit finds the game is problematic. What is the most precise finding?',
    opts: [
      'The in-game rewards (points per correct answer) reinforce recall of isolated facts, not the synthesis behavior named in the learning objective — so players can accumulate maximum points without ever performing the target skill.',
      'The point system creates extrinsic motivation that undermines intrinsic engagement with the learning objective, consistent with overjustification research on reward structures.',
      'The trivia format is misaligned with a synthesis objective regardless of reward structure, so the reward audit confirms what the learning objective crosswalk would have caught at the D2 stage.',
      'Players who understand structural causes will also answer trivia correctly, so the reward audit would need to examine whether high-scorers actually outperform low-scorers on a transfer measure — the audit alone is inconclusive.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is whether the reward is contingent on the target behavior: a reward audit asks specifically whether in-game rewards reinforce the learning objective or reward something else. Here, points are awarded for correct answers — a recall behavior — not for demonstrating synthesis, which means a player can score perfectly while never performing the skill the game claims to teach.',
      'Overjustification effects are a real concern in reward design, but that is an intrinsic-motivation argument, not a reward-audit argument. The reward audit asks about behavioral alignment, not motivational theory.',
      'The trivia format problem is real and would be caught by an alignment review, but the reward audit is a distinct lens. The audit finding about point-per-answer reinforcing recall is valid even if you separately note the format problem.',
      'Whether high-scorers outperform on transfer is an empirical question for an outcome study. The reward audit is a design-phase analysis that does not require empirical data — it asks whether the reward structure is logically contingent on the target behavior.',
    ],
  },
  {
    lo: 'LO 10.2',
    q: 'A cognitive load audit of a game finds that players must simultaneously track six resource counters, manage a turn timer, read incoming scenario cards, and evaluate three possible actions — all within a single decision window. The designers argue this complexity is intentional because the learning objective involves decision-making under pressure. The audit\'s response should be:',
    opts: [
      'The audit distinguishes necessary load (the cognitive demand inherent to the learning objective) from extraneous load (demands imposed by game mechanics that do not advance the objective); tracking six resource counters and a turn timer may be extraneous if the objective is about decision quality, not multi-tasking.',
      'If the learning objective explicitly involves pressure, then high working memory demand is a design feature, not a flaw — the audit should flag only load that has no instructional rationale.',
      'The audit should defer to the playtest data: if target learners were able to complete the game, the cognitive load is within acceptable bounds regardless of the designer\'s rationale.',
      'Cognitive load is subjective; the audit should survey players for perceived difficulty rather than apply a structural analysis to the mechanic count.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is necessary vs. extraneous load: a cognitive load audit does not eliminate all demand — it asks whether each demand element is required for the learning objective to function. Decision-making under pressure may justify a time constraint, but it does not automatically justify six simultaneous resource counters if tracking them consumes working memory that would otherwise go toward the decision itself.',
      'The argument that "high load with a rationale is exempt from auditing" is the most common audit-escape strategy. The audit should engage with the rationale critically: does the pressure mechanic require six resource counters specifically, or would two suffice to create the same decision pressure?',
      'Playtest completion is a task-performance measure, not a cognitive load measure. Players who complete a game under high load may have done so by abandoning the learning behavior the game was designed to elicit.',
      'Player-perceived difficulty surveys are one cognitive load measurement tool, but structural analysis of mechanic count and working memory demand is a valid audit method that does not require survey data.',
    ],
  },
  {
    lo: 'LO 10.3',
    q: 'An ethics audit question asks: "What harm could the game do when used as intended?" A team interprets this as "what could go wrong if someone misuses the game?" and concludes the game is safe because misuse is the user\'s responsibility. Why is the audit question being misread?',
    opts: [
      '"When used as intended" specifically excludes misuse scenarios — it asks about harm that arises from the design choices themselves, in a deployment context the designer anticipated, such as reinforcing a misconception or stigmatizing a group within the game\'s own narrative.',
      'The ethics audit and the data-privacy audit both cover misuse; the ethics audit as described focuses on intended use, so conflating the two means the team is performing the data-privacy audit instead of the ethics audit.',
      'Ethics audits are always prospective; "when used as intended" means the audit covers all foreseeable uses, including misuse, because foreseeability is a legal standard that encompasses more than the designer\'s specific intent.',
      'Harm that arises from misuse is the user\'s responsibility only if the designer took reasonable precautions; the ethics audit is where those precautions are documented, so the team should redirect the answer to precaution-listing.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is intended vs. unintended use as the scope boundary of the ethics audit: the audit is designed to surface harms embedded in the design itself — a stereotype encoded in a character, a misconception reinforced by the reward structure, a scenario that re-traumatizes a population the game claims to serve. These harms occur even when the game is deployed exactly as the designer planned.',
      'The distinction between the ethics audit and the data-privacy audit is real, but it is not the primary error here. The team\'s error is misidentifying the scope of "intended use," not confusing two audit lenses.',
      'Legal foreseeability standards are broader than design intent, but the ethics audit as defined in S10 uses "when used as intended" to narrow the scope to design-embedded harms, not to expand it to all foreseeable deployments.',
      'Documenting precautions against misuse is a reasonable design-ethics practice, but it answers a different question. The audit question is about harm that the design itself can cause in normal deployment — not about what safeguards are in place.',
    ],
  },
  {
    lo: 'LO 10.4',
    q: 'A game logs each learner\'s answer choices, time-per-question, session duration, and replay count. The data-privacy audit asks which of these data streams creates the highest risk. A team argues that answer choices are the most sensitive because they reveal what the learner does not know. A reviewer disagrees. What is the reviewer\'s most defensible counter-argument?',
    opts: [
      'Replay count and session duration, in combination, can reveal behavioral patterns (e.g., a learner who replays a module repeatedly at 2 a.m.) that go well beyond academic performance and could expose mental health status, learning disability, or personal circumstances — a risk that is harder to anonymize than answer-choice data.',
      'Answer choices are the least sensitive because they are the data the game was designed to collect; data collected for a stated purpose carries lower privacy risk than data collected incidentally.',
      'Time-per-question is the most sensitive stream because it can be used to infer cognitive processing speed, which may be used to discriminate against learners with documented disabilities.',
      'All four data streams carry equal risk because any personally identifiable behavioral log can be re-identified if combined with external datasets; the audit should recommend not logging any of them.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is inferential risk beyond the designed purpose: the data-privacy audit is not only about what the game intends to measure but about what the logged data could reveal when analyzed in ways the designer did not anticipate. Behavioral metadata like replay patterns can expose sensitive personal information that answer-choice data, which is directly tied to the academic context, typically does not.',
      'The "designed-for-purpose" argument lowers perceived risk but does not reduce actual inferential risk. Data collected for a stated purpose can still be re-purposed or re-analyzed. Purpose limitation is a privacy principle, not a risk-elimination mechanism.',
      'Time-per-question as a proxy for cognitive processing speed is a real concern, especially under disability discrimination frameworks, but it is a narrower harm than the behavioral exposure that session-level metadata can create.',
      'Recommending no logging eliminates risk but also eliminates the formative data the game needs to function. The audit\'s role is to surface and rank risks so that mitigation choices can be made, not to prohibit data collection.',
    ],
  },
];

// SESSION 11 — Revision triage
const S11_QUESTIONS = [
  {
    lo: 'LO 11.1',
    q: 'A team\'s ranked backlog has the following top three items: (1) replace the loading spinner with an animated logo, (2) fix the mechanic that the playtest showed players ignored entirely, (3) improve the background music. The triage criterion for S11 is whether fixing an item brings the game closer to the learning objective. Which ranking is correct, and why?',
    opts: [
      'Item 2 should be ranked first because a mechanic that players ignore cannot deliver the learning objective, regardless of how much the team values it; items 1 and 3 are production quality improvements that do not affect instructional function.',
      'Item 2 should be ranked first, and items 1 and 3 should be removed from the backlog entirely because production improvements have no place in a revision triage document.',
      'All three items belong in the backlog, and item 1 could be ranked first if the team believes first impressions affect engagement, which affects time-on-task, which affects learning.',
      'The ranking is subjective; triage is a team decision and any order the team can defend is correct as long as the rationale is documented in D4.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the triage criterion itself: does fixing this item bring the game closer to the learning objective? A mechanic that players ignore is a structural failure — the game cannot teach what players will not engage with. The loading spinner and background music may affect polish and affect player affect, but they do not change whether the learning objective is achievable.',
      'Items 1 and 3 should remain in the backlog — triage does not delete items, it orders them. They may be appropriate after the instructional-function problems are resolved. Removing them entirely is a scope decision that triage does not authorize.',
      'The engagement chain (first impressions → engagement → time-on-task → learning) is real but is being used here to justify ranking a cosmetic item above an evidence-backed structural failure. Triage requires evidence of the harm, not a plausible chain that could justify anything.',
      'Triage is explicitly described in S11 as a prioritization discipline, not a creativity exercise. A team decision defended only by preference is the failure mode triage is designed to prevent. The criterion — closeness to the learning objective — is non-negotiable.',
    ],
  },
  {
    lo: 'LO 11.2',
    q: 'During triage, a team is considering whether to keep or cut a narrative branching system that took them three weeks to build. The playtest data (D4) shows that players explored only one branch in all five sessions and did not notice the other branches existed. The team argues: "The branching system is the heart of the game — without it, the game is just a quiz." Triage discipline says the team should:',
    opts: [
      'Treat the attachment to the mechanic as a red flag rather than a triage criterion; the playtest evidence shows players did not use the branches, which means the branches are not contributing to the learning objective, and keeping them because the team loves them is the riskiest triage move.',
      'Keep the branching system but deprioritize it in the backlog so the team can focus on surface issues first, then return to it with more playtest data.',
      'Accept the team\'s framing: if the branching system is the game\'s core mechanic, it cannot be cut without redesigning the game, which is out of scope for S11 triage.',
      'Commission one additional playtest session specifically focused on the branching system before making a triage decision, since five sessions may not be enough to assess a non-linear mechanic.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the triage rule about design love: the riskiest move in revision triage is keeping a mechanic you are attached to when the playtest evidence says it is not working. Five sessions in which no player discovered a branching system is strong evidence that the branches are invisible or irrelevant to the player experience — and invisible branches cannot deliver a learning objective.',
      'Deprioritizing the branching system while keeping surface issues above it in the backlog is the opposite of the triage criterion. It defers the hardest evidence-backed decision and prioritizes polish over instructional function.',
      '"Out of scope for triage" is a boundary argument that triage does not recognize. Triage must be able to recommend cutting any element that does not move the game toward the learning objective, including the mechanic the team considers central. The centrality of a mechanic is a reason to test it rigorously, not to exempt it from evidence.',
      'Additional playtesting is a valid tool, but it should not be used to delay a decision supported by five existing sessions. If five players did not find the branches, the question is why the branches are invisible — a design question — not whether to trust the data.',
    ],
  },
  {
    lo: 'LO 11.3',
    q: 'A team receives both a D4 playtest report and a D10 audit memo before triage. The playtest report shows that players consistently misread the resource-scarcity mechanic. The audit memo flags the same mechanic for cognitive overload. The team\'s triage lead argues: "Since two documents flag the same mechanic, it goes to the top of the backlog automatically." What is the risk in this reasoning?',
    opts: [
      'Convergent evidence from D4 and D10 does raise the mechanic\'s priority, but "automatic top ranking" short-circuits the triage process: the team still needs to confirm that fixing the mechanic brings the game closer to the learning objective, not just that it has problems.',
      'The triage lead is correct — convergent evidence from multiple audit lenses is the strongest possible signal and should always produce a top-ranked backlog item.',
      'D4 and D10 flag different failure modes (usability vs. cognitive load), so their convergence is coincidental; the items should be triaged separately rather than merged into a single backlog entry.',
      'The risk is that a top-ranked item will attract the most development resources; if the team cannot fix the mechanic without rebuilding the game, they may spend D5 preparation time on an item that cannot be resolved in the remaining session.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is that triage is a criterion-driven prioritization, not an algorithm: convergent evidence increases confidence that something is wrong, but the triage criterion — does fixing this bring the game closer to the learning objective? — must still be applied. A mechanic that is both misread and overloading could be fixed in ways that address symptoms without reaching the instructional failure.',
      'Convergent evidence is indeed a strong signal, but treating it as an automatic top-ranking rule replaces the triage criterion with a counting rule. Two documents flagging the same item means two sources agree something is wrong; it does not mean fixing it is the highest-value move relative to the learning objective.',
      'D4 and D10 flagging the same mechanic for different reasons is not coincidental — it is multi-lens convergence, which is meaningful. Triaging them separately may produce two backlog items for the same root cause, which is less efficient than a single triage entry that addresses both diagnoses.',
      'Development-resource concerns are real, but this answer frames the risk as a project management problem rather than a triage-discipline problem. The conceptual error — automatic top-ranking without applying the triage criterion — is the primary risk.',
    ],
  },
  {
    lo: 'LO 11.4',
    q: 'A team\'s triage produces a backlog where the top five items all make the game look better (improved UI, new sound effects, refined animations) and the bottom five items all involve restructuring game mechanics flagged in D4. When the S11 instructor reviews the backlog, she returns it with a single comment: "Invert this." What does the instructor mean, and why is the original ordering a triage failure?',
    opts: [
      'The team ranked production-quality improvements above evidence-backed structural failures, violating the triage criterion; the items that bring the game closer to the learning objective (mechanic restructuring) should rank above items that make it look better (UI polish).',
      'The instructor means the team should cut the bottom five items entirely rather than rank them last, because unfixed structural problems should not appear in a final backlog.',
      'The team used effort as their ranking criterion (low-effort items at top) rather than alignment to the learning objective, and the instructor is asking them to re-rank by effort level in descending order.',
      'The instructor means the team should interleave polish and structural items so that motivation is maintained across the revision cycle — alternating difficult and easy tasks is a recognized triage strategy.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the distinction between production quality and instructional function as ranking criteria: the triage criterion in S11 is closeness to the learning objective, not visual quality or ease of implementation. A backlog where all polish items outrank all structural-failure items is a backlog ranked by aesthetic preference, which is precisely the triage failure the session is designed to prevent.',
      'Cutting items from the backlog is a scope decision that the instructor\'s one-word instruction does not authorize. Unfixed structural problems should remain in the backlog to be addressed — moving them to the top is the point of triage.',
      'Low-effort ranking is a plausible misreading of the original backlog, but it misidentifies the criterion error. Whether the team used effort or aesthetics as the criterion, the result is the same: structural failures rank below polish. The fix is to apply the correct criterion, not to re-rank by effort.',
      'Interleaving for motivational continuity is a project management strategy, not a triage discipline. The S11 triage framework is prioritization by instructional value, not by psychological rhythm of the revision cycle.',
    ],
  },
];

// SESSION 12 — D5 final defense
const S12_QUESTIONS = [
  {
    lo: 'LO 12.1',
    q: 'During a D5 defense, a team presents their final build with polished visuals and a live demo that runs without errors. When the panel asks "why did you change the feedback mechanic between D3 and D4?" the team says: "We felt the original feedback wasn\'t landing — it just didn\'t feel right." The panel\'s concern is best described as:',
    opts: [
      'The team narrated a design decision in terms of preference rather than evidence; a defensible answer would cite specific D4 observations ("three of five players re-read the feedback screen twice without changing behavior") as the evidentiary warrant for the change.',
      'The team failed to rehearse their defense sufficiently; "didn\'t feel right" is an informal register that undermines panel confidence in a formal presentation context.',
      'The team should not have changed the feedback mechanic between D3 and D4 without first running an additional playtest cycle to confirm the change addressed the identified problem.',
      'The panel expects a technical explanation of how the feedback mechanic was implemented in Three.js; aesthetic rationale is appropriate for the design rationale section but not for a live panel question.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the evidence vs. preference distinction in design narration: D5 defense skills require narrating decisions as "we changed X because D4 showed Y." The claim being defended in a D5 is the quality of the design process — which requires evidence as the warrant. Preference language ("felt," "didn\'t feel right") signals that the decision was not process-driven.',
      'Register and rehearsal matter for presentation quality, but the panel\'s concern is not about formality — it is about the absence of evidence. A polished delivery of "we felt it didn\'t land" would still fail the same criterion.',
      'Whether an additional playtest was required before changing the mechanic is a process question. The panel\'s immediate concern is the quality of the evidence cited in the defense, not whether the process had one more step.',
      'Technical implementation details are appropriate for the Three.js bridge section of D3, not for a design-decision question. The panel asked about the rationale for the change, which should be answered with observational evidence, not implementation method.',
    ],
  },
  {
    lo: 'LO 12.2',
    q: 'A panel member tells a presenting team: "Your final build is the most polished project I\'ve seen this term. But I\'m not convinced you have a strong defense." What distinction is the panel member drawing?',
    opts: [
      'The D5 defense evaluates the quality of the design process as evidenced by a visible decision trail from D1 to D4, not the quality of the final artifact; a polished build with a weak process narration fails the defense even if the game is excellent.',
      'The panel member is being generous about the build quality while signaling that the live demo has not yet been run, which is a required component of D5 alongside the eight slides.',
      'The panel member is distinguishing between the team\'s individual contributions and the collective output; polish suggests strong execution but weak collaboration evidence.',
      'The defense requires the team to defend the originality of the design concept; polish of execution is not evidence of conceptual originality.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is the D5 claim being defended: the claim is the quality of the design process, not the quality of the game. A polished final build is evidence of production skill; it is not evidence of a rigorous iterative process. The panel trusts process over polish, and process must be narrated with reference to the D1–D4 decision trail.',
      'The live loop is a required D5 component, but the panel member\'s comment follows the presentation — it is not a warning about a missing element. The distinction being drawn is between artifact quality and process quality.',
      'Collaboration evidence and individual contribution are assessment concerns, but they are not the distinction the panel member is making. The comment is about the relationship between a polished product and a defensible process narrative.',
      'Originality of concept is assessed earlier in the course; D5 defends process quality, not novelty. A thoroughly iterated version of a conventional game design concept is a stronger D5 than a novel concept with a thin process trail.',
    ],
  },
  {
    lo: 'LO 12.3',
    q: 'A team\'s eight-slide D5 deck includes slides for each deliverable (D1–D4) and a final slide showing the polished build. They allocate the most speaking time to the final slide. The panel redirects them repeatedly to the D3 → D4 decision. What does the panel\'s redirection reveal about the D5 evaluation frame?',
    opts: [
      'The panel values evidence of iteration — specifically where and why the design changed between deliverables — more than the quality of the endpoint; the D3 → D4 transition is where the playtest evidence translated into revision decisions, which is the core process claim the defense must support.',
      'The panel is checking whether the team can explain the technical implementation documented in D3, since the spec-to-build translation is the most technically demanding part of the project.',
      'The D5 rubric weights the D3 → D4 transition more heavily than other transitions because S09 playtesting is the most resource-intensive deliverable in the course.',
      'The panel\'s redirection is a test of the team\'s ability to handle unexpected questions under pressure; the D3 → D4 content is not specifically more important than other transitions.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is where in the process the design decisions are most visible: D3 → D4 represents the playtest-to-revision moment, where observational evidence directly shaped design changes. This is the highest-fidelity evidence that the team\'s process was evidence-driven rather than preference-driven. The panel redirects there because it is where the defense claim is most testable.',
      'Technical implementation is addressed in D3, but the panel\'s redirection is not about how the spec was built — it is about why the spec changed. The D3 → D4 moment is instructionally significant because it is where evidence enters the design.',
      'Resource-intensity does not determine panel weighting. The D3 → D4 transition is weighted because it is the moment where process rigor is most observable, not because S09 was the hardest session.',
      'Handling unexpected questions is a presentation skill being assessed, but the panel\'s interest in D3 → D4 is not arbitrary. The content of the transition — evidence-to-decision — is genuinely central to the D5 claim.',
    ],
  },
  {
    lo: 'LO 12.4',
    q: 'Two teams both present strong final builds. Team A narrates every design decision with reference to specific D4 observations and can point to the slide where each observation appears. Team B narrates decisions fluently and confidently but cannot, when pressed, cite which session or document produced the evidence for any specific change. Under the D5 evaluation frame, which team has the stronger defense, and why?',
    opts: [
      'Team A has the stronger defense because the D5 claim is about process quality, and process quality is demonstrated by a traceable decision trail — specific observations linked to specific changes. Team B\'s fluency is a presentation skill, not a process claim.',
      'Team B has the stronger defense because fluency and confidence under panel questioning demonstrate deeper internalization of the design process than the ability to cite document numbers.',
      'Both defenses are equivalent; one team shows evidence externally (slides) and the other has internalized it — the outcome (a well-designed game) is the same.',
      'Team A\'s defense is stronger only if the panel prioritizes documentation over understanding; a panel that values learning over compliance would score Team B higher.',
    ],
    ans: 0,
    feedback: [
      'Correct. The discriminating feature is traceability as the mechanism of a process defense: a defense of process quality requires that the panel can verify the claim. Team A provides verifiable evidence — specific observations → specific decisions → specific slides. Team B provides confident narration that the panel cannot verify. In D5, the ability to say "D4, session 3, player 2 clicked the button three times — that\'s why we changed it" is the defense, not the polish of the delivery.',
      'Internalization and fluency are signs of understanding, but they are not substitutes for traceability in a process defense. The D5 defense is not an oral exam of design knowledge — it is a defense of a documented process. Without citations, the panel has no way to distinguish genuine iteration from post-hoc rationalization.',
      'The outcome being equivalent (well-designed game) is the confusion the D5 frame is designed to prevent. Two teams can produce similar games through very different processes; the defense distinguishes which process was rigorous. A well-designed game produced by luck or intuition and one produced by evidence-driven iteration look the same as artifacts — the defense is the only instrument that separates them.',
      'A panel that values learning over compliance is still obligated to assess process quality, which is the learning the course is designed to produce. Framing traceability as "compliance" versus "understanding" creates a false dichotomy: traceability is evidence of the understanding, not a bureaucratic substitute for it.',
    ],
  },
];
