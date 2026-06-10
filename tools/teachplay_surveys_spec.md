# TeachPlay Microcredential — Qualtrics survey-gated credentialing spec

Built by `tools/build_teachplay_surveys.py` against datacenter **az1**.

## Gate policy

**Completion/submission, NOT consent-yes.** Submitting either form passes the
gate. The research-data-use questions inside the forms are OPT-IN and never block
the credential and never screen anyone out. There is no screen-out branch.

| Touchpoint | Survey | Gates |
|---|---|---|
| PRE  | Informed Consent & Start | program START (can't begin sessions) |
| POST | Completion Survey | certificate CLAIM (can't claim cert) |

## Survey IDs + anonymous links (datacenter az1)

| | Survey ID | Anonymous link |
|---|---|---|
| PRE / consent | `SV_56GYSEQ2PqvFYTY` | https://az1.qualtrics.com/jfe/form/SV_56GYSEQ2PqvFYTY |
| POST / completion | `SV_8uoREQqBiHUWvZk` | https://az1.qualtrics.com/jfe/form/SV_8uoREQqBiHUWvZk |

Both are PUBLISHED + ACTIVE; both anon links resolve HTTP 200.

## Embedded data fields (captured from the link query string)

Both surveys declare, at the TOP of the flow, exactly:
`learner_id`, `sig`, `cohort` (type=Recipient, bound from the query string).

TeachPlay's signed link appends `?learner_id=<id>&sig=<HMAC>&cohort=<c>` so these
land in the response and are echoed back on the end-of-survey redirect.

## End-of-survey redirect

Set via the **flow** (an `EndSurvey` element, `EndingType: "Advanced"`,
`Options.SurveyTermination: "Redirect"`, `Options.EOSRedirectURL: <url>`).

> NOTE — the survey-**options** API (`PUT /survey-definitions/{sid}/options`) on
> this Qualtrics brand REJECTS `EOSRedirectURL` / `EOSRedirect` /
> `EOSMessageOptions` (400 "Additional property ... is not allowed"). The
> reliable API path is the flow EndSurvey element used here; it round-trips on
> GET. No manual dashboard step is required — the redirect was set and verified
> programmatically.

- PRE  → `https://teachplay.dev/api/consent-complete?learner_id=${e://Field/learner_id}&sig=${e://Field/sig}&rid=${e://Field/ResponseID}`
- POST → `https://teachplay.dev/api/survey-complete?learner_id=${e://Field/learner_id}&sig=${e://Field/sig}&rid=${e://Field/ResponseID}`

Both verified present via `GET /survey-definitions/{sid}/flow`.

### If you ever need to set the redirect by hand (dashboard fallback)
Survey → **Survey flow** → **+ Add a New Element Here** → **End of Survey** →
Customize → **Override Survey Options** → **Redirect to a URL** → paste the URL
above (with the `${e://Field/...}` piped fields). Save flow → Publish.

## Question inventory

### PRE — Informed Consent & Start (`SV_56GYSEQ2PqvFYTY`)
- `consent_intro` (descriptive): program + de-identified-data handling, voluntary
  participation, PI contact jmoon19@ua.edu, **IRB protocol PLACEHOLDER** (see
  residuals), data-handling description.
- `ack_read` (single choice): "I have read and understand."
- `consent_research` (opt-in, Yes/No): use my de-identified data for research.
- `consent_followup` (opt-in, Yes/No): contact me for follow-up research.

No screen-out branch — everyone who submits passes the start gate.

### POST — Completion Survey (`SV_8uoREQqBiHUWvZk`)
- `satisfaction` (1–5 single choice).
- `nps_recommend` (0–10 NPS single choice).
- `comp_gain` (Likert matrix): objective→mechanic→evidence alignment; run a
  5-minute playtest & use the evidence; use AI with human-in-the-loop + provenance.
- `component_use` (Likert matrix, usefulness scale): written sessions/handbook,
  concept-primer videos, portfolio/evidence work, AI design tools.
- `workload` (single choice buckets): <10 / 10–20 / 21–35 / 36–50 / >50 hours.
- `consent_research`, `consent_followup` (same two opt-in items as PRE).
- `most_valuable`, `improve` (open-ended).

## Token handling
- Token + DC read PROGRAMMATICALLY from the inline `TOKEN`/`DC` in
  `C:\Users\jewoo\Projects\AIMedia_IRB\build_surveys_v2.py` — never echoed.
- The credential file `C:\Users\jewoo\Desktop\token_qualtrics.txt` (which the
  survey-build skill expects) is restored by the script if missing — token value
  only, written to that file, never to the transcript/repo.

## Worker secrets the survey gate needs (USER must set)
See README "Survey-gated credentialing" for the exact `wrangler secret put`
commands. Until they are set the gate FEATURE-DETECTS OFF (no lockout).
- `QUALTRICS_TOKEN`        = the az1 API token
- `QUALTRICS_CONSENT_SID`  = `SV_56GYSEQ2PqvFYTY`
- `QUALTRICS_POST_SID`     = `SV_8uoREQqBiHUWvZk`
- (`QUALTRICS_DC` defaults to `az1`; `WORKER_SECRET` optional — HMAC falls back
  to `ISSUER_API_KEY`.)
