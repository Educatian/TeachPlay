# Performance And Device Test Pack

<div style="border:2px solid #A16207; background:#FFF9F2; padding:18px; border-radius:10px; margin:12px 0;">
  <div style="font-size:22px; font-weight:700; color:#A16207;">Facilitator Handout 11</div>
  <div style="margin-top:8px;"><strong>Module Focus:</strong> performance, device coverage, interaction reliability, and test planning for browser-based educational games and simulations</div>
  <div><strong>Best Use:</strong> use this handout when teams move from conceptually successful prototypes to systems that need to load, respond, and behave reliably across real devices and contexts</div>
  <div><strong>Atlas:</strong> <a href="/C:/Users/jewoo/Documents/Playground/educational-game-design-resource-pack-en/00-master-curriculum-atlas.md">Master Curriculum Atlas</a></div>
</div>

<table>
  <tr>
    <td style="background:#123B5D; color:#FFFFFF; padding:6px 10px;"><strong>[FRAME]</strong></td>
    <td style="background:#0F766E; color:#FFFFFF; padding:6px 10px;"><strong>[MAP]</strong></td>
    <td style="background:#A16207; color:#FFFFFF; padding:6px 10px;"><strong>[ACTION]</strong></td>
    <td style="background:#2F855A; color:#FFFFFF; padding:6px 10px;"><strong>[CHECK]</strong></td>
    <td style="background:#7C3AED; color:#FFFFFF; padding:6px 10px;"><strong>[EVIDENCE]</strong></td>
    <td style="background:#B42318; color:#FFFFFF; padding:6px 10px;"><strong>[RISK]</strong></td>
    <td style="background:#334155; color:#FFFFFF; padding:6px 10px;"><strong>[LINKS]</strong></td>
  </tr>
</table>

<div style="border-left:4px solid #A16207; background:#FFFCF7; padding:12px 14px; margin:14px 0;">
  <strong>Reliability Lens</strong><br/>
  In educational prototypes, performance is not only a technical quality issue. Slow load, delayed response, or unstable layout can distort learner attention, confidence, and the validity of your playtest evidence.
</div>

## [FRAME] Purpose

This handout helps teams test whether a browser-based learning game or simulation is:

- loading fast enough
- responding clearly enough
- stable enough across devices
- usable with different input modes
- trustworthy enough for formal playtesting

It is especially relevant for `Three.js`, canvas, or other interaction-heavy browser projects.

## [FRAME] Why Performance Is A Learning Issue

When a prototype stutters, delays, or misreads input, teams often misinterpret the results:

- learners appear confused when the interface is actually lagging
- learners appear unmotivated when load time is breaking momentum
- learners appear inaccurate when touch targets are unreliable

That means performance issues can contaminate both `engagement evidence` and `learning evidence`.

## [MAP] Performance Review Loop

```mermaid
flowchart LR
    A["Build prototype"] --> B["Measure load, interaction, stability"]
    B --> C["Test on real devices"]
    C --> D["Observe learner behavior"]
    D --> E["Separate design problems from runtime problems"]
    E --> F["Revise code and content"]
    F --> B
```

## [MAP] Device And Input Coverage

```mermaid
flowchart TD
    A["Browser prototype"] --> B["Desktop mouse/keyboard"]
    A --> C["Laptop trackpad"]
    A --> D["Tablet touch"]
    A --> E["Phone touch if supported"]
    B --> F["precision input"]
    C --> G["reduced precision"]
    D --> H["larger target needs"]
    E --> I["small viewport constraints"]
```

## [ACTION] Core Web Vitals Baseline

The current `web.dev` guidance says that good user experience targets include:

- `LCP` within `2.5 seconds` or less
- `INP` of `200 milliseconds` or less
- `CLS` of `0.1` or less

Use these as orientation targets, not as the only definition of quality. Educational interactions may need additional checks around:

- asset-heavy scene load
- interaction feedback timing
- device-specific input accuracy

## [ACTION] Minimum Test Matrix

| Test Area | Minimum Coverage |
|---|---|
| browsers | one Chromium-based browser plus one alternate engine where feasible |
| devices | desktop or laptop plus one touch device if touch is supported |
| input | mouse, trackpad, and touch if relevant |
| network conditions | normal connection plus one slower condition if the audience may encounter it |
| viewport sizes | desktop and one smaller-screen layout |
| performance moments | initial load, first interaction, repeated interaction, scene transition |

## [ACTION] Device Test Template

