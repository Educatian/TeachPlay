# L3 · Program evaluation plan — design note

Design-only. This document names the questions a rigorous evaluation of the *AI-enhanced Educational Game Design* microcredential should answer, the data that answers them, and the instruments already wired into the handbook versus the ones still to build. It is written so that a College of Education assessment committee can sign off on it, and so that a future cohort's outcomes are not re-litigated every semester.

Status: **design + most instruments wired**. Pre/post self-assessment, rubric scores, inter-rater κ, exit tickets, xAPI funnel — all emit today. The gaps are the *longitudinal* pieces (transfer study at 3–6 months) and the *equity* pieces (subgroup analysis, which requires demographic fields we do not currently collect).

---

## The job

A program evaluation for a microcredential must answer five questions. They are not interchangeable — mixing them is how credentials lose their meaning.

| # | Question | What a defensible answer looks like |
| --- | --- | --- |
| EQ1 | Did learners acquire the stated skills? | Pre/post self-assessment delta with effect size, corroborated by rubric scores on D1–D5 |
| EQ2 | Are instructor judgments reliable? | Cohen's κ ≥ 0.70 on double-rated deliverables, trend stable across cohorts |
| EQ3 | Does the program work equitably across subgroups? | No group × outcome interaction > 0.3 SD; disaggregated pass rates published |
| EQ4 | Do learners transfer skills into practice? | 3–6 month follow-up: artifacts produced in their own classrooms show rubric-relevant evidence |
| EQ5 | Does the credential carry meaning outside UA? | External endorser audit agrees with our Proficient calls on ≥80% of sampled deliverables |

EQ1–EQ2 are *internal validity*. EQ3 is *equity*. EQ4 is *transfer / Kirkpatrick L3*. EQ5 is *external validity*. Each is evaluated separately. A program can pass EQ1–EQ2 and fail EQ4; that is a real finding, not a bug in the eval design.

## Framework

We use a **Kirkpatrick × CIPP hybrid**, because neither alone fits a microcredential:

- **Kirkpatrick** gives the outcome spine: Reaction (L1) → Learning (L2) → Behavior (L3) → Results (L4).
- **CIPP** (Stufflebeam) gives the feedback loop: Context → Input → Process → Product, each with an explicit decision point for whether to continue, modify, or retire the program.

