# AI-enhanced Educational Game Design — Microcredential Handbook

Static handbook for The University of Alabama's AI-enhanced Educational Game Design microcredential (v2, 12 sessions, ~36 contact hours). Vanilla HTML/CSS/JS — no build step required for the shell. Two embedded interactive labs (SCORM packages) live under `minigames/`.

## Run locally

```
cd microcredential
python -m http.server 8099
```

Open http://localhost:8099/ — the landing page is `index.html`. The preview launch config at `.claude/launch.json` starts the same server for in-editor preview.

## Structure

```
index.html             Landing page: hero, sessions grid, deliverables
resources.html         Resource library + #labs section
read.html              Markdown viewer for companion handouts
session-01.html …      12 session pages (weekly content)
  session-12.html
handbook.css           Shared styles (incl. @media print at 1886)
shell.js               Sidebar, session grid, checklist + ticket persistence
minigames.js           Injects inline minigames via [data-minigame="sXX"]
animations.jsx         React/Babel animations for shell content
scenes.jsx             Three.js ES-module scenes
resources/             12 markdown handouts (01–12)
minigames/
  orbit-sum-lab/       SCORM · React/Vite practice-loop lab
  electric-circuit-lab/ SCORM · Three.js hero-scene lab
screenshots/           Screenshot assets
assets/                Shared static assets
```

## Session ↔ Lab pairings

- **S3 Objectives & crosswalk** → Orbit Sum Lab (worked crosswalk case)
- **S8 Interaction spec** → Electric Circuit Lab (Three.js reference impl)
- **S10 Audit** → both labs (audit subjects for accessibility, QA, data)
- **resources.html#labs** → both labs (library entry)

## Persistence

All progress is stored in `localStorage` on the visitor's browser:

- `hb:s{n}:chk:{id}` — checklist item state per session
- `hb:s{n}:ticket:{id}` — exit-ticket textarea content
- `hb:done` — set of sessions marked complete

No server component, no analytics. Clearing site data resets progress.

## Print / PDF

Each session page has a "Print / PDF" button. Print CSS (`handbook.css:1886`) hides sidebar/toolbar/nav, expands content to full width, and avoids page breaks inside blocks.

## Adding a new handout

1. Drop `resources/NN-slug.md` into the `resources/` folder.
2. Add a `.resource` card to the relevant session's Companion reading section with:
   - `href="read.html?doc=NN-slug.md"` on the Read button
   - `href="resources/NN-slug.md" download` on the Download button
3. Add a matching entry to the `resources.html` library grid.

## Adding a new lab

1. Unpack the SCORM package into `minigames/<slug>/`.
2. Pick the session whose learning objective the lab exemplifies.
3. Add a `.resource` card inside that session's `#reading` block — use the `A` (green) or `B` (blue) badge convention established in S3/S8/S10.
4. Also add a card to `resources.html#labs` so the library stays complete.