| Device | Browser | Input Mode | Load Result | Interaction Result | Notes |
|---|---|---|---|---|---|
| laptop A | browser name | trackpad | pass/issue | pass/issue | notes |
| desktop B | browser name | mouse | pass/issue | pass/issue | notes |
| tablet C | browser name | touch | pass/issue | pass/issue | notes |

## [ACTION] What To Measure

### Loading

Check:

- time until meaningful content appears
- time until the first interactive action is possible
- whether large assets block early understanding

### Interactivity

Check:

- delay between action and visible response
- whether hover-only assumptions break touch use
- whether taps, clicks, and drags register consistently

### Visual Stability

Check:

- layout shift during loading
- moving buttons or overlays
- changes that cause accidental taps or misreads

### Input Reliability

Check:

- pointer precision expectations
- drag versus tap ambiguity
- small target failures on touch devices

## [ACTION] Pointer Events Review Questions

Use `Pointer Events` guidance when your interface should work across mouse, pen, and touch.

Ask:

- are we assuming mouse behavior where touch behavior differs?
- does the prototype require hover to discover essential information?
- what happens if the player cannot maintain precise continuous contact?
- are targets large enough for touch interaction?

## [EVIDENCE] Distinguishing Design Failure From Runtime Failure

| Observation | Possible Design Problem | Possible Runtime Problem |
|---|---|---|
| learner pauses before acting | unclear objective | slow first render or blocked input |
| learner misses buttons | weak visual hierarchy | layout shift or touch target issue |
| learner abandons task | low motivation | excessive load time |
| learner repeats action | unclear feedback | delayed response or dropped event |

## [ACTION] Pre-Playtest Gate

Do not run a formal or high-stakes playtest until the prototype can answer `yes` to all of these:

- does the main learning path load consistently
- does the first interaction work without hidden browser assumptions
- do targets remain stable while the page settles
- does the prototype behave acceptably on at least one realistic learner device
- can we tell whether confusion is conceptual rather than performance-related

## [RISK] Common Failure Modes

| Failure Mode | What It Looks Like | Why It Happens | Mitigation |
|---|---|---|---|
| desktop-only confidence | the prototype works well only on the creator’s machine | narrow test environment | require at least one lower-precision device test |
| touch afterthought | interactions rely on hover or tiny targets | mouse-first design habits | review Pointer Events assumptions early |
| asset overload | large media blocks initial meaning | polish is prioritized over usability | stage loading and reduce initial payload |
| misleading playtests | teams infer learning problems from runtime instability | design and performance evidence are mixed | add a technical smoke test before user sessions |
| late performance panic | issues appear only just before showcase | no recurring measurement loop | schedule lightweight checks each sprint |

## [ACTION] Mitigation Strategies

| If You Notice... | Then Do This |
|---|---|
| the prototype looks fine but feels slow | measure first interactive moment, not just page appearance |
| touch users struggle more than mouse users | enlarge targets and remove hover-only dependencies |
| layout moves under the learner | reserve space early and reduce late-loading UI shifts |
| large scenes delay meaning | load a simpler starter scene or placeholder state first |
| teams say “it works on my laptop” | require evidence from the minimum test matrix |

## [CHECK] Critical Thinking Prompts

- What learner behavior in our playtest could actually be a performance artifact?
- Which device in our expected audience is least likely to succeed right now?
- What is the smallest runtime improvement that would most improve educational validity?
- Are we measuring the moment the page appears, or the moment meaningful learning interaction begins?
- What assumption about input precision is built into this prototype?

## [LINKS] Official References

- Learn Core Web Vitals: [https://web.dev/explore/learn-core-web-vitals](https://web.dev/explore/learn-core-web-vitals)
- Web Vitals article: [https://web.dev/articles/vitals](https://web.dev/articles/vitals)
- Web performance overview: [https://web.dev/performance/](https://web.dev/performance/)
- MDN Pointer Events: [https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)

## [LINKS] Internal Navigation

- [05-threejs-foundations-learning-pack.md](</C:/Users/jewoo/Documents/Playground/educational-game-design-resource-pack-en/05-threejs-foundations-learning-pack.md>)
- [06-technical-qa-and-data-logging-checklists.md](</C:/Users/jewoo/Documents/Playground/educational-game-design-resource-pack-en/06-technical-qa-and-data-logging-checklists.md>)
- [00-master-curriculum-atlas.md](</C:/Users/jewoo/Documents/Playground/educational-game-design-resource-pack-en/00-master-curriculum-atlas.md>)
