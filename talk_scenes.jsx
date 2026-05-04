// talk_scenes.jsx - two-host short explainers for TeachPlay.

const Talk = {
  bg: '#ffffff',
  ink: '#161616',
  softInk: '#525252',
  faintInk: '#6f6f6f',
  line: '#e0e0e0',
  panel: '#f4f4f4',
  blue: '#0f62fe',
  blueSoft: '#edf5ff',
  red: '#da1e28',
  redSoft: '#fff1f1',
  green: '#24a148',
  greenSoft: '#defbe6',
};

const TALK_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const TALK_MONO = "'IBM Plex Mono', ui-monospace, monospace";

function TalkGrid() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(${Talk.line} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
      opacity: 0.55,
    }} />
  );
}

function TalkChrome({ label }) {
  const t = useTime();
  return (
    <>
      <div style={{
        position: 'absolute',
        top: 30,
        left: 48,
        right: 48,
        height: 1,
        background: Talk.line,
      }}>
        <div style={{
          height: 1,
          width: `${Math.min(100, (t / 45) * 100)}%`,
          background: Talk.ink,
        }} />
      </div>
      <div style={{
        position: 'absolute',
        top: 46,
        left: 48,
        fontFamily: TALK_MONO,
        fontSize: 13,
        color: Talk.faintInk,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        TeachPlay microcredential - {label}
      </div>
      <div style={{
        position: 'absolute',
        top: 46,
        right: 48,
        fontFamily: TALK_MONO,
        fontSize: 13,
        color: Talk.faintInk,
      }}>
        {t.toFixed(1).padStart(4, '0')}s / 45.0s
      </div>
    </>
  );
}

function Host({ side, name, role, mood = 'neutral', accent = Talk.blue }) {
  const isLeft = side === 'left';
  const x = isLeft ? 72 : 1548;
  const face = mood === 'concerned' ? 'M 25 38 Q 40 28 55 38' : mood === 'skeptical' ? 'M 24 34 L 56 34' : 'M 24 35 Q 40 47 56 35';
  return (
    <div style={{
      position: 'absolute',
      left: x,
      bottom: 84,
      width: 300,
      height: 260,
      fontFamily: TALK_SANS,
      transform: isLeft ? 'none' : 'scaleX(-1)',
    }}>
      <div style={{
        position: 'absolute',
        left: 94,
        top: 0,
        width: 112,
        height: 112,
        borderRadius: 56,
        background: '#ffffff',
        border: `4px solid ${accent}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
      }}>
        <svg viewBox="0 0 80 80" width="112" height="112" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="#fff" />
          <circle cx="29" cy="31" r="4" fill={Talk.ink} />
          <circle cx="51" cy="31" r="4" fill={Talk.ink} />
          <path d={face} fill="none" stroke={Talk.ink} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{
        position: 'absolute',
        left: 48,
        top: 92,
        width: 204,
        height: 148,
        background: accent,
        clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)',
      }} />
      <div style={{
        position: 'absolute',
        left: 64,
        top: 180,
        width: 172,
        padding: '10px 14px',
        background: '#ffffff',
        border: `1px solid ${Talk.line}`,
        transform: isLeft ? 'none' : 'scaleX(-1)',
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: Talk.ink }}>{name}</div>
        <div style={{ marginTop: 2, fontSize: 12, color: Talk.softInk }}>{role}</div>
      </div>
    </div>
  );
}

function Bubble({ start, end, side, speaker, text, accent = Talk.blue }) {
  const isLeft = side === 'left';
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.35, 0, 1));
        const exit = clamp((localTime - duration + 0.35) / 0.35, 0, 1);
        const opacity = entry * (1 - exit);
        return (
          <div style={{
            position: 'absolute',
            left: isLeft ? 386 : 828,
            top: 718,
            width: 700,
            minHeight: 118,
            padding: '26px 30px',
            background: '#ffffff',
            border: `2px solid ${accent}`,
            boxShadow: '0 20px 55px rgba(0,0,0,0.12)',
            opacity,
            transform: `translateY(${(1 - entry) * 18 - exit * 12}px)`,
            fontFamily: TALK_SANS,
          }}>
            <div style={{
              fontFamily: TALK_MONO,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: accent,
              marginBottom: 10,
              fontWeight: 700,
            }}>
              {speaker}
            </div>
            <div style={{
              fontSize: 30,
              lineHeight: 1.22,
              color: Talk.ink,
              fontWeight: 400,
            }}>
              {text}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function MetricCards({ start, end }) {
  const items = [
    ['Clicks', 'high'],
    ['Smiles', 'high'],
    ['Transfer', 'flat'],
  ];
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
        return (
          <div style={{ position: 'absolute', left: 196, top: 180, right: 196, opacity: entry }}>
            <div style={{
              fontFamily: TALK_MONO,
              fontSize: 14,
              color: Talk.faintInk,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 18,
            }}>
              Prototype test readout
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
              {items.map(([label, value], i) => (
                <div key={label} style={{
                  background: value === 'flat' ? Talk.redSoft : Talk.greenSoft,
                  border: `1px solid ${value === 'flat' ? Talk.red : Talk.green}`,
                  padding: '30px 30px 26px',
                  minHeight: 188,
                  transform: `translateY(${(1 - entry) * (18 + i * 8)}px)`,
                }}>
                  <div style={{ fontFamily: TALK_SANS, fontSize: 26, fontWeight: 700, color: Talk.ink }}>
                    {label}
                  </div>
                  <div style={{
                    marginTop: 30,
                    height: 22,
                    background: '#ffffff',
                    border: `1px solid ${Talk.line}`,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: value === 'flat' ? '22%' : '86%',
                      background: value === 'flat' ? Talk.red : Talk.green,
                    }} />
                  </div>
                  <div style={{ marginTop: 18, fontFamily: TALK_MONO, fontSize: 17, color: value === 'flat' ? Talk.red : Talk.green }}>
                    {value === 'flat' ? 'no movement' : 'looks great'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function TrapPattern({ start, end }) {
  const rows = [
    ['Fun loop', 'Players keep clicking'],
    ['School wrapper', 'Vocabulary pasted on top'],
    ['Assessment gap', 'Post-test asks a different skill'],
  ];
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.5, 0, 1));
        return (
          <div style={{ position: 'absolute', left: 230, top: 150, width: 1460, opacity: entry, fontFamily: TALK_SANS }}>
            <div style={{ fontSize: 64, fontWeight: 300, color: Talk.ink, marginBottom: 34 }}>
              The engagement trap has a pattern.
            </div>
            {rows.map((row, i) => {
              const rowIn = Easing.easeOutCubic(clamp((localTime - i * 0.35) / 0.45, 0, 1));
              return (
                <div key={row[0]} style={{
                  display: 'grid',
                  gridTemplateColumns: '290px 1fr',
                  alignItems: 'center',
                  gap: 28,
                  padding: '24px 28px',
                  marginBottom: 14,
                  border: `1px solid ${i === 2 ? Talk.red : Talk.line}`,
                  background: i === 2 ? Talk.redSoft : '#ffffff',
                  opacity: rowIn,
                  transform: `translateX(${(1 - rowIn) * -28}px)`,
                }}>
                  <div style={{ fontFamily: TALK_MONO, fontSize: 15, color: i === 2 ? Talk.red : Talk.blue, textTransform: 'uppercase' }}>{row[0]}</div>
                  <div style={{ fontSize: 31, color: Talk.ink }}>{row[1]}</div>
                </div>
              );
            })}
          </div>
        );
      }}
    </Sprite>
  );
}

function CrosswalkMatrixTalk({ start, end }) {
  const columns = ['Retrieval', 'Discrimination', 'Procedural', 'Conceptual', 'Judgment'];
  const rows = [
    ['Timed drill', [2, 2, 3, 1, -1]],
    ['Leaderboard', [2, 1, 2, 1, -1]],
    ['Branching', [1, 2, 2, 3, 3]],
    ['Simulation', [1, 1, 2, 3, 3]],
    ['Narrative role', [1, 2, 2, 3, 3]],
  ];
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.55, 0, 1));
        const strong = clamp((localTime - 4.5) / 0.55, 0, 1);
        return (
          <div style={{ position: 'absolute', left: 126, top: 132, width: 1668, opacity: entry, fontFamily: TALK_SANS }}>
            <div style={{ fontSize: 54, fontWeight: 300, color: Talk.ink, marginBottom: 28 }}>
              Use the crosswalk before you fall in love with a mechanic.
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '260px repeat(5, 1fr)',
              borderTop: `2px solid ${Talk.ink}`,
              borderLeft: `1px solid ${Talk.line}`,
            }}>
              <div style={{ padding: 16, fontFamily: TALK_MONO, color: Talk.faintInk, borderRight: `1px solid ${Talk.line}`, borderBottom: `1px solid ${Talk.line}` }}>
                Mechanic
              </div>
              {columns.map((c, i) => (
                <div key={c} style={{
                  padding: 16,
                  fontWeight: i === 4 ? 700 : 500,
                  color: i === 4 ? Talk.blue : Talk.ink,
                  background: i === 4 ? Talk.blueSoft : '#ffffff',
                  borderRight: `1px solid ${Talk.line}`,
                  borderBottom: `1px solid ${Talk.line}`,
                }}>
                  {c}
                </div>
              ))}
              {rows.map((row) => (
                <React.Fragment key={row[0]}>
                  <div style={{
                    padding: '15px 16px',
                    borderRight: `1px solid ${Talk.line}`,
                    borderBottom: `1px solid ${Talk.line}`,
                    fontWeight: 600,
                  }}>
                    {row[0]}
                  </div>
                  {row[1].map((score, i) => {
                    const isJudgment = i === 4;
                    const risky = isJudgment && score === -1;
                    const good = isJudgment && score === 3;
                    return (
                      <div key={`${row[0]}-${i}`} style={{
                        padding: '15px 16px',
                        textAlign: 'center',
                        fontFamily: TALK_MONO,
                        fontWeight: 700,
                        fontSize: 22,
                        color: risky ? Talk.red : good && strong > 0.4 ? Talk.blue : Talk.softInk,
                        background: risky ? Talk.redSoft : good && strong > 0.4 ? Talk.blueSoft : isJudgment ? '#f7fbff' : '#ffffff',
                        borderRight: `1px solid ${Talk.line}`,
                        borderBottom: `1px solid ${Talk.line}`,
                      }}>
                        {score === -1 ? 'Risky' : score === 3 ? 'Strong' : score === 2 ? 'Fair' : 'Weak'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function TakeawayCard({ start, end, kicker, line1, line2, accent = Talk.blue }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
        return (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 132px',
            opacity: entry,
            fontFamily: TALK_SANS,
          }}>
            <div style={{ fontFamily: TALK_MONO, fontSize: 14, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 26 }}>
              {kicker}
            </div>
            <div style={{ fontSize: 86, lineHeight: 1.05, fontWeight: 300, color: Talk.ink }}>
              {line1}
            </div>
            <div style={{ marginTop: 12, fontSize: 86, lineHeight: 1.05, fontWeight: 700, color: accent }}>
              {line2}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function TrapVideo() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <TalkGrid />
      <TalkChrome label="Engagement trap" />
      <MetricCards start={0.8} end={12.0} />
      <TrapPattern start={13.0} end={31.0} />
      <TakeawayCard start={35.0} end={45.0} kicker="Session 01 principle" line1="Engagement is not" line2="evidence of learning." accent={Talk.red} />
      <Host side="left" name="Mira" role="learning designer" mood="concerned" accent={Talk.blue} />
      <Host side="right" name="Jon" role="game designer" mood="skeptical" accent={Talk.red} />
      <Bubble start={2.0} end={6.0} side="left" speaker="Mira" text="The playtest looked successful. Everyone kept clicking." accent={Talk.blue} />
      <Bubble start={6.4} end={10.4} side="right" speaker="Jon" text="But the transfer task was flat. The game trained attention, not the target skill." accent={Talk.red} />
      <Bubble start={15.2} end={19.3} side="left" speaker="Mira" text="So the problem is not fun. It is a missing bridge from play to performance." accent={Talk.blue} />
      <Bubble start={23.5} end={27.7} side="right" speaker="Jon" text="Exactly. If the post-test asks for reasoning, the loop must make players reason." accent={Talk.red} />
      <Bubble start={31.2} end={34.6} side="left" speaker="Mira" text="Start with what learners must do afterward, then design the play." accent={Talk.blue} />
    </div>
  );
}

function CrosswalkVideo() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <TalkGrid />
      <TalkChrome label="Objective mechanic crosswalk" />
      <CrosswalkMatrixTalk start={0.8} end={34.0} />
      <TakeawayCard start={35.0} end={45.0} kicker="Session 03 principle" line1="Design from the objective." line2="Not from the mechanic." accent={Talk.blue} />
      <Host side="left" name="Mira" role="learning designer" mood="neutral" accent={Talk.blue} />
      <Host side="right" name="Jon" role="game designer" mood="skeptical" accent={Talk.green} />
      <Bubble start={2.2} end={6.0} side="left" speaker="Mira" text="Our objective is judgment under uncertainty." accent={Talk.blue} />
      <Bubble start={6.5} end={10.8} side="right" speaker="Jon" text="Then a timed drill is risky. Speed can erase deliberation." accent={Talk.green} />
      <Bubble start={15.0} end={19.2} side="left" speaker="Mira" text="The crosswalk gives us a disciplined way to reject tempting mechanics." accent={Talk.blue} />
      <Bubble start={23.3} end={27.6} side="right" speaker="Jon" text="Branching, simulation, and narrative role keep the trade-offs visible." accent={Talk.green} />
      <Bubble start={30.0} end={34.2} side="left" speaker="Mira" text="Now the mechanic is a hypothesis we can test, not a preference." accent={Talk.blue} />
    </div>
  );
}

const MODULE_VIDEO_DATA = {
  1: {
    label: 'Framing',
    title: 'What makes a game educational?',
    cards: [
      ['About', 'A topic appears in the game.'],
      ['Experience', 'Learners feel or explore something.'],
      ['Teach', 'A target behavior improves.'],
    ],
    lines: [
      ['Mira', 'left', 'A game can be about a topic and still teach nothing measurable.', Talk.blue],
      ['Jon', 'right', 'So the first question is not "is it fun?" It is "what changes after play?"', Talk.red],
      ['Mira', 'left', 'For D1, write the behavior you can observe. Everything else is context.', Talk.blue],
    ],
    takeaway1: 'Name the learner behavior.',
    takeaway2: 'Then design the play.',
    accent: Talk.red,
  },
  2: {
    label: 'Learner and context',
    title: 'A generic learner creates a generic game.',
    cards: [
      ['Learner', 'Who needs the change?'],
      ['Constraint', 'Where will the game run?'],
      ['Evidence', 'What would prove the gap moved?'],
    ],
    lines: [
      ['Jon', 'right', 'If the learner is "students," the design can hide almost anything.', Talk.green],
      ['Mira', 'left', 'Right. D1 needs a real context, a real constraint, and a measurable shift.', Talk.blue],
      ['Jon', 'right', 'No design talk until the learner sentence survives critique.', Talk.green],
    ],
    takeaway1: 'Design for a concrete learner.',
    takeaway2: 'Not an imagined average.',
    accent: Talk.green,
  },
  3: {
    label: 'Objectives and crosswalk',
    title: 'The mechanic must fit the objective type.',
    cards: [
      ['Objective', 'What cognitive work is required?'],
      ['Mechanic', 'What loop produces that work?'],
      ['Risk', 'Where might the loop teach the wrong thing?'],
    ],
    lines: [
      ['Mira', 'left', 'Judgment under uncertainty is not trained by raw speed.', Talk.blue],
      ['Jon', 'right', 'The crosswalk lets us reject tempting mechanics before we prototype them.', Talk.green],
      ['Mira', 'left', 'Now the mechanic is a testable hypothesis, not a preference.', Talk.blue],
    ],
    takeaway1: 'Design from the objective.',
    takeaway2: 'Not from the mechanic.',
    accent: Talk.blue,
  },
  4: {
    label: 'Mechanics I',
    title: 'Challenge, feedback, and failure are one system.',
    cards: [
      ['Challenge', 'The task is hard for the right reason.'],
      ['Feedback', 'The response points to the next attempt.'],
      ['Failure', 'The cost is visible and recoverable.'],
    ],
    lines: [
      ['Jon', 'right', 'A difficult game is not automatically a good learning game.', Talk.green],
      ['Mira', 'left', 'Failure teaches only when the retry path exposes the missing idea.', Talk.blue],
      ['Jon', 'right', 'Tune the loop until the learner knows what to try next.', Talk.green],
    ],
    takeaway1: 'Make failure informative.',
    takeaway2: 'Not punitive.',
    accent: Talk.red,
  },
  5: {
    label: 'Mechanics II',
    title: 'Narrative and role should do instructional work.',
    cards: [
      ['Wrapper', 'Story decorates the task.'],
      ['Role', 'The learner sees what actions are possible.'],
      ['Structure', 'Solo, pair, team, or asymmetric play.'],
    ],
    lines: [
      ['Mira', 'left', 'A story wrapper can make weak mechanics feel polished.', Talk.blue],
      ['Jon', 'right', 'A role is stronger when it permits some actions and forbids others.', Talk.green],
      ['Mira', 'left', 'Use narrative to sharpen the decision, not to distract from it.', Talk.blue],
    ],
    takeaway1: 'Role is a constraint.',
    takeaway2: 'Not decoration.',
    accent: Talk.green,
  },
  6: {
    label: 'Facilitator design',
    title: 'If a colleague cannot run it, it is not a module yet.',
    cards: [
      ['Setup', 'Materials and room are unambiguous.'],
      ['Script', 'Critical facilitator lines are written.'],
      ['Recovery', 'Common failures have a response.'],
    ],
    lines: [
      ['Jon', 'right', 'Teams often write notes only the author can interpret.', Talk.green],
      ['Mira', 'left', 'The guide has to carry the session when the designer is absent.', Talk.blue],
      ['Jon', 'right', 'Write the moments where silence, timing, or wording changes the learning.', Talk.green],
    ],
    takeaway1: 'Facilitation is part of the design.',
    takeaway2: 'Document the moves.',
    accent: Talk.blue,
  },
  7: {
    label: 'Low-fi prototyping',
    title: 'The cheapest prototype is the one that fails today.',
    cards: [
      ['Build', 'Only enough to run the loop.'],
      ['Play', 'Watch without rescuing.'],
      ['Revise', 'Cut what the playtest disproves.'],
    ],
    lines: [
      ['Mira', 'left', 'A polished prototype can protect a bad idea for too long.', Talk.blue],
      ['Jon', 'right', 'Paper lets the loop fail before the team starts defending the build.', Talk.green],
      ['Mira', 'left', 'The prototype is a question. The playtest is the answer.', Talk.blue],
    ],
    takeaway1: 'Prototype the loop.',
    takeaway2: 'Not the fantasy.',
    accent: Talk.red,
  },
  8: {
    label: 'Interaction spec',
    title: 'A game idea becomes buildable when states and events are named.',
    cards: [
      ['State', 'What can be true right now?'],
      ['Event', 'What can change it?'],
      ['Feedback', 'What does the learner see next?'],
    ],
    lines: [
      ['Jon', 'right', 'Developers cannot build "make it engaging." They can build named states.', Talk.green],
      ['Mira', 'left', 'The spec protects the learning loop from getting lost in implementation.', Talk.blue],
      ['Jon', 'right', 'One hero scene is enough if the event map is precise.', Talk.green],
    ],
    takeaway1: 'Name the state changes.',
    takeaway2: 'Then build.',
    accent: Talk.blue,
  },
  9: {
    label: 'Playtest design',
    title: 'A useful playtest tries to falsify the design.',
    cards: [
      ['Target users', 'Peers are not enough.'],
      ['Protocol', 'The script is run, not improvised.'],
      ['Hypotheses', 'Findings can change the design.'],
    ],
    lines: [
      ['Mira', 'left', 'If a finding cannot make you revise, it was not a real test.', Talk.blue],
      ['Jon', 'right', 'Peers are useful for debugging. Target learners are needed for evidence.', Talk.green],
      ['Mira', 'left', 'Write what would convince you the loop is wrong.', Talk.blue],
    ],
    takeaway1: 'Test the risky claim.',
    takeaway2: 'Not the easy one.',
    accent: Talk.red,
  },
  10: {
    label: 'Audit',
    title: 'Every reward teaches something, even when you did not mean it to.',
    cards: [
      ['Reward', 'What behavior gets reinforced?'],
      ['Load', 'Where does attention go?'],
      ['Access', 'Who is excluded by the design?'],
    ],
    lines: [
      ['Jon', 'right', 'A score system can train shortcuts faster than it trains learning.', Talk.green],
      ['Mira', 'left', 'Audit lenses expose what the loop rewards, burdens, or hides.', Talk.blue],
      ['Jon', 'right', 'The fix is not moral language. It is a changed mechanic.', Talk.green],
    ],
    takeaway1: 'Audit the incentives.',
    takeaway2: 'Then revise the loop.',
    accent: Talk.green,
  },
  11: {
    label: 'Revision studio',
    title: 'Revision is a prioritization problem.',
    cards: [
      ['Evidence', 'What did the playtest show?'],
      ['Impact', 'What learning risk changes?'],
      ['Effort', 'What can ship now?'],
    ],
    lines: [
      ['Mira', 'left', 'A long revision list can feel productive and still protect the wrong fix.', Talk.blue],
      ['Jon', 'right', 'Rank by evidence, impact, and effort. Then keep the top few.', Talk.green],
      ['Mira', 'left', 'A deferred idea is not a failure. It is scope discipline.', Talk.blue],
    ],
    takeaway1: 'Ship the highest-leverage changes.',
    takeaway2: 'Defer the rest.',
    accent: Talk.blue,
  },
  12: {
    label: 'Final presentations',
    title: 'End with a defensible claim.',
    cards: [
      ['Claim', 'What can you say now?'],
      ['Evidence', 'Which artifacts support it?'],
      ['Limits', 'What remains unproven?'],
    ],
    lines: [
      ['Jon', 'right', 'A final presentation is not a tour of everything the team made.', Talk.green],
      ['Mira', 'left', 'It is a claim about what the design can now teach, backed by evidence.', Talk.blue],
      ['Jon', 'right', 'Strong designers name limits without apologizing for them.', Talk.green],
    ],
    takeaway1: 'Make the claim.',
    takeaway2: 'Show the evidence.',
    accent: Talk.red,
  },
};

function ModuleCards({ data, start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const entry = Easing.easeOutCubic(clamp(localTime / 0.55, 0, 1));
        return (
          <div style={{ position: 'absolute', left: 170, top: 150, right: 170, opacity: entry, fontFamily: TALK_SANS }}>
            <div style={{ fontFamily: TALK_MONO, fontSize: 14, color: data.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
              {data.label}
            </div>
            <div style={{ fontSize: 60, lineHeight: 1.08, fontWeight: 300, color: Talk.ink, maxWidth: 1220, marginBottom: 34 }}>
              {data.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {data.cards.map((card, index) => {
                const cardIn = Easing.easeOutCubic(clamp((localTime - index * 0.25) / 0.5, 0, 1));
                return (
                  <div key={card[0]} style={{
                    minHeight: 172,
                    padding: '28px 30px',
                    background: '#ffffff',
                    border: `1px solid ${index === 2 ? data.accent : Talk.line}`,
                    borderTop: `5px solid ${index === 2 ? data.accent : Talk.line}`,
                    boxShadow: '0 14px 35px rgba(0,0,0,0.08)',
                    opacity: cardIn,
                    transform: `translateY(${(1 - cardIn) * 18}px)`,
                  }}>
                    <div style={{ fontFamily: TALK_MONO, fontSize: 13, color: index === 2 ? data.accent : Talk.faintInk, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
                      {card[0]}
                    </div>
                    <div style={{ fontSize: 27, lineHeight: 1.18, color: Talk.ink }}>
                      {card[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function ModuleVideo({ module = 1 }) {
  const data = MODULE_VIDEO_DATA[module] || MODULE_VIDEO_DATA[1];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <TalkGrid />
      <TalkChrome label={data.label} />
      <ModuleCards data={data} start={0.7} end={34.0} />
      <TakeawayCard start={35.0} end={45.0} kicker={`Session ${String(module).padStart(2, '0')} principle`} line1={data.takeaway1} line2={data.takeaway2} accent={data.accent} />
      <Host side="left" name="Mira" role="learning designer" mood="neutral" accent={Talk.blue} />
      <Host side="right" name="Jon" role="game designer" mood="skeptical" accent={module % 3 === 1 ? Talk.red : Talk.green} />
      {data.lines.map((line, index) => (
        <Bubble
          key={`${line[0]}-${index}`}
          start={[2.0, 10.5, 22.0][index]}
          end={[7.2, 16.0, 29.5][index]}
          speaker={line[0]}
          side={line[1]}
          text={line[2]}
          accent={line[3]}
        />
      ))}
    </div>
  );
}

Object.assign(window, { TrapVideo, CrosswalkVideo, ModuleVideo, MODULE_VIDEO_DATA });
