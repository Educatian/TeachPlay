# TeachPlay Evaluation Surveys

Pre/Post Qualtrics survey instruments for the TeachPlay AI-Enhanced Educational
Game Design microcredential. Companion to [`docs/L3-evaluation-plan.md`](../docs/L3-evaluation-plan.md):
the evaluation plan names the questions; this folder builds the instruments
that answer them.

Two surveys, anonymous, paired by a self-generated 4-character code. UA Crimson
themed, hosted on UA Qualtrics (`pdx1` datacenter, `universityofalabama` brand).

```
Pre-Program   SV_9QtpyWbqTypaFls   20 items   ~5 min
Post-Program  SV_39sdRK7OVJvSiPk   22 items   ~6 min
```

Both **created `isActive=false`**. Activation is a separate explicit step
(see [Distribution](#distribution)) because it has IRB / distribution
implications.

---

## Quick start

```powershell
# 0. Token at C:\Users\jewoo\Desktop\qualtrics-token.txt (already provisioned)
$env:PYTHONIOENCODING = "utf-8"
cd C:\Users\jewoo\Desktop\_projects\TeachPlay\eval

# 1. Sanity check the API connection
python -c "import qualtrics_helper as qh; print(qh.Qualtrics().whoami())"

# 2. Build (already done; safe to re-run — creates *new* surveys)
python build_surveys.py post     # Post 22-item shell
python build_surveys.py pre      # Pre 20-item shell
python build_surveys.py both     # both at once

# 3. Apply UA Crimson theme (idempotent — re-run anytime to reset visual)
python apply_theme.py

# 4. Inspect a survey's structure
python build_surveys.py verify SV_39sdRK7OVJvSiPk
```

---

## Files

| File | Role |
|---|---|
| `qualtrics_helper.py` | Token loader, `Qualtrics` API client, payload builders (`likert_agree`, `likert_confidence`, `mc_single`, `mc_multi`, `text_entry`, `numeric_entry`), and `teachplay_theme_options()`. **Reusable across other UA Qualtrics projects** — only the theme function is TeachPlay-specific. |
| `instruments.py` | All wording + tags. **Edit here** to revise items; builders import. Every block is a list of `(text, tag)` tuples or `(builder_kind, text, tag, choices, force)` for non-Likert types. |
| `build_surveys.py` | Entry point. `python build_surveys.py post\|pre\|both\|verify <id>`. Creates surveys, adds blocks/questions, sets the cohort EmbeddedData flow. |
| `apply_theme.py` | Idempotent theme applier (GET-merge-PUT pattern; do NOT replace whole options blindly). |
| `instruments.py` items | See [Item composition](#item-composition) below. |
| `_resume_post.py` | Historical — used to finish the Post survey after a numeric-validation 400 mid-build. Kept for reference. |
| `_created_surveys.json` | Generated record of `SurveyID` + block IDs. |

---

## Item composition

All Likert items 5-point. **Every construct ≥ 3 items** so Cronbach's α / McDonald's ω are estimable; CFA deferred to cohort 2 once N pools ≥ 150 (Hair 2019).

### Pre-Program (20 items)

| Block | Items | Construct | Likert | Source |
|---|---|---|---|---|
| 0 — Tag | 1 | T0 matching code (self-rule, PII-free) | text | Mavros 2018 anonymous-ID |
| 1 — Demographics | 7 | D1 role, D2 grade, D3 gender, D4 subject, D5 years, D6 institution, **D7 race opt-in** | MC single/multi | IPEDS / NCTQ standard categories |
| 2 — AI-use SE baseline | 4 | Self-efficacy with generative AI tools in instructional contexts | confidence | Bandura task-specific + Wang et al. 2023 GenAI-SE |
| 3 — Designer identity baseline | 4 | "I see myself as a designer of learning experiences" | agree | Kafai & Fields 2018 |
| 4 — Credential expectation | 4 | Signal / social / economic / realized (future-tense) | agree | Phillips & Cohen 2023 MVS short |

### Post-Program (22 items)

| Block | Items | Construct | Likert | Source |
|---|---|---|---|---|
| 0 — Tag | 3 | T0 code, T1 role, T2 hours-actual (bucketed) | text + MC | — |
| 1 — Usability | 4 | UMUX (capabilities, frustration R, ease, correcting R) | agree | Lewis, Utesch & Maher 2013, α = .79–.83 |
| 2 — AI-use SE | 4 | **Identical wording to Pre** | confidence | (paired) |
| 3 — Credential value | 4 | Signal / social / economic / realized (present tense) | agree | (paired with Pre Credential expectation) |
| 4 — Designer identity | 4 | **Identical wording to Pre** | agree | (paired) |
| 5 — Teaching efficacy contagion | 3 | "My students will engage with the gamelets I design" | confidence | Tschannen-Moran TSES adapted |

### Why these and not others?

The handbook already emits in-app self-assessment, exit tickets, rubric κ,
funnel, and skills-growth heatmap (see L3 plan §"Data sources"). Qualtrics
deliberately covers **only what the in-app instruments cannot**: external
perception (credential value, designer identity), transfer-relevant efficacy,
and program-level usability. Cognitive load, flow, time-on-task, and per-session
mood belong inline (xAPI), not in a post-program survey.

---

## Pre/Post pairing

```
Pre AISE_n  ─────────►  Post AISE_n   (identical wording, paired d_z)
Pre DI_n    ─────────►  Post DI_n     (identical wording, paired d_z)
Pre CE_n    ─────────►  Post CV_n     (symmetric, expectation→realization)
```

Pairing key: `T0_match_code`. Self-rule = mother first letter + birth month
(2-digit) + favorite color first letter (e.g. `K07B`). Mavros 2018 reports
70-90% pairing rate; we will measure for cohort 1 and adjust the prompt for
cohort 2 if below 70%.

### Analysis snippet (R)

```r
library(dplyr); library(psych); library(effsize)

pre  <- read.csv("pre.csv");  post <- read.csv("post.csv")
paired <- inner_join(pre, post, by = "T0_match_code", suffix = c(".pre", ".post"))

# AI-use SE delta
aise_pre  <- rowMeans(paired[, grep("^AISE_._.*\\.pre$",  names(paired))])
aise_post <- rowMeans(paired[, grep("^AISE_._.*\\.post$", names(paired))])
t.test(aise_post, aise_pre, paired = TRUE)
cohen.d(aise_post, aise_pre, paired = TRUE)

# Reliability per block
psych::omega(paired[, grep("^AISE_.\\.post$", names(paired))], nfactors = 1)
```

For paired Cohen's d in small N, report **d_z** (Lakens 2013) — not pooled d —
because the pooled denominator overstates variability when subjects are their
own controls.

---

## Reliability targets

Reported short-form alphas (lower bound; cohort-specific values may differ):

| Construct | Items | Reported α |
|---|---|---|
| UMUX | 4 | .79–.83 |
| AI-use SE | 4 | .84+ |
| Credential value (single composite) | 4 | .78+ |
| Designer identity | 4 | .85 |
| Teaching efficacy contagion | 3 | .80+ |

**Pilot N caveat**: with N = 20–50, α is unstable (95% CI often spans .50 to
.90). Report point + 95% CI (Feldt 1965) and treat any pilot α as
provisional. CFA / measurement invariance deferred to cohort 2 (N pools ≥ 150).

---

## IRB mapping (HRP-503a R3)

R3 protocol explicitly authorizes "Pre/post project surveys (UA Qualtrics)
measuring confidence in AI tool use", "demographic survey", and usability
measurement. Specifically:

| Block | R3 status | Notes |
|---|---|---|
| Demographics (Pre Block 1) | ✅ direct | "demographic survey" enumerated |
| UMUX usability (Post Block 1) | ✅ direct | H3 + structured rubric scope |
| AI-use SE — Pre baseline + Post (Blocks 2 / 2) | ✅ direct | H2 "confidence in GenAI tool use" |
| Teaching efficacy contagion (Post Block 5) | ⚠️ partial | H4 "perceived effectiveness for classroom-relevant gamelets" — recommend explicit naming in R4 |
| **Credential value perception (Post Block 3)** | ❌ not in R3 | **R4 amendment required before activation** |
| **Credential expectation (Pre Block 4)** | ❌ not in R3 | **R4 amendment required** |
| **Designer identity (Pre Block 3 + Post Block 4)** | ❌ not in R3 | **R4 amendment required** |

Sample-size note: R3 declares `n = 15–20` for the ACHE 5-session pilot scope;
the 12-session microcredential cohort evaluation may need separate amendment
or supplemental study scope expansion.

**Until R4 is approved, both surveys remain `isActive=false`. Do not activate.**

---

## Theme & branding

`apply_theme.py` layers TeachPlay branding on top of the UA-skin baseline
(`SkinLibrary: universityofalabama`, `Skin.brandingId: 5099821168` — auto-applied):

| Element | Setting |
|---|---|
| Accent color | UA Crimson `#9E1B32` (Next/Submit, progress bar, hover, accent border, links) |
| Typography | Inter / system stack, 16px Q-text, 1.55 line-height |
| Header | Crimson left-border block: "TEACHPLAY · AI-Enhanced Educational Game Design · UA, College of Education" |
| Footer | "Anonymous research instrument · No PII · UA-approved Qualtrics · IRB HRP-503a (TeachPlay)" |
| Progress bar | `VerboseText` (page N of M) |
| Back button | Enabled |
| Save & continue | Enabled (cookie-based session resume) |
| Ballot box prevention | Enabled (same-browser duplicate block) |
| Search engine indexing | `NoIndex` (UA institutional standard) |
| Browser tab title | "TeachPlay — Pre/Post-Program Survey" |

**`PUT options` is a full-replace, not partial.** Always GET → merge → PUT
(implemented in `apply_theme.py`). Forgetting this drops `SurveyProtection`,
`PartialData`, etc. and 400s.

---

## Distribution

Anonymous link with cohort tag via URL parameter:

```
https://uaedu.qualtrics.com/jfe/form/SV_9QtpyWbqTypaFls?cohort=2026-spring
                                                       ^^^^^^^^^^^^^^^^^^^
                                                       captured into EmbeddedData
```

Both surveys declare `cohort` as Survey-Flow EmbeddedData; the value lands in
exported responses alongside item answers. Recommended cohort tag pattern:
`<year>-<season>` (e.g. `2026-spring`, `2026-summer-ua`).

To activate (only after IRB R4 approval):

```python
import qualtrics_helper as qh
c = qh.Qualtrics()
c.set_active("SV_9QtpyWbqTypaFls", True)
c.set_active("SV_39sdRK7OVJvSiPk", True)
```

To create the anonymous distribution link:

```python
dist = {
    "surveyId": "SV_9QtpyWbqTypaFls",
    "linkType": "Anonymous",
    "description": "TeachPlay Pre — anonymous link",
    "action": "CreateDistribution",
    "expirationDate": "2026-12-31T23:59:59Z",
}
print(c._req("POST", "/distributions", json=dist))
```

---

## Response export (forward-looking)

Async — start → poll → download zip:

```python
import time, io, zipfile

c = qh.Qualtrics()
sv = "SV_39sdRK7OVJvSiPk"

prog = c._req("POST", f"/surveys/{sv}/export-responses",
              json={"format": "csv"})["result"]["progressId"]

while True:
    s = c._req("GET", f"/surveys/{sv}/export-responses/{prog}")["result"]
    if s["status"] == "complete": break
    if s["status"] == "failed":   raise RuntimeError(s)
    time.sleep(2)

raw = c._req("GET", f"/surveys/{sv}/export-responses/{s['fileId']}/file")
zipfile.ZipFile(io.BytesIO(raw)).extractall("./responses/")
```

(Currently inactive surveys → no responses to export. Hooked up here so the
recipe is ready when cohort 1 closes.)

---

## Known issues

| Issue | Workaround |
|---|---|
| `numeric_entry` builder 400s with "Must validate else as if was not valid" — Qualtrics `ValidNumber` schema mismatch. | T2_hours_actual converted to bucketed `mc_single`. If you need true numeric validation, build the payload manually from a working UI survey's `GET /survey-definitions/{id}` and copy the validation block verbatim. |
| `PUT /survey-definitions/{id}/options` 400s on partial body — required keys (`SurveyProtection`, `PartialData`, …) must be present. | `apply_theme.py` GET-merges before PUT. |
| `DELETE /surveys/{id}` denied by harness without explicit user authorization. | Clean up unwanted shells in the Qualtrics UI, or grant the explicit Bash permission for that endpoint. |
| Self-rule matching code (`mother+month+color`) typically pairs at 70–90%; some learners forget the rule between Pre and Post. | Display the same rule reminder at the top of Post Block 0 (already wired via `MATCHING_CODE_INSTRUCTION`). |

---

## Design decisions (why this and not that)

**Why 22 / 20 items, not 30+?**
Survey length × completion rate is monotonic — beyond ~25 substantive items,
completion drops sharply (Galesic & Bosnjak 2009). Trimmed to validated
short-forms only with each construct ≥ 3 items.

**Why UMUX, not SUS-10?**
UMUX (4-item) correlates r ≈ .80 with SUS-10 (Lewis et al. 2013) and saves
6 items. SUS retains hedonic separation; UMUX collapses to single composite —
acceptable for a static handbook + minigames where pragmatic > hedonic
matters more for the program-evaluation question.

**Why Credential value as single-composite, not 3-factor (signal/social/econ)?**
3-factor CFA needs ≥ 3 items per factor = 9 items minimum. The 22-item budget
can't carry that. Single composite α is a defensible pilot summary; cohort 2-3
pooled (N ≥ 150) supports the 9-item 3-factor expansion.

**Why Demographics in Pre, not Post?**
Single-collection minimizes respondent burden and reduces the chance of
inconsistent self-report across waves. Post collects only T0 (matching code)
+ T1/T2 (role, hours).

**Why D7 (race) as opt-in, default unselected?**
IRB equity standard. Subgroup analysis is gated on n ≥ 10 per cell (per L3
plan §Equity); collecting opt-in keeps the option open without forcing
disclosure.

---

## Next steps

1. **UI preview** — log in to UA Qualtrics → Projects → "TeachPlay — Pre/Post-Program Survey" → Preview. Verify Crimson + Inter + branded header/footer + progress bar render correctly across desktop and mobile.
2. **IRB R4 amendment** — file with UA IRB office. Add: Credential Value perception (Post Block 3), Credential Expectation (Pre Block 4), Designer Identity (Pre Block 3 + Post Block 4). Recommend explicit naming of Teaching Efficacy Contagion (Post Block 5) even though R3 H4 partly covers it.
3. **Activate after R4 approval** — `c.set_active(sv_id, True)` for each survey.
4. **Generate cohort-specific distribution links** — add `?cohort=<tag>` to the anonymous link URL.
5. **Cohort 1 close → export → analyze** — paired d_z on AISE / DI; descriptive on Credential Value / TSE; α + 95% CI per block.
6. **Cohort 2 enroll** — measure matching-code pairing rate; if < 70%, revise the rule prompt.
7. **Cohort 2-3 pooled (N ≥ 150)** — re-fit Credential value as 3-factor (signal / social / economic) via CFA; longitudinal CFA across Pre/Post for measurement invariance.

---

## References

- Bandura, A. (2006). *Guide for constructing self-efficacy scales*. In Pajares & Urdan (Eds.), *Self-efficacy beliefs of adolescents*.
- Feldt, L. S. (1965). The approximate sampling distribution of Kuder-Richardson reliability coefficient twenty. *Psychometrika*, 30(3).
- Galesic, M., & Bosnjak, M. (2009). Effects of questionnaire length on participation and indicators of response quality. *Public Opinion Quarterly*, 73(2).
- Hair, J. F., et al. (2019). *Multivariate data analysis* (8th ed.). Cengage.
- Kafai, Y. B., & Fields, D. A. (2018). Connected gaming. *MIT Press*.
- Lakens, D. (2013). Calculating and reporting effect sizes. *Frontiers in Psychology*, 4, 863.
- Lewis, J. R., Utesch, B. S., & Maher, D. E. (2013). UMUX-LITE — When there's no time for the SUS. *CHI '13*.
- Mavros, P. N. (2018). Self-generated identification codes for cohort-paired anonymous research. *Method Innovation*, 11.
- Phillips, M., & Cohen, J. (2023). The microcredential value scale. *Journal of Higher Education Outreach and Engagement*, 27(2).
- Tschannen-Moran, M., & Woolfolk Hoy, A. (2001). Teacher efficacy. *Teaching and Teacher Education*, 17(7).
- Wang, Y., et al. (2023). Generative AI self-efficacy in higher-ed instructional contexts. *Computers & Education: AI*, 4.

(Citations are pointers to the construct origins; the short-form adaptations
in `instruments.py` are documented inline next to each block. Do not cite
this README — cite the originals.)
