# L2 · LTI 1.3 integration — design note

Design-only. No code. The goal is to document what LTI 1.3 integration would do for this microcredential if we moved from a self-hosted handbook into a real LMS (Canvas / Blackboard / Moodle / Brightspace) deployment, and to name the decisions the College of Education would have to make before that step is worth building.

Status: **design-only**. The current handbook uses a localStorage-backed role toggle (`role.js`) that hides UI but does not block URL access — fine for a reference implementation, insufficient for enrollment-bound delivery.

---

## What LTI 1.3 replaces

The current reference implementation has three gaps that LTI closes:

| Gap | Today | With LTI 1.3 |
| --- | --- | --- |
| **Identity** | Pseudonymous UUID generated in browser (`hb:xapi:actor`) | Real learner identity from the LMS via `sub` claim + roster sync |
| **Role** | Self-select pill switch (`Student ⇄ Instructor`) | LMS-asserted role claim (`http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor`) |
| **Gradebook** | None — completions live in localStorage | Grades posted to LMS gradebook via Assignment and Grade Services (AGS) |
| **Roster** | None | Roster read via Names and Role Provisioning Services (NRPS) |
| **Enforcement** | UI-level hiding only | OIDC-authenticated tool launch; URL access is gated by tool registration |

## Architecture at a glance

```
Learner clicks "Open Handbook" in LMS
       │
       ▼
[ LMS ] ──(1. OIDC login initiation)──► [ Handbook tool launch endpoint ]
       ◄──(2. auth request)─────────────
       ──(3. id_token / launch JWT)───►
       ◄──(4. redirect to deep link / resource)
       
Behind the scenes, as learner works:
[ Handbook ] ──(AGS: lineitem + score)──► [ LMS gradebook ]
[ Handbook ] ──(NRPS: roster fetch)────► [ LMS membership service ]
[ Handbook ] ──(xAPI: events)──────────► [ LRS ] (unchanged)
```

The handbook becomes an LTI 1.3 *tool*. The LMS is the *platform*. Learners launch the tool from the LMS; they do not browse directly to handbook URLs.

## Decisions that must be made before we build

1. **Which LMS is authoritative?** UA uses Blackboard institution-wide. College-of-Education-specific deployments may use Canvas for graduate programs. LTI 1.3 works across all four major platforms, but platform quirks (Blackboard's AGS latency, Canvas's tool-placement verbs) shape 10–20% of the work. Pick one; support others later.
2. **Tool placement.** LTI allows launching from course nav, assignments, modules, or the editor. Recommend *course nav + per-deliverable assignment placements* so the LMS gradebook carries D1–D5 grades as line items and the handbook itself is a course-nav link.
3. **Grade granularity.** Two options:
   - **Five line items** — one per deliverable (D1–D5), scored pass/fail at Proficient. Registrar-friendly; no mid-flight grades.
   - **Twenty-five line items** — one per rubric criterion. Richer gradebook, but many LMS gradebooks become unusable with >10 line items per course.
   Recommend the five-line-item model; publish the 25-criterion detail on the handbook page, not the LMS gradebook.
4. **Roster privacy.** NRPS gives us learner email, name, and role. We must decide what to persist. Current posture: do not persist NRPS responses — fetch on demand for facilitator views, and use a cohort-scoped pseudonym in xAPI as we do today.
5. **Deep linking vs course nav.** Deep linking lets instructors drop a specific session or deliverable into a module. Worth the small extra engineering because it matches how instructors actually build course pages.
6. **Tool lifecycle.** Who rotates the tool's signing key? When the annual rubric audit changes a line item's point value, do already-issued grades migrate? Policy questions — should be answered in writing before any code ships.

## Role claims we would trust

LTI 1.3 carries membership roles in the launch JWT. The handbook would:

- Treat any role containing `#Instructor`, `#ContentDeveloper`, `#TeachingAssistant` as instructor.
- Treat `#Learner` as student.
- Treat everything else as read-only guest (observer roles, admins).

The `role.js` pill switch stays as an override *only when the launch JWT carries an instructor role*. A learner cannot flip into instructor mode by clicking a UI button; they would need to re-launch from the LMS with an instructor-level LTI claim, which the LMS will not grant them.

## AGS: what grades look like

Each deliverable becomes an LTI line item:

```
{
  "scoreMaximum": 1.0,
  "label": "D1 · Design Problem Statement",
  "resourceId": "teachplay:d1",
  "tag": "microcredential-d1",
  "scoreGivenOn": "<instructor review date>",
  "scoreGiven": 1.0,     // if Proficient on all 5 criteria
  "activityProgress": "Completed",
  "gradingProgress": "FullyGraded",
  "comment": "Proficient on all 5 criteria. See rubric detail at <handbook URL>#d1."
}
```

Key property: `scoreGiven` is binary (0 or 1) because the microcredential is non-compensatory. A learner at Developing on one criterion is `scoreGiven: 0`, `gradingProgress: PendingManual` until they revise. We do not post partial credit.

## NRPS: what the roster gives us

NRPS returns the enrolled members of the course context. For this microcredential we use it only for the *facilitator view* — so the instructor can see which learners haven't started S1 yet, which are behind on D3, etc. We do not persist NRPS data past session end.

## Keeping xAPI on the outside

Even with LTI 1.3, the xAPI queue remains the source of truth for learning analytics. LTI is for *enrollment and grading*; xAPI is for *behavior*. The two intersect at actor identity:

- Without LTI: actor = pseudonymous UUID in browser
- With LTI: actor = `sub` claim from the LMS (still pseudonymous-to-us if we never resolve it against NRPS)

The rest of `analytics.html` (heatmap, funnel, κ reliability, skills growth) works identically either way. Losing localStorage persistence (because learners now flow through an LMS-launched iframe on multiple devices) is the main wrinkle; we solve it by writing the xAPI queue server-side, keyed on `sub`.

## What this does *not* solve

- **Institution-level credential signing.** The OBv3 signing pipeline is orthogonal — LTI hands us learner identity, but the issuer key stays under the College's control.
- **Cross-institution transfer.** If a learner from another institution wants to take the course, they still need a guest account or an external LTI registration. LTI does not magically federate.
- **Accessibility.** LTI integration does not change our UDL obligations — all the WCAG work is handbook-side and unchanged.

## Estimated effort

- Tool registration + OIDC launch + role claim enforcement: ~1 week
- AGS grade posting for 5 line items: ~1 week
- NRPS roster fetch + facilitator view wiring: ~3–4 days
- Deep linking picker: ~3–4 days
- Test against Blackboard + Canvas sandboxes: ~1 week
- Documentation + instructor onboarding materials: ~3–4 days

**Total: ~4–5 engineer-weeks** for a single-LMS production deployment. Multiply by ~1.3 per additional platform, because the edges differ.

## Files this would touch

- New `lti/launch.js` (OIDC launch handler — server-side)
- New `lti/ags.js` (grade posting)
- New `lti/nrps.js` (roster fetch)
- `role.js` — gated on LTI role claim when present
- `xapi.js` — actor resolution changes
- `analytics.html` — facilitator roster view
- `shell.js` — launch-context awareness