| Kirkpatrick level | Our instrument | Where it lives |
| --- | --- | --- |
| L1 Reaction | Per-session exit ticket (confidence + muddiest point + next action) | `session-*.html`, persisted via xAPI |
| L2 Learning — self-report | Pre/post 8-skill Likert self-assessment | `session-01.html` / `session-12.html` → `analytics.html#sa-growth` |
| L2 Learning — performance | 25-criterion rubric, non-compensatory, Proficient floor | `rubrics.html`, `alignment.html` |
| L3 Behavior | Transfer artifact audit at 3–6 months post-program | **Not yet wired** — see [Transfer study](#transfer-study) |
| L4 Results | Student-of-learner outcomes (learners' own classroom games) | **Not yet wired** — requires IRB + consent |

CIPP maps onto our program cycle:

- **Context** — why this micro exists (gap analysis, labor-market demand for AI-enhanced LXD skills). Documented in `credential.html`, should be revisited annually.
- **Input** — 36 contact hours, 12 sessions, 25 rubric criteria, $X per-seat cost. Input changes (e.g. dropping to 10 sessions) require re-evaluation.
- **Process** — implementation fidelity. Did instructors actually run the sessions as designed? Exit-ticket completion rate ≥ 70% is our proxy.
- **Product** — EQ1, EQ3, EQ4, EQ5 above.

## Data sources (what's wired today)

All of the below already emit to xAPI and render in `analytics.html`:

1. **Exit tickets** — one per session × 12 sessions. `verb: responded`, `object: exit-ticket`. Captures reaction (L1) and catches muddiest-point patterns across cohort.
2. **Pre/post self-assessment** — 8 skills × 0–4 Likert, phase `pre` (S1) and `post` (S12). `result.score.scaled` + `extensions.sa-phase` + `extensions.sa-skill`. Rendered in *Skills growth* chart with n and Δ per skill.
3. **Rubric scores** — per-deliverable-per-criterion. 5 deliverables × 5 criteria = 25 decisions per learner. Non-compensatory: one Developing on any criterion blocks that deliverable.
4. **Inter-rater κ** — from `analytics.html` reliability panel. Requires double-rating on ≥ 20% of submissions per cohort.
5. **Funnel** — session-entry / attempted / completed / abandoned. Catches silent failure modes (e.g. learners who submit S3 but never re-open S4).
6. **Heatmap** — which rubric criteria get Developing calls most often. Drives prompt + session-content revision between cohorts.

## Instruments to build

The gaps in the current handbook, in priority order:

### Transfer study

At 3 and 6 months post-credential, ask every graduate to submit:
- One instructional game or AI-enhanced activity they designed *after* the program, for their own class.
- A short reflection (≤ 500 words) on what they tried, what worked, what did not.
- Optional: student work samples, anonymized.

Apply the same 25-criterion rubric to the transfer artifact. Compare to the learner's D5 rubric score.

- **Kept-skill signal**: post-program artifact scores ≥ 80% of D5 on the same criteria.
- **Decay signal**: post-program artifact scores < 50% of D5 → triggers a cohort-level review of which skills decayed and whether mid-program bootstrapping (e.g. a refresher) would help.

Response rate realism: educational transfer studies typically see 30–50% response rates at 6 months. We report findings conditional on response rate and flag the non-response bias openly rather than hiding behind it.

### Equity / subgroup analysis

We currently collect no demographics. That is a choice — a defensible one at pilot scale — but it is also a ceiling on what EQ3 can answer. To do subgroup analysis we need to collect, with explicit opt-in consent, at least:

- Role (pre-service teacher / in-service K-12 / higher-ed / other)
- Years of teaching experience (bucketed)
- Subject area taught
- Institution type (public / private / charter / other)
- Self-identified demographics (race, gender, first-generation status) — optional, aggregated only

**What we would never do**: tie these to individual rubric decisions in a way that lets any single instructor see them. Subgroup analysis is a cohort-level product, not a per-learner flag. The `analytics.html` facilitator view would render subgroup breakdowns only when n ≥ 10 per cell, to prevent triangulated re-identification.

### External endorser audit

Once per cohort, a random 10% of Proficient deliverables is re-scored by an external reviewer (e.g. a faculty member from another CoE, or an industry partner like The Center for Learning Sciences — see `credential/endorsement-template-v3.json`). Their independent rubric scores are compared to ours.

- Agreement ≥ 80% at the deliverable level → credential meaning confirmed externally for that cycle.
- Agreement < 80% → triggers a rubric review, not an individual grade change. Systemic disagreement is a *rubric* problem, not a *learner* problem.

### Reaction depth

Exit tickets capture confidence and muddiest point, but nothing about *relevance*. Add one question per session: *"Did today's session change how you'll approach [specific upcoming decision in your work]?"* — free text, coded thematically after the cohort closes. This is cheap signal and disproportionately useful for CIPP Context review.

## Analysis plan

Per-cohort (at close of S12 + 30 days):

1. **Descriptive**: completion rate, per-deliverable pass rate, exit-ticket response rate, self-assessment response rate.
2. **EQ1** (Learning): paired t-test or Wilcoxon signed-rank on pre vs post self-assessment, per skill and aggregate. Report Cohen's d. Triangulate with rubric pass rate — if self-assessment improves but rubric scores don't, that is a *calibration* finding, not a *learning* finding.
3. **EQ2** (Reliability): Cohen's κ on double-rated deliverables. If κ < 0.70, run a rubric calibration session before the next cohort launches and flag the cohort's scores as lower-confidence in the public report.
4. **EQ3** (Equity): one-way ANOVA or chi-square per demographic dimension on pass rate. Report all subgroup pass rates, not just the ones where p < .05. A non-significant result on a small n is not "no difference"; it is "insufficient evidence to detect a difference." Say that.
5. **EQ4** (Transfer): cohort-level descriptive of transfer-artifact rubric scores at 3mo and 6mo. Paired with D5 scores for retention slope.
6. **EQ5** (External validity): agreement rate with external endorser, confusion matrix by criterion (which criteria do we agree on, which not).

Annual (end of academic year, across all cohorts that year):

- Meta-analytic summary of the above.
- Rubric audit: which criteria had the most Developing calls? Which are rarely a deciding factor (candidates for consolidation)?
- Prompt audit: the AI-assisted skill-tagging prompt's acceptance rate per instructor. Per `L1-ai-skill-tagging-design.md`, < 40% acceptance triggers prompt review.

Three-year (program-level):

- Retention / transfer curve: do skills decay linearly, plateau, or drop off a cliff?
- Credential-as-signal study: do OBv3 assertion holders cite the credential on LinkedIn / applications / CVs? Proxy for EQ5 demand-side validity.

## Reporting

Three audiences, three artifacts:

1. **Learner-facing** — published in `credential.html` as "Cohort N results": completion rate, pass rate, and one-line equity statement. Plain English. No inferential statistics.
2. **Faculty / committee-facing** — full cohort report: all EQ1–EQ5 results, κ trend, rubric heatmap, transfer-study findings, recommended rubric revisions. This is the document the annual rubric audit acts on.
3. **External / registry-facing** — aggregate metrics pushed to the CTDL registry (see `L1-credential-engine-registration.md`) under `ceterms:aggregateData`. Lets state workforce agencies and receiving institutions see our pass rate and graduation volume without contacting us.

Cadence: cohort reports within 30 days of cohort close. Annual reports by July 31 each year. Three-year reports at program years 3, 6, 9.

## Ethics / IRB posture

The handbook itself is instructional; its use does not require IRB. The *evaluation study* — specifically the transfer-study follow-up, demographic collection, and external endorser audit — does. Recommended posture:

- Submit the evaluation plan as an **exempt-category 1 or 2** study (educational research in established educational settings, anonymous or aggregated data).
- Consent for demographic collection and transfer-study participation is opt-in, separate from enrollment. Declining does not affect credential issuance.
- Data retention: de-identified cohort data retained indefinitely for longitudinal analysis; identified data purged at 3 years unless learner re-consents.
- External endorser audit: reviewers see de-identified deliverables; learner names are stripped before handoff.

## What this plan does *not* solve

- **Causal efficacy.** We do not have a control group. We can report pre/post change and transfer-study outcomes, but we cannot claim "our program *caused* the gain" against any credible counterfactual. A randomized comparison with a waitlist cohort would be the right design if UA CoE wants to make efficacy claims publicly; we have not scoped that here.
- **Long-horizon labor-market outcomes.** Whether credential holders earn more, move into LXD roles, or stay in teaching longer is a multi-year LER-RS study, not a program evaluation. It would use CTDL registry linkage but lives outside this plan.
- **Rubric validity as a construct.** We measure inter-rater reliability (κ) and external agreement rate, but not *construct validity* (does our rubric actually measure "AI-enhanced educational game design skill"? or does it measure "ability to write clearly about AI-enhanced game design"?). Construct-validity studies are their own multi-year research program.

## Files this plan touches

- `analytics.html` — add subgroup breakdown panels (gated on n ≥ 10), transfer-study results section, external-endorser agreement matrix
- `session-01.html` — add demographic opt-in block (separate from enrollment)
- New `docs/evaluation-report-template.md` — cohort report template faculty fill in
- New `eval/transfer-prompt.md` — the 3mo / 6mo follow-up email + artifact-submission instructions
- `credential.html` — "Cohort results" public block
- `credential/assertion-example-v3.json` — add `ceterms:aggregateData` block for registry push
- `xapi.js` — no changes; existing streams suffice for EQ1, EQ2, partial EQ3

## Estimated effort

- Transfer-study instrument (email templates, submission form, rubric re-scoring workflow): ~1 week
- Demographic opt-in + subgroup rendering in analytics: ~3–4 days
- External endorser audit protocol + first-cycle coordination: ~1 week engineering, plus external reviewer time
- Cohort report template + first real report: ~3–4 days
- IRB submission (exempt category): ~2 weeks of calendar time, ~1 day of prep

**Total: ~3 engineer-weeks** of build + IRB + one full cohort cycle (12 weeks) before the first complete evaluation report can be published.
