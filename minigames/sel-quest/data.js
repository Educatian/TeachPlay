// Maeum Village: SEL Quest 3D — quest, dialogue, and UI string data.
// Every learner-facing string is bilingual: { ko, en }.
// Dialogue nodes form small branching trees. Choices carry a quality tier
// ("best" | "good" | "poor") that maps to points for the linked competency.

export const COMPETENCIES = [
  {
    id: "selfAwareness",
    label: { ko: "자기인식", en: "Self-Awareness" },
    color: "#f2b134",
    icon: "🔍"
  },
  {
    id: "selfManagement",
    label: { ko: "자기관리", en: "Self-Management" },
    color: "#4fc3f7",
    icon: "🧘"
  },
  {
    id: "socialAwareness",
    label: { ko: "사회적 인식", en: "Social Awareness" },
    color: "#81c784",
    icon: "🤝"
  },
  {
    id: "relationship",
    label: { ko: "관계 기술", en: "Relationship Skills" },
    color: "#f48fb1",
    icon: "💬"
  },
  {
    id: "decision",
    label: { ko: "책임 있는 의사결정", en: "Responsible Decision-Making" },
    color: "#b39ddb",
    icon: "⚖️"
  }
];

export const CHOICE_POINTS = { best: 10, good: 6, poor: 2 };

export const NPCS = {
  hana: {
    id: "hana",
    name: { ko: "하나 선생님", en: "Ms. Hana" },
    role: { ko: "마음 마을 안내자", en: "Village Guide" },
    palette: { skin: 0xf1c9a5, hair: 0x3a2c23, top: 0x2e6f5e, bottom: 0x24333f },
    position: { x: 0, z: 6 },
    facing: Math.PI,
    mood: "happy"
  },
  jiho: {
    id: "jiho",
    name: { ko: "지호", en: "Jiho" },
    role: { ko: "연못가의 학생", en: "Student by the pond" },
    palette: { skin: 0xf1c9a5, hair: 0x20242c, top: 0x5471b8, bottom: 0x30405c },
    position: { x: -16, z: -10 },
    facing: Math.PI * 0.3,
    mood: "sad"
  },
  yuna: {
    id: "yuna",
    name: { ko: "유나", en: "Yuna" },
    role: { ko: "운동장의 학생", en: "Student at the playground" },
    palette: { skin: 0xf6d3b3, hair: 0x5a3825, top: 0xc75450, bottom: 0x574052 },
    position: { x: 17, z: -12 },
    facing: -Math.PI * 0.4,
    mood: "angry"
  },
  minjun: {
    id: "minjun",
    name: { ko: "민준", en: "Minjun" },
    role: { ko: "전학 온 학생", en: "New transfer student" },
    palette: { skin: 0xe8bd95, hair: 0x1c1c22, top: 0x8d9440, bottom: 0x3d4a37 },
    position: { x: -14, z: 14 },
    facing: -Math.PI * 0.2,
    mood: "worried"
  },
  sora: {
    id: "sora",
    name: { ko: "소라", en: "Sora" },
    role: { ko: "발명 동아리원", en: "Maker-club member" },
    palette: { skin: 0xf6d3b3, hair: 0x704214, top: 0xd98e2b, bottom: 0x4b3b56 },
    position: { x: 14.6, z: 13.4 },
    facing: Math.PI * 0.9,
    mood: "angry"
  },
  taeo: {
    id: "taeo",
    name: { ko: "태오", en: "Taeo" },
    role: { ko: "발명 동아리원", en: "Maker-club member" },
    palette: { skin: 0xedc39d, hair: 0x2f2620, top: 0x4a7fb5, bottom: 0x2e3d4d },
    position: { x: 17.4, z: 15 },
    facing: -Math.PI * 0.75,
    mood: "sad"
  },
  doyun: {
    id: "doyun",
    name: { ko: "도윤", en: "Doyun" },
    role: { ko: "가게 앞의 학생", en: "Student outside the shop" },
    palette: { skin: 0xf1c9a5, hair: 0x33261c, top: 0x6b5ca5, bottom: 0x30363f },
    position: { x: 3, z: -20 },
    facing: 0.2,
    mood: "worried"
  }
};

// ---------------------------------------------------------------------------
// Quests. Each quest: giver NPC, competency, dialogue nodes.
// Node shape:
//   { speaker, text, next }                      → linear line
//   { speaker, text, choices: [{ text, tier, stat, reply, next }] } → decision
//   { speaker, text, end: true }                 → closes the dialogue
// The special node id "done" finishes the quest.
// ---------------------------------------------------------------------------

