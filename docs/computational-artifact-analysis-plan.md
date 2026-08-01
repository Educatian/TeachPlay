# TeachPlay computational artifact analysis plan

## Purpose

The portfolio agent evaluates a learner's Google AI Studio prototype as a computational learning artifact. It does not judge polish, popularity, or whether an LLM generated the code. Its question is:

> Does the artifact operationalize the stated learning objective in observable rules, player actions, feedback, state transitions, and evidence traces?

This follows constructive-alignment work that begins with learning goals, maps them to learning and game mechanics, and then evaluates prototype and assessment alignment ([Romero & Kalmpourtzis, 2020](https://doi.org/10.3390/info11030126); [Shelton & Scoresby, 2011](https://digitalcommons.usu.edu/itls_facpub/134)). It also uses learning-analytics research that treats gameplay as timestamped traces rather than relying only on end-of-game scores ([Sierra et al., 2014](https://doi.org/10.1016/j.entcom.2014.02.003); [Tlili et al., 2021](https://doi.org/10.9781/ijimai.2021.03.003)).

## Inputs and evidence boundary

The learner submits:

1. A learning objective written as an observable performance, including learner, condition, behavior, and success criterion.
2. A public Google AI Studio or hosted prototype URL.
3. Optional GDD/crosswalk, playtest trace, AI provenance log, and implementation notes.

The agent fetches only an allow-listed HTTPS host and records the fetched timestamp, final approved URL, content type, and a bounded text snapshot. It must label each finding as `observed`, `claimed`, or `not_verifiable`. A page summary alone is never sufficient evidence of computational alignment.

## Analysis layers

### 1. Objective formalization

Convert the objective into a structured tuple:

`{ learner, context, target_behavior, domain_concept, condition, success_criterion }`

Flag objectives that use only engagement language (“have fun”, “be motivated”) without an observable target behavior.

### 2. Computational mechanism extraction

Extract or infer an artifact graph:

`state -> player input -> rule/algorithm -> system output -> feedback -> next state`

Look for explicit state variables, rules, thresholds, branching, scoring, simulation, prompt/tool calls, data persistence, and error/failure states. Separate an implemented rule from a description of a proposed rule.

### 3. Learning-mechanics alignment

Map each target behavior to one or more observable mechanics. Score each mapping on:

- `0` absent: no artifact mechanism supports the target behavior;
- `1` indirect: the behavior is mentioned but the mechanic mostly rewards something else;
- `2` direct: the player must perform the target behavior to progress or solve the task;
- `3` evidenced: the direct mechanic also emits inspectable evidence of the behavior.

This operationalizes the LM-GM/constructive-alignment tradition rather than treating game mechanics and learning mechanics as interchangeable ([Callaghan et al., 2020](https://radar.gsa.ac.uk/3824/1/mapping-for-serious-games-analysis.pdf)).

### 4. Trace and assessment analysis

Extract candidate universal traces: action type, timestamp/order, state before/after, attempt, error, hint, feedback, revision, completion, and evidence artifact. Examine transitions and sequences, not only totals. Research on educational-game analytics recommends game-agnostic traces, while recent work shows transition patterns and mechanic profiles can reveal learning-relevant strategies ([Sierra et al., 2014](https://doi.org/10.1016/j.entcom.2014.02.003); [Dever et al., 2024](https://doi.org/10.17083/ijsg.v11i4.790); [Horn et al., 2016](https://researchwith.njit.edu/en/publications/opening-the-black-box-of-play-strategy-analysis-of-an-educational/)).

The agent should report:

- trace coverage: which target behaviors produce a trace;
- observability: whether a reviewer can infer the behavior from the trace;
- feedback validity: whether feedback explains or changes the target behavior;
- assessment validity: whether the success rule measures the objective rather than speed, clicks, or persistence alone;
- missingness and ambiguity: what would require a live playtest or instructor evidence.

### 5. Computational artifact quality

Review implementation evidence for deterministic rules, state consistency, edge cases, accessibility, error handling, data minimization, and AI provenance. The agent must not claim that a learner mastered the domain merely because the prototype runs. Product/process research warns that completion and learning gain can diverge; the review therefore treats completion as evidence of implementation, not proof of learning ([Dever et al., 2024](https://doi.org/10.17083/ijsg.v11i4.790)).

## Output schema

The stored pre-review contains:

```json
{
  "learning_objective": "...",
  "computational_artifact_summary": "...",
  "observable_mechanics": [],
  "evidence_traces": [],
  "alignment_findings": [],
  "strengths": [],
  "risks": [],
  "evidence_questions": [],
  "rubric_hints": [],
  "finding_labels": ["observed", "claimed", "not_verifiable"],
  "recommended_status": "needs_review"
}
```

The model can recommend `needs_review` or `rejected`; it can never produce `approved` and never mints a credential. The instructor must inspect the artifact, resolve evidence questions, score all D1–D5 criteria, and use the existing final approval/credential gate.

## Validation plan

1. Build a gold set of 12–20 prototype artifacts spanning direct alignment, indirect alignment, attractive-but-misaligned games, missing traces, and inaccessible implementations.
2. Have two instructors independently label objective–mechanic links, trace sufficiency, and evidence status.
3. Compare agent findings with instructor labels using precision/recall for missing-alignment and missing-evidence flags, plus Cohen's κ for categorical labels.
4. Run adversarial cases: prompt injection in page text, unsupported claims, redirect to private hosts, huge pages, broken prototypes, and links that expose secrets.
5. Monitor false reassurance as the primary safety metric: a polished artifact must not receive a high recommendation when the target behavior is not computationally observable.

## Decision policy

- `needs_review`: default for readable artifacts, including strong artifacts; AI is triage, not approval.
- `rejected`: only for clearly disallowed/unreadable submissions or artifacts with no credible connection to the stated objective; instructor can override after review.
- `approved`: instructor-only state after artifact inspection and rubric scoring.
- credential/badge: existing completion + all 25 rubric criteria at Proficient or above + final instructor approval.
