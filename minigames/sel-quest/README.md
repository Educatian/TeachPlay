# Maeum Village: SEL Quest 3D (마음 마을: 사회정서 RPG)

A standalone SCORM 1.2 learning game built with plain Three.js. Learners explore
a small 3D village in third person, RPG-style, and practice the five CASEL
social-emotional competencies through branching NPC dialogue quests.

## Learning goal

Each quest targets one CASEL competency through an authentic peer scenario:

| Quest | NPC | Competency | SEL skill practiced |
| --- | --- | --- | --- |
| The Nameless Storm Cloud | Jiho | Self-Awareness | Noticing, naming, and body-mapping emotions |
| Volcano About to Blow | Yuna | Self-Management | Pausing, paced breathing, cool-first-talk-later |
| The Kid Standing Alone | Minjun | Social Awareness | Perspective-taking, checking interpretations against clues |
| Broken Robot, Broken Friendship? | Sora & Taeo | Relationship Skills | Turn-taking, active listening, I-messages, mediation |
| The Lost Wallet | Doyun | Responsible Decision-Making | Pause → options → outcomes → responsible action |

A tutorial (Ms. Hana) opens the loop and a finale ceremony closes it with a
personal report across all five competencies.

## Game systems

- Third-person 3D village built from game-ready assets (see Credits):
  animated character (idle/walk clips), low-poly buildings, tree patches,
  fountain plaza — with procedural fallbacks if a model fails to load
- Keyboard (WASD/arrows + Shift run + E + J), mouse orbit/zoom, and a touch
  joystick on mobile; ACES tone mapping, gradient sky dome, instanced
  wildflowers, confetti bursts, generative music-box soundtrack (toggleable)
- Branching dialogue with tiered choices (best/good/poor). Weak choices get
  reflective, non-punitive feedback and the scene continues
- RPG progression: XP, levels, per-competency progress bars, quest markers
  (`!` available, `…` active, `✓` complete), quest journal
- Fully bilingual (Korean/English) with an in-game toggle; UI, dialogue, and
  3D name labels all switch live
- Progress persists in `localStorage`; the SCO can be resumed
- Final report: per-competency percentages, overall score, grade
  (S/A/B as Heart Guardian / Explorer / Sprout)

## Interactions included

- free 3D roaming with collision, camera orbit, NPC proximity prompts
- clicking/tapping NPCs or pressing E to talk
- dialogue choices with immediate feedback and floating XP
- quest tracker, journal overlay, final report overlay
- SCORM score and completion reporting

## Local preview

```bash
cd TeachPlay
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/minigames/sel-quest/`.

## Completion logic

- learners finish the tutorial, all five competency quests, and the finale
- score = earned choice points / maximum choice points × 100
- the SCO reports `cmi.core.score.raw` and sets `lesson_status` to `passed`
  (score ≥ 80, matching the manifest mastery score) or `completed`

## Credits

3D models come from Kenney's open-source starter kits — the same
asset family distributed for Unity/Godot/Unreal projects:

- [Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer)
  (`character.glb`, `flag.glb`)
- [Starter Kit City Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder)
  (buildings, fountain, tree patches)

Both are MIT licensed; the license text ships with the package at
`assets/LICENSE-kenney.md`. Three.js (MIT) is vendored under `vendor/three/`.

## Content safety

All scenarios are synthetic peer-conflict vignettes written for upper
elementary / middle school SEL practice. Poor choices never punish the player;
NPCs model reflective correction instead.
