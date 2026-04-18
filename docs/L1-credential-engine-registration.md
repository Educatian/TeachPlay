# L1 · Credential Engine / CTDL Registry Registration

Design note for registering the *AI-enhanced Educational Game Design* microcredential in the Credential Engine registry, using the Credential Transparency Description Language (CTDL).

Status: **design-only**. No code. No API keys. The steps below are what we would do; each requires institutional sign-off (registrar + provost) before execution.

---

## What and why

Credential Engine ([credentialengine.org](https://credentialengine.org/)) is the U.S.-centric public registry of credentials. Everything in the registry is expressed in CTDL, a Linked Data vocabulary that lets employers, state workforce agencies, and articulation systems reason about credentials programmatically. Registration puts our micro on the same structural footing as a BLS-recognized certification — not as an authority signal, but as a *transferability* signal.

Peer institutions already registered: Penn State Digital Badges, ASU's Trusted Learner Network outputs, Western Governors competencies, Northeastern microcredentials.

## CTDL shape we would publish

CTDL is *not* Open Badges. They describe different things:

| Question | Open Badges v3 | CTDL |
| --- | --- | --- |
| What did this one learner achieve? | Yes (AchievementCredential) | No |
| What does this credential mean? | Partial | Yes (Credential, LearningOpportunityProfile) |
| Is this credential recognized, and by whom? | No | Yes (QACredentialOrganization) |
| What skills does it prove? | Alignment block | Competency / CompetencyFramework |

Our registration would publish four CTDL resources:

1. **`ceterms:MicroCredential`** — the credential itself, with CTID, name, description, issuance URL (our `credential/badge-class-v3.json`), target type `ceterms:Microcredential`, and `ceterms:estimatedDuration` of 36 contact hours over 12 sessions.
2. **`ceterms:LearningOpportunityProfile`** — the 12-session course delivery, with per-session objectives.
3. **`ceasn:CompetencyFramework`** — the 25 rubric criteria published as a framework. This is the piece that makes our rubric machine-readable against ESCO and Lightcast.
4. **`ceterms:QACredentialOrganization`** — the College of Education's quality-assurance role, citing the annual rubric audit and the appeal path published in `credential.html`.

Each resource gets a **CTID** (a UUID-based stable identifier) that other systems cite. The CTID is *issued by the registry*, not by us; it's how employer wallets and articulation software find us.

## Field-by-field mapping

| CTDL field | Source of truth |
| --- | --- |
| `ceterms:name` | `credential/badge-class-v3.json` · `name` |
| `ceterms:description` | `credential/badge-class-v3.json` · `description` |
| `ceterms:subjectWebpage` | `https://teachplay.dev/credential.html` |
| `ceterms:image` | `credential/badge.svg` |
| `ceterms:ownedBy` | Issuer organization resource (College of Education) |
| `ceterms:credentialStatusType` | `ceterms:Active` (update annually after rubric audit) |
| `ceterms:hasAssessment` | Pointer to a CTDL `Assessment` resource derived from `rubrics.html` |
| `ceterms:requires` | `ceterms:ConditionProfile` citing the 25-criterion non-compensatory floor |
| `ceterms:estimatedDuration` | `PT36H` (ISO-8601) over 12 weeks |
| `ceterms:occupationType` | ONET SOC codes relevant to instructional design |
| `ceasn:teaches` | Each rubric criterion expressed as `ceasn:Competency`, with `ceasn:codedNotation` matching the rubric ref (e.g. `D3.iteration_log`) |
| `ceterms:alignmentObject` | ESCO + Lightcast skill URIs from `credential/skills-crosswalk.json` |

## Registration workflow

1. **Prerequisite: organizational profile.** The College of Education registers as a `ceterms:CredentialOrganization`. This requires name, homepage, contact email, and a list of credentials the org issues. One-time.
2. **Request API access.** Credential Engine issues organization-scoped API keys for the publisher endpoint. A registrar or authorized credential officer submits.
3. **Author CTDL JSON-LD.** Four resource files — we would stage them in `docs/ctdl/` for review before publication. A CTDL validator runs each file against the schema; errors are reported as path+severity.
4. **Publish via API.** POST each resource to the Registry Assistant; the registry mints CTIDs and returns canonical URIs.
5. **Add CTIDs back to our pages.** The CTID becomes a permanent link from `credential.html` (&ldquo;Registered in the Credential Engine Registry: ce-UUID&rdquo;) and from the OBv3 badge-class alignment block.
6. **Annual review.** After each rubric audit, re-publish any changed fields; the registry versions records so employers can see what changed and when.

## What this buys us

- **Transferability signal.** An articulation counselor at a partner university can read the CTDL and know what our rubric actually demands — not just that we offer a badge called *Educational Game Design*.
- **Discoverability in employer platforms.** Workday, Eightfold, and state workforce portals increasingly ingest CTDL to present credentials as evidence for hiring-manager filters.
- **Cross-reference with ESCO / Lightcast.** The `ceterms:alignmentObject` links make the credential readable in non-U.S. labor market taxonomies.
- **Stackable pathway machine-readability.** The MEd-credit articulation described in `credential.html#stacking` becomes an actual `ceterms:isPartOf` relationship between our micro and the MEd program, once both are registered.

## What this does *not* buy us

- CTDL registration is not accreditation. It does not validate rubric rigor. It only asserts that we have published our rubric in a format others can read.
- The registry does not sign credentials. That is still the OBv3 / VC pipeline's job.
- There is no automatic employer acceptance. Registration helps a hiring manager who already wants to look; it does not create demand.

## Open questions before we register

- **Org-level governance.** Does the College of Education want the credential under its own org profile, or under a central UA institutional org? Affects who has publisher rights.
- **CTID migration risk.** If we restructure the program (e.g., v3 with different deliverables), the CTID stays but field contents change. We need a written policy on what change triggers versioning vs. retirement.
- **Translation scope.** CTDL is English-centric in the registry today. If we want to signal to non-U.S. employers via ESCO, the skills-crosswalk alignment is load-bearing and must be maintained.

## Files this connects to

- `credential/badge-class-v3.json` — OBv3 Achievement (what a learner earns)
- `credential/skills-crosswalk.json` — ESCO / Lightcast mapping (the competency framework source)
- `credential.html#stacking` — stackable pathway (future `ceterms:isPartOf`)
- `rubrics.html` — the criteria published in the registry `ceterms:hasAssessment`