export const QUESTS = [
  {
    id: "intro",
    npc: "hana",
    competency: null,
    order: 0,
    title: { ko: "마음 마을에 온 것을 환영해!", en: "Welcome to Maeum Village!" },
    summary: {
      ko: "하나 선생님에게 마을과 다섯 가지 마음의 힘에 대해 듣는다.",
      en: "Hear from Ms. Hana about the village and the five heart skills."
    },
    objective: {
      ko: "하나 선생님과 대화하기",
      en: "Talk to Ms. Hana"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "hana",
        text: {
          ko: "어서 와! 여기는 '마음 마을'이야. 이 마을 친구들은 저마다 마음의 어려움을 하나씩 안고 있어.",
          en: "Welcome! This is Maeum Village — the Village of Hearts. Each friend here is carrying a feeling that's hard to handle alone."
        },
        next: "n2"
      },
      n2: {
        speaker: "hana",
        text: {
          ko: "네가 친구들의 이야기를 잘 듣고 도와주면, 다섯 가지 '마음의 힘'이 자라나. 자기인식, 자기관리, 사회적 인식, 관계 기술, 그리고 책임 있는 의사결정이지.",
          en: "When you listen well and help them, five 'heart skills' grow: self-awareness, self-management, social awareness, relationship skills, and responsible decision-making."
        },
        next: "n3"
      },
      n3: {
        speaker: "hana",
        text: {
          ko: "먼저 연습해 볼까? 내가 오늘 아침에 아끼던 화분을 깨뜨렸어. 지금 내 기분이 어떨 것 같니?",
          en: "Let's practice. This morning I broke my favorite flower pot. How do you think I feel right now?"
        },
        choices: [
          {
            text: { ko: "속상하고 아쉬우실 것 같아요.", en: "You probably feel sad and disappointed." },
            tier: "best",
            stat: "socialAwareness",
            reply: {
              ko: "맞아, 정확해! 상대의 상황에서 마음을 짐작해 보는 것, 그게 공감의 시작이야.",
              en: "Exactly right! Imagining how someone feels in their situation — that's where empathy begins."
            },
            next: "n4"
          },
          {
            text: { ko: "화분은 또 사면 되죠, 뭐.", en: "You can just buy another pot." },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "하하, 그렇긴 하지. 하지만 물건보다 먼저 '마음'을 읽어 주면 상대는 훨씬 큰 위로를 받는단다.",
              en: "Ha, true! But if you notice the feeling before the fix, your words comfort people much more."
            },
            next: "n4"
          },
          {
            text: { ko: "왜 깨뜨리셨는지 여쭤봐도 돼요?", en: "May I ask how it happened?" },
            tier: "good",
            stat: "socialAwareness",
            reply: {
              ko: "좋은 질문이야! 궁금해하며 물어봐 주는 것도 관심의 표현이지. 거기에 마음 읽기까지 더하면 완벽해.",
              en: "Good question! Asking with curiosity shows you care. Add a guess about the feeling and it's perfect."
            },
            next: "n4"
          }
        ]
      },
      n4: {
        speaker: "hana",
        text: {
          ko: "이제 준비됐어. 마을 곳곳에서 노란 느낌표(!)가 떠 있는 친구들을 찾아가 봐. 지도는 필요 없어 — 마음이 이끄는 곳으로 가면 되니까!",
          en: "You're ready. Look for friends with a yellow exclamation mark (!) around the village. No map needed — just follow where your heart points!"
        },
        end: true
      }
    },
    completion: {
      ko: "튜토리얼 완료! 이제 마을 친구들을 도우러 가자.",
      en: "Tutorial complete! Now go help the villagers."
    }
  },

  {
    id: "q_selfAwareness",
    npc: "jiho",
    competency: "selfAwareness",
    order: 1,
    requires: ["intro"],
    title: { ko: "이름 없는 먹구름", en: "The Nameless Storm Cloud" },
    summary: {
      ko: "연못가의 지호가 시험을 망친 뒤 마음이 복잡하다. 감정에 이름을 붙이도록 도와주자.",
      en: "Jiho bombed a test and his feelings are a tangle. Help him name what he feels."
    },
    objective: {
      ko: "연못가의 지호와 대화하기",
      en: "Talk to Jiho by the pond"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "jiho",
        text: {
          ko: "…아, 안녕. 나 오늘 수학 시험을 완전히 망쳤어. 가슴이 꽉 막힌 것 같고, 뭐가 뭔지 모르겠어.",
          en: "...Oh, hey. I totally bombed the math test today. My chest feels tight and I can't even tell what's going on inside me."
        },
        choices: [
          {
            text: {
              ko: "가슴이 답답할 정도구나. 지금 마음속에 어떤 느낌들이 섞여 있는 것 같아?",
              en: "That sounds heavy. What feelings do you think are mixed up in there right now?"
            },
            tier: "best",
            stat: "selfAwareness",
            reply: {
              ko: "음… 그러게. 하나씩 꺼내 보면… 속상하고, 창피하고, 다음 시험이 벌써 무섭기도 해.",
              en: "Hmm... let me pull them apart. I'm upset... embarrassed... and honestly already scared of the next test."
            },
            next: "n2"
          },
          {
            text: {
              ko: "에이, 시험 하나 망친 게 뭐 어때. 잊어버려!",
              en: "Come on, it's just one test. Forget about it!"
            },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "잊으라고 하니까 더 답답해… 그냥 지금 이 기분이 뭔지 알고 싶은 것뿐이야.",
              en: "Telling me to forget it makes it worse... I just want to understand what this feeling even is."
            },
            next: "n1b"
          },
          {
            text: {
              ko: "무슨 일이 있었는지 처음부터 이야기해 줄래?",
              en: "Want to tell me what happened, from the beginning?"
            },
            tier: "good",
            stat: "selfAwareness",
            reply: {
              ko: "공부를 열심히 했는데 아는 문제도 틀렸어. 말하다 보니… 여러 감정이 한꺼번에 몰려온 것 같아.",
              en: "I studied hard but missed problems I knew. Saying it out loud... I think a bunch of feelings hit me at once."
            },
            next: "n2"
          }
        ]
      },
      n1b: {
        speaker: "jiho",
        text: {
          ko: "미안, 짜증 내려던 건 아니야. 그… 내 기분을 알아차리는 걸 도와줄 수 있어?",
          en: "Sorry, I didn't mean to snap. Could you... help me figure out what I'm feeling?"
        },
        next: "n2"
      },
      n2: {
        speaker: "jiho",
        text: {
          ko: "특히 이 느낌이 제일 커. 얼굴이 화끈거리고, 친구들이 내 점수를 알까 봐 자꾸 신경 쓰여. 이건 무슨 감정일까?",
          en: "This one feeling is the biggest: my face burns and I keep worrying my friends will find out my score. What feeling is that?"
        },
        choices: [
          {
            text: { ko: "그건 '부끄러움(수치심)' 같아.", en: "That sounds like embarrassment (shame)." },
            tier: "best",
            stat: "selfAwareness",
            reply: {
              ko: "맞아, 부끄러움이야! 이름을 붙이니까 신기하게 조금 작아진 느낌이야.",
              en: "Yes — embarrassment! Weirdly, giving it a name just made it feel a little smaller."
            },
            next: "n3"
          },
          {
            text: { ko: "그건 그냥 '배고픔' 아닐까?", en: "Maybe you're just hungry?" },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "하하, 배도 고프긴 한데… 얼굴이 화끈거리는 건 아마 다른 걸 거야. 다시 생각해 보니 '부끄러움'인 것 같아.",
              en: "Ha, I am hungry... but the burning face is probably something else. Thinking again — it's embarrassment."
            },
            next: "n3"
          },
          {
            text: { ko: "'걱정'이 큰 것 같아. 들킬까 봐 불안한 거지.", en: "It sounds like worry — anxiety about being found out." },
            tier: "good",
            stat: "selfAwareness",
            reply: {
              ko: "걱정도 섞여 있는 것 같아. 걱정 반, 부끄러움 반! 감정이 한 개가 아닐 수도 있구나.",
              en: "Worry is in there too. Half worry, half embarrassment! I guess feelings can come in mixtures."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "jiho",
        text: {
          ko: "감정에 이름표를 붙이니까 마음속 먹구름이 조금 걷힌 것 같아. 마지막으로… 이 기분들, 몸의 어디에서 느껴지는지도 살펴보라고 했지?",
          en: "Labeling the feelings cleared some of the storm clouds. One more thing... you're supposed to notice where feelings live in your body, right?"
        },
        choices: [
          {
            text: {
              ko: "응! 가슴이 꽉 막힌 느낌, 화끈거리는 얼굴 — 몸의 신호가 감정을 알려 주는 단서야.",
              en: "Yes! The tight chest, the burning face — body signals are clues that point to feelings."
            },
            tier: "best",
            stat: "selfAwareness",
            reply: {
              ko: "몸이 먼저 알려 주는 거구나. 다음엔 가슴이 답답해지면 '아, 내 마음에 무슨 일이 있구나' 하고 멈춰서 살펴볼게!",
              en: "So my body knows first. Next time my chest tightens, I'll stop and ask, 'Okay, what's happening in my heart?'"
            },
            next: "n4"
          },
          {
            text: {
              ko: "몸은 상관없어. 그냥 생각만 바꾸면 돼.",
              en: "The body doesn't matter. Just change your thoughts."
            },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "음… 근데 아까 가슴이 답답한 걸 먼저 느꼈는걸? 몸의 신호도 마음을 읽는 단서가 되는 것 같아.",
              en: "Hmm... but the tight chest is what I noticed first? I think body signals really are clues to the heart."
            },
            next: "n4"
          }
        ]
      },
      n4: {
        speaker: "jiho",
        text: {
          ko: "고마워! '감정 알아차리기 → 이름 붙이기 → 몸의 신호 살피기' — 오늘 배운 세 단계, 잊지 않을게. 너 덕분에 다음 시험은 두렵지 않아!",
          en: "Thanks! Notice the feeling → name it → check the body signals. I won't forget those three steps. Thanks to you, the next test doesn't scare me!"
        },
        end: true
      }
    },
    completion: {
      ko: "지호가 자기 감정에 이름을 붙일 수 있게 되었다! (자기인식 ↑)",
      en: "Jiho can now name his feelings! (Self-Awareness ↑)"
    }
  },

  {
    id: "q_selfManagement",
    npc: "yuna",
    competency: "selfManagement",
    order: 2,
    requires: ["intro"],
    title: { ko: "폭발 직전의 화산", en: "Volcano About to Blow" },
    summary: {
      ko: "운동장의 유나가 경기에서 진 뒤 화가 나 폭발하기 직전이다. 화를 다스리는 방법을 함께 찾아 주자.",
      en: "Yuna just lost a match and is about to erupt. Help her find a way to cool the volcano."
    },
    objective: {
      ko: "운동장의 유나와 대화하기",
      en: "Talk to Yuna at the playground"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "yuna",
        text: {
          ko: "아 진짜!! 심판이 완전 불공평했어! 지금 당장 가서 다 뒤엎고 싶어! 주먹이 부들부들 떨려!",
          en: "ARGH!! The referee was SO unfair! I want to storm over and flip everything! My fists are literally shaking!"
        },
        choices: [
          {
            text: {
              ko: "정말 화가 많이 났구나. 행동하기 전에, 우리 같이 깊게 숨을 세 번만 쉬어 볼래?",
              en: "You're really angry. Before you do anything — want to take three deep breaths with me first?"
            },
            tier: "best",
            stat: "selfManagement",
            reply: {
              ko: "…후우우. …후우. …후. …어, 이상하다. 주먹이 조금 풀렸어.",
              en: "...Whooo. ...Whoo. ...Whew. ...Huh. Weird. My fists just loosened a little."
            },
            next: "n2"
          },
          {
            text: {
              ko: "맞아, 가서 따지자! 내가 같이 가 줄게!",
              en: "Yeah, let's go yell at them! I'll come with you!"
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "…아니 잠깐. 지난번에 화난 채로 따졌다가 일주일 동안 후회했어. 이번엔 다르게 하고 싶어. 도와줄래?",
              en: "...Wait, no. Last time I charged in angry, I regretted it for a week. I want to do it differently this time. Help me?"
            },
            next: "n2"
          },
          {
            text: {
              ko: "화가 100점 만점에 몇 점쯤이야?",
              en: "On a scale of 0 to 100, how hot is the anger?"
            },
            tier: "good",
            stat: "selfManagement",
            reply: {
              ko: "95점!! …아니, 말하고 나니까 90점? 숫자로 재 보니까 조금은 내려다볼 수 있네.",
              en: "95!! ...Actually, saying it out loud... 90? Measuring it kind of lets me look down at it."
            },
            next: "n2"
          }
        ]
      },
      n2: {
        speaker: "yuna",
        text: {
          ko: "아직 속이 부글부글해. 몸이 뜨거운 용암으로 가득 찬 것 같아. 지금 나한테 제일 도움이 되는 건 뭘까?",
          en: "I'm still bubbling inside. My body feels full of hot lava. What would actually help me right now?"
        },
        choices: [
          {
            text: {
              ko: "천천히 넷 세며 들이쉬고, 여섯 세며 내쉬어 보자. 용암을 식히는 호흡법이야.",
              en: "Breathe in for four counts, out for six. It's the lava-cooling breath."
            },
            tier: "best",
            stat: "selfManagement",
            reply: {
              ko: "들이쉬고… 둘, 셋, 넷. 내쉬고… 둘, 셋, 넷, 다섯, 여섯. …용암이 식는 게 진짜 느껴져. 이 호흡법 뭐야, 마법이야?",
              en: "In... two, three, four. Out... two, three, four, five, six. ...The lava is actually cooling. What is this breath, magic?"
            },
            next: "n3"
          },
          {
            text: {
              ko: "화를 참지 말고 그냥 소리 지르는 게 낫지 않아?",
              en: "Wouldn't it be better to just scream it all out?"
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "소리 지르면 그 순간엔 시원한데, 지르고 나면 더 화가 나 있더라고. 다른 방법이 필요해.",
              en: "Screaming feels good for a second, but afterwards I'm always angrier. I need something else."
            },
            next: "n2b"
          },
          {
            text: {
              ko: "잠깐 이 자리를 벗어나서 물 한잔 마시고 오는 건 어때?",
              en: "How about stepping away for a minute and getting a drink of water?"
            },
            tier: "good",
            stat: "selfManagement",
            reply: {
              ko: "그거 좋다. '잠깐 멈추고 자리 옮기기'라니, 간단한데 효과 있을 것 같아.",
              en: "I like that. 'Pause and change the scene' — simple, but I bet it works."
            },
            next: "n3"
          }
        ]
      },
      n2b: {
        speaker: "yuna",
        text: {
          ko: "심호흡이 좋다고 들었어. 넷 세며 들이쉬고 여섯 세며 내쉬고… 오, 진짜 용암이 조금 식었어!",
          en: "I heard deep breathing helps. In for four, out for six... oh wow, the lava actually cooled a bit!"
        },
        next: "n3"
      },
      n3: {
        speaker: "yuna",
        text: {
          ko: "이제 화가 60점까지 내려왔어. 심판 판정 문제는 어떻게 하는 게 좋을까?",
          en: "Okay, the anger is down to 60. So what should I do about the unfair call?"
        },
        choices: [
          {
            text: {
              ko: "마음이 가라앉은 다음, 내일 코치님께 차분하게 '판정이 이해가 안 됐어요'라고 이야기해 보자.",
              en: "Once you're calm, talk to Coach tomorrow: 'I didn't understand that call' — calmly."
            },
            tier: "best",
            stat: "selfManagement",
            reply: {
              ko: "그래! 화산이 식은 다음에 말하면 내 말이 훨씬 잘 전달되겠지. '먼저 식히고, 나중에 말하기' — 이거다!",
              en: "Right! If I speak after the volcano cools, my words will actually land. 'Cool first, talk later' — that's it!"
            },
            next: "n4"
          },
          {
            text: {
              ko: "그냥 다시는 경기에 안 나가면 돼.",
              en: "Just never play in a match again."
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "안 돼, 난 경기가 너무 좋아! 피하는 건 답이 아닌 것 같아. 식힌 다음에 코치님께 말해 볼래.",
              en: "No way, I love playing! Avoiding it isn't the answer. I'll cool down and then talk to Coach."
            },
            next: "n4"
          }
        ]
      },
      n4: {
        speaker: "yuna",
        text: {
          ko: "고마워! '멈추기 → 호흡으로 식히기 → 가라앉은 뒤 말하기'. 이제 화가 나도 화산이 아니라 온천으로 만들 수 있을 것 같아!",
          en: "Thanks! Stop → cool it with breath → talk once it settles. Next time I'm angry, I'll turn the volcano into a hot spring instead!"
        },
        end: true
      }
    },
    completion: {
      ko: "유나가 화를 다스리는 자기만의 방법을 찾았다! (자기관리 ↑)",
      en: "Yuna found her own way to manage anger! (Self-Management ↑)"
    }
  },

  {
    id: "q_socialAwareness",
    npc: "minjun",
    competency: "socialAwareness",
    order: 3,
    requires: ["intro"],
    title: { ko: "혼자인 아이", en: "The Kid Standing Alone" },
    summary: {
      ko: "전학 온 민준이가 나무 아래에 혼자 서 있다. 민준이의 입장이 되어 마음을 헤아려 보자.",
      en: "Minjun, the new transfer student, stands alone under a tree. Step into his shoes."
    },
    objective: {
      ko: "나무 아래의 민준과 대화하기",
      en: "Talk to Minjun under the tree"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "minjun",
        text: {
          ko: "어… 안녕. 나 지난주에 전학 왔어. 다들 이미 친한 것 같아서, 어디에 껴야 할지 모르겠어. 그래서 그냥 여기 서 있었어.",
          en: "Oh... hi. I transferred here last week. Everyone already has their groups, and I don't know where I fit. So I've just been... standing here."
        },
        choices: [
          {
            text: {
              ko: "새 학교에서 아는 사람이 없으면 정말 외롭고 긴장되지. 나라도 그럴 것 같아.",
              en: "Being new with no one you know — that must feel lonely and nerve-wracking. I'd feel the same."
            },
            tier: "best",
            stat: "socialAwareness",
            reply: {
              ko: "…맞아, 딱 그 기분이야. 알아주는 사람이 있으니까 갑자기 마음이 놓인다.",
              en: "...Yeah, that's exactly it. Just having someone get it makes me feel so much lighter."
            },
            next: "n2"
          },
          {
            text: {
              ko: "그냥 아무 데나 먼저 말 걸면 되잖아. 뭐가 어려워?",
              en: "Just go talk to anyone first. How hard can it be?"
            },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "너한텐 쉬울지 몰라도… 모르는 사람들 사이에 먼저 들어가는 건 나한테는 절벽에서 뛰는 기분이야.",
              en: "Maybe it's easy for you... but walking into a group of strangers feels like jumping off a cliff to me."
            },
            next: "n1b"
          },
          {
            text: {
              ko: "전에 다니던 학교는 어땠어? 이야기해 줄래?",
              en: "What was your old school like? Tell me about it?"
            },
            tier: "good",
            stat: "socialAwareness",
            reply: {
              ko: "물어봐 줘서 고마워. 거기엔 3년 넘게 사귄 단짝이 있었어. 새로 시작하려니 그 친구 생각이 많이 나.",
              en: "Thanks for asking. I had a best friend there for three years. Starting over makes me miss them a lot."
            },
            next: "n2"
          }
        ]
      },
      n1b: {
        speaker: "minjun",
        text: {
          ko: "혹시… 내 입장이 되어서 한번 상상해 볼래? 아는 사람이 한 명도 없는 교실 문을 여는 기분을.",
          en: "Could you... try imagining it from where I stand? Opening a classroom door where you know absolutely no one."
        },
        next: "n2"
      },
      n2: {
        speaker: "minjun",
        text: {
          ko: "아까 점심시간에 어떤 애들이 나를 보면서 웃었어. 분명 나를 비웃는 거겠지…?",
          en: "At lunch, some kids looked my way and laughed. They must have been laughing at me... right?"
        },
        choices: [
          {
            text: {
              ko: "그렇게 보였다면 속상했겠다. 그런데 다른 이유로 웃었을 수도 있지 않을까? 사실은 알 수 없으니까.",
              en: "If it looked that way, that must have stung. But could there be another reason they laughed? We can't actually know."
            },
            tier: "best",
            stat: "socialAwareness",
            reply: {
              ko: "듣고 보니… 걔들이 자기들끼리 영상을 보고 있었던 것 같기도 해. 내 생각이 최악의 해석으로 점프했나 봐.",
              en: "Now that you say it... I think they were watching a video together. My brain jumped straight to the worst interpretation."
            },
            next: "n3"
          },
          {
            text: {
              ko: "응, 분명 너를 비웃은 거야. 걔들 별로다.",
              en: "Yeah, they were definitely laughing at you. They sound mean."
            },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "그런가… 아니다, 잠깐. 사실 확실하지 않아. 확인도 없이 나쁘게 단정하면 내 마음만 더 무거워지는 것 같아.",
              en: "Maybe... wait, no. I don't actually know that. Assuming the worst without checking just makes my heart heavier."
            },
            next: "n3"
          },
          {
            text: {
              ko: "웃음소리만으로는 알 수 없어. 표정이나 상황 같은 다른 단서도 봤어?",
              en: "A laugh alone doesn't tell us much. Did you catch other clues — faces, what they were doing?"
            },
            tier: "good",
            stat: "socialAwareness",
            reply: {
              ko: "단서라… 걔들은 핸드폰을 보고 있었어. 나를 가리키지도 않았고. 어쩌면 나랑 상관없는 웃음이었을지도.",
              en: "Clues... they were looking at a phone. Nobody pointed at me. Maybe the laugh had nothing to do with me."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "minjun",
        text: {
          ko: "너랑 이야기하니까 용기가 조금 생겼어. 저기 벤치에 앉아 있는 애들한테 가 보고 싶은데, 첫 마디를 뭐라고 하면 좋을까?",
          en: "Talking to you gave me a little courage. I want to go over to those kids by the bench — what should my first words be?"
        },
        choices: [
          {
            text: {
              ko: "\"안녕, 나 지난주에 전학 온 민준이야. 너희 뭐 하고 있어? 같이 해도 돼?\"",
              en: "\"Hi, I'm Minjun — I transferred last week. What are you playing? Mind if I join?\""
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "이름 말하고, 궁금해하고, 부탁하기! 완벽한 3단 콤보다. 좋아, 심장이 두근거리지만 가 볼게!",
              en: "Say my name, show curiosity, ask to join! The perfect three-hit combo. Okay — heart pounding, but I'm going in!"
            },
            next: "n4"
          },
          {
            text: {
              ko: "말은 걸지 말고 옆에 조용히 서 있어. 알아서 말 걸어 줄 거야.",
              en: "Don't say anything — just stand near them quietly. They'll talk to you eventually."
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "그건 내가 일주일 동안 해 본 방법인데… 아무 일도 일어나지 않았어. 역시 내가 먼저 인사해야겠지?",
              en: "That's what I've been doing all week... and nothing happened. I guess I really do need to say hi first."
            },
            next: "n4"
          }
        ]
      },
      n4: {
        speaker: "minjun",
        text: {
          ko: "가르쳐 줘서 고마워. 오늘 배운 것: 사람 마음은 내 상상이 아니라 '단서'로 읽기, 그리고 상대 입장에서 한 번 더 생각하기. 너는 그걸 나한테 해 줬어!",
          en: "Thank you. Today I learned: read people by clues, not by my imagination — and think once more from the other person's side. That's exactly what you did for me!"
        },
        end: true
      }
    },
    completion: {
      ko: "민준이가 용기를 내어 새 친구들에게 다가갔다! (사회적 인식 ↑)",
      en: "Minjun found the courage to approach new friends! (Social Awareness ↑)"
    }
  },

  {
    id: "q_relationship",
    npc: "sora",
    competency: "relationship",
    order: 4,
    requires: ["intro"],
    title: { ko: "부서진 로봇, 부서진 우정?", en: "Broken Robot, Broken Friendship?" },
    summary: {
      ko: "소라와 태오가 발명 대회 로봇이 부서진 일로 크게 다퉜다. 두 사람 사이에서 대화의 다리를 놓아 주자.",
      en: "Sora and Taeo are fighting over their broken contest robot. Build a bridge between them."
    },
    objective: {
      ko: "공방 앞의 소라, 태오와 대화하기",
      en: "Talk to Sora and Taeo by the workshop"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "sora",
        text: {
          ko: "잘 왔어! 네가 판단 좀 해 줘. 태오가 우리 대회 로봇을 떨어뜨려서 부쉈어! 3주 동안 만든 건데! 쟤랑은 이제 끝이야!",
          en: "Perfect timing! You be the judge. Taeo dropped our contest robot and SMASHED it! Three weeks of work! I'm done with him!"
        },
        next: "n2"
      },
      n2: {
        speaker: "taeo",
        text: {
          ko: "일부러 그런 게 아니야! 선반이 흔들려서 잡으려다가… 그리고 소라 넌 내 말은 듣지도 않잖아!",
          en: "It wasn't on purpose! The shelf wobbled and I tried to catch it... and Sora, you won't even listen to me!"
        },
        choices: [
          {
            text: {
              ko: "잠깐, 둘 다 소중한 로봇을 잃어서 속상한 건 같아 보여. 한 명씩 차례로 이야기해 볼까? 먼저 소라부터.",
              en: "Hold on — you both look upset about losing something you care about. Let's take turns. Sora first."
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "(소라) …좋아. 차례로라면. 나는 3주 내내 만든 로봇이 부서져서 가슴이 무너졌어. 대회가 다음 주란 말이야.",
              en: "(Sora) ...Fine. If we take turns. My heart sank when the robot broke — I built it for three straight weeks. The contest is next week."
            },
            next: "n3"
          },
          {
            text: {
              ko: "태오가 부쉈으니까 태오 잘못이네.",
              en: "Taeo broke it, so it's Taeo's fault."
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "(태오) 거봐, 다들 내 이야기는 듣지도 않아! …(소라) 아니, 잠깐. 그렇게 정하면 싸움만 커져. 순서대로 이야기해 보자.",
              en: "(Taeo) See?! Nobody even hears my side! ...(Sora) Wait, no. Deciding like that just makes the fight bigger. Let's actually take turns."
            },
            next: "n3"
          },
          {
            text: {
              ko: "태오야, 그때 무슨 일이 있었는지 자세히 말해 줄래?",
              en: "Taeo, can you tell us exactly what happened?"
            },
            tier: "good",
            stat: "relationship",
            reply: {
              ko: "(태오) 로봇을 더 안전한 칸으로 옮기려던 거였어. 소라를 놀라게 해 주고 싶어서… 근데 선반이 흔들렸어.",
              en: "(Taeo) I was moving it to a safer shelf. I wanted to surprise Sora... then the shelf wobbled."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "sora",
        text: {
          ko: "…옮기려던 거였다고? 몰랐어. 그래도 나 아직 화가 나. 이 마음을 태오한테 어떻게 말하면 좋을까?",
          en: "...You were moving it for me? I didn't know that. But I'm still angry. How do I even say this to him?"
        },
        choices: [
          {
            text: {
              ko: "'너 때문에'가 아니라 '나는'으로 시작해 봐. \"로봇이 부서져서 나는 정말 속상해\" 처럼.",
              en: "Start with 'I', not 'you'. Like: \"I'm really hurt that the robot broke.\""
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "(소라) \"태오야… 로봇이 부서져서 나는 정말 속상하고, 대회를 망칠까 봐 무서워.\" (태오) …정말 미안해, 소라야. 나도 그게 제일 무서웠어.",
              en: "(Sora) \"Taeo... I'm really hurt the robot broke, and I'm scared we'll lose the contest.\" (Taeo) ...I'm so sorry, Sora. That's what scared me most too."
            },
            next: "n4"
          },
          {
            text: {
              ko: "\"다시는 내 물건에 손대지 마!\"라고 확실하게 말해.",
              en: "Tell him straight: \"Never touch my stuff again!\""
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "(소라) \"다시는 손대지 마!\" (태오) …알았어. 이제 아무것도 안 도와줄게. (소라) 아 잠깐, 이건 아니야. 이렇게 말하면 마음이 더 멀어지잖아. 다시 해 볼래.",
              en: "(Sora) \"Never touch my stuff!\" (Taeo) ...Fine. I won't help with anything then. (Sora) Wait — no. That just pushed us further apart. Let me try again."
            },
            next: "n3b"
          }
        ]
      },
      n3b: {
        speaker: "sora",
        text: {
          ko: "이번엔 '나'로 시작해 볼게. \"로봇이 부서져서 나는 속상해. 그런데 네가 도와주려던 것도 이제 알아.\" (태오) 미안해… 그리고 고마워, 들어줘서.",
          en: "Let me start with 'I' this time. \"I'm hurt the robot broke. But now I know you were trying to help.\" (Taeo) I'm sorry... and thank you for hearing me."
        },
        next: "n4"
      },
      n4: {
        speaker: "taeo",
        text: {
          ko: "저기… 부품은 대부분 무사해. 대회까지 일주일 남았는데, 우리 어떻게 하면 좋을까?",
          en: "Hey... most of the parts survived. We have one week until the contest. What should we do?"
        },
        choices: [
          {
            text: {
              ko: "둘이 역할을 나눠서 같이 다시 만들면 어때? 소라는 설계, 태오는 조립처럼.",
              en: "Rebuild it together with split roles — Sora on design, Taeo on assembly?"
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "(소라) 좋아, 같이 하면 일주일이면 충분해! (태오) 이번엔 선반 말고 바닥에서 작업하자! 하하!",
              en: "(Sora) Yes — together, a week is plenty! (Taeo) And this time we work on the FLOOR, not the shelf! Haha!"
            },
            next: "n5"
          },
          {
            text: {
              ko: "그냥 대회를 포기하는 게 마음 편하지 않을까?",
              en: "Maybe just drop out of the contest? Less stress."
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "(소라) 포기라니! 3주의 노력이 아깝잖아. (태오) 맞아, 같이 다시 만들자. 이번엔 더 튼튼하게!",
              en: "(Sora) Drop out?! Not after three weeks of work. (Taeo) Right — let's rebuild it together. Sturdier this time!"
            },
            next: "n5"
          }
        ]
      },
      n5: {
        speaker: "sora",
        text: {
          ko: "고마워! 네가 없었으면 우리 우정도 로봇처럼 산산조각 났을 거야. '차례로 듣기'와 '나-전달법', 잊지 않을게!",
          en: "Thank you! Without you, our friendship would've shattered like the robot. Taking turns and I-messages — we won't forget!"
        },
        end: true
      }
    },
    completion: {
      ko: "소라와 태오가 화해하고 다시 한 팀이 되었다! (관계 기술 ↑)",
      en: "Sora and Taeo made up and became a team again! (Relationship Skills ↑)"
    }
  },

  {
    id: "q_decision",
    npc: "doyun",
    competency: "decision",
    order: 5,
    requires: ["intro"],
    title: { ko: "주인 잃은 지갑", en: "The Lost Wallet" },
    summary: {
      ko: "도윤이가 가게 앞에서 지갑을 주웠다. 책임 있는 선택의 단계를 함께 밟아 보자.",
      en: "Doyun found a wallet outside the shop. Walk through the steps of a responsible choice together."
    },
    objective: {
      ko: "가게 앞의 도윤과 대화하기",
      en: "Talk to Doyun outside the shop"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "doyun",
        text: {
          ko: "야, 잠깐만! 나 방금 가게 앞에서 이 지갑을 주웠어. 안에 5만 원이나 들어 있어… 아무도 못 봤는데, 어떡하지?",
          en: "Hey, wait! I just found this wallet outside the shop. There's 50,000 won inside... nobody saw me pick it up. What do I do?"
        },
        choices: [
          {
            text: {
              ko: "결정하기 전에 잠깐 멈추자. 이 선택이 지갑 주인, 그리고 너 자신에게 어떤 영향을 줄지 생각해 볼까?",
              en: "Let's pause before deciding. How would each choice affect the wallet's owner — and you?"
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "잠깐 멈추고 생각하기라… 좋아. 주인은 지금 엄청 애타게 찾고 있을 거야. 그리고 내가 가지면… 계속 마음이 무거울 것 같아.",
              en: "Pause and think... okay. The owner is probably searching frantically right now. And if I kept it... my heart would stay heavy."
            },
            next: "n2"
          },
          {
            text: {
              ko: "아무도 못 봤으면 그냥 가져도 되지 않아?",
              en: "If nobody saw you, can't you just keep it?"
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "그치? 아무도 모르는데… 근데 이상하다. '아무도 모르는데'라고 말할수록 내 마음은 알고 있다는 뜻이잖아. 다시 생각해 볼래.",
              en: "Right? Nobody knows... but wait. The more I say 'nobody knows', the more it means my own heart knows. Let me think again."
            },
            next: "n2"
          },
          {
            text: {
              ko: "지갑 안에 주인을 알 수 있는 단서가 있는지 먼저 볼까?",
              en: "Should we check the wallet for clues about the owner first?"
            },
            tier: "good",
            stat: "decision",
            reply: {
              ko: "그러네! 학생증이 있어 — 옆 학교 6학년이야. 얼굴 사진을 보니까 더 남 일 같지 않다…",
              en: "Good idea! There's a student ID — a 6th grader from the school next door. Seeing the photo makes it feel so much more real..."
            },
            next: "n2"
          }
        ]
      },
      n2: {
        speaker: "doyun",
        text: {
          ko: "솔직히 말하면 요즘 갖고 싶던 게임이 딱 5만 원이야. 머릿속에서 천사와 악마가 싸우고 있어. 선택지를 정리해 줄래?",
          en: "Honestly? The game I've been wanting costs exactly 50,000 won. There's an angel and a devil wrestling in my head. Help me lay out the options?"
        },
        choices: [
          {
            text: {
              ko: "선택지는 세 가지야: 갖는다, 그 자리에 둔다, 주인을 찾아 준다. 각각 그다음에 무슨 일이 생길까?",
              en: "Three options: keep it, leave it where it was, or find the owner. What happens after each one?"
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "갖으면 → 게임은 생기지만 죄책감도 생겨. 두고 가면 → 다른 사람이 가져갈지도 몰라. 찾아 주면 → 주인이 기뻐하고, 나도 떳떳해! …답이 보인다.",
              en: "Keep it → I get the game but also the guilt. Leave it → someone else might take it. Return it → the owner's relieved and I can hold my head high! ...The answer is showing itself."
            },
            next: "n3"
          },
          {
            text: {
              ko: "고민할 게 뭐 있어, 반반 나누자!",
              en: "Why agonize? Split it fifty-fifty!"
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "하하, 잠깐 솔깃했다… 근데 반만 가져도 가진 건 가진 거잖아. 어중간한 선택은 어중간하게 마음이 무거울 뿐이야.",
              en: "Ha, tempting for a second... but keeping half is still keeping. A halfway choice just leaves my heart halfway heavy."
            },
            next: "n3"
          },
          {
            text: {
              ko: "만약 네 지갑이었다면, 주운 사람이 어떻게 해 주길 바랄 것 같아?",
              en: "If it were YOUR wallet, what would you want the finder to do?"
            },
            tier: "good",
            stat: "decision",
            reply: {
              ko: "당연히 찾아 주길 바라지! …아, 이렇게 뒤집어 생각하니까 답이 명확해지네.",
              en: "I'd obviously want it back! ...Oh. Flipping it around makes the answer crystal clear."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "doyun",
        text: {
          ko: "결정했어. 주인을 찾아 주자! 학생증을 보니 옆 학교 학생이야. 어떤 방법이 제일 좋을까?",
          en: "Decided. We return it! The ID says the owner goes to the school next door. What's the best way?"
        },
        choices: [
          {
            text: {
              ko: "가게 아저씨나 선생님 같은 어른에게 맡기고, 학생증 정보를 알려 드리자.",
              en: "Hand it to a trusted adult — the shopkeeper or a teacher — along with the ID info."
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "그게 제일 안전하고 확실하겠다. 어른에게 맡기면 주인한테 꼭 전해질 거야. 같이 가 줄래?",
              en: "That's the safest and surest way. With an adult on it, it'll definitely reach the owner. Come with me?"
            },
            next: "n4"
          },
          {
            text: {
              ko: "지갑을 그냥 길에 다시 두고 가자. 주인이 다시 찾으러 오겠지.",
              en: "Just put it back on the street. The owner will come looking."
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "음… 그러다 다른 사람이 가져가면? 여기까지 고민했는데 마지막에 무책임해질 순 없어. 어른에게 맡기는 게 낫겠어.",
              en: "Hmm... what if someone else grabs it? After all this thinking, I can't go irresponsible at the finish line. I'll hand it to an adult."
            },
            next: "n4"
          }
        ]
      },
      n4: {
        speaker: "doyun",
        text: {
          ko: "가게 아저씨가 옆 학교에 바로 연락해 주셨어! 오늘 배운 '멈추기 → 선택지 펼치기 → 결과 상상하기 → 책임 있게 행동하기' 4단계, 진짜 물건이다. 고마워!",
          en: "The shopkeeper called the school right away! That four-step move — pause → lay out options → imagine outcomes → act responsibly — is the real deal. Thank you!"
        },
        end: true
      }
    },
    completion: {
      ko: "도윤이가 책임 있는 선택으로 지갑 주인을 찾아 주었다! (책임 있는 의사결정 ↑)",
      en: "Doyun made the responsible choice and returned the wallet! (Responsible Decision-Making ↑)"
    }
  },

  {
    id: "finale",
    npc: "hana",
    competency: null,
    order: 6,
    requires: ["q_selfAwareness", "q_selfManagement", "q_socialAwareness", "q_relationship", "q_decision"],
    title: { ko: "마음의 힘 수여식", en: "The Heart Skills Ceremony" },
    summary: {
      ko: "마을 친구들을 모두 도왔다! 하나 선생님에게 돌아가 수여식을 치르자.",
      en: "Every villager has been helped! Return to Ms. Hana for the ceremony."
    },
    objective: {
      ko: "하나 선생님에게 돌아가기",
      en: "Return to Ms. Hana"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "hana",
        text: {
          ko: "마을 전체가 환해졌어! 지호는 감정에 이름을 붙이고, 유나는 화산을 온천으로 만들고, 민준이는 새 친구를 사귀고, 소라와 태오는 다시 한 팀이 되고, 도윤이는 떳떳한 선택을 했지.",
          en: "The whole village is glowing! Jiho names his feelings, Yuna turns volcanoes into hot springs, Minjun made new friends, Sora and Taeo are a team again, and Doyun chose to stand tall."
        },
        next: "n2"
      },
      n2: {
        speaker: "hana",
        text: {
          ko: "이 모든 건 네가 '들어 주는 사람'이 되어 준 덕분이야. 마지막 질문! 오늘 배운 마음의 힘 중에서, 내일 당장 네 하루에 써 보고 싶은 건 뭐니?",
          en: "It all happened because you chose to be a listener. Final question: of all the heart skills from today, which one will you try in your own day tomorrow?"
        },
        choices: [
          {
            text: {
              ko: "감정에 이름 붙이기 — 내 마음부터 알아차릴래요.",
              en: "Naming feelings — I'll start by noticing my own heart."
            },
            tier: "best",
            stat: "selfAwareness",
            reply: {
              ko: "멋진 선택이야. 모든 마음의 힘은 자기 마음을 아는 것에서 시작하니까.",
              en: "A beautiful choice. Every heart skill begins with knowing your own heart."
            },
            next: "n3"
          },
          {
            text: {
              ko: "차례로 듣기와 나-전달법 — 다툰 친구와 화해하고 싶어요.",
              en: "Taking turns and I-messages — there's a friend I want to make up with."
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "용기 있는 선택이야. 먼저 다리를 놓는 사람이 관계의 영웅이란다.",
              en: "A brave choice. The one who builds the bridge first is the hero of the friendship."
            },
            next: "n3"
          },
          {
            text: {
              ko: "멈추고 생각하기 — 결정하기 전에 결과를 상상해 볼래요.",
              en: "Pausing to think — I'll imagine outcomes before I decide."
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "지혜로운 선택이야. 잠깐의 멈춤이 오랜 후회를 막아 주지.",
              en: "A wise choice. A moment's pause prevents a long regret."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "hana",
        text: {
          ko: "이제 수여식을 시작할게. 마음 마을의 이름으로, 너에게 '마음의 힘 배지'를 수여합니다! 결과 리포트를 확인해 봐!",
          en: "Now, the ceremony. In the name of Maeum Village, I award you the Heart Skills Badge! Check your final report!"
        },
        end: true,
        triggersReport: true
      }
    },
    completion: {
      ko: "모든 여정 완료! 마음의 힘 배지를 획득했다!",
      en: "Journey complete! You earned the Heart Skills Badge!"
    }
  }
];

// ---------------------------------------------------------------------------
// UI strings
// ---------------------------------------------------------------------------

export const UI = {
  gameTitle: { ko: "마음 마을: 사회정서 RPG", en: "Maeum Village: SEL Quest 3D" },
  gameSubtitle: {
    ko: "3D 사회정서학습(SEL) 시뮬레이터",
    en: "A 3D social-emotional learning simulator"
  },
  introBody: {
    ko: "마음 마을의 친구들이 저마다 마음의 어려움을 겪고 있어요. 마을을 자유롭게 돌아다니며 친구들의 이야기를 듣고, 다섯 가지 마음의 힘(CASEL 사회정서 역량)을 키워 보세요.",
    en: "The villagers of Maeum Village are each wrestling with a feeling. Explore freely, listen to their stories, and grow the five heart skills (the CASEL social-emotional competencies)."
  },
  startButton: { ko: "모험 시작하기", en: "Start the Adventure" },
  continueButton: { ko: "이어서 하기", en: "Continue Journey" },
  newGameButton: { ko: "처음부터 시작", en: "Start Over" },
  controlsTitle: { ko: "조작법", en: "Controls" },
  controlsMove: { ko: "이동: WASD / 방향키 (모바일: 조이스틱)", en: "Move: WASD / arrows (mobile: joystick)" },
  controlsCamera: { ko: "시점: 마우스 드래그 · 휠로 확대/축소", en: "Camera: drag to orbit, wheel to zoom" },
  controlsTalk: { ko: "대화: 가까이 가서 E 키 또는 말풍선 클릭", en: "Talk: get close, press E or click the prompt" },
  controlsJournal: { ko: "퀘스트 일지: J 키 또는 📜 버튼", en: "Quest journal: J key or the 📜 button" },
  talkPrompt: { ko: "E — 대화하기", en: "E — Talk" },
  level: { ko: "레벨", en: "Level" },
  xp: { ko: "경험치", en: "XP" },
  journalTitle: { ko: "퀘스트 일지", en: "Quest Journal" },
  journalEmpty: { ko: "아직 받은 퀘스트가 없어요.", en: "No quests yet." },
  statusLocked: { ko: "잠김", en: "Locked" },
  statusAvailable: { ko: "진행 가능", en: "Available" },
  statusActive: { ko: "진행 중", en: "In progress" },
  statusDone: { ko: "완료", en: "Complete" },
  questAccepted: { ko: "새 퀘스트:", en: "New quest:" },
  questComplete: { ko: "퀘스트 완료!", en: "Quest complete!" },
  levelUp: { ko: "레벨 업!", en: "LEVEL UP!" },
  reportTitle: { ko: "마음의 힘 리포트", en: "Heart Skills Report" },
  reportBadge: { ko: "마음의 힘 배지 획득!", en: "Heart Skills Badge earned!" },
  reportScore: { ko: "종합 점수", en: "Overall score" },
  reportGradeLabel: { ko: "등급", en: "Grade" },
  reportReflection: {
    ko: "오늘 연습한 것: 감정에 이름 붙이기 · 호흡으로 진정하기 · 입장 바꿔 생각하기 · 나-전달법 · 멈추고 결정하기. 내일 실제 하루에서 하나만 골라 써 보세요!",
    en: "Practiced today: naming feelings, calming breaths, perspective-taking, I-messages, and pausing before deciding. Pick one and try it in real life tomorrow!"
  },
  reportReplay: { ko: "다시 플레이", en: "Play Again" },
  reportClose: { ko: "마을로 돌아가기", en: "Back to the Village" },
  scormLocal: { ko: "LMS 미연결 · 로컬 플레이", en: "No LMS · local preview" },
  scormConnected: { ko: "LMS 연결됨 · 진행 상황 기록 중", en: "LMS connected · progress reported" },
  scormSent: { ko: "LMS에 점수 전송 완료", en: "Score sent to LMS" },
  toastLocked: {
    ko: "먼저 하나 선생님과 이야기해 보자! (광장의 ! 표시)",
    en: "Talk to Ms. Hana first! (the ! in the plaza)"
  },
  toastFinaleLocked: {
    ko: "아직 도움이 필요한 친구들이 남아 있어요.",
    en: "Some friends still need your help."
  },
  choiceHint: { ko: "어떻게 말할까?", en: "What will you say?" },
  continueHint: { ko: "클릭 또는 스페이스로 계속", en: "Click or press Space to continue" },
  playerName: { ko: "나", en: "You" },
  resetConfirm: {
    ko: "저장된 진행 상황을 지우고 처음부터 시작할까요?",
    en: "Erase saved progress and start over?"
  },
  grades: {
    S: { ko: "마음 지킴이 (S)", en: "Heart Guardian (S)" },
    A: { ko: "마음 탐험가 (A)", en: "Heart Explorer (A)" },
    B: { ko: "마음 새싹 (B)", en: "Heart Sprout (B)" }
  }
};

export const MOOD_EMOJI = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  worried: "😟",
  neutral: "🙂",
  relieved: "😌"
};
