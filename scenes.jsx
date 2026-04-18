// scenes.jsx — The Crosswalk explainer (30s)

const C = {
  bg: '#ffffff',
  ink: '#161616',
  ink2: '#525252',
  ink3: '#8d8d8d',
  line: '#e0e0e0',
  line2: '#c6c6c6',
  layer: '#f4f4f4',
  blue: '#0f62fe',
  blueBg: '#edf5ff',
  blueDeep: '#002d9c',
  red: '#da1e28',
  redBg: '#fff1f1',
  green: '#24a148',
  greenBg: '#defbe6',
  yellow: '#f1c21b',
  gridDot: '#e0e0e0',
};

const FSANS = "'IBM Plex Sans', system-ui, sans-serif";
const FMONO = "'IBM Plex Mono', ui-monospace, monospace";

// ────────────────────────────────────────────────────────────
// Grid background — subtle dot grid, always visible
// ────────────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `radial-gradient(${C.gridDot} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0',
      opacity: 0.5,
    }} />
  );
}

// ────────────────────────────────────────────────────────────
// Top chrome: IBM-style timestamp + progress ticker
// ────────────────────────────────────────────────────────────
function Chrome() {
  const t = useTime();
  return (
    <>
      <div style={{
        position: 'absolute', top: 32, left: 48,
        fontFamily: FMONO, fontSize: 13, color: C.ink3,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        AI-enhanced Educational Game Design · Session 3
      </div>
      <div style={{
        position: 'absolute', top: 32, right: 48,
        fontFamily: FMONO, fontSize: 13, color: C.ink3,
        letterSpacing: '0.04em',
      }}>
        {t.toFixed(1).padStart(4, '0')}s / 30.0s
      </div>
      <div style={{
        position: 'absolute', top: 60, left: 48, right: 48,
        height: 1, background: C.line,
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 1,
          width: `${(t / 30) * 100}%`,
          background: C.ink,
        }} />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 1 — Objective card appears (0 → 5s)
// ────────────────────────────────────────────────────────────
function SceneObjective() {
  return (
    <Sprite start={0.3} end={9.5}>
      {({ localTime, progress }) => {
        // Card entry
        const cardIn = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
        // Exit slide left when risky fires
        const exitT = clamp((localTime - 8.6) / 0.9, 0, 1);
        const exitX = Easing.easeInCubic(exitT) * -900;
        const exitO = 1 - exitT;

        return (
          <div style={{
            position: 'absolute',
            left: 100, top: 180,
            width: 780,
            opacity: cardIn * exitO,
            transform: `translateX(${exitX}px) translateY(${(1 - cardIn) * 20}px)`,
          }}>
            <div style={{
              fontFamily: FMONO, fontSize: 12,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: C.ink3, marginBottom: 16,
            }}>
              Learning objective
            </div>
            <div style={{
              fontFamily: FSANS, fontWeight: 300, fontSize: 54,
              color: C.ink, lineHeight: 1.15, letterSpacing: '-0.01em',
              marginBottom: 28,
            }}>
              Given a patient's history,<br/>
              weigh risks and select<br/>
              <span style={{ color: C.blue, fontWeight: 400 }}>one of three treatment paths</span>,<br/>
              articulating rationale.
            </div>

            {/* Objective type tag — reveals at 2.2s */}
            <Sprite start={2.5} end={9.5}>
              {({ localTime: lt2 }) => {
                const tagIn = Easing.easeOutBack(clamp(lt2 / 0.5, 0, 1));
                return (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    padding: '10px 18px',
                    background: C.ink, color: '#fff',
                    fontFamily: FMONO, fontSize: 13,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    opacity: tagIn,
                    transform: `translateY(${(1 - tagIn) * 12}px)`,
                  }}>
                    <span style={{ width: 8, height: 8, background: C.blue, borderRadius: 0 }} />
                    Type: Judgment under uncertainty
                  </div>
                );
              }}
            </Sprite>
          </div>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 2 — Team slaps on WRONG mechanics (3.5 → 9.5s)
// ────────────────────────────────────────────────────────────
function SceneWrongMechanics() {
  return (
    <Sprite start={3.8} end={9.5}>
      {({ localTime }) => {
        const exitT = clamp((localTime - 5.0) / 0.9, 0, 1);
        const exitO = 1 - exitT;

        return (
          <div style={{
            position: 'absolute',
            right: 80, top: 220,
            width: 480,
            opacity: exitO,
          }}>
            <div style={{
              fontFamily: FMONO, fontSize: 12,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: C.ink3, marginBottom: 20,
            }}>
              Team picks mechanics
            </div>

            <MechanicChip label="Timed drill" delay={0} icon="clock" />
            <MechanicChip label="Leaderboard" delay={0.5} icon="trophy" />
            <MechanicChip label="Points × combo" delay={1.0} icon="star" />
          </div>
        );
      }}
    </Sprite>
  );
}

function MechanicChip({ label, delay, icon }) {
  return (
    <Sprite start={3.8 + delay} end={9.5}>
      {({ localTime }) => {
        const inT = Easing.easeOutBack(clamp(localTime / 0.45, 0, 1));

        // Shake when warning fires (approx at 8.7-9.1)
        const shakeT = clamp((localTime - 4.4) / 0.5, 0, 1);
        const shake = shakeT > 0 && shakeT < 1 ? Math.sin(shakeT * 40) * 6 * (1 - shakeT) : 0;

        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 22px',
            background: '#fff',
            border: `1px solid ${C.line2}`,
            marginBottom: 12,
            opacity: inT,
            transform: `translateX(${(1 - inT) * 40}px) translateX(${shake}px)`,
          }}>
            <IconGlyph name={icon} color={C.ink} size={24} />
            <div style={{
              fontFamily: FSANS, fontSize: 22, fontWeight: 400, color: C.ink,
            }}>
              {label}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function IconGlyph({ name, color, size = 24 }) {
  const s = size;
  if (name === 'clock') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <path d="M12 7v5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
  if (name === 'trophy') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v5a6 6 0 01-12 0V4zM4 4h2v3a2 2 0 01-2 0V4zM18 4h2v3a2 2 0 01-2 0V4zM10 16h4v3h-4zM8 19h8" stroke={color} strokeWidth="1.5" strokeLinejoin="miter"/>
    </svg>
  );
  if (name === 'star') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9 12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="miter"/>
    </svg>
  );
  if (name === 'branch') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="2" fill={color}/>
      <circle cx="19" cy="5" r="2" fill={color}/>
      <circle cx="19" cy="19" r="2" fill={color}/>
      <path d="M7 12l10-7M7 12l10 7" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
  if (name === 'book') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 4h7a2 2 0 012 2v14a2 2 0 00-2-2H4V4zM20 4h-7a2 2 0 00-2 2v14a2 2 0 012-2h7V4z" stroke={color} strokeWidth="1.5" strokeLinejoin="miter"/>
    </svg>
  );
  return null;
}

// ────────────────────────────────────────────────────────────
// Scene 3 — RISKY warning scrim (8.3 → 13s)
// ────────────────────────────────────────────────────────────
function SceneRiskyWarning() {
  return (
    <Sprite start={8.3} end={13.2}>
      {({ localTime }) => {
        const dur = 4.9;
        const scrimIn = Easing.easeOutCubic(clamp(localTime / 0.4, 0, 1));
        const scrimOut = clamp((localTime - (dur - 0.5)) / 0.5, 0, 1);
        const scrimO = scrimIn * (1 - scrimOut);

        const barIn = Easing.easeOutExpo(clamp((localTime - 0.1) / 0.4, 0, 1));
        const barOut = clamp((localTime - (dur - 0.5)) / 0.5, 0, 1);
        const barW = barIn * (1 - barOut);

        const textIn = Easing.easeOutBack(clamp((localTime - 0.35) / 0.5, 0, 1));
        const textOut = clamp((localTime - (dur - 0.5)) / 0.5, 0, 1);
        const textO = textIn * (1 - textOut);

        // Blink the red bar band
        const blink = 0.7 + 0.3 * Math.sin(localTime * 8);

        return (
          <>
            {/* Red accent band top */}
            <div style={{
              position: 'absolute', top: 64, left: 0, right: 0, height: 6,
              background: C.red,
              transform: `scaleX(${barW})`, transformOrigin: 'left',
              opacity: blink,
            }}/>
            {/* White-out accent band sweeping across */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
              background: C.red,
              transform: `scaleX(${barW})`, transformOrigin: 'right',
              opacity: blink,
            }}/>

            {/* Central RISKY lockup */}
            <div style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(-50%, -50%) translateY(${(1 - textIn) * 30}px)`,
              opacity: textO,
              textAlign: 'center',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 16,
                padding: '12px 24px',
                background: C.red, color: '#fff',
                fontFamily: FMONO, fontSize: 16, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                marginBottom: 32,
              }}>
                <WarningIcon />
                Mechanic mismatch
              </div>
              <div style={{
                fontFamily: FSANS, fontWeight: 300, fontSize: 72,
                color: C.ink, lineHeight: 1.05, letterSpacing: '-0.02em',
                marginBottom: 24,
              }}>
                A timer on <span style={{ color: C.red, fontWeight: 600, fontStyle: 'italic' }}>judgment</span>
                <br/>trains the opposite skill.
              </div>
              <div style={{
                fontFamily: FSANS, fontSize: 22, color: C.ink2,
                fontWeight: 400, letterSpacing: '0.01em',
              }}>
                Speed beats deliberation. The learner stops thinking.
              </div>
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 21h20L12 2z" fill="#fff"/>
      <rect x="11" y="9" width="2" height="6" fill={C.red}/>
      <rect x="11" y="17" width="2" height="2" fill={C.red}/>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 4 — THE CROSSWALK MATRIX (13.0 → 22.5s)
// This is the hero moment — the tool itself
// ────────────────────────────────────────────────────────────
const OBJ_TYPES = ['Retrieval', 'Discrimination', 'Procedural', 'Conceptual', 'Judgment'];
const MECHANICS = [
  { name: 'Timed drill',      row: [2, 2, 3, 1, -1] },
  { name: 'Leaderboard',      row: [2, 1, 2, 1, -1] },
  { name: 'Matching',         row: [2, 3, 1, 2, 1]  },
  { name: 'Branching',        row: [1, 2, 2, 3, 3]  },
  { name: 'Simulation',       row: [1, 1, 2, 3, 3]  },
  { name: 'Narrative role',   row: [1, 2, 2, 3, 3]  },
];
// score: -1 risky, 1 weak, 2 fair, 3 strong

function SceneCrosswalk() {
  return (
    <Sprite start={13.0} end={22.5}>
      {({ localTime }) => {
        const dur = 9.5;
        const titleIn = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
        const gridIn = Easing.easeOutCubic(clamp((localTime - 0.3) / 0.8, 0, 1));
        const exitT = clamp((localTime - (dur - 0.7)) / 0.7, 0, 1);
        const exitO = 1 - Easing.easeInCubic(exitT);

        return (
          <div style={{
            position: 'absolute', inset: 0,
            opacity: exitO,
          }}>
            {/* Title */}
            <div style={{
              position: 'absolute', top: 110, left: 80,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 16}px)`,
            }}>
              <div style={{
                fontFamily: FMONO, fontSize: 12,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: C.blue, marginBottom: 10,
              }}>
                Learning objective × Game mechanic
              </div>
              <div style={{
                fontFamily: FSANS, fontWeight: 300, fontSize: 48,
                color: C.ink, letterSpacing: '-0.01em',
              }}>
                Start from the <span style={{ fontWeight: 600 }}>objective type</span>.
              </div>
            </div>

            {/* Matrix */}
            <CrosswalkGrid localTime={localTime} opacity={gridIn} />
          </div>
        );
      }}
    </Sprite>
  );
}

function CrosswalkGrid({ localTime, opacity }) {
  const left = 80;
  const top = 250;
  const colLabelW = 220;
  const cellW = 150;
  const cellH = 54;
  const headerH = 70;

  // Highlight sequence:
  // 14.0 (local 1.0): Judgment column highlighted
  // 15.0 (local 2.0): timed drill / leaderboard rows — red flash (risky column)
  // 16.5 (local 3.5): Branching + Sim + Narrative — blue strong rows in judgment col
  // 18.0 (local 5.0): zoom/settle
  // 19.5 (local 6.5): "Right matches" callout appears

  const judgmentColHL = Easing.easeOutCubic(clamp((localTime - 1.0) / 0.5, 0, 1));
  const riskyHL = clamp((localTime - 2.0) / 0.4, 0, 1);
  const strongHL = clamp((localTime - 3.5) / 0.5, 0, 1);
  const calloutIn = Easing.easeOutBack(clamp((localTime - 6.0) / 0.6, 0, 1));
  const calloutOut = clamp((localTime - 8.3) / 0.4, 0, 1);
  const calloutO = calloutIn * (1 - calloutOut);

  return (
    <div style={{
      position: 'absolute',
      left, top,
      opacity,
      fontFamily: FSANS,
    }}>
      {/* Judgment column highlight behind */}
      <div style={{
        position: 'absolute',
        left: colLabelW + 4 * cellW, top: 0,
        width: cellW, height: headerH + MECHANICS.length * cellH,
        background: C.blueBg,
        opacity: judgmentColHL * 0.9,
        transition: 'opacity 200ms',
      }}/>

      {/* Header row — objective types */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        height: headerH,
        borderBottom: `2px solid ${C.ink}`,
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ width: colLabelW, padding: '0 12px 12px 0',
          fontFamily: FMONO, fontSize: 11, color: C.ink3,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Mechanic ↓ / Objective →
        </div>
        {OBJ_TYPES.map((t, i) => {
          const isJudgment = i === 4;
          return (
            <div key={t} style={{
              width: cellW,
              padding: '0 12px 12px 12px',
              fontFamily: FSANS,
              fontSize: 14,
              fontWeight: isJudgment ? 600 : 400,
              color: isJudgment && judgmentColHL > 0.5 ? C.blue : C.ink,
              letterSpacing: '0.01em',
            }}>
              {t}
            </div>
          );
        })}
      </div>

      {/* Matrix rows */}
      {MECHANICS.map((mech, rowI) => {
        const isRisky = mech.row[4] === -1;
        const isStrong = mech.row[4] === 3;

        // Row-reveal stagger
        const rowIn = clamp((localTime - 0.5 - rowI * 0.08) / 0.4, 0, 1);

        return (
          <div key={mech.name} style={{
            display: 'flex', alignItems: 'center',
            height: cellH,
            borderBottom: `1px solid ${C.line}`,
            opacity: rowIn,
            transform: `translateX(${(1 - rowIn) * -20}px)`,
          }}>
            <div style={{
              width: colLabelW, padding: '0 12px',
              fontFamily: FSANS, fontSize: 15,
              fontWeight: (isRisky && riskyHL > 0.5) || (isStrong && strongHL > 0.5) ? 600 : 400,
              color: isRisky && riskyHL > 0.5 ? C.red
                    : isStrong && strongHL > 0.5 ? C.blue
                    : C.ink,
            }}>
              {mech.name}
            </div>
            {mech.row.map((score, colI) => {
              const isJudgmentCell = colI === 4;
              return (
                <div key={colI} style={{
                  width: cellW, height: cellH,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <CellMark
                    score={score}
                    isJudgment={isJudgmentCell}
                    riskyHL={isRisky && isJudgmentCell ? riskyHL : 0}
                    strongHL={isStrong && isJudgmentCell ? strongHL : 0}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Callout: arrow pointing to Judgment column + right-match label */}
      <div style={{
        position: 'absolute',
        left: colLabelW + 4 * cellW + cellW + 40,
        top: headerH + 3 * cellH - 20,
        opacity: calloutO,
        transform: `translateX(${(1 - calloutIn) * -12}px)`,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '10px 16px',
          background: C.blue, color: '#fff',
          fontFamily: FMONO, fontSize: 13, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          Strong fit
        </div>
        <div style={{
          fontFamily: FSANS, fontSize: 17, color: C.ink, fontWeight: 400,
          lineHeight: 1.3, maxWidth: 280,
        }}>
          Branching, simulation, and narrative role preserve deliberation.
        </div>
      </div>
    </div>
  );
}

function CellMark({ score, isJudgment, riskyHL, strongHL }) {
  // score: -1 risky, 1 weak, 2 fair, 3 strong
  let mark, color, bg, weight = 400;
  if (score === -1) { mark = '×'; color = C.red; bg = 'transparent'; weight = 600; }
  else if (score === 1) { mark = '·'; color = C.ink3; bg = 'transparent'; }
  else if (score === 2) { mark = '○'; color = C.ink2; bg = 'transparent'; }
  else if (score === 3) { mark = '●'; color = C.ink; bg = 'transparent'; weight = 600; }

  const flash = riskyHL > 0 ? {
    background: `rgba(218, 30, 40, ${riskyHL * 0.18})`,
  } : strongHL > 0 ? {
    background: `rgba(15, 98, 254, ${strongHL * 0.22})`,
  } : {};

  const emphColor = riskyHL > 0.5 ? C.red : strongHL > 0.5 && score === 3 ? C.blue : color;

  return (
    <div style={{
      position: 'absolute', inset: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FMONO, fontSize: 22, fontWeight: weight,
      color: emphColor,
      ...flash,
    }}>
      {score === -1 && riskyHL > 0.5 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: FMONO, fontSize: 12, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: C.red,
        }}>
          Risky
        </div>
      ) : (
        mark
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 5 — Swap in the right mechanics (22.5 → 27s)
// ────────────────────────────────────────────────────────────
function SceneRightMechanics() {
  return (
    <Sprite start={22.5} end={27.2}>
      {({ localTime }) => {
        const dur = 4.7;
        const exitT = clamp((localTime - (dur - 0.5)) / 0.5, 0, 1);
        const exitO = 1 - exitT;

        return (
          <div style={{
            position: 'absolute', inset: 0,
            opacity: exitO,
          }}>
            {/* Objective re-card, smaller, left */}
            <Sprite start={22.5} end={27.2}>
              {({ localTime: lt }) => {
                const inT = Easing.easeOutCubic(clamp(lt / 0.5, 0, 1));
                return (
                  <div style={{
                    position: 'absolute',
                    left: 100, top: 200,
                    width: 540,
                    opacity: inT,
                    transform: `translateY(${(1 - inT) * 12}px)`,
                  }}>
                    <div style={{
                      fontFamily: FMONO, fontSize: 11,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: C.ink3, marginBottom: 14,
                    }}>
                      Objective · judgment under uncertainty
                    </div>
                    <div style={{
                      fontFamily: FSANS, fontWeight: 300, fontSize: 36,
                      color: C.ink, lineHeight: 1.2, letterSpacing: '-0.01em',
                    }}>
                      Weigh risks. Select a path.<br/>
                      <span style={{ color: C.blue, fontWeight: 400 }}>Articulate rationale.</span>
                    </div>
                  </div>
                );
              }}
            </Sprite>

            {/* Arrow */}
            <Sprite start={22.9} end={27.2}>
              {({ localTime: lt }) => {
                const inT = Easing.easeOutCubic(clamp(lt / 0.4, 0, 1));
                return (
                  <div style={{
                    position: 'absolute',
                    left: 670, top: 290,
                    width: 80, height: 2,
                    background: C.ink,
                    transform: `scaleX(${inT})`,
                    transformOrigin: 'left',
                  }}>
                    <div style={{
                      position: 'absolute', right: -1, top: -5,
                      width: 12, height: 12,
                      borderRight: `2px solid ${C.ink}`,
                      borderTop: `2px solid ${C.ink}`,
                      transform: 'rotate(45deg)',
                      opacity: inT > 0.9 ? 1 : 0,
                    }}/>
                  </div>
                );
              }}
            </Sprite>

            {/* Right mechanics — stacked */}
            <div style={{
              position: 'absolute',
              right: 100, top: 200,
              width: 460,
            }}>
              <Sprite start={23.2} end={27.2}>
                {({ localTime: lt }) => {
                  const inT = Easing.easeOutCubic(clamp(lt / 0.4, 0, 1));
                  return (
                    <div style={{
                      fontFamily: FMONO, fontSize: 11,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: C.blue, marginBottom: 18,
                      opacity: inT,
                    }}>
                      Mechanics that fit
                    </div>
                  );
                }}
              </Sprite>
              <RightChip label="Branching decision" sub="delayed consequence feedback" delay={23.4} icon="branch" />
              <RightChip label="Required rationale step" sub="reward the reasoning, not the outcome" delay={23.9} icon="book" />
              <RightChip label="Narrative role · attending physician" sub="amplifier, not driver" delay={24.4} icon="star" />
            </div>

            {/* Dropped bar */}
            <Sprite start={25.2} end={27.2}>
              {({ localTime: lt }) => {
                const inT = Easing.easeOutCubic(clamp(lt / 0.5, 0, 1));
                return (
                  <div style={{
                    position: 'absolute',
                    left: 100, top: 500,
                    opacity: inT,
                    transform: `translateY(${(1 - inT) * 10}px)`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px',
                      background: C.redBg,
                      border: `1px solid ${C.red}`,
                      fontFamily: FSANS, fontSize: 15, fontWeight: 500, color: C.red,
                      textDecoration: 'line-through',
                      textDecorationColor: C.red,
                    }}>
                      Timed drill
                    </div>
                    <div style={{
                      fontFamily: FMONO, fontSize: 12,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: C.ink3,
                    }}>
                      Rejected · documented
                    </div>
                  </div>
                );
              }}
            </Sprite>
          </div>
        );
      }}
    </Sprite>
  );
}

function RightChip({ label, sub, delay, icon }) {
  return (
    <Sprite start={delay} end={27.2}>
      {({ localTime }) => {
        const inT = Easing.easeOutBack(clamp(localTime / 0.5, 0, 1));
        return (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '18px 22px',
            background: '#fff',
            border: `1px solid ${C.blue}`,
            borderLeft: `4px solid ${C.blue}`,
            marginBottom: 12,
            opacity: clamp(inT, 0, 1),
            transform: `translateX(${(1 - clamp(inT, 0, 1)) * 30}px)`,
          }}>
            <div style={{ marginTop: 2 }}>
              <IconGlyph name={icon} color={C.blue} size={22} />
            </div>
            <div>
              <div style={{
                fontFamily: FSANS, fontSize: 19, fontWeight: 500, color: C.ink,
                marginBottom: 4,
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: FSANS, fontSize: 13, color: C.ink2,
              }}>
                {sub}
              </div>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────
// Scene 6 — Takeaway (27 → 30s)
// ────────────────────────────────────────────────────────────
function SceneTakeaway() {
  return (
    <Sprite start={27.0} end={30.0}>
      {({ localTime }) => {
        const line1In = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));
        const line2In = Easing.easeOutCubic(clamp((localTime - 0.7) / 0.5, 0, 1));
        const barIn = Easing.easeOutCubic(clamp((localTime - 1.4) / 0.5, 0, 1));
        const creditIn = Easing.easeOutCubic(clamp((localTime - 2.0) / 0.5, 0, 1));

        return (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 120px',
          }}>
            <div style={{
              fontFamily: FMONO, fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: C.blue, marginBottom: 24,
              opacity: line1In,
              transform: `translateY(${(1 - line1In) * 12}px)`,
            }}>
              Principle 2
            </div>
            <div style={{
              fontFamily: FSANS, fontWeight: 300, fontSize: 88,
              color: C.ink, lineHeight: 1.05, letterSpacing: '-0.025em',
              opacity: line1In,
              transform: `translateY(${(1 - line1In) * 20}px)`,
              marginBottom: 28,
            }}>
              Design from the objective.
            </div>
            <div style={{
              fontFamily: FSANS, fontWeight: 600, fontSize: 88,
              color: C.blue, lineHeight: 1.05, letterSpacing: '-0.025em',
              opacity: line2In,
              transform: `translateY(${(1 - line2In) * 20}px)`,
              marginBottom: 56,
            }}>
              Not from the mechanic.
            </div>

            <div style={{
              width: 240, height: 3, background: C.ink,
              transform: `scaleX(${barIn})`, transformOrigin: 'left',
              marginBottom: 20,
            }}/>

            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 16,
              opacity: creditIn,
              transform: `translateY(${(1 - creditIn) * 8}px)`,
            }}>
              <div style={{
                fontFamily: FMONO, fontSize: 13, color: C.ink,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                AI-enhanced Educational Game Design · Micro-credential
              </div>
              <div style={{
                fontFamily: FMONO, fontSize: 12, color: C.ink3,
                letterSpacing: '0.04em',
              }}>
                §5 — Learning-objective × mechanic crosswalk
              </div>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ────────────────────────────────────────────────────────────
// Root scene composition
// ────────────────────────────────────────────────────────────
function CrosswalkVideo() {
  const t = useTime();
  // Update data-screen-label for commenting
  React.useEffect(() => {
    const root = document.getElementById('video-root');
    if (root) root.setAttribute('data-screen-label', `t=${t.toFixed(1)}s`);
  }, [Math.floor(t)]);

  return (
    <div id="video-root" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <DotGrid />
      <Chrome />
      <SceneObjective />
      <SceneWrongMechanics />
      <SceneRiskyWarning />
      <SceneCrosswalk />
      <SceneRightMechanics />
      <SceneTakeaway />
    </div>
  );
}

Object.assign(window, { CrosswalkVideo });
