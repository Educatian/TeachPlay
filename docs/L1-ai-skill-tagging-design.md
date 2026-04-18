# L1 · AI-assisted artifact skill extraction

Design note for an AI-assisted workflow that reads a learner's D1–D5 deliverable and suggests ESCO / Lightcast skill tags for the instructor to confirm. This is the feature that gives the course's own name — *AI-enhanced Educational Game Design* — teeth: we are not just teaching about AI-in-education, we are using AI in our own assessment loop, with the guardrails we would ask any of our learners to put on their own work.

Status: **design + prompt template ready**; production wiring requires an API key and provenance policy. The `rubrics.html` button invokes a local stub that reveals the prompt template and a fake suggestion list for demonstration.

---

## The job

Given a deliverable artifact (PDF, Markdown, CSV, folder of images), produce:

1. A ranked list of ≤8 candidate skill tags drawn from `credential/skills-crosswalk.json`.
2. Per candidate, the *specific excerpt* from the artifact that warrants it.
3. A confidence band (low / medium / high) with the reasoning in one sentence.
4. A list of *skills the artifact claims to address but does not visibly demonstrate* — the negative-space signal that lets the instructor flag over-claiming.

The instructor then accepts, rejects, or revises each tag. Only accepted tags attach to the learner's OBv3 assertion `alignment[]` block. The model never writes to the credential directly.

## Prompt template (v0.3)

```
System:
You are a rubric-auditor. You do NOT grade. You extract evidence of skill
performance from a learning-design artifact and propose taxonomy tags that the
artifact itself justifies. If the artifact does not justify a tag, do not
propose it. You propose at most 8 tags.

Context:
- Microcredential: "AI-enhanced Educational Game Design" (University of Alabama).
- Taxonomy source (authoritative): the JSON file "credential/skills-crosswalk.json",
  which lists ESCO and Lightcast Open Skill concepts per rubric criterion.
- Deliverable under review: {{D1|D2|D3|D4|D5}}.
- Rubric criteria for this deliverable: {{list of 5 criteria with Proficient descriptor}}.

Artifact:
{{full text of artifact, up to 12,000 tokens; images described via alt text or vision preview}}

Task:
Produce a JSON object with fields:
  "tags":        [ { "skill_code": "LXD|ASSESS|...", "excerpt": "<= 240 char quote from artifact",
                     "reason": "<= 30 word justification", "confidence": "low|medium|high" } ]
  "claimed_but_not_shown": [ { "skill_code": "...", "reason": "what would make this visible" } ]
  "notes": "one paragraph, plain English, for the instructor. No grades, no advice."

Constraints:
- Never assign a skill the artifact does not evidence.
- Never infer from the learner's name, grade history, or prior deliverables.
- If an excerpt is ambiguous, mark confidence "low" and explain what would raise it.
- If the artifact is <200 words, return an empty tags array and say so in notes.
```

## Why this shape

- **Evidence-linked tags** — every tag cites the excerpt that justifies it. The instructor can accept in one click when the excerpt is self-evidently on-point, and dig when it is not. This is the difference between a skill-tagging aid and a skill-generating hallucinator.
- **Negative-space signal** — the `claimed_but_not_shown` list is where the model earns its keep. A learner's D1 may say "I considered accessibility" while the artifact contains zero observable accessibility work; the model flags the gap so the instructor can decide whether to score Developing.
- **Bounded output** — the at-most-8 cap prevents tag inflation. If a learner's artifact genuinely demonstrates 12 skills, picking the 8 most load-bearing ones is still an instructor job, not a model job.
- **No grading, no advice** — the prompt is aggressive about staying in its lane. Tag extraction, not rubric scoring. We don't want instructors deferring judgment to a model trained on someone else's rubric.

## Guardrails the UI must enforce

1. **Nothing auto-commits.** A tag does not attach to the assertion until the instructor clicks Accept. Default stance is review, not trust.
2. **Show the excerpt.** Never just a skill code. If the excerpt is missing or paraphrased, reject the suggestion.
3. **Cache by artifact hash.** Re-running on the same artifact should produce the same suggestions, or document why it did not. Non-determinism is a cost we do not want to pay silently.
4. **Log the model + prompt version** to xAPI: `verb = "assisted"`, `object = artifact`, `context.extensions.model = <model-id>`, `context.extensions.prompt-version = "v0.3"`. This is audit trail; if we later discover a prompt produced biased suggestions we can trace which cohorts were affected.
5. **Rate-limit per instructor.** If a single instructor's acceptance rate falls below some threshold (e.g. 40% of suggestions accepted), surface it as a signal to revise the prompt, not to "train the instructor."
6. **No PII to the model.** Strip learner identifiers from the artifact before sending. The model does not need to know whose work it is reading.

## Over-reliance is the real risk

The failure mode is not model error. It is instructor atrophy: the model gets it right 85% of the time, and the instructor stops reading carefully. We mitigate by:

- **Blind audit.** Once per cohort, one random deliverable is manually double-tagged without the model, and the tags are compared. Disagreement > 20% triggers a prompt review.
- **Instructor sign-off.** Each accepted tag includes an `endorser` field with the instructor's ID, not just the model's. The assertion records humans, not LLMs, as the source of the attached skill.
- **Visible disclosure.** The public credential page says "skill tags were AI-proposed and human-confirmed per artifact, with the prompt template published at `docs/L1-ai-skill-tagging-design.md`." The learner, the registrar, and the employer can read exactly what happened.

## Pipeline (future)

1. Instructor uploads artifact on `rubrics.html`.
2. Client-side: strip PII, hash the artifact, check cache.
3. Server-side: call model with the prompt template; store raw response keyed on hash.
4. Client-side: render suggestions in a review panel. Instructor accepts/rejects.
5. On accept: append to draft `alignment[]` for the learner's OBv3 assertion.
6. On assertion issuance: the final `alignment[]` is what signs, along with instructor ID.

## What's wired today (reference stub)

`rubrics.html` has a &ldquo;Suggest skills (AI)&rdquo; button that shows a modal containing:

- The prompt template above, rendered for the currently selected deliverable.
- A canned, deterministic example of 3 suggestions so the UX is reviewable without an API key.
- A warning banner: &ldquo;This is a design stub. Production wiring requires institutional AI-use policy sign-off.&rdquo;

The stub is not a substitute for the real pipeline. It is a discussion artifact — it makes the UX concrete so the committee can argue about it rather than about an abstract roadmap bullet.

## Files this connects to

- `credential/skills-crosswalk.json` — the taxonomy the model is allowed to draw from
- `rubrics.html` — where the instructor workflow lives
- `credential/badge-class-v3.json` — destination for accepted alignment blocks
- `xapi.js` — provenance log (`assisted` verb)
