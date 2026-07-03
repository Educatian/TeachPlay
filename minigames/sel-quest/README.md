# Maeum Village: SEL Quest 3D (마음 마을: 사회정서 RPG)

A standalone SCORM 1.2 learning game built with plain Three.js. Learners explore
a small 3D village in third person, RPG-style, and practice the five CASEL
social-emotional competencies through branching NPC dialogue quests.

## Learning goal

Each quest targets one CASEL competency through an authentic peer scenario:

| Quest | NPC | Competency | SEL skill practiced |
| --- | --- | --- | --- |
| The Nameless Storm Cloud | Roy the apprentice archer | Self-Awareness | Noticing, naming, and body-mapping emotions |
| Volcano About to Blow | Tara the young warrior | Self-Management | Pausing, paced breathing, cool-first-talk-later |
| The Kid Standing Alone | Luka the newcomer | Social Awareness | Perspective-taking, checking interpretations against clues |
| Broken Robot, Broken Friendship? | Ember & Niko, smithy apprentices | Relationship Skills | Turn-taking, active listening, I-messages, mediation |
| The Lost Coin Pouch | Momo the errand runner | Responsible Decision-Making | Pause → options → outcomes → responsible action |

A tutorial (Sage Sera, the village mage) opens the loop and a finale ceremony closes it with a
personal report across all five competencies.

## Game systems

- Third-person 3D village built from game-ready assets (see Credits):
  animated character (idle/walk clips), low-poly buildings, tree patches,
  fountain plaza — with procedural fallbacks if a model fails to load
- Keyboard (WASD/arrows + Shift run + E + J), mouse orbit/zoom, and a touch
  joystick on mobile; ACES tone mapping, gradient sky dome, instanced
  wildflowers, confetti bursts, generative music-box soundtrack (toggleable)
- Branching dialogue with tiered choices (best/good/poor). Weak choices get
  reflective, non-punitive feedback and hand the moment back: the NPC's
  reply ends with a re-ask and the learner picks again (first answer is
  what scores; the retry is practice). Option lengths are balanced so the
  best answer can't be spotted by elaboration alone
- Learner-facing learning goals ("I can...") shown on quest accept and in
  the journal; the finale asks for a skill commitment plus the concrete
  moment to use it (implementation intention), which personalizes the
  final report
- Helped NPCs remember it: talking to them again plays a short follow-up
  line showing the skill in use in their life; the camera frames both
  speakers during conversations
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
- score = earned choice points / maximum choice points × 100; each dialogue
  node is scored once (first answer), even across reloads
- the SCO reports `cmi.core.score.raw` and sets `lesson_status` to `passed`
  (score ≥ 70 — consistently reasonable answers pass) or `completed`; a
  recorded pass or score is never downgraded within the same attempt
- `cmi.suspend_data` carries a compact JSON record: per-competency
  earned/max points and the tier picked at every dialogue node, for
  teacher-side review or later psychometric analysis

## Credits

3D models come from open-source game asset kits — the same asset
families distributed for Unity/Godot/Unreal projects:

- [KayKit Character Pack: Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0)
  (CC0) — the human characters (knight, barbarian, mage, rogues). The
  shipped GLBs are slimmed in-repo: weapon/prop nodes removed for the
  school setting and only the Idle / Walking_A / Running_A / Cheer clips
  kept (3.6 MB → ~320 KB each), quantized with KHR_mesh_quantization.
- [Kenney Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer)
  (MIT) — `flag.glb`, plus the robot `character.glb` kept as a fallback.
- [Kenney Starter Kit City Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder)
  (MIT) — buildings, fountain, tree patches.

License texts ship with the package (`assets/LICENSE-kenney.md`,
`assets/LICENSE-kaykit.txt`). Three.js (MIT) is vendored under
`vendor/three/`.

## Content safety

All scenarios are synthetic peer-conflict vignettes written for upper
elementary / middle school SEL practice. Poor choices never punish the player;
NPCs model reflective correction instead.
