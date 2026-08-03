# TeachPlay content logic and evidence audit — 2026-08-01

## Scope and decision rule

This audit reviews the learner app, the twelve sessions, the resource/reference layer, the credential and privacy pages, and the instructor/admin surfaces. A claim is marked **verified** only when the current implementation or a primary source supports it. A claim that depends on local institutional policy, deployment configuration, or learner data is marked **conditional** rather than presented as a universal fact.

## Page-family findings

| Page family | Learning/content job | Logic break found | Action |
|---|---|---|---|
| Catalog and landing | Explain the credential pathway and get learners into the studio | The pathway was visible, but the content did not foreground the computational artifact and evidence-review loop early enough | Keep the pathway ordered as problem → artifact → analysis → instructor review; catalog copy now emphasizes objectives, artifacts, and evidence standards |
| Sessions 01–03 | Move from problem framing to objective/evidence alignment | Strong sequence; the risk was treating “engagement” as a learning claim | Retain the falsifiable objective, baseline, counter-hypothesis, and evidence language |
| Sessions 04–08 | Turn objectives into mechanics, roles, interaction, and implementation | Useful design logic, but several “teaches” statements could be read as outcome claims | Treat mechanic-to-learning links as hypotheses that require playtest evidence |
| Sessions 09–12 | Test, audit, revise, and defend the artifact | Strongest distinctive feature: the course requires observable traces and revision rationale, not only a polished prototype | Preserve the computational-artifact analysis and non-compensatory evidence gate |
| Rubrics and examples | Make quality inspectable | Worked examples use realistic numbers; those numbers are synthetic and could be mistaken for study findings | Keep the examples, label them as illustrative/synthetic in the surrounding copy |
| Credential and verifier | Explain what is issued and what can be verified | OBv2/OBv3 wording was internally inconsistent; “decade of forward compatibility” overclaimed interoperability | Updated page to make OBv3 current, OBv2 legacy, and interoperability deployment-dependent |
| Accessibility | State the target and known limits | WCAG 2.1 was stale; automated tests were too easy to read as conformance evidence | Updated to WCAG 2.2 AA target and explicitly separated automated checks from conformance |
| Privacy | Tell learners who receives data | “No third parties” conflicted with the configured OpenRouter analysis path | Disclose Cloudflare hosting and OpenRouter artifact-text processing; warn against unnecessary PII in public artifact URLs |
| Admin/review | Keep AI analysis advisory and human approval explicit | The implementation already had the correct safety boundary, but the content should repeat it at the review point | Preserve “never approve automatically”; require instructor inspection of artifact evidence |
| AI touchpoints | Make prompt guidance match runtime behavior | Page cards named temperatures, but the runnable BYOK client used one hidden default and did not show the effective configuration | Each runnable touchpoint now declares model/temperature, clamps the value, records it in xAPI, and shows the effective setting in the UI |
| Credential handoff | Explain what is implemented versus portable | Wallet/OID4VCI/DCC language could be read as proof of a live issuer or universal import support | Label current artifacts as signed/synthetic examples and handoff scaffolds; require a deployed issuer, verifier, and wallet test before claiming interoperability |

## Fact-check status

- **WCAG:** The site now names WCAG 2.2 as the target, not as a completed conformance claim. The page states known gaps and the need for manual review.
- **Verifiable Credentials:** W3C VC Data Model 2.0 is a Recommendation; the site’s VC language is now aligned to that version. A valid data model does not by itself prove issuer trust, wallet interoperability, or credential acceptance.
- **Open Badges:** Open Badges 3.0 is the current implementation direction. The legacy OBv2 JSON remains a compatibility artifact; the site no longer describes it as the primary format.
- **UDL and UNESCO:** UDL 3.0 and UNESCO’s 2024 AI Competency Framework for Teachers are framework alignments, not evidence that the course has been externally certified against them.
- **FERPA:** The privacy page describes FERPA-related rights and records cautiously. Whether a particular record is an education record depends on the institution, record, and governing facts; the page should not be read as legal advice.
- **Research claims:** The handbook’s game-based learning, cognitive-load, teacher-facilitation, and AI-assessment claims remain tied to named references. Universal language was softened where the evidence supports a recurring risk or moderator rather than a single dominant cause.

## Novelty and usefulness assessment

The most defensible novelty is not “AI plus games.” It is the **computational artifact evidence loop**:

1. State the learning objective and observable success criterion.
2. Inspect the artifact’s state machine, rules, feedback, and input/output behavior.
3. Capture traces that could support or contradict the learning claim.
4. Separate model-generated analysis from human-reviewed evidence.
5. Require a documented revision decision and known limits before credential approval.

This is useful because it gives learners and instructors a shared inspection language. It also prevents the common category error of treating a functional prototype, an enjoyable playtest, or an AI summary as proof of learning. This loop is now exposed in all twelve session pages through a session-specific Claim / Evidence / Limit rail. The rail is intentionally phrased as an evidence prompt, not a guarantee of learning.

## Next content improvements

1. Label all example numbers as synthetic unless they link to a real, permissioned dataset. (The worked-example and calibration pages now do this.)
2. Add a source/version field to framework alignment rows so outdated standards cannot silently persist. **Done 2026-08-01:** alignment rows now expose source/version links and the page distinguishes its static and interactive scopes.
3. Add a deployment-specific data-processing notice whenever the AI provider changes. **Done 2026-08-01:** privacy page now names the current OpenRouter default and the `OPENROUTER_MODEL` override boundary.
4. Add a manual screen-reader and caption review record; automated tests remain necessary but insufficient. **Record added 2026-08-01:** keyboard/caption checks are documented; NVDA/VoiceOver and human caption comparison remain explicitly open.
5. Keep the 3+ target-learner playtest item explicitly framed as a course evidence minimum, not a statistical power rule or proof of transfer.

## Verification rerun

The current implementation was rechecked after the content and interface revisions:

- Unit suite: 164 passed.
- Full CI browser gate: 117 passed, 3 intentional legacy skips, 0 failures.
- Media browser audit: 42 pages, 41 media requests, 0 failures.
- Accessibility smoke: 8 representative pages, 0 axe violations.
- Static surface audit: 30 pages, 0 errors, 0 warnings.
- UI correction: the Canvas shell now gives the learner workspace, hero actions, onboarding actions, and evidence controls a compact 4px control radius. Status markers may remain circular when they communicate state rather than action.
- Figma catalog: the evidence contract strip includes a fitted source/version ledger and was screenshot-checked after the layout adjustment.
