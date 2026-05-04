# TeachPlay Module Video Plan

TeachPlay now uses one two-host primer per session. The videos are short dialogue explainers, not narrated slide decks. Mira speaks as the learning designer; Jon speaks as the game designer. Each video introduces the session's core design move, gives three visual anchors, and ends with one principle.

## Runtime and Embedding

- Runtime shell: `module-video.html?m=<session-number>`
- Scene source: `talk_scenes.jsx`
- Shared animation utilities: `animations.jsx`
- Automatic embedding: `shell.js` injects a `.video-slot` after each session's outcomes block when the page does not already contain a module video.
- Session 01 keeps its named entry point, `The Engagement Trap.html`, now repaired to use `talk_scenes.jsx`.
- `The Crosswalk.html` is kept as a named standalone entry point for the Session 03 crosswalk concept.

## Video Inventory

| Session | Video focus | Core principle |
| --- | --- | --- |
| 01 Framing | Engagement trap; about vs experience vs teach | Name the learner behavior, then design the play |
| 02 Learner and context | Concrete learner, constraint, evidence | Design for a concrete learner, not an imagined average |
| 03 Objectives and crosswalk | Objective type to mechanic fit | Design from the objective, not from the mechanic |
| 04 Mechanics I | Challenge, feedback, productive failure | Make failure informative, not punitive |
| 05 Mechanics II | Narrative, role, collaboration | Role is a constraint, not decoration |
| 06 Facilitator design | Run-ready guide and recovery moves | Facilitation is part of the design |
| 07 Low-fi prototyping | Paper loop, silent playtest, revision | Prototype the loop, not the fantasy |
| 08 Interaction spec | State, event, feedback map | Name the state changes, then build |
| 09 Playtest design | Target learners and falsifiable hypotheses | Test the risky claim, not the easy one |
| 10 Audit | Reward, load, access, ethics, data | Audit the incentives, then revise the loop |
| 11 Revision studio | Evidence, impact, effort triage | Ship the highest-leverage changes |
| 12 Final presentations | Claim, evidence, limits | Make the claim and show the evidence |

## Optional MP4 Export

The website currently uploads and serves the videos as editable HTML animation routes. If a later LMS or social upload requires fixed MP4 files, render each `module-video.html?m=<n>` route at 1920x1080, 45 seconds, then replace the iframe source with a `<video>` element or hosted MP4 URL. Keep the current iframe route as the editable source of truth.
