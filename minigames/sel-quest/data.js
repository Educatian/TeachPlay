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
    model: "charMage",
    name: { ko: "세라 현자님", en: "Sage Sera" },
    role: { ko: "마음 마을의 현자", en: "Village Sage" },
    palette: { skin: 0xf1c9a5, hair: 0x3a2c23, top: 0x2e6f5e, bottom: 0x24333f },
    position: { x: 0, z: 6 },
    facing: Math.PI,
    mood: "happy"
  },
  jiho: {
    id: "jiho",
    model: "charRogue",
    name: { ko: "로이", en: "Roy" },
    role: { ko: "연못가의 견습 궁수", en: "Apprentice archer by the pond" },
    palette: { skin: 0xf1c9a5, hair: 0x20242c, top: 0x5471b8, bottom: 0x30405c },
    position: { x: -16, z: -10 },
    facing: Math.PI * 0.3,
    mood: "sad"
  },
  yuna: {
    id: "yuna",
    model: "charBarbarian",
    name: { ko: "타라", en: "Tara" },
    role: { ko: "수련장의 꼬마 전사", en: "Young warrior at the training yard" },
    palette: { skin: 0xf6d3b3, hair: 0x5a3825, top: 0xc75450, bottom: 0x574052 },
    position: { x: 17, z: -12 },
    facing: -Math.PI * 0.4,
    mood: "angry"
  },
  minjun: {
    id: "minjun",
    model: "charRogueHooded",
    name: { ko: "루카", en: "Luka" },
    role: { ko: "새로 온 여행자", en: "Newcomer to the village" },
    palette: { skin: 0xe8bd95, hair: 0x1c1c22, top: 0x8d9440, bottom: 0x3d4a37 },
    position: { x: -14, z: 14 },
    facing: -Math.PI * 0.2,
    mood: "worried"
  },
  sora: {
    id: "sora",
    model: "charBarbarian",
    name: { ko: "엠버", en: "Ember" },
    role: { ko: "대장간 견습 장인", en: "Smithy apprentice" },
    palette: { skin: 0xf6d3b3, hair: 0x704214, top: 0xd98e2b, bottom: 0x4b3b56 },
    position: { x: 14.6, z: 13.4 },
    facing: Math.PI * 0.9,
    mood: "angry"
  },
  taeo: {
    id: "taeo",
    model: "charRogue",
    name: { ko: "니코", en: "Niko" },
    role: { ko: "대장간 견습 장인", en: "Smithy apprentice" },
    palette: { skin: 0xedc39d, hair: 0x2f2620, top: 0x4a7fb5, bottom: 0x2e3d4d },
    position: { x: 17.4, z: 15 },
    facing: -Math.PI * 0.75,
    mood: "sad"
  },
  doyun: {
    id: "doyun",
    model: "charRogueHooded",
    name: { ko: "모모", en: "Momo" },
    role: { ko: "상점 앞 심부름꾼", en: "Errand runner outside the shop" },
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
// A node with `end: true` completes the quest. Every choice must carry `next`.
// ---------------------------------------------------------------------------

export const QUESTS = [
  {
    id: "intro",
    npc: "hana",
    competency: null,
    order: 0,
    title: { ko: "마음 마을에 온 것을 환영해!", en: "Welcome to Maeum Village!" },
    summary: {
      ko: "세라 현자님에게 마을과 다섯 가지 마음의 힘에 대해 듣는다.",
      en: "Hear from Sage Sera about the village and the five heart skills."
    },
    objective: {
      ko: "세라 현자님과 대화하기",
      en: "Talk to Sage Sera"
    },
    learningGoal: {
      ko: "마을과 다섯 가지 마음의 힘 알아보기",
      en: "Meet the village and the five heart skills"
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
        practice: true, // tutorial item: observable recorded, never scored (ECD blueprint)
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
            text: {
              ko: "화분은 또 사면 되죠. 너무 속상해하지 마세요, 별일 아니에요.",
              en: "You can just buy another pot. Don't be too sad — it's not a big deal."
            },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "하하, 맞는 말이긴 해. 그런데 물건 이야기 전에 내 '마음'을 먼저 읽어 주면 훨씬 큰 위로가 된단다. 다시 한번 말해 볼까?",
              en: "Ha, fair point! But reading my feeling before fixing the thing would comfort me much more. Want to try again?"
            }
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
      ko: "연못가의 로이가 궁술 시험을 망친 뒤 마음이 복잡하다. 감정에 이름을 붙이도록 도와주자.",
      en: "Roy bombed his archery test and his feelings are a tangle. Help him name what he feels."
    },
    objective: {
      ko: "연못가의 로이와 대화하기",
      en: "Talk to Roy by the pond"
    },
    learningGoal: {
      ko: "섞여 있는 감정에 이름을 붙이고, 몸의 신호 알아차리기",
      en: "Name mixed feelings and spot the body's signals"
    },
    postLine: {
      ko: "오늘 아침엔 내 기분에 '긴장 반, 설렘 반'이라고 이름 붙여 봤어. 진짜로 마음이 가벼워지더라!",
      en: "This morning I named my feeling: 'half nervous, half excited.' It really does get lighter!"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "jiho",
        text: {
          ko: "…아, 안녕. 나 오늘 궁술 시험을 완전히 망쳤어. 가슴이 꽉 막힌 것 같고, 뭐가 뭔지 모르겠어.",
          en: "...Oh, hey. I totally bombed the archery test today. My chest feels tight and I can't even tell what's going on inside me."
        },
        choices: [
          {
            text: {
              ko: "가슴이 답답하구나. 지금 마음속에 어떤 느낌들이 섞여 있는 것 같아?",
              en: "That sounds heavy. What feelings are mixed up in there right now?"
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
              ko: "에이, 시험 하나 망친 거 가지고 뭘. 맛있는 거 먹고 싹 잊어버리는 게 최고야!",
              en: "Come on, it's just one test. Grab something tasty and forget the whole thing — works every time!"
            },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "잊어버리려고 나도 해 봤는데, 자꾸 생각나서 더 답답해… 지금 나한테 뭐라고 말해 주면 좋을까?",
              en: "I've tried forgetting... it just keeps coming back louder. What else could you say to me right now?"
            }
          },
          {
            text: {
              ko: "잠깐 옆에 앉아도 돼? 무슨 일이 있었는지 처음부터 천천히 이야기해 줄래?",
              en: "Mind if I sit with you? Tell me what happened, slowly, from the very beginning?"
            },
            tier: "good",
            stat: "selfAwareness",
            reply: {
              ko: "연습을 그렇게 했는데 자신 있던 과녁까지 빗나갔어. 말하다 보니… 여러 감정이 한꺼번에 몰려온 것 같아.",
              en: "I practiced so hard, and still missed targets I knew I could hit. Saying it out loud... I think a bunch of feelings hit me at once."
            },
            next: "n2"
          }
        ]
      },
      n2: {
        speaker: "jiho",
        text: {
          ko: "특히 이 느낌이 제일 커. 얼굴이 화끈거리고, 친구들이 내 점수를 알까 봐 자꾸 신경 쓰여. 이건 무슨 감정일까?",
          en: "This one feeling is the biggest: my face burns and I keep worrying my friends will find out my score. What feeling is that?"
        },
        choices: [
          {
            text: { ko: "얼굴이 화끈거리는 거… 그건 '부끄러움' 같아.", en: "The burning face... that sounds like embarrassment." },
            tier: "best",
            stat: "selfAwareness",
            reply: {
              ko: "맞아, 부끄러움이야! 이름을 붙이니까 신기하게 조금 작아진 느낌이야.",
              en: "Yes — embarrassment! Weirdly, giving it a name just made it feel a little smaller."
            },
            next: "n3"
          },
          {
            text: { ko: "에이, 그건 별거 아니야. 너무 깊게 생각하지 마.", en: "Eh, that one's probably nothing. Don't overthink it." },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "그냥 넘기려고 해 봤는데 자꾸 얼굴이 화끈거린단 말이야… 이 느낌, 뭐라고 부르면 좋을까?",
              en: "I tried brushing it off, but my face keeps burning... What would you call this feeling?"
            }
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
              ko: "응! 답답한 가슴, 화끈거리는 얼굴 — 몸의 신호가 감정을 알려 주는 단서야.",
              en: "Yes! Tight chest, burning face — body signals are clues that point to feelings."
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
              ko: "그런 몸의 느낌은 신경 쓸수록 커져. 그냥 꾹 참고 모른 척하는 게 나아.",
              en: "Those body feelings grow if you focus on them. Better to squeeze them down and play it cool."
            },
            tier: "poor",
            stat: "selfAwareness",
            reply: {
              ko: "꾹 참는 건 해 봤는데, 참을수록 가슴이 더 답답해지던걸? …그럼 이 신호들을 어떻게 하면 좋을까?",
              en: "I've tried squeezing it down — the tighter I squeeze, the tighter my chest gets. So... what should I do with these signals?"
            }
          }
        ]
      },
      n4: {
        speaker: "jiho",
        text: {
          ko: "고마워! '감정 알아차리기 → 이름 붙이기 → 몸의 신호 살피기' — 오늘 배운 세 단계, 잊지 않을게. 다음 시험을 생각하면 아직 떨리긴 하지만, 이제 그 마음을 어떻게 다루면 될지 알 것 같아!",
          en: "Thanks! Notice the feeling → name it → check the body signals. I won't forget those three steps. I still get nervous thinking about the next test — but now I know what to do with that feeling!"
        },
        end: true
      }
    },
    completion: {
      ko: "로이가 자기 감정에 이름을 붙일 수 있게 되었다! (자기인식 ↑)",
      en: "Roy can now name his feelings! (Self-Awareness ↑)"
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
      ko: "수련장의 타라가 대련에서 진 뒤 화가 나 폭발하기 직전이다. 화를 다스리는 방법을 함께 찾아 주자.",
      en: "Tara just lost a sparring match and is about to erupt. Help her find a way to cool the volcano."
    },
    objective: {
      ko: "수련장의 타라와 대화하기",
      en: "Talk to Tara at the training yard"
    },
    learningGoal: {
      ko: "화가 날 때 멈추고, 호흡으로 식힌 뒤 말하기",
      en: "Pause when angry, cool down with breath, talk after"
    },
    postLine: {
      ko: "어제 동생이 내 그림을 찢어 놨는데, 넷-여섯 호흡부터 했다? 나 완전 온천이었어.",
      en: "My little brother tore up my drawing yesterday — and I did the four-six breath FIRST. Total hot spring."
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
              ko: "정말 화가 많이 났구나. 움직이기 전에 나랑 같이 숨 세 번만 쉬어 볼래?",
              en: "You're really angry. Before you move — three deep breaths with me first?"
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
              ko: "맞아, 완전 불공평했어! 지금 바로 가서 따지자. 내가 옆에서 같이 소리쳐 줄게!",
              en: "Yeah, that was SO unfair! Let's storm over right now — I'll stand next to you and yell too!"
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "그래!! …아니, 잠깐. 지난번에 화난 채로 따졌다가 일주일 내내 후회했단 말이야. 지금 나한테 진짜 필요한 건 뭘까?",
              en: "YEAH!! ...Wait. No. Last time I charged in angry, I regretted it for a whole week. What do I actually need right now?"
            }
          },
          {
            text: {
              ko: "잠깐만. 지금 그 화, 100점 만점에 몇 점쯤인지 말해 줄 수 있어?",
              en: "Hold on. That anger — on a scale of 0 to 100, how hot is it right now?"
            },
            tier: "good",
            stat: "selfManagement",
            reply: {
              ko: "95점!! …아니, 말하고 나니까 90점? 숫자로 재 보니까 한 발짝 떨어져서 볼 수 있네.",
              en: "95!! ...Actually, saying it out loud... 90? Measuring it kind of lets me step back from it."
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
              ko: "넷 세며 들이쉬고, 여섯 세며 내쉬어 보자. 용암을 식히는 호흡법이야.",
              en: "Breathe in for four counts, out for six. It's the lava-cooling breath."
            },
            tier: "best",
            stat: "selfManagement",
            reply: {
              ko: "들이쉬고… 둘, 셋, 넷. 내쉬고… 둘, 셋, 넷, 다섯, 여섯. …용암이 조금씩 식는 게 느껴져. 아직 뜨겁긴 한데, 완전 신기해!",
              en: "In... two, three, four. Out... two, three, four, five, six. ...I can feel the lava cooling bit by bit. Still warm, but wow!"
            },
            next: "n3"
          },
          {
            text: {
              ko: "참으면 병 돼. 수련장 끝까지 달려가서 속이 시원해질 때까지 소리 지르는 게 낫지 않아?",
              en: "Bottling it up is bad for you. Run to the far field and scream until it's all out — better, right?"
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "저번에 그렇게 해 봤는데, 그 순간만 시원하고 끝나고 나면 더 화가 나 있더라고… 다른 방법 없을까?",
              en: "I tried that once — feels great for a second, then I'm even angrier after... got anything else?"
            }
          },
          {
            text: {
              ko: "잠깐 이 자리를 벗어나서 시원한 물 한 잔 마시고 오는 건 어때?",
              en: "How about stepping away for a minute and getting a cool drink of water?"
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
      n3: {
        speaker: "yuna",
        text: {
          ko: "이제 화가 60점까지 내려왔어. 심판 판정 문제는 어떻게 하는 게 좋을까?",
          en: "Okay, the anger is down to 60. So what should I do about the unfair call?"
        },
        choices: [
          {
            text: {
              ko: "가라앉은 다음, 내일 사부님께 차분하게 '판정이 이해가 안 됐어요'라고 말해 보자.",
              en: "Once it settles, talk to Master tomorrow: 'I didn't understand that call' — calmly."
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
              ko: "속상할 일을 뭐 하러 만들어? 앞으로 대련에 안 나가면 화날 일도 없잖아.",
              en: "Why sign up for more hurt? Just skip the sparring bouts from now on — no bouts, no anger."
            },
            tier: "poor",
            stat: "selfManagement",
            reply: {
              ko: "안 돼, 난 대련이 너무 좋단 말이야! 피해 버리는 것 말고… 이 문제를 어떻게 다루면 좋을까?",
              en: "No way, I love sparring too much! Something besides running away... how should I handle this?"
            }
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
      ko: "타라가 화를 다스리는 자기만의 방법을 찾았다! (자기관리 ↑)",
      en: "Tara found her own way to manage anger! (Self-Management ↑)"
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
      ko: "마을에 새로 온 루카가 나무 아래에 혼자 서 있다. 루카의 입장이 되어 마음을 헤아려 보자.",
      en: "Luka, new to the village, stands alone under a tree. Step into his shoes."
    },
    objective: {
      ko: "나무 아래의 루카와 대화하기",
      en: "Talk to Luka under the tree"
    },
    learningGoal: {
      ko: "상상 대신 단서로 마음 읽기, 입장 바꿔 생각하기",
      en: "Read hearts by clues (not assumptions) and take another's view"
    },
    postLine: {
      ko: "벤치 애들이랑 내일 같이 축구하기로 했어! 네 덕분에 용기 냈다, 진짜로.",
      en: "The bench kids and I are playing soccer tomorrow! You're the reason I got brave. Really."
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "minjun",
        text: {
          ko: "어… 안녕. 나 지난주에 이 마을로 이사 왔어. 다들 이미 친한 것 같아서, 어디에 껴야 할지 모르겠어. 그래서 그냥 여기 서 있었어.",
          en: "Oh... hi. I moved to this village last week. Everyone already has their groups, and I don't know where I fit. So I've just been... standing here."
        },
        choices: [
          {
            text: {
              ko: "아는 사람 없는 새 마을이라니… 많이 외롭고 긴장되겠다. 나라도 그럴 것 같아.",
              en: "A new village where you know no one... that must be lonely and nerve-wracking. I'd feel the same."
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
              ko: "그게 뭐가 어려워? 아무 무리에나 가서 먼저 말 걸면 되지. 고민할 시간에 벌써 친구 사귀었겠다.",
              en: "How hard can it be? Just walk up to any group and say hi. You could've made three friends in the time you've stood here."
            },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "너한텐 쉬울지 몰라도, 나한테는 모르는 무리에 끼어드는 게 절벽에서 뛰어내리는 기분이야… 내 마음, 조금은 알아줄래?",
              en: "Maybe it's easy for you... for me, walking into a group of strangers feels like jumping off a cliff. Could you try seeing it from where I stand?"
            }
          },
          {
            text: {
              ko: "전에 살던 마을은 어땠어? 거기 이야기 좀 들려줄래?",
              en: "What was your old village like? Would you tell me about it?"
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
      n2: {
        speaker: "minjun",
        text: {
          ko: "아까 점심시간에 어떤 애들이 나를 보면서 웃었어. 분명 나를 비웃는 거겠지…?",
          en: "At lunch, some kids looked my way and laughed. They must have been laughing at me... right?"
        },
        choices: [
          {
            text: {
              ko: "속상했겠다. 근데 혹시 다른 이유로 웃었을 수도 있지 않을까? 아직 알 수 없잖아.",
              en: "That must have stung. But could they have laughed at something else? We can't know yet."
            },
            tier: "best",
            stat: "socialAwareness",
            reply: {
              ko: "듣고 보니… 걔들이 자기들끼리 영상을 보고 있었던 것 같기도 해. 내 생각이 곧장 최악의 상상으로 튀었나 봐.",
              en: "Now that you say it... I think they were watching a video together. My brain jumped straight to the worst interpretation."
            },
            next: "n3"
          },
          {
            text: {
              ko: "응, 딱 봐도 너 들으라고 웃은 거네. 그런 애들이랑은 처음부터 어울리지 않는 게 나아.",
              en: "Yeah, that laugh was obviously aimed at you. Honestly, you're better off avoiding kids like that from day one."
            },
            tier: "poor",
            stat: "socialAwareness",
            reply: {
              ko: "그런가… 근데 확실하지도 않은데 나쁘게만 생각하니까 마음이 더 무거워져. 다르게 볼 방법은 없을까?",
              en: "Maybe... but assuming the worst when I can't even be sure just makes my heart heavier. Is there another way to look at it?"
            }
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
        claim: "relationship", // cross-loaded item: hosted here, evidences relationship skills
        crossLoaded: true,
        text: {
          ko: "너랑 이야기하니까 용기가 조금 생겼어. 저기 벤치에 앉아 있는 애들한테 가 보고 싶은데, 첫 마디를 뭐라고 하면 좋을까?",
          en: "Talking to you gave me a little courage. I want to go over to those kids by the bench — what should my first words be?"
        },
        choices: [
          {
            text: {
              ko: "\"안녕, 나 지난주에 이사 온 루카야. 너희 뭐 하고 있어? 같이 해도 돼?\"",
              en: "\"Hi, I'm Luka — I just moved here. What are you playing? Mind if I join?\""
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
              ko: "먼저 말 걸었다가 무시당하면 어떡해. 옆에 조용히 서 있으면 언젠가 알아서 말 걸어 줄 거야.",
              en: "What if you say hi first and they ignore you? Just stand near them quietly — they'll talk to you eventually."
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "그거 내가 일주일 내내 해 본 방법인데… 아무 일도 일어나지 않았어. 첫마디, 뭐라고 하면 좋을까?",
              en: "That's exactly what I've done all week... and nothing happened. So — what should my first words be?"
            }
          }
        ]
      },
      n4: {
        speaker: "minjun",
        text: {
          ko: "가르쳐 줘서 고마워. 오늘 배운 것: 사람 마음은 내 상상이 아니라 '단서'로 읽기, 그리고 상대 입장에서 한 번 더 생각하기. 네가 방금 나한테 딱 그렇게 해 줬잖아!",
          en: "Thank you. Today I learned: read people by clues, not by my imagination — and think once more from the other person's side. That's exactly what you did for me!"
        },
        end: true
      }
    },
    completion: {
      ko: "루카가 용기를 내어 새 친구들에게 다가갔다! (사회적 인식 ↑)",
      en: "Luka found the courage to approach new friends! (Social Awareness ↑)"
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
      ko: "엠버와 니코가 축제에 낼 태엽 로봇이 부서진 일로 크게 다퉜다. 두 사람 사이에서 대화의 다리를 놓아 주자.",
      en: "Ember and Niko are fighting over their broken festival robot. Build a bridge between them."
    },
    objective: {
      ko: "공방 앞의 엠버, 니코와 대화하기",
      en: "Talk to Ember and Niko by the workshop"
    },
    learningGoal: {
      ko: "차례로 듣기와 '나'로 시작하는 말로 갈등 풀기",
      en: "Use turn-taking and I-messages to work through conflict"
    },
    postLine: {
      ko: "로봇 2호 제작 중! 이번엔 바닥에서 만들고, 이야기도 차례로 들어. 축제에서 보자!",
      en: "Robot 2.0 in progress! We build on the floor now — and take turns talking. See you at the festival!"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "sora",
        text: {
          ko: "잘 왔어! 네가 판단 좀 해 줘. 니코가 장인 축제에 낼 우리 태엽 로봇을 떨어뜨려서 부쉈어! 3주 동안 만든 건데! 쟤랑은 이제 끝이야!",
          en: "Perfect timing! You be the judge. Niko dropped our festival clockwork robot and SMASHED it! Three weeks of work! I'm done with him!"
        },
        next: "n2"
      },
      n2: {
        speaker: "taeo",
        text: {
          ko: "일부러 그런 게 아니야! 선반이 흔들려서 잡으려다가… 그리고 엠버 넌 내 말은 듣지도 않잖아!",
          en: "It wasn't on purpose! The shelf wobbled and I tried to catch it... and Ember, you won't even listen to me!"
        },
        choices: [
          {
            text: {
              ko: "잠깐, 둘 다 로봇을 아껴서 속상한 거잖아. 한 명씩 차례로 듣자. 먼저 엠버부터.",
              en: "Hold on — you're both upset because you both care. Let's take turns listening. Ember first."
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "(엠버) …좋아. 차례로라면. 나는 3주 내내 만든 로봇이 부서져서 가슴이 무너졌어. 축제가 다음 주란 말이야.",
              en: "(Ember) ...Fine. If we take turns. My heart sank when the robot broke — I built it for three straight weeks. The festival is next week."
            },
            next: "n3"
          },
          {
            text: {
              ko: "뭘 물어봐, 로봇을 떨어뜨린 사람 잘못이지. 니코가 부품값을 다 물어내면 되겠네.",
              en: "What's there to judge? Whoever dropped it is at fault. Niko can just pay for all the parts."
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "(니코) 거봐, 아무도 내 이야기는 듣지도 않아! (엠버) …이러니까 싸움만 커지네. 우리, 어떻게 이야기하면 좋을까?",
              en: "(Niko) See?! Nobody even hears my side! (Ember) ...This is just making the fight bigger. How should we talk about this?"
            }
          },
          {
            text: {
              ko: "니코야, 그때 무슨 일이 있었는지 자세히 말해 줄래?",
              en: "Niko, can you tell us exactly what happened?"
            },
            tier: "good",
            stat: "relationship",
            reply: {
              ko: "(니코) 로봇을 더 안전한 칸으로 옮기려던 거였어. 엠버를 놀라게 해 주고 싶어서… 근데 선반이 흔들렸어.",
              en: "(Niko) I was moving it to a safer shelf. I wanted to surprise Ember... then the shelf wobbled."
            },
            next: "n3"
          }
        ]
      },
      n3: {
        speaker: "sora",
        text: {
          ko: "…옮기려던 거였다고? 몰랐어. 그래도 나 아직 화가 나. 이 마음을 니코한테 어떻게 말하면 좋을까?",
          en: "...You were moving it for me? I didn't know that. But I'm still angry. How do I even say this to him?"
        },
        choices: [
          {
            text: {
              ko: "'너 때문에'가 아니라 '나는'으로 시작해 봐. \"로봇이 부서져서 나는 정말 속상해\"처럼.",
              en: "Start with 'I', not 'you'. Like: \"I'm really hurt that the robot broke.\""
            },
            tier: "best",
            stat: "relationship",
            reply: {
              ko: "(엠버) \"니코야… 로봇이 부서져서 나는 정말 속상하고, 축제를 망칠까 봐 무서워.\" (니코) …정말 미안해, 엠버야. 나도 그게 제일 무서웠어.",
              en: "(Ember) \"Niko... I'm really hurt the robot broke, and I'm scared we'll lose the festival.\" (Niko) ...I'm so sorry, Ember. That's what scared me most too."
            },
            next: "n4"
          },
          {
            text: {
              ko: "\"다시는 내 물건에 손대지 마!\"라고 세게 말해 둬야 다음에 또 이런 일이 없지.",
              en: "Tell him hard: \"Never touch my stuff again!\" That way it never happens twice."
            },
            tier: "poor",
            stat: "relationship",
            reply: {
              ko: "(엠버) \"다시는 손대지 마!\" (니코) …알았어. 다신 아무것도 안 도와줄 거야. (엠버) 아, 이게 아닌데… 마음이 더 멀어졌어. 어떻게 말하면 좋을까?",
              en: "(Ember) \"Never touch my stuff!\" (Niko) ...Fine. I'm never helping with anything again. (Ember) Wait, that's not what I wanted... we're further apart now. How should I say it?"
            }
          }
        ]
      },
      n4: {
        speaker: "taeo",
        claim: "decision", // cross-loaded item: hosted here, evidences decision-making
        crossLoaded: true,
        text: {
          ko: "저기… 부품은 대부분 무사해. 축제까지 일주일 남았는데, 우리 어떻게 하면 좋을까?",
          en: "Hey... most of the parts survived. We have one week until the festival. What should we do?"
        },
        choices: [
          {
            text: {
              ko: "둘이 역할을 나눠서 같이 다시 만들면 어때? 엠버는 설계, 니코는 조립처럼.",
              en: "Rebuild it together with split roles — Ember on design, Niko on assembly?"
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "(엠버) 좋아, 같이 하면 일주일이면 충분해! (니코) 이번엔 선반 말고 바닥에서 작업하자! 하하!",
              en: "(Ember) Yes — together, a week is plenty! (Niko) And this time we work on the FLOOR, not the shelf! Haha!"
            },
            next: "n5"
          },
          {
            text: {
              ko: "일주일 만에 다시 만들다가 또 싸우면 어떡해. 이번 축제는 그냥 포기하는 게 마음 편하지 않을까?",
              en: "What if rebuilding in a week just starts another fight? Maybe dropping this festival is easier on everyone."
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "(엠버) 포기라니! 3주의 노력이 아깝잖아. (니코) 맞아, 포기 말고… 우리 셋이서 방법을 찾아보자. 어떻게 하면 좋을까?",
              en: "(Ember) Drop out?! Not after three weeks of work. (Niko) Right — not quitting... let's figure something out, the three of us. What should we do?"
            }
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
      ko: "엠버와 니코가 화해하고 다시 한 팀이 되었다! (관계 기술 ↑)",
      en: "Ember and Niko made up and became a team again! (Relationship Skills ↑)"
    }
  },

  {
    id: "q_decision",
    npc: "doyun",
    competency: "decision",
    order: 5,
    requires: ["intro"],
    title: { ko: "주인 잃은 동전 주머니", en: "The Lost Coin Pouch" },
    summary: {
      ko: "모모가 상점 앞에서 동전 주머니을 주웠다. 책임 있는 선택의 단계를 함께 밟아 보자.",
      en: "Momo found a coin pouch outside the shop. Walk through the steps of a responsible choice together."
    },
    objective: {
      ko: "상점 앞의 모모와 대화하기",
      en: "Talk to Momo outside the shop"
    },
    learningGoal: {
      ko: "결정 전에 멈춰서 선택지와 결과를 따져 보기",
      en: "Pause before deciding; weigh the options and outcomes"
    },
    postLine: {
      ko: "동전 주머니 주인이 고맙다고 쪽지를 줬어! 떳떳한 기분이 금화 다섯 닢보다 훨씬 크더라.",
      en: "The pouch's owner left me a thank-you note! Standing tall feels way bigger than five gold coins."
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "doyun",
        text: {
          ko: "야, 잠깐만! 나 방금 상점 앞에서 이 동전 주머니을 주웠어. 안에 금화가 다섯 닢이나 들어 있어… 아무도 못 봤는데, 어떡하지?",
          en: "Hey, wait! I just found this coin pouch outside the shop. There are five gold coins inside... nobody saw me pick it up. What do I do?"
        },
        choices: [
          {
            text: {
              ko: "결정하기 전에 잠깐 멈추자. 이 선택이 주인과 너에게 어떤 영향을 줄까?",
              en: "Let's pause before deciding. How would this choice land on the owner — and on you?"
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
              ko: "아무도 못 봤다며. 주운 사람이 임자라는 말도 있는데, 그냥 가져도 되지 않아?",
              en: "You said nobody saw. Finders keepers, right? Can't you just keep it and move on?"
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "그치? 아무도 모르는데… 근데 이상하다. '아무도 모른다'고 말할수록 내 마음은 알고 있다는 뜻이잖아. …나 어떻게 하면 좋을까?",
              en: "Right? Nobody knows... but wait. The more I say 'nobody knows', the more it means my own heart knows. ...So what should I do?"
            }
          },
          {
            text: {
              ko: "동전 주머니 안에 주인을 알 수 있는 단서가 있는지 먼저 볼까?",
              en: "Should we check the coin pouch for clues about the owner first?"
            },
            tier: "good",
            stat: "decision",
            reply: {
              ko: "그러네! 이름표가 있어 — 이웃 마을 아이인가 봐. 얼굴 사진을 보니까 더 남 일 같지 않다…",
              en: "Good idea! There's a name tag — a kid from the next village. Seeing the photo makes it feel so much more real..."
            },
            next: "n2"
          }
        ]
      },
      n2: {
        speaker: "doyun",
        text: {
          ko: "솔직히 말하면 요즘 갖고 싶던 망원경이 딱 금화 다섯 닢이야. 머릿속에서 천사와 악마가 싸우고 있어. 선택지를 정리해 줄래?",
          en: "Honestly? The spyglass I've been wanting costs exactly five gold coins. There's an angel and a devil wrestling in my head. Help me lay out the options?"
        },
        choices: [
          {
            text: {
              ko: "선택지는 셋이야: 갖는다, 그 자리에 둔다, 주인을 찾아 준다. 각각 그다음엔?",
              en: "Three options: keep it, leave it there, or find the owner. Then what, for each?"
            },
            tier: "best",
            stat: "decision",
            reply: {
              ko: "가지면 → 망원경은 생기지만 죄책감도 생겨. 두고 가면 → 다른 사람이 가져갈지도 몰라. 찾아 주면 → 주인이 기뻐하고, 나도 떳떳해! …답이 보인다.",
              en: "Keep it → I get the spyglass but also the guilt. Leave it → someone else might take it. Return it → the owner's relieved and I can hold my head high! ...The answer is showing itself."
            },
            next: "n3"
          },
          {
            text: {
              ko: "고민할 게 뭐 있어? 절반은 찾아 주고 절반은 수고비로 갖는 반반 작전이 제일 공평하지!",
              en: "Why agonize? Return half, keep half as a finder's fee — fifty-fifty is the fairest deal there is!"
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "하하, 잠깐 솔깃했다… 근데 반만 가져도 가진 건 가진 거잖아. 마음 무거운 것도 똑같을 테고. 다시 정리해 줄래?",
              en: "Ha, tempting for a second... but keeping half is still keeping. And my heart would be just as heavy. Lay it out for me again?"
            }
          },
          {
            text: {
              ko: "만약 네 동전 주머니이었다면, 주운 사람이 어떻게 해 주길 바랄 것 같아?",
              en: "If it were YOUR coin pouch, what would you want the finder to do?"
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
          ko: "결정했어. 주인을 찾아 주자! 이름표를 보니 이웃 마을 아이야. 어떤 방법이 제일 좋을까?",
          en: "Decided. We return it! The tag says the owner lives in the next village. What's the best way?"
        },
        choices: [
          {
            text: {
              ko: "상점 아저씨나 선생님 같은 어른께 이름표 정보와 함께 맡기자.",
              en: "Hand it to a trusted adult — the shopkeeper or a teacher — with the tag info."
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
              ko: "괜히 엮이지 말고 원래 자리에 두고 가자. 주인이 왔던 길을 되짚어 찾으러 올 거야.",
              en: "Don't get tangled up in it — put it back where it was. The owner will retrace their steps."
            },
            tier: "poor",
            stat: "decision",
            reply: {
              ko: "음… 그러다 다른 사람이 먼저 가져가면? 여기까지 고민해 놓고 마지막에 무책임해질 순 없지. 제일 확실한 방법이 뭘까?",
              en: "Hmm... what if someone else grabs it first? After all this thinking, I can't go irresponsible at the finish line. What's the surest way?"
            }
          }
        ]
      },
      n4: {
        speaker: "doyun",
        text: {
          ko: "상점 아저씨가 이웃 마을에 바로 연락해 주셨어! 오늘 배운 '멈추기 → 선택지 펼치기 → 결과 상상하기 → 책임 있게 행동하기' 4단계, 진짜 꿀팁이다. 고마워!",
          en: "The shopkeeper sent word to the next village right away! That four-step move — pause → lay out options → imagine outcomes → act responsibly — is the real deal. Thank you!"
        },
        end: true
      }
    },
    completion: {
      ko: "모모가 책임 있는 선택으로 동전 주머니 주인을 찾아 주었다! (책임 있는 의사결정 ↑)",
      en: "Momo made the responsible choice and returned the coin pouch! (Responsible Decision-Making ↑)"
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
      ko: "마을 친구들을 모두 도왔다! 세라 현자님에게 돌아가 수여식을 치르자.",
      en: "Every villager has been helped! Return to Sage Sera for the ceremony."
    },
    objective: {
      ko: "세라 현자님에게 돌아가기",
      en: "Return to Sage Sera"
    },
    learningGoal: {
      ko: "마음의 힘 하나를 골라, 내일 쓸 순간까지 다짐하기",
      en: "Pick one heart skill and the exact moment to use it tomorrow"
    },
    start: "n1",
    nodes: {
      n1: {
        speaker: "hana",
        text: {
          ko: "마을 전체가 환해졌어! 로이는 감정에 이름을 붙이고, 타라는 화산을 온천으로 만들고, 루카는 새 친구를 사귀고, 엠버와 니코는 다시 한 팀이 되고, 모모는 떳떳한 선택을 했지.",
          en: "The whole village is glowing! Roy names his feelings, Tara turns volcanoes into hot springs, Luka made new friends, Ember and Niko are a team again, and Momo chose to stand tall."
        },
        next: "n2"
      },
      n2: {
        speaker: "hana",
        assessed: false, // self-report commitment: recorded, never scored (ECD blueprint)
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
            remember: "commitment",
            stat: "selfAwareness",
            reply: {
              ko: "멋진 선택이야. 모든 마음의 힘은 자기 마음을 아는 것에서 시작하니까.",
              en: "A beautiful choice. Every heart skill begins with knowing your own heart."
            },
            next: "n2b"
          },
          {
            text: {
              ko: "차례로 듣기와 나-전달법 — 다툰 친구와 화해하고 싶어요.",
              en: "Taking turns and I-messages — there's a friend I want to make up with."
            },
            tier: "best",
            remember: "commitment",
            stat: "relationship",
            reply: {
              ko: "용기 있는 선택이야. 먼저 다리를 놓는 사람이 관계의 영웅이란다.",
              en: "A brave choice. The one who builds the bridge first is the hero of the friendship."
            },
            next: "n2b"
          },
          {
            text: {
              ko: "멈추고 생각하기 — 결정하기 전에 결과를 상상해 볼래요.",
              en: "Pausing to think — I'll imagine outcomes before I decide."
            },
            tier: "best",
            remember: "commitment",
            stat: "decision",
            reply: {
              ko: "지혜로운 선택이야. 잠깐의 멈춤이 오랜 후회를 막아 주지.",
              en: "A wise choice. A moment's pause prevents a long regret."
            },
            next: "n2b"
          },
          {
            text: {
              ko: "넷 세며 들이쉬고 여섯 세며 내쉬기 — 화가 나면 용암부터 식힐래요.",
              en: "In for four, out for six — when I'm angry, I'll cool the lava first."
            },
            tier: "best",
            remember: "commitment",
            stat: "selfManagement",
            reply: {
              ko: "든든한 선택이야. 가장 뜨거운 순간에 그 호흡이 너를 지켜 줄 거야.",
              en: "A steady choice. That breath will hold you through the hottest moments."
            },
            next: "n2b"
          },
          {
            text: {
              ko: "단서로 다시 보기 — 나쁜 상상이 들 때 진짜 단서를 찾아볼래요.",
              en: "Checking the clues — when my brain assumes the worst, I'll look for real clues."
            },
            tier: "best",
            remember: "commitment",
            stat: "socialAwareness",
            reply: {
              ko: "지혜로운 선택이야. 상상 대신 단서를 보면 마음이 훨씬 가벼워지지.",
              en: "A wise choice. Clues instead of stories — your heart gets much lighter that way."
            },
            next: "n2b"
          }
        ]
      },
      n2b: {
        speaker: "hana",
        assessed: false, // implementation intention: recorded, never scored
        text: {
          ko: "멋진 다짐이야. 그럼 그 힘을 꺼내 쓸 '순간'도 하나 정해 두자. 미리 정해 두면 그 순간이 왔을 때 몸이 먼저 기억하거든!",
          en: "A lovely promise. Now let's pick the exact moment you'll use it. Decide in advance, and your body remembers when the moment comes!"
        },
        choices: [
          {
            text: {
              ko: "학교에서 친구 때문에 마음이 출렁일 때요.",
              en: "At school, when a friend makes my heart wobble."
            },
            tier: "best",
            key: "school",
            remember: "commitmentWhen",
            reply: {
              ko: "좋아. 그 순간이 오면 오늘의 연습이 너를 도와줄 거야.",
              en: "Good. When that moment comes, today's practice will be right there with you."
            },
            next: "n3"
          },
          {
            text: {
              ko: "집에서 가족이랑 이야기하다가 욱할 때요.",
              en: "At home, when talking with family makes me flare up."
            },
            tier: "best",
            key: "home",
            remember: "commitmentWhen",
            reply: {
              ko: "좋아. 가장 가까운 사람에게 쓰는 마음의 힘이 제일 힘이 세지.",
              en: "Good. Heart skills are strongest when used with the people closest to us."
            },
            next: "n3"
          },
          {
            text: {
              ko: "잠들기 전에 오늘 하루를 돌아볼 때요.",
              en: "At night, when I look back on my day before sleep."
            },
            tier: "best",
            key: "night",
            remember: "commitmentWhen",
            reply: {
              ko: "좋아. 하루 5분의 돌아보기가 마음 근육을 키워 준단다.",
              en: "Good. Five minutes of looking back each day grows the heart's muscles."
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
    ko: "마음의 힘을 키우는 3D 마을 모험",
    en: "A 3D village adventure that grows your heart skills"
  },
  introBody: {
    ko: "마음 마을의 친구들이 저마다 마음의 어려움을 겪고 있어요. 마을을 자유롭게 돌아다니며 친구들의 이야기를 듣고, 다섯 가지 마음의 힘을 키워 보세요.",
    en: "The villagers of Maeum Village are each wrestling with a feeling. Explore freely, listen to their stories, and grow the five heart skills."
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
  arrowUnlocked: {
    ko: "🧭 레벨 2 달성! '길잡이 화살표'가 열렸어요 — 화면 가장자리 화살표가 다음 친구를 가리켜 줘요.",
    en: "🧭 Level 2! Guide Arrow unlocked — the arrow at the screen edge now points to the next friend."
  },
  reportTitle: { ko: "마음의 힘 리포트", en: "Heart Skills Report" },
  reportBadge: { ko: "마음의 힘 배지 획득!", en: "Heart Skills Badge earned!" },
  reportScore: { ko: "종합 점수", en: "Overall score" },
  reportGradeLabel: { ko: "등급", en: "Grade" },
  reportReflection: {
    ko: "오늘 연습한 것: 감정에 이름 붙이기 · 호흡으로 진정하기 · 입장 바꿔 생각하기 · 나-전달법 · 멈추고 결정하기. 내일 실제 하루에서 하나만 골라 써 보세요!",
    en: "Practiced today: naming feelings, calming breaths, perspective-taking, I-messages, and pausing before deciding. Pick one and try it in real life tomorrow!"
  },
  reportHedge: {
    ko: "각 지표는 대화 속 선택 2~4개를 바탕으로 한 연습 기록이에요. 진짜 실력은 내일의 하루에서 자라나요!",
    en: "Each bar is a practice snapshot from 2–4 conversation choices — the real skill grows in your day tomorrow!"
  },
  reportReplay: { ko: "다시 플레이", en: "Play Again" },
  reportClose: { ko: "마을로 돌아가기", en: "Back to the Village" },
  scormLocal: { ko: "LMS 미연결 · 로컬 플레이", en: "No LMS · local preview" },
  scormConnected: { ko: "LMS 연결됨 · 진행 상황 기록 중", en: "LMS connected · progress reported" },
  scormSent: { ko: "LMS에 점수 전송 완료", en: "Score sent to LMS" },
  toastLocked: {
    ko: "먼저 세라 현자님과 이야기해 보세요! (광장의 ! 표시)",
    en: "Talk to Sage Sera first! (the ! in the plaza)"
  },
  toastFinaleLocked: {
    ko: "아직 도움이 필요한 친구들이 남아 있어요.",
    en: "Some friends still need your help."
  },
  choiceHint: { ko: "어떻게 말할까?", en: "What will you say?" },
  retryHint: { ko: "다시 한번 골라 볼까?", en: "Want to try another way?" },
  goalLabel: { ko: "목표", en: "Goal" },
  commitmentLabel: { ko: "나의 다짐", en: "My promise" },
  continueHint: { ko: "클릭 또는 스페이스로 계속", en: "Click or press Space to continue" },
  playerName: { ko: "나", en: "You" },
  resetConfirm: {
    ko: "저장된 진행 상황을 지우고 처음부터 시작할까요?",
    en: "Erase saved progress and start over?"
  },
  customizeTitle: { ko: "캐릭터 설정", en: "Character Setup" },
  namePlaceholder: { ko: "이름을 입력하세요 (안 써도 돼요)", en: "Enter your name (optional)" },
  colorLabel: { ko: "옷 색깔", en: "Outfit color" },
  colorDefault: { ko: "기본", en: "Default" },
  soundTitle: { ko: "사운드", en: "Sound" },
  musicLabel: { ko: "배경 음악", en: "Music" },
  sfxLabel: { ko: "효과음", en: "Effects" },
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
