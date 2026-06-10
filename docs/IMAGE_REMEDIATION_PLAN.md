# Image Remediation Plan — weak AI-generated course images

**Status:** plan for the user to approve / execute. This document does **not**
regenerate or replace any image; it specifies what to replace, with what, and by
which production method.

**Date:** 2026-06-10
**Scope:** the two weak diffusion-generated instructional images in
`app/images/course/`. Atmospheric / non-instructional art is out of scope.

---

## The core finding (grounds every method recommendation)

The images that actually *teach* on this site are **vector / code-drawn**, not
diffusion output. Compare:

- **Strong (keep, match this style):** `assets/generated/s04-loop-anatomy.png`,
  `s01-loop-vs-activity.png`, `s08-state-machine-sketch.png`,
  `s09-evidence-loop.png`, and the hand-authored SVGs `api-call-flow.svg`,
  `perception-efficacy-quadrant.svg`, `workflow-overview.svg`. These have crisp
  serif/clean labels, a consistent crimson-on-cream palette, real annotation
  callouts, and correct geometry because they were drawn in SVG / code.
- **Weak (replace):** `learning_mechanic_triangle.png`,
  `genai_prototyping_workflow.png`. Both are diffusion (SDXL-style) raster art.

**Why diffusion is the wrong tool here:** diffusion image models (SDXL,
Higgsfield, etc.) **cannot render crisp labels or text reliably**. They produce
garbled glyphs (see `genai_prototyping_workflow.png`'s distorted "CONSTRAIN")
and they cannot be held to a precise, correct diagram geometry (see the
"triangle" that is actually a circle). An instructional diagram whose entire job
is to label and relate concepts must therefore be **redrawn as a vector / code
figure**, not regenerated with a better prompt. Reserve diffusion only for
**textless atmospheric art**.

**Recommended production methods (in priority order):**

1. **Hand-authored SVG** — best for labeled conceptual diagrams (loops,
   triangles, node-and-arrow). Matches the existing `*.svg` assets exactly,
   stays crisp at any zoom, is diffable in git, and is accessible (text is real
   text). This is the recommended method for both images below.
2. **Code-generated figure** (matplotlib → PNG, or an HTML/CSS diagram captured
   to PNG via the repo's existing headless-Chromium tooling) — acceptable
   alternative if an SVG-by-hand is impractical for a given figure.
3. **Diffusion (SDXL / Higgsfield)** — only for purely decorative, **text-free**
   atmospheric backgrounds. Never for a figure that carries labels.

**House style to match** (from the strong assets):
- Background `#fdf8f5` / cream (`#f4f3f0`).
- Primary stroke crimson `#be1a2f` (UA crimson); secondary ink near-black `#161616`.
- Labels: serif display for titles (Georgia / the site `--font-display`),
  clean sans (Inter) for node labels and callouts; uppercase node labels with
  letter-spacing, matching `s04-loop-anatomy.png`.
- Thin grey annotation leader-lines to short notes, as in `s04-loop-anatomy.png`.

---

## Image 1 — `learning_mechanic_triangle.png`

**What's wrong**
- It is named a **triangle** but drawn as a **circle** of three icons connected
  by a circular arrow — the geometry contradicts the label.
- The three nodes are **unlabeled icons only** (a brain-with-gears, a
  game-controller-with-gear, a clipboard-with-chart). A learner cannot tell what
  the three vertices *are* or what the relationship between them is. It teaches
  nothing.
- Decorative doodle background (books, globe, mortarboard, magnifier) adds visual
  noise with no instructional value.
- Diffusion raster: cannot be corrected by re-prompting because the failure is
  conceptual (no labels, wrong shape), not aesthetic.

**Target**
- A genuine **labeled triangle** (three vertices, three edges) in the crimson-on-
  cream style of `s04-loop-anatomy.png`. The three vertices are the
  objective→mechanic→evidence triad this course teaches (consistent with the D2
  "Objective × Mechanic Crosswalk" and the xapi `rubricCriterion`/crosswalk
  vocabulary): **Learning Objective**, **Game Mechanic**, **Evidence of
  Learning**, with each edge labeled by the relationship the rubric requires
  (objective→mechanic = "alignment rationale"; mechanic→evidence = "observable
  signal"; evidence→objective = "claim it supports"). Confirm the exact triad
  with the instructor before drawing, since this is the conceptual spine of D2.

**Right production method:** hand-authored **SVG** (method 1). A triangle with
three text labels and three edge labels is trivial and crisp in SVG and
impossible to do reliably in diffusion. Save as
`assets/generated/learning-mechanic-triangle.svg` (and an optional PNG export for
contexts that need raster), matching the naming of the other `assets/generated`
figures.

**Exact alt-text the replacement should carry:**
> "Triangle diagram of the objective–mechanic–evidence relationship: a Learning
> Objective vertex, a Game Mechanic vertex, and an Evidence-of-Learning vertex,
> connected by labeled edges — alignment rationale, observable signal, and the
> claim the evidence supports."

---

## Image 2 — `genai_prototyping_workflow.png`

**What's wrong**
- The label **"CONSTRAIN" is rendered as a distorted / garbled glyph** — the
  classic diffusion text-rendering failure. The other labels (GENERATE, VERIFY,
  ITERATE, LOG, HUMAN-IN-THE-LOOP) are legible but inconsistent in weight and
  partly warped.
- The arrow flow is decorative rather than precise; it is hard to read the actual
  cycle order (Generate → Verify → Constrain → Iterate → Log → back) from the
  overlapping ribbons.
- Diffusion raster: the text defect is unfixable by re-prompting.

**Target**
- A clean **labeled cycle diagram** (5 steps around a "Human in the loop" hub) in
  the same crimson-on-cream style as `s09-evidence-loop.png` /
  `workflow-overview.svg`: **Generate → Verify → Constrain → Iterate → Log**,
  arrows showing the loop direction, a central "Human in the loop" node, and a
  short caption per step. All text must be real, crisp, correctly spelled.

**Right production method:** hand-authored **SVG** (method 1), or the HTML/CSS-to-
PNG path (method 2) if a designer prefers CSS layout. Either way the labels are
real text, so "CONSTRAIN" can never garble again. Save as
`assets/generated/genai-prototyping-workflow.svg`.

**Exact alt-text the replacement should carry:**
> "AI-assisted prototyping workflow as a five-step cycle around a human-in-the-
> loop hub: Generate, Verify, Constrain, Iterate, and Log, with arrows showing
> the repeating loop and the human retaining judgment at each step."

---

## Checklist (per image, before it ships)

- [ ] Confirm the conceptual content with the instructor (esp. the D2 triad for
      Image 1) — the diagram must match what the course actually teaches.
- [ ] Produce the figure as **SVG** (preferred) or code-generated PNG — **not**
      diffusion.
- [ ] Palette: cream background, crimson `#be1a2f` primary, near-black ink.
- [ ] All labels are **real, crisp, correctly spelled** text (no raster glyphs).
- [ ] Geometry matches the name (triangle is a triangle; cycle reads in order).
- [ ] Add the exact alt-text above to every `<img>` that uses the figure.
- [ ] Place under `assets/generated/` with kebab-case naming to match siblings.
- [ ] Remove the orphaned `app/images/course/*.png` weak files once replaced, or
      repoint any reference to the new asset (the two weak files are not
      referenced by current HTML/JS, so this is cleanup, not a hot-swap).
- [ ] Re-run `npm run build` (search index / sitemap) and the a11y spec so the
      new alt-text is indexed and checked.

## Note on the other two `app/images/course/` PNGs

`gagne_nine_events.png` and `ethics_governance.png` are also diffusion raster and
also unreferenced by current source. They are **not** in this remediation scope
because they were not flagged as actively misleading. If the instructor wants
them surfaced to learners, apply the same rule: redraw as labeled SVG, do not
re-prompt diffusion.
