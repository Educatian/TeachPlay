// Maeum Village: SEL Quest 3D
// A third-person RPG-style social-emotional learning simulator built with
// plain Three.js. Learners roam a small village, talk with residents through
// branching dialogue, and grow the five CASEL competencies as RPG stats.

import * as THREE from "./vendor/three/three.module.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";
import { clone as cloneSkinned } from "./vendor/three/SkeletonUtils.js";
import {
  COMPETENCIES,
  CHOICE_POINTS,
  NPCS,
  QUESTS,
  UI,
  MOOD_EMOJI
} from "./data.js";

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

const dom = {
  root: document.getElementById("gameRoot"),
  levelValue: document.getElementById("levelValue"),
  levelWord: document.querySelector('[data-ui="level"]'),
  xpFill: document.getElementById("xpFill"),
  xpLabel: document.getElementById("xpLabel"),
  competencyList: document.getElementById("competencyList"),
  questTracker: document.getElementById("questTracker"),
  scormBadge: document.getElementById("scormBadge"),
  toast: document.getElementById("toast"),
  questArrow: document.getElementById("questArrow"),
  talkPrompt: document.getElementById("talkPrompt"),
  dialogueBox: document.getElementById("dialogueBox"),
  dialoguePortrait: document.getElementById("dialoguePortrait"),
  dialogueName: document.getElementById("dialogueName"),
  dialogueText: document.getElementById("dialogueText"),
  dialogueChoices: document.getElementById("dialogueChoices"),
  dialogueContinue: document.getElementById("dialogueContinue"),
  journalButton: document.getElementById("journalButton"),
  musicButton: document.getElementById("musicButton"),
  soundPanel: document.getElementById("soundPanel"),
  soundTitle: document.getElementById("soundTitle"),
  musicLabel: document.getElementById("musicLabel"),
  sfxLabel: document.getElementById("sfxLabel"),
  musicVolInput: document.getElementById("musicVolInput"),
  sfxVolInput: document.getElementById("sfxVolInput"),
  customizeTitle: document.getElementById("customizeTitle"),
  playerNameInput: document.getElementById("playerNameInput"),
  colorLabel: document.getElementById("colorLabel"),
  colorSwatches: document.getElementById("colorSwatches"),
  journalOverlay: document.getElementById("journalOverlay"),
  journalTitle: document.getElementById("journalTitle"),
  journalClose: document.getElementById("journalClose"),
  journalList: document.getElementById("journalList"),
  langButton: document.getElementById("langButton"),
  resetButton: document.getElementById("resetButton"),
  reportOverlay: document.getElementById("reportOverlay"),
  reportTitle: document.getElementById("reportTitle"),
  reportBadgeText: document.getElementById("reportBadgeText"),
  reportScoreLabel: document.getElementById("reportScoreLabel"),
  reportScoreValue: document.getElementById("reportScoreValue"),
  reportGradeLabel: document.getElementById("reportGradeLabel"),
  reportGradeValue: document.getElementById("reportGradeValue"),
  reportBars: document.getElementById("reportBars"),
  reportHedge: document.getElementById("reportHedge"),
  reportReflection: document.getElementById("reportReflection"),
  reportScorm: document.getElementById("reportScorm"),
  reportReplay: document.getElementById("reportReplay"),
  reportClose: document.getElementById("reportClose"),
  startOverlay: document.getElementById("startOverlay"),
  startTitle: document.getElementById("startTitle"),
  startSubtitle: document.getElementById("startSubtitle"),
  startBody: document.getElementById("startBody"),
  controlsTitle: document.getElementById("controlsTitle"),
  controlsMove: document.getElementById("controlsMove"),
  controlsCamera: document.getElementById("controlsCamera"),
  controlsTalk: document.getElementById("controlsTalk"),
  controlsJournal: document.getElementById("controlsJournal"),
  startButton: document.getElementById("startButton"),
  startLangButton: document.getElementById("startLangButton"),
  startScorm: document.getElementById("startScorm"),
  joystick: document.getElementById("joystick"),
  joystickKnob: document.getElementById("joystickKnob"),
  shell: document.getElementById("gameShell")
};

// ---------------------------------------------------------------------------
// Persistent game state
// ---------------------------------------------------------------------------

const SAVE_KEY = "teachplay-sel-quest-v1";

const state = {
  lang: "ko",
  started: false,
  xp: 0,
  level: 1,
  stats: {},
  statMax: {},
  quests: {}, // id -> "locked" | "available" | "active" | "done"
  answered: {}, // "questId:nodeId" -> true, so replays never re-score a node
  reportShown: false,
  musicVol: 0.6,
  sfxVol: 0.8,
  playerName: "",
  playerColor: null,
  commitment: null, // {ko,en} — the skill the learner promised to use
  commitmentWhen: null, // {ko,en} — the moment they'll use it
  playerPos: null
};

COMPETENCIES.forEach((c) => {
  state.stats[c.id] = 0;
  state.statMax[c.id] = 0;
});

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return false;
    state.lang = data.lang === "en" ? "en" : "ko";
    state.xp = Number(data.xp) || 0;
    state.level = Number(data.level) || 1;
    COMPETENCIES.forEach((c) => {
      state.stats[c.id] = Number(data.stats?.[c.id]) || 0;
      state.statMax[c.id] = Number(data.statMax?.[c.id]) || 0;
    });
    state.quests = data.quests && typeof data.quests === "object" ? data.quests : {};
    state.answered = data.answered && typeof data.answered === "object" ? data.answered : {};
    state.reportShown = !!data.reportShown;
    state.musicVol = Number.isFinite(data.musicVol) ? Math.min(Math.max(data.musicVol, 0), 1) : 0.6;
    state.sfxVol = Number.isFinite(data.sfxVol) ? Math.min(Math.max(data.sfxVol, 0), 1) : 0.8;
    if (data.musicOn === false) state.musicVol = 0; // legacy save field
    state.playerName = typeof data.playerName === "string" ? data.playerName.slice(0, 12) : "";
    state.playerColor = typeof data.playerColor === "string" ? data.playerColor : null;
    state.commitment = data.commitment && data.commitment.ko ? data.commitment : null;
    state.commitmentWhen = data.commitmentWhen && data.commitmentWhen.ko ? data.commitmentWhen : null;
    if (data.playerPos && Number.isFinite(data.playerPos.x) && Number.isFinite(data.playerPos.z)) {
      state.playerPos = { x: data.playerPos.x, z: data.playerPos.z };
    }
    return Object.keys(state.quests).length > 0 || state.xp > 0;
  } catch (error) {
    return false;
  }
}

function persistSave() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        lang: state.lang,
        xp: state.xp,
        level: state.level,
        stats: state.stats,
        statMax: state.statMax,
        quests: state.quests,
        answered: state.answered,
        reportShown: state.reportShown,
        musicVol: state.musicVol,
        sfxVol: state.sfxVol,
        playerName: state.playerName,
        playerColor: state.playerColor,
        commitment: state.commitment,
        commitmentWhen: state.commitmentWhen,
        playerPos: player
          ? { x: Number(player.position.x.toFixed(2)), z: Number(player.position.z.toFixed(2)) }
          : state.playerPos
      })
    );
  } catch (error) {
    /* storage unavailable — play on without saving */
  }
}

const hasSave = loadSave();

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    /* storage unavailable — reload will start fresh anyway */
  }
}

// ---------------------------------------------------------------------------
// SCORM — initialized before asset streaming so the LMS records the attempt
// even if the learner bails during the download.
// ---------------------------------------------------------------------------

const scorm = {
  active: false,
  learner: "",
  submitted: false
};

function scormInit() {
  if (!window.Scorm12) return;
  scorm.active = window.Scorm12.init();
  if (!scorm.active) return;
  scorm.learner = window.Scorm12.get("cmi.core.student_name") || "";
  const status = window.Scorm12.get("cmi.core.lesson_status");
  if (status === "not attempted" || status === "") {
    window.Scorm12.set("cmi.core.lesson_status", "incomplete");
  }
  window.Scorm12.commit();
}

// Compact per-competency + per-item record for the teacher/LMS side
// (readable via cmi.suspend_data; stays well under the 4096-char guarantee).
function scormDetailPayload(score) {
  const comps = {};
  COMPETENCIES.forEach((c) => {
    comps[c.id] = [state.stats[c.id], state.statMax[c.id]];
  });
  return JSON.stringify({ v: 1, score, comps, nodes: state.answered });
}

function scormSubmit(score) {
  if (!scorm.active || scorm.submitted) return;
  scorm.submitted = true;
  // Never downgrade an already-recorded result within the same attempt.
  const prevStatus = window.Scorm12.get("cmi.core.lesson_status");
  const prevRawStr = window.Scorm12.get("cmi.core.score.raw");
  const prevRaw = prevRawStr === "" ? -1 : Number(prevRawStr);
  // Pass cut 70: a learner who consistently picks reasonable ("good")
  // answers passes; the on-screen A grade (75) always clears it.
  const newStatus = score >= 70 ? "passed" : "completed";
  if (prevStatus === "passed" && newStatus !== "passed") return;
  if (Number.isFinite(prevRaw) && score < prevRaw) return;
  window.Scorm12.set("cmi.core.score.min", "0");
  window.Scorm12.set("cmi.core.score.max", "100");
  window.Scorm12.set("cmi.core.score.raw", String(score));
  window.Scorm12.set("cmi.core.lesson_status", newStatus);
  window.Scorm12.set("cmi.suspend_data", scormDetailPayload(score));
  window.Scorm12.commit();
}

window.addEventListener("beforeunload", () => {
  persistSave();
  if (scorm.active && window.Scorm12) {
    window.Scorm12.commit();
    window.Scorm12.finish();
  }
});

scormInit();

// ---------------------------------------------------------------------------
// Game-ready 3D assets (Kenney starter kits, MIT — see assets/LICENSE-kenney.md)
// Loaded up front; every user is served the local files packaged with the SCO.
// Any file that fails to load falls back to the procedural primitive builders.
// ---------------------------------------------------------------------------

const MODEL_FILES = {
  character: "./assets/models/platformer/character.glb",
  charKnight: "./assets/models/kaykit/knight.glb",
  charBarbarian: "./assets/models/kaykit/barbarian.glb",
  charMage: "./assets/models/kaykit/mage.glb",
  charRogue: "./assets/models/kaykit/rogue.glb",
  charRogueHooded: "./assets/models/kaykit/rogue-hooded.glb",
  flag: "./assets/models/platformer/flag.glb",
  houseA: "./assets/models/city/building-small-a.glb",
  houseB: "./assets/models/city/building-small-b.glb",
  houseC: "./assets/models/city/building-small-c.glb",
  houseD: "./assets/models/city/building-small-d.glb",
  garage: "./assets/models/city/building-garage.glb",
  fountain: "./assets/models/city/pavement-fountain.glb",
  trees: "./assets/models/city/grass-trees.glb",
  treesTall: "./assets/models/city/grass-trees-tall.glb"
};

const assets = {};
{
  const gltfLoader = new GLTFLoader();
  const entries = Object.entries(MODEL_FILES);
  const loaded = await Promise.all(
    entries.map(([, url]) => gltfLoader.loadAsync(url).catch(() => null))
  );
  entries.forEach(([key], i) => {
    assets[key] = loaded[i];
  });
}

// Clone a loaded glTF scene, normalize its size, center it on XZ, rest it on
// the ground plane, and optionally tint it toward a color.
function cloneModel(gltf, { size = 1, axis = "footprint", tint = null, tintStrength = 0.62, shadows = true } = {}) {
  if (gltf.__hasSkin === undefined) {
    gltf.__hasSkin = false;
    gltf.scene.traverse((o) => {
      if (o.isSkinnedMesh) gltf.__hasSkin = true;
    });
  }
  const root = gltf.__hasSkin ? cloneSkinned(gltf.scene) : gltf.scene.clone(true);
  const box = new THREE.Box3().setFromObject(root);
  const dims = box.getSize(new THREE.Vector3());
  const basis = axis === "y" ? dims.y : Math.max(dims.x, dims.z);
  root.scale.setScalar(size / (basis || 1));
  const box2 = new THREE.Box3().setFromObject(root);
  const center = box2.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box2.min.y;
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = shadows;
      obj.receiveShadow = true;
      if (tint) {
        obj.material = obj.material.clone();
        obj.material.color.lerp(new THREE.Color(tint), tintStrength);
      }
    }
  });
  return root;
}

// ---------------------------------------------------------------------------
// i18n helpers
// ---------------------------------------------------------------------------

function t(entry) {
  if (!entry) return "";
  return entry[state.lang] ?? entry.ko ?? "";
}

// ---------------------------------------------------------------------------
// Tiny synth audio (no assets)
// ---------------------------------------------------------------------------

let audioCtx = null;
let musicBus = null;
let sfxBus = null;

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      musicBus = audioCtx.createGain();
      musicBus.connect(audioCtx.destination);
      sfxBus = audioCtx.createGain();
      sfxBus.connect(audioCtx.destination);
      applyVolumes();
    } catch (error) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  startMusic();
}

function applyVolumes() {
  if (musicBus) musicBus.gain.value = state.musicVol;
  if (sfxBus) sfxBus.gain.value = state.sfxVol;
  if (dom.musicButton) dom.musicButton.textContent = state.musicVol > 0 ? "🔊" : "🔇";
  if (dom.musicVolInput) dom.musicVolInput.value = String(Math.round(state.musicVol * 100));
  if (dom.sfxVolInput) dom.sfxVolInput.value = String(Math.round(state.sfxVol * 100));
}

function tone(freq, start, duration, type = "sine", volume = 0.08, bus = "sfx") {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = audioCtx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(bus === "music" ? musicBus : sfxBus);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// Gentle generative background music: a slow pentatonic music-box line.
const music = { timer: null, step: 0 };
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const MELODY = [0, 2, 4, 3, 5, 4, 2, 1, 3, 2, 4, 0];

function musicTick() {
  if (!audioCtx || state.musicVol <= 0) return;
  const i = music.step % MELODY.length;
  const octaveLift = music.step % 24 >= 12 ? 2 : 1;
  tone(PENTA[MELODY[i]] * octaveLift, 0, 1.6, "sine", 0.022, "music");
  if (music.step % 4 === 0) {
    tone(PENTA[MELODY[i]] / 2, 0, 2.4, "triangle", 0.014, "music");
  }
  music.step += 1;
}

function startMusic() {
  if (music.timer || !audioCtx) return;
  music.timer = setInterval(musicTick, 620);
}

const sfx = {
  talk: () => tone(520, 0, 0.09, "triangle", 0.05),
  step: (run) => tone(run ? 170 : 150, 0, 0.045, "sine", 0.018),
  choice: () => {
    tone(660, 0, 0.1, "triangle", 0.06);
    tone(880, 0.07, 0.12, "triangle", 0.05);
  },
  quest: () => {
    tone(523, 0, 0.14, "triangle", 0.07);
    tone(659, 0.11, 0.14, "triangle", 0.07);
    tone(784, 0.22, 0.22, "triangle", 0.07);
  },
  levelup: () => {
    tone(523, 0, 0.12, "square", 0.045);
    tone(659, 0.1, 0.12, "square", 0.045);
    tone(784, 0.2, 0.12, "square", 0.045);
    tone(1046, 0.3, 0.3, "triangle", 0.07);
  }
};

// ---------------------------------------------------------------------------
// Three.js scene setup
// ---------------------------------------------------------------------------

const WORLD_BOUND = 26;
const PLAYER_RADIUS = 0.55;

// shortest-arc angle wrap, shared by every turn-toward easing
function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function createRenderer() {
  try {
    return new THREE.WebGLRenderer({ antialias: true });
  } catch (error) {
    if (window.__selquestBootFailed) {
      window.__selquestBootFailed("WebGL 사용 불가 — 그래픽 가속을 켜 주세요 · WebGL unavailable");
    }
    throw error;
  }
}

const renderer = createRenderer();
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
dom.root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe6f2);
scene.fog = new THREE.Fog(0xbfe6f2, 55, 130);

// Gradient sky dome
{
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#3f97d6");
  grad.addColorStop(0.42, "#7cc3e8");
  grad.addColorStop(0.62, "#c7ecf5");
  grad.addColorStop(1, "#f4e9c8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(190, 24, 14),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.renderOrder = -10;
  scene.add(sky);
}

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

const hemiLight = new THREE.HemisphereLight(0xdff3ff, 0x6a8f5a, 0.95);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff3d6, 2.4);
sun.position.set(28, 42, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -42;
sun.shadow.camera.right = 42;
sun.shadow.camera.top = 42;
sun.shadow.camera.bottom = -42;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0004;
scene.add(sun);

function resize() {
  const w = dom.root.clientWidth || window.innerWidth;
  const h = dom.root.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ---------------------------------------------------------------------------
// World building
// ---------------------------------------------------------------------------

const colliders = []; // { x, z, r }

function addCollider(x, z, r) {
  colliders.push({ x, z, r });
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...extra });
}

// Ground with soft color noise
{
  const geo = new THREE.PlaneGeometry(140, 140, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const colors = [];
  const base = new THREE.Color(0x79b45c);
  const alt = new THREE.Color(0x8cc46b);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const n = Math.sin(pos.getX(i) * 0.35) * Math.cos(pos.getZ(i) * 0.3);
    const c = base.clone().lerp(alt, (n + 1) / 2 + (Math.sin(i * 7.13) * 0.5 + 0.5) * 0.25);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
  );
  ground.receiveShadow = true;
  scene.add(ground);
}

// Plaza + paths
{
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(8.2, 40).rotateX(-Math.PI / 2),
    mat(0xd9c49a, { roughness: 1 })
  );
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);
}

function addPath(x, z, w, d, rot = 0) {
  const path = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat(0xcdb98f, { roughness: 1 }));
  path.position.set(x, 0.015, z);
  path.rotation.y = rot;
  path.receiveShadow = true;
  scene.add(path);
}

addPath(0, -13, 3.2, 18); // south to shop
addPath(0, 14, 3.2, 16); // north to school
addPath(-13, 0, 3.2, 18, Math.PI / 2); // west
addPath(13, 0, 3.2, 18, Math.PI / 2); // east
addPath(-14, -8, 3, 12, Math.PI / 4); // to pond
addPath(14, -8, 3, 12, -Math.PI / 4); // to playground
addPath(-13.5, 9, 3, 11, -Math.PI / 4); // to big tree
addPath(13.5, 9, 3, 11, Math.PI / 4); // to workshop

// Fountain at plaza center
let fountainWater = null;
if (assets.fountain) {
  const tile = cloneModel(assets.fountain, { size: 6 });
  tile.position.y += 0.03;
  scene.add(tile);
  addCollider(0, 0, 2.1);
} else {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.8, 24), mat(0xb8b2a6));
  rim.position.y = 0.4;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);
  fountainWater = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0x59b7d8, roughness: 0.2, emissive: 0x1d6f8e, emissiveIntensity: 0.35 })
  );
  fountainWater.position.y = 0.72;
  group.add(fountainWater);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 16), mat(0xb8b2a6));
  column.position.y = 1.4;
  column.castShadow = true;
  group.add(column);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.6, 0.35, 16), mat(0xc7c2b6));
  bowl.position.y = 2.25;
  bowl.castShadow = true;
  group.add(bowl);
  scene.add(group);
  addCollider(0, 0, 3.1);
}

// Pond (southwest)
{
  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(5.2, 30).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x4da4cf, roughness: 0.25, emissive: 0x15506b, emissiveIntensity: 0.25 })
  );
  pond.scale.set(1.35, 1, 1);
  pond.position.set(-19.5, 0.03, -14);
  scene.add(pond);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.35, 0.28, 10, 34).rotateX(-Math.PI / 2), mat(0x9a8f78));
  rim.scale.set(1.35, 1, 1);
  rim.position.set(-19.5, 0.12, -14);
  scene.add(rim);
  // radius kept small enough that push-out + world clamp cannot re-embed
  // the player at the map edge (26 - 19.5 = 6.5 > 5.8 + player radius 0.55)
  addCollider(-19.5, -14, 5.8);
}

function addBox(group, w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

function addRoof(group, w, d, color, x, y, z, rotY = 0) {
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.9, 4), mat(color, { roughness: 0.7 }));
  roof.position.set(x, y, z);
  roof.rotation.y = Math.PI / 4 + rotY;
  roof.castShadow = true;
  group.add(roof);
  return roof;
}

function makeSign(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a3423";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#f7ecd7";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: tex }));
}

function addBuilding({ x, z, w = 6, h = 3.4, d = 5, wall = 0xf5e9d2, roof = 0xc75450, rotY = 0, sign = null, model = null }) {
  const g = new THREE.Group();
  const source = model ? assets[model] : null;
  if (source) {
    const building = cloneModel(source, { size: Math.max(w, d) });
    g.add(building);
    if (sign) {
      const box = new THREE.Box3().setFromObject(building);
      const board = makeSign(sign);
      board.position.set(0, box.max.y * 0.72, box.max.z + 0.08);
      g.add(board);
    }
  } else {
    addBox(g, w, h, d, wall, 0, h / 2, 0);
    addRoof(g, w, d, roof, 0, h + 0.92, 0);
    // door + windows
    addBox(g, 1.1, 1.8, 0.15, 0x6b4a2f, 0, 0.9, d / 2 + 0.03);
    addBox(g, 1.2, 1, 0.12, 0xbde3f2, -w / 4, h * 0.55, d / 2 + 0.03, { roughness: 0.3 });
    addBox(g, 1.2, 1, 0.12, 0xbde3f2, w / 4, h * 0.55, d / 2 + 0.03, { roughness: 0.3 });
    if (sign) {
      const board = makeSign(sign);
      board.position.set(0, h - 0.5, d / 2 + 0.06);
      g.add(board);
    }
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  addCollider(x, z, Math.max(w, d) * (source ? 0.55 : 0.68));
  return g;
}

addBuilding({ x: 0, z: 23, w: 13, h: 4.6, d: 7, wall: 0xf2e3c8, roof: 0x3e6f8e, sign: "SCHOOL", model: "houseC" });
addBuilding({ x: 19, z: 19.5, w: 7, h: 3.2, d: 5.6, wall: 0xe8dcc0, roof: 0xd98e2b, rotY: -0.35, sign: "MAKER", model: "houseB" });
addBuilding({ x: 6.5, z: -24.5, w: 6.6, h: 3.1, d: 5, wall: 0xf7ecd7, roof: 0x7fae5c, sign: "SHOP", model: "houseD" });
addBuilding({ x: -23, z: 3, w: 6, h: 3, d: 4.6, wall: 0xf5e0d8, roof: 0xb56a4f, rotY: Math.PI / 2, model: "houseA" });
addBuilding({ x: 23.5, z: 1.5, w: 6, h: 3, d: 4.6, wall: 0xe9eadd, roof: 0x8a6fae, rotY: -Math.PI / 2, model: "houseB" });
addBuilding({ x: -9, z: 24, w: 5.6, h: 2.9, d: 4.4, wall: 0xfbeed9, roof: 0xc75450, rotY: 0.2, model: "houseA" });
addBuilding({ x: -21, z: -22, w: 5.2, h: 2.6, d: 4.2, rotY: 0.7, model: "garage" });

// Playground (southeast): slide + swing silhouettes
{
  const g = new THREE.Group();
  const slideBase = addBox(g, 0.5, 2.2, 0.5, 0xd9d4c8, 0, 1.1, 0);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 3.4), mat(0xe0685f, { roughness: 0.5 }));
  slide.position.set(0, 1.35, 1.6);
  slide.rotation.x = 0.62;
  slide.castShadow = true;
  g.add(slide);
  const frame = addBox(g, 3.4, 0.18, 0.18, 0x6b8fb0, 3.4, 2.3, 0);
  addBox(g, 0.16, 2.3, 0.16, 0x6b8fb0, 1.9, 1.15, 0);
  addBox(g, 0.16, 2.3, 0.16, 0x6b8fb0, 4.9, 1.15, 0);
  addBox(g, 0.8, 0.12, 0.35, 0xf2b134, 3, 0.85, 0);
  addBox(g, 0.8, 0.12, 0.35, 0xf2b134, 4, 1, 0);
  g.position.set(20, 0, -17);
  g.rotation.y = 0.5;
  scene.add(g);
  addCollider(20, -17, 4.2);
}

// Benches
function addBench(x, z, rotY) {
  const g = new THREE.Group();
  addBox(g, 2.2, 0.14, 0.7, 0x9a6b43, 0, 0.55, 0);
  addBox(g, 2.2, 0.6, 0.12, 0x9a6b43, 0, 0.95, -0.32);
  addBox(g, 0.14, 0.55, 0.6, 0x5e4128, -0.9, 0.28, 0);
  addBox(g, 0.14, 0.55, 0.6, 0x5e4128, 0.9, 0.28, 0);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);
  addCollider(x, z, 1.3);
}
addBench(-5.5, 5.5, 0.7);
addBench(5.5, 5.5, -0.7);
addBench(-12.5, 16.5, -0.9);

// Street lamps (decorative)
function addLamp(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.4, 8), mat(0x37414a));
  pole.position.y = 1.7;
  pole.castShadow = true;
  g.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff1bd, emissive: 0xffdf8a, emissiveIntensity: 0.9 })
  );
  bulb.position.y = 3.45;
  g.add(bulb);
  g.position.set(x, 0, z);
  scene.add(g);
  addCollider(x, z, 0.4);
}
[[-8, -6], [8, -6], [-8, 8.5], [8, 8.5], [2.5, -18], [0, 17], [-16, 5], [16, 5]].forEach(([x, z]) => addLamp(x, z));

// Trees
const treeSpots = [
  [-24, -4], [-25, 12], [-18, 22], [-4, -24], [-12, -21], [12, -22], [24, -10],
  [25, 9], [12, 24], [-25, -20], [24, -22], [9, 13], [-9, -11],
  [10, -12.5], [-22, 17], [-14.2, 14.8], [23, 13]
];
treeSpots.forEach(([x, z], i) => {
  if (assets.trees || assets.treesTall) {
    const source = i % 3 === 0 ? assets.treesTall || assets.trees : assets.trees || assets.treesTall;
    const size = 3.4 + ((i * 37) % 10) / 4;
    const patch = cloneModel(source, { size });
    patch.position.set(x, -0.04, z);
    patch.rotation.y = (i * 2.39996) % (Math.PI * 2);
    scene.add(patch);
    addCollider(x, z, size * 0.28);
    return;
  }
  const g = new THREE.Group();
  const trunkH = 1.5 + (i % 3) * 0.4;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, trunkH, 8), mat(0x7a5230));
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const leafColor = i % 2 ? 0x4e8f43 : 0x5da24f;
  if (i % 3 === 0) {
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 9), mat(leafColor));
    cone1.position.y = trunkH + 1;
    cone1.castShadow = true;
    g.add(cone1);
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.9, 9), mat(leafColor));
    cone2.position.y = trunkH + 2.2;
    cone2.castShadow = true;
    g.add(cone2);
  } else {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), mat(leafColor));
    puff.position.y = trunkH + 1.15;
    puff.scale.y = 0.92;
    puff.castShadow = true;
    g.add(puff);
    const puff2 = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), mat(leafColor));
    puff2.position.set(0.75, trunkH + 0.75, 0.35);
    puff2.castShadow = true;
    g.add(puff2);
  }
  const scale = 0.85 + ((i * 37) % 10) / 22;
  g.scale.setScalar(scale);
  g.position.set(x, 0, z);
  scene.add(g);
  addCollider(x, z, 0.75 * scale);
});

// Big landmark tree near Minjun
if (assets.treesTall) {
  const grove = cloneModel(assets.treesTall, { size: 8.5 });
  grove.position.set(-16.5, -0.04, 16.5);
  grove.rotation.y = 0.8;
  scene.add(grove);
  addCollider(-16.5, 16.5, 1.6);
} else {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 3.6, 10), mat(0x6d4527));
  trunk.position.y = 1.8;
  trunk.castShadow = true;
  g.add(trunk);
  [[0, 4.6, 0, 2.6], [1.6, 3.9, 0.6, 1.7], [-1.5, 4, -0.4, 1.6], [0.3, 3.6, 1.5, 1.4]].forEach(([x, y, z, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(0x54984a));
    puff.position.set(x, y, z);
    puff.castShadow = true;
    g.add(puff);
  });
  g.position.set(-16.5, 0, 16.5);
  scene.add(g);
  addCollider(-16.5, 16.5, 1.2);
}

// Clouds
const clouds = [];
for (let i = 0; i < 6; i += 1) {
  const g = new THREE.Group();
  const cmat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
  for (let j = 0; j < 4; j += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + (j % 2), 10, 8), cmat);
    puff.position.set(j * 1.9 - 2.8, (j % 2) * 0.5, ((j * 13) % 3) - 1);
    puff.scale.y = 0.55;
    g.add(puff);
  }
  g.position.set(-50 + i * 20, 24 + (i % 3) * 3, -30 + ((i * 29) % 60));
  scene.add(g);
  clouds.push(g);
}

// Butterflies
const butterflies = [];
for (let i = 0; i < 7; i += 1) {
  const g = new THREE.Group();
  const wingMat = new THREE.MeshBasicMaterial({
    color: [0xf2b134, 0xf48fb1, 0x81d4fa, 0xb39ddb][i % 4],
    side: THREE.DoubleSide
  });
  const wingGeo = new THREE.PlaneGeometry(0.34, 0.26);
  const w1 = new THREE.Mesh(wingGeo, wingMat);
  w1.position.x = -0.17;
  const w2 = new THREE.Mesh(wingGeo, wingMat);
  w2.position.x = 0.17;
  g.add(w1, w2);
  g.userData = {
    w1, w2,
    cx: -20 + ((i * 53) % 40),
    cz: -18 + ((i * 31) % 36),
    r: 2 + (i % 3),
    speed: 0.5 + (i % 4) * 0.18,
    phase: i * 1.7
  };
  scene.add(g);
  butterflies.push(g);
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

function buildCharacter(cfg) {
  const source = (cfg.model && assets[cfg.model]) || assets.character;
  if (source) return buildCharacterGLB(cfg, source);
  return buildCharacterPrimitive(cfg);
}

// Animated GLB character: KayKit human adventurers (skinned, Idle/Walking_A/
// Running_A/Cheer) with the Kenney robot as fallback (idle/walk).
function buildCharacterGLB({ top, scale = 1 }, source) {
  const g = new THREE.Group();
  const isRobot = source === assets.character;
  const model = cloneModel(source, {
    size: 2.05 * scale,
    axis: "y",
    tint: top,
    tintStrength: isRobot ? 0.62 : 0.45
  });
  g.add(model); // both asset families face +Z, matching the game convention

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.42 * scale, 16).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })
  );
  blob.position.y = 0.02;
  g.add(blob);

  const mixer = new THREE.AnimationMixer(model);
  const clips = source.animations;
  const pick = (...names) => {
    for (const n of names) {
      const clip = THREE.AnimationClip.findByName(clips, n);
      if (clip) return mixer.clipAction(clip);
    }
    return null;
  };
  const actions = {
    idle: pick("Idle", "idle"),
    walk: pick("Walking_A", "walk"),
    run: pick("Running_A"),
    cheer: pick("Cheer")
  };
  if (actions.idle) {
    actions.idle.play();
    // desynchronize idle cycles between characters
    actions.idle.time = Math.random() * actions.idle.getClip().duration;
  }
  const anim = { mixer, actions, state: "idle", oneShot: false };
  anim.playOnce = (name) => {
    const action = actions[name];
    if (!action || anim.oneShot) return;
    anim.oneShot = true;
    const from = actions[anim.state];
    action.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
    if (from) from.fadeOut(0.2);
  };
  mixer.addEventListener("finished", () => {
    anim.oneShot = false;
    if (actions[anim.state]) actions[anim.state].reset().fadeIn(0.25).play();
  });
  g.userData.anim = anim;
  return g;
}

function buildCharacterPrimitive({ skin, hair, top, bottom, scale = 1 }) {
  const g = new THREE.Group();
  const parts = {};

  const legGeo = new THREE.BoxGeometry(0.24, 0.62, 0.26);
  legGeo.translate(0, -0.31, 0);
  parts.legL = new THREE.Mesh(legGeo, mat(bottom));
  parts.legL.position.set(-0.15, 0.72, 0);
  parts.legR = new THREE.Mesh(legGeo.clone(), mat(bottom));
  parts.legR.position.set(0.15, 0.72, 0);

  parts.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 6, 12), mat(top));
  parts.body.position.y = 1.15;

  const armGeo = new THREE.CapsuleGeometry(0.1, 0.42, 4, 8);
  armGeo.translate(0, -0.26, 0);
  parts.armL = new THREE.Mesh(armGeo, mat(top));
  parts.armL.position.set(-0.44, 1.42, 0);
  parts.armR = new THREE.Mesh(armGeo.clone(), mat(top));
  parts.armR.position.set(0.44, 1.42, 0);

  const handGeo = new THREE.SphereGeometry(0.11, 8, 8);
  const handL = new THREE.Mesh(handGeo, mat(skin));
  handL.position.set(0, -0.52, 0);
  parts.armL.add(handL);
  const handR = new THREE.Mesh(handGeo.clone(), mat(skin));
  handR.position.set(0, -0.52, 0);
  parts.armR.add(handR);

  parts.head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), mat(skin));
  parts.head.position.y = 1.95;

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(hair)
  );
  hairCap.position.y = 0.03;
  parts.head.add(hairCap);

  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x21262d });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.02, 0.3);
  const eyeR = new THREE.Mesh(eyeGeo.clone(), eyeMat);
  eyeR.position.set(0.12, 0.02, 0.3);
  parts.head.add(eyeL, eyeR);

  Object.values(parts).forEach((p) => {
    p.castShadow = true;
    g.add(p);
  });
  // shadow-only blob to ground the character visually
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 16).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  blob.position.y = 0.02;
  g.add(blob);

  g.scale.setScalar(scale);
  g.userData.parts = parts;
  return g;
}

function animateWalk(charGroup, timeMs, moving, speedFactor = 1, dt = 1 / 60) {
  const anim = charGroup.userData.anim;
  if (anim) {
    if (!anim.oneShot) {
      let target = "idle";
      if (moving && anim.actions.walk) {
        target = speedFactor > 1.2 && anim.actions.run ? "run" : "walk";
      }
      if (anim.state !== target && anim.actions[target]) {
        const from = anim.actions[anim.state];
        anim.actions[target].reset().fadeIn(0.16).play();
        if (from) from.fadeOut(0.16);
        anim.state = target;
      }
      if (anim.actions.walk) anim.actions.walk.timeScale = speedFactor * 1.35;
    }
    anim.mixer.update(dt);
    return;
  }
  const p = charGroup.userData.parts;
  if (!p) return;
  const tSec = timeMs / 1000;
  if (moving) {
    const swing = Math.sin(tSec * 10 * speedFactor) * 0.55;
    p.legL.rotation.x = swing;
    p.legR.rotation.x = -swing;
    p.armL.rotation.x = -swing * 0.8;
    p.armR.rotation.x = swing * 0.8;
    p.body.position.y = 1.15 + Math.abs(Math.sin(tSec * 10 * speedFactor)) * 0.05;
    p.head.position.y = 1.95 + Math.abs(Math.sin(tSec * 10 * speedFactor)) * 0.05;
  } else {
    p.legL.rotation.x *= 0.8;
    p.legR.rotation.x *= 0.8;
    p.armL.rotation.x = Math.sin(tSec * 1.7) * 0.06;
    p.armR.rotation.x = -Math.sin(tSec * 1.7) * 0.06;
    p.body.position.y = 1.15 + Math.sin(tSec * 2.1) * 0.018;
    p.head.position.y = 1.95 + Math.sin(tSec * 2.1) * 0.022;
  }
}

// Text/emoji sprite helpers
function makeTextSprite(text, { font = "600 44px sans-serif", pad = 18, bg = null, fg = "#ffffff", stroke = null, size = 0.55 } = {}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  const metrics = ctx.measureText(text);
  canvas.width = Math.max(48, Math.ceil(metrics.width) + pad * 2);
  canvas.height = 72 + pad;
  const c2 = canvas.getContext("2d");
  if (bg) {
    c2.fillStyle = bg;
    c2.beginPath();
    if (typeof c2.roundRect === "function") {
      c2.roundRect(0, 0, canvas.width, canvas.height, 18);
    } else {
      c2.rect(0, 0, canvas.width, canvas.height);
    }
    c2.fill();
  }
  c2.font = font;
  c2.textAlign = "center";
  c2.textBaseline = "middle";
  if (stroke) {
    c2.strokeStyle = stroke;
    c2.lineWidth = 7;
    c2.strokeText(text, canvas.width / 2, canvas.height / 2);
  }
  c2.fillStyle = fg;
  c2.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })
  );
  sprite.renderOrder = 999;
  sprite.scale.set((canvas.width / canvas.height) * size, size, 1);
  return sprite;
}

// NPC instances
const npcActors = {}; // id -> actor

function spawnNpc(def) {
  const group = buildCharacter({ ...def.palette, model: def.model, scale: 0.96 });
  group.position.set(def.position.x, 0, def.position.z);
  group.rotation.y = def.facing || 0;
  scene.add(group);
  addCollider(def.position.x, def.position.z, 0.6);

  const nameSprite = makeTextSprite(t(def.name), {
    font: "700 40px sans-serif",
    bg: "rgba(20,30,38,0.72)",
    fg: "#fdfaf2"
  });
  nameSprite.position.y = 2.62;
  group.add(nameSprite);

  const moodSprite = makeTextSprite(MOOD_EMOJI[def.mood] || "🙂", { font: "60px sans-serif", size: 0.62 });
  moodSprite.position.y = 3.1;
  group.add(moodSprite);

  const markerSprite = makeTextSprite("!", {
    font: "900 62px sans-serif",
    fg: "#ffd147",
    stroke: "#5c3d00",
    size: 0.95
  });
  markerSprite.position.y = 3.72;
  markerSprite.visible = false;
  group.add(markerSprite);

  const actor = {
    def,
    group,
    mood: def.mood,
    nameSprite,
    moodSprite,
    markerSprite,
    baseFacing: def.facing || 0
  };
  npcActors[def.id] = actor;
  return actor;
}

Object.values(NPCS).forEach(spawnNpc);
const npcList = Object.values(npcActors); // fixed after spawn — cached for hot paths

// Quest flags planted beside each quest giver, tinted by the quest's
// competency color (derived from data.js so colors can never drift).
if (assets.flag) {
  const flagSpots = [];
  const seen = new Set();
  QUESTS.forEach((q) => {
    if (seen.has(q.npc)) return;
    seen.add(q.npc);
    const comp = COMPETENCIES.find((c) => c.id === q.competency);
    flagSpots.push({ npc: q.npc, color: comp ? comp.color : "#2e6f5e" });
  });
  flagSpots.forEach(({ npc, color }, i) => {
    const def = NPCS[npc];
    const flag = cloneModel(assets.flag, { size: 1.5, axis: "y", tint: color });
    const angle = (def.facing || 0) + Math.PI / 2;
    flag.position.set(def.position.x + Math.sin(angle) * 1.15, 0, def.position.z + Math.cos(angle) * 1.15);
    flag.rotation.y = i * 1.1;
    scene.add(flag);
  });
}

// Wildflower sprinkles (instanced — two draw calls for the whole meadow)
{
  const COUNT = 90;
  const rand = (n) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.32, 5);
  stemGeo.translate(0, 0.16, 0);
  const stems = new THREE.InstancedMesh(stemGeo, mat(0x4e8f43), COUNT);
  const headGeo = new THREE.IcosahedronGeometry(0.09, 0);
  const heads = new THREE.InstancedMesh(
    headGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    COUNT
  );
  const petal = [0xf2b134, 0xf48fb1, 0xffffff, 0xb39ddb, 0xff8a65];
  const m4 = new THREE.Matrix4();
  let placed = 0;
  let n = 0;
  while (placed < COUNT && n < COUNT * 30) {
    n += 1;
    const x = (rand(n) - 0.5) * 2 * (WORLD_BOUND - 1);
    const z = (rand(n + 1000) - 0.5) * 2 * (WORLD_BOUND - 1);
    // keep flowers off the plaza, paths corridor, and colliders
    if (Math.hypot(x, z) < 9.5) continue;
    if (Math.abs(x) < 2.2 || Math.abs(z) < 2.2) continue;
    if (colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 0.4)) continue;
    const s = 0.75 + rand(n + 2000) * 0.7;
    m4.makeScale(s, s, s).setPosition(x, 0, z);
    stems.setMatrixAt(placed, m4);
    m4.makeScale(s, s, s).setPosition(x, 0.34 * s, z);
    heads.setMatrixAt(placed, m4);
    heads.setColorAt(placed, new THREE.Color(petal[placed % petal.length]));
    placed += 1;
  }
  stems.count = placed;
  heads.count = placed;
  stems.receiveShadow = true;
  scene.add(stems, heads);
}

function replaceSprite(actor, key, sprite, y) {
  const old = actor[key];
  actor.group.remove(old);
  old.material.map.dispose();
  old.material.dispose();
  sprite.position.y = y;
  actor.group.add(sprite);
  actor[key] = sprite;
}

function setNpcMood(id, mood) {
  const actor = npcActors[id];
  if (!actor || actor.mood === mood) return;
  actor.mood = mood;
  replaceSprite(actor, "moodSprite", makeTextSprite(MOOD_EMOJI[mood] || "🙂", { font: "60px sans-serif", size: 0.62 }), 3.1);
}

function setNpcMarker(id, kind) {
  const actor = npcActors[id];
  if (!actor) return;
  if (actor.markerKind === kind) return;
  actor.markerKind = kind;
  if (!kind) {
    actor.markerSprite.visible = false;
    return;
  }
  const styles = {
    available: { text: "!", fg: "#ffd147", stroke: "#5c3d00" },
    active: { text: "…", fg: "#9adcf7", stroke: "#124b63" },
    done: { text: "✓", fg: "#8ef0b0", stroke: "#124b2a" }
  };
  const s = styles[kind] || styles.available;
  replaceSprite(
    actor,
    "markerSprite",
    makeTextSprite(s.text, { font: "900 62px sans-serif", fg: s.fg, stroke: s.stroke, size: 0.95 }),
    3.72
  );
  actor.markerSprite.visible = true;
}

function refreshNpcNameSprites() {
  Object.values(npcActors).forEach((actor) => {
    replaceSprite(
      actor,
      "nameSprite",
      makeTextSprite(t(actor.def.name), { font: "700 40px sans-serif", bg: "rgba(20,30,38,0.72)", fg: "#fdfaf2" }),
      2.62
    );
  });
}

// Ambient villagers wandering the paths (non-interactive)
const wanderers = [];
[
  { model: "charRogue", palette: { skin: 0xf1c9a5, hair: 0x51361f, top: 0xf2b134, bottom: 0x3a4a5a }, path: [[-10, 0], [-5, -5.5], [5, -5.5], [10, 0], [10, -8], [-4, -12]] },
  { model: "charRogueHooded", palette: { skin: 0xecc19c, hair: 0x2b2b33, top: 0x81c784, bottom: 0x5a4a3a }, path: [[-4, 10], [0, 16], [8, 12], [-6, 12]] }
].forEach((cfg, i) => {
  const g = buildCharacter({ ...cfg.palette, model: cfg.model, scale: 0.82 });
  g.position.set(cfg.path[0][0], 0, cfg.path[0][1]);
  scene.add(g);
  wanderers.push({ group: g, path: cfg.path, target: 1, speed: 1.5 + i * 0.3, wait: 0 });
});

// Confetti bursts (quest complete / level up)
const bursts = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function spawnBurst(position, count = 40) {
  if (reducedMotion) return;
  const colors = [0xf2b134, 0xf48fb1, 0x81c784, 0x4fc3f7, 0xb39ddb, 0xffffff];
  const positions = new Float32Array(count * 3);
  const colorArr = new Float32Array(count * 3);
  const velocities = [];
  const c = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    c.set(colors[i % colors.length]);
    colorArr[i * 3] = c.r;
    colorArr[i * 3 + 1] = c.g;
    colorArr[i * 3 + 2] = c.b;
    const a = (i / count) * Math.PI * 2;
    const spread = 1.6 + (i % 5) * 0.55;
    velocities.push(new THREE.Vector3(Math.cos(a) * spread, 3.6 + (i % 4) * 0.8, Math.sin(a) * spread));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false })
  );
  scene.add(points);
  bursts.push({ points, velocities, age: 0, life: 1.5 });
}

function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const b = bursts[i];
    b.age += dt;
    const pos = b.points.geometry.attributes.position;
    for (let j = 0; j < b.velocities.length; j += 1) {
      const v = b.velocities[j];
      v.y -= 7.5 * dt;
      pos.array[j * 3] += v.x * dt;
      pos.array[j * 3 + 1] += v.y * dt;
      pos.array[j * 3 + 2] += v.z * dt;
    }
    pos.needsUpdate = true;
    b.points.material.opacity = Math.max(0, 1 - b.age / b.life);
    if (b.age >= b.life) {
      scene.remove(b.points);
      b.points.geometry.dispose();
      b.points.material.dispose();
      bursts.splice(i, 1);
    }
  }
}

// Player — the knight, untinted hero look; learners can pick an outfit color
const player =
  assets.charKnight || assets.character
    ? buildCharacter({ top: null, model: "charKnight" })
    : buildCharacter({ skin: 0xf3cba5, hair: 0x2c2320, top: 0x2e6f5e, bottom: 0x2c3a46 });

const PLAYER_COLORS = [null, "#f2b134", "#e0685f", "#4fc3f7", "#81c784", "#b39ddb", "#f48fb1"];
let playerMeshes = null;
let playerNameSprite = null;

function setPlayerColor(color) {
  state.playerColor = color;
  if (!playerMeshes) {
    playerMeshes = [];
    player.traverse((obj) => {
      // skip the translucent ground blob; tint only the body meshes
      if (obj.isMesh && !(obj.material.transparent && obj.material.opacity < 0.5)) {
        playerMeshes.push(obj);
      }
    });
  }
  playerMeshes.forEach((mesh) => {
    if (!mesh.userData.baseMaterial) mesh.userData.baseMaterial = mesh.material;
    mesh.material = mesh.userData.baseMaterial.clone();
    if (color) mesh.material.color.lerp(new THREE.Color(color), 0.62);
  });
}

function setPlayerName(rawName) {
  state.playerName = String(rawName || "").trim().slice(0, 12);
  if (playerNameSprite) {
    player.remove(playerNameSprite);
    playerNameSprite.material.map.dispose();
    playerNameSprite.material.dispose();
    playerNameSprite = null;
  }
  if (state.playerName) {
    playerNameSprite = makeTextSprite(state.playerName, {
      font: "700 40px sans-serif",
      bg: "rgba(46, 111, 94, 0.82)",
      fg: "#fdfaf2",
      size: 0.5
    });
    playerNameSprite.position.y = 2.55;
    player.add(playerNameSprite);
  }
}

function buildSwatches() {
  dom.colorSwatches.innerHTML = "";
  PLAYER_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.background = color || "#f6f1e3";
    btn.title = color || t(UI.colorDefault);
    if (!color) btn.textContent = "✕";
    if ((state.playerColor || null) === color) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      setPlayerColor(color);
      persistSave();
      dom.colorSwatches.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      sfx.choice();
    });
    dom.colorSwatches.appendChild(btn);
  });
}
if (state.playerPos) {
  // saved positions are untrusted: clamp to the world and push out of any
  // collider (collider layout can change between versions)
  const safe = resolveCollisions(
    THREE.MathUtils.clamp(state.playerPos.x, -WORLD_BOUND, WORLD_BOUND),
    THREE.MathUtils.clamp(state.playerPos.z, -WORLD_BOUND, WORLD_BOUND)
  );
  player.position.set(safe.x, 0, safe.z);
} else {
  player.position.set(0, 0, 12);
}
player.rotation.y = Math.PI;
scene.add(player);

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const input = {
  keys: new Set(),
  joy: { active: false, x: 0, y: 0 },
  cam: { yaw: 0, pitch: 0.52, dist: 9.5 }
};

// Show the joystick for any touch-capable device (coarse-pointer phones,
// but also touchscreen laptops/tablets whose primary pointer is fine).
const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
if (isTouch) dom.joystick.hidden = false;

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  // never hijack keys while the learner is typing (e.g. the name input)
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  const k = e.key.toLowerCase();
  input.keys.add(k);
  if (k === "e" || k === " ") {
    // let Space/Enter activate a focused dialogue-choice button natively
    const active = document.activeElement;
    if (active && active.tagName === "BUTTON" && dom.dialogueChoices.contains(active)) return;
    if (dialogue.open) {
      e.preventDefault();
      advanceDialogue();
    } else if (k === "e" && nearestNpc) {
      startInteraction(nearestNpc);
    }
  }
  if (k === "j" && state.started && !dialogue.open) toggleJournal();
  if (k === "escape") {
    if (!dom.journalOverlay.hidden) toggleJournal(false);
    else if (!dom.reportOverlay.hidden) dom.reportOverlay.hidden = true;
  }
});
window.addEventListener("keyup", (e) => input.keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => input.keys.clear());

// Camera orbit via pointer drag on canvas; two-finger pinch zooms.
// Pointers are tracked by id so a second finger cannot corrupt the drag.
{
  const pointers = new Map();
  let pinchDist = 0;

  function pinchDistance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  renderer.domElement.addEventListener("pointerdown", (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: 0 });
    renderer.domElement.setPointerCapture(e.pointerId);
    if (pointers.size === 2) pinchDist = pinchDistance();
  });

  renderer.domElement.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    p.moved += Math.abs(dx) + Math.abs(dy);
    if (pointers.size === 2) {
      const d = pinchDistance();
      if (pinchDist > 0) {
        input.cam.dist = THREE.MathUtils.clamp(input.cam.dist + (pinchDist - d) * 0.03, 5, 17);
      }
      pinchDist = d;
      return;
    }
    input.cam.yaw -= dx * 0.0052;
    input.cam.pitch = THREE.MathUtils.clamp(input.cam.pitch + dy * 0.0042, 0.12, 1.25);
  });

  function endPointer(e) {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    pinchDist = 0;
    if (p && p.moved < 8 && e.type === "pointerup" && pointers.size === 0) handleTap(e);
  }
  renderer.domElement.addEventListener("pointerup", endPointer);
  renderer.domElement.addEventListener("pointercancel", endPointer);

  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    input.cam.dist = THREE.MathUtils.clamp(input.cam.dist + e.deltaY * 0.01, 5, 17);
  }, { passive: false });
}

// Tap-to-talk raycast
const raycaster = new THREE.Raycaster();
function handleTap(e) {
  if (!state.started || dialogue.open) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const groups = npcList.map((a) => a.group);
  // ignore hidden helper sprites (e.g. an invisible quest marker)
  const hit = raycaster.intersectObjects(groups, true).find((h) => h.object.visible);
  if (!hit) return;
  let obj = hit.object;
  while (obj && !groups.includes(obj)) obj = obj.parent;
  if (!obj) return;
  const actor = npcList.find((a) => a.group === obj);
  if (actor && actor.group.position.distanceTo(player.position) < 4.5) {
    startInteraction(actor);
  }
}

// Virtual joystick
{
  let pointerId = null;
  const maxR = 40;
  function setKnob(dx, dy) {
    dom.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
  function applyJoystick(e) {
    const rect = dom.joystick.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > maxR) {
      dx = (dx / len) * maxR;
      dy = (dy / len) * maxR;
    }
    setKnob(dx, dy);
    input.joy.x = dx / maxR;
    input.joy.y = dy / maxR;
  }
  dom.joystick.addEventListener("pointerdown", (e) => {
    pointerId = e.pointerId;
    dom.joystick.setPointerCapture(pointerId);
    input.joy.active = true;
    applyJoystick(e); // a stationary press already sets a direction
  });
  dom.joystick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    applyJoystick(e);
  });
  function endJoy(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    input.joy.active = false;
    input.joy.x = 0;
    input.joy.y = 0;
    setKnob(0, 0);
  }
  dom.joystick.addEventListener("pointerup", endJoy);
  dom.joystick.addEventListener("pointercancel", endJoy);
}

// ---------------------------------------------------------------------------
// Quest state machine
// ---------------------------------------------------------------------------

// npc id -> quest lookup (taeo shares the relationship quest)
const NPC_QUEST_ALIAS = { taeo: "q_relationship" };

function questById(id) {
  return QUESTS.find((q) => q.id === id);
}

// Single source of truth for "which quests does this NPC front?"
function questsOwnedBy(npcId) {
  const aliasQuest = NPC_QUEST_ALIAS[npcId];
  return QUESTS.filter((q) => q.npc === npcId || q.id === aliasQuest);
}

function questStatus(quest) {
  if (state.quests[quest.id]) return state.quests[quest.id];
  const reqs = quest.requires || [];
  const unlocked = reqs.every((r) => state.quests[r] === "done");
  return unlocked ? "available" : "locked";
}

function questForNpc(npcId) {
  const candidates = questsOwnedBy(npcId);
  // prefer active, then available, ordered by quest order
  candidates.sort((a, b) => a.order - b.order);
  const active = candidates.find((q) => questStatus(q) === "active");
  if (active) return active;
  const available = candidates.find((q) => questStatus(q) === "available");
  if (available) return available;
  return null;
}

function refreshMarkers() {
  Object.keys(npcActors).forEach((npcId) => {
    const quest = questForNpc(npcId);
    if (quest) {
      setNpcMarker(npcId, questStatus(quest) === "active" ? "active" : "available");
      return;
    }
    const anyDone = questsOwnedBy(npcId).some((q) => questStatus(q) === "done");
    setNpcMarker(npcId, anyDone ? "done" : null);
  });
}

const MOOD_AFTER = {
  q_selfAwareness: { jiho: "relieved" },
  q_selfManagement: { yuna: "happy" },
  q_socialAwareness: { minjun: "happy" },
  q_relationship: { sora: "happy", taeo: "happy" },
  q_decision: { doyun: "relieved" },
  finale: { hana: "happy" }
};

function applyMoodsFromState() {
  Object.entries(MOOD_AFTER).forEach(([questId, moods]) => {
    if (state.quests[questId] === "done") {
      Object.entries(moods).forEach(([npcId, mood]) => setNpcMood(npcId, mood));
    }
  });
}

// ---------------------------------------------------------------------------
// XP / level
// ---------------------------------------------------------------------------

function xpNeededFor(level) {
  return 40 + (level - 1) * 25;
}

function grantPoints(statId, tier) {
  const pts = CHOICE_POINTS[tier] ?? 0;
  if (statId && state.stats[statId] !== undefined) {
    state.stats[statId] += pts;
    state.statMax[statId] += CHOICE_POINTS.best;
  }
  state.xp += pts;
  let leveled = false;
  while (state.xp >= totalXpForLevel(state.level + 1)) {
    state.level += 1;
    leveled = true;
  }
  updateStatusHud();
  spawnFloatText(`+${pts} XP`, false);
  if (leveled) {
    spawnFloatText(t(UI.levelUp), true);
    sfx.levelup();
    spawnBurst(player.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 52);
    if (state.level === 2) showToast(t(UI.arrowUnlocked), 5600);
  }
  persistSave();
}

function totalXpForLevel(level) {
  // cumulative XP required to reach a level
  let sum = 0;
  for (let l = 2; l <= level; l += 1) sum += xpNeededFor(l - 1);
  return sum;
}

function spawnFloatText(text, isLevel) {
  const el = document.createElement("div");
  el.className = `float-text${isLevel ? " levelup" : ""}`;
  el.textContent = text;
  // project the player's head to screen space
  const v = player.position.clone().add(new THREE.Vector3(0, 2.4, 0)).project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  el.style.left = `${rect.left + ((v.x + 1) / 2) * rect.width}px`;
  el.style.top = `${rect.top + ((1 - v.y) / 2) * rect.height - (isLevel ? 40 : 0)}px`;
  dom.shell.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

function updateStatusHud() {
  dom.levelValue.textContent = String(state.level);
  const currentBase = totalXpForLevel(state.level);
  const nextTotal = totalXpForLevel(state.level + 1);
  const frac = THREE.MathUtils.clamp((state.xp - currentBase) / (nextTotal - currentBase), 0, 1);
  dom.xpFill.style.width = `${Math.round(frac * 100)}%`;
  dom.xpLabel.textContent = `${state.xp} XP`;

  COMPETENCIES.forEach((c) => {
    const li = dom.competencyList.querySelector(`[data-comp="${c.id}"]`);
    if (!li) return;
    const max = Math.max(state.statMax[c.id], 1);
    const pct = state.statMax[c.id] === 0 ? 0 : Math.round((state.stats[c.id] / max) * 100);
    li.querySelector(".comp-fill").style.width = `${pct}%`;
    li.querySelector(".comp-value").textContent = state.statMax[c.id] === 0 ? "—" : `${pct}%`;
  });
}

function buildCompetencyHud() {
  dom.competencyList.innerHTML = "";
  COMPETENCIES.forEach((c) => {
    const li = document.createElement("li");
    li.dataset.comp = c.id;
    li.innerHTML = `
      <span class="comp-name">${t(c.label)}</span>
      <span class="comp-icon">${c.icon}</span>
      <span class="comp-track"><span class="comp-fill" style="background:${c.color}"></span></span>
      <span class="comp-value">—</span>`;
    dom.competencyList.appendChild(li);
  });
  updateStatusHud();
}

function updateTracker() {
  dom.questTracker.innerHTML = "";
  const visible = QUESTS
    .map((q) => ({ q, s: questStatus(q) }))
    .filter(({ s }) => s === "active" || s === "available")
    .slice(0, 3);
  if (!visible.length) {
    const allDone = QUESTS.every((q) => questStatus(q) === "done");
    const div = document.createElement("div");
    div.className = "tracker-item done";
    div.textContent = allDone ? t(UI.reportBadge) : t(UI.journalEmpty);
    dom.questTracker.appendChild(div);
    return;
  }
  visible.forEach(({ q, s }) => {
    const div = document.createElement("div");
    div.className = "tracker-item";
    div.innerHTML = `<strong>${s === "active" ? "▶" : "!"} ${t(q.title)}</strong>${t(q.objective)}`;
    dom.questTracker.appendChild(div);
  });
}

function updateScormBadge() {
  const label = scorm.active ? t(UI.scormConnected) : t(UI.scormLocal);
  dom.scormBadge.textContent = label;
  dom.startScorm.textContent = scorm.learner
    ? `${label} — ${scorm.learner}`
    : label;
}

let toastTimer = null;
function showToast(message, ms = 3400) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), ms);
}

// ---------------------------------------------------------------------------
// Dialogue engine
// ---------------------------------------------------------------------------

const dialogue = {
  open: false,
  quest: null,
  nodeId: null,
  phase: "line", // "line" | "choices" | "reply"
  pendingNext: null,
  lastChoice: null,
  repliedAt: 0,
  excluded: new Set(), // choices already tried on the current node (retry loop)
  actor: null
};

const RETRY = "__retry";

function speakerName(speakerId) {
  if (speakerId === "player") return state.playerName || t(UI.playerName);
  const def = NPCS[speakerId];
  return def ? t(def.name) : speakerId;
}

function speakerEmoji(speakerId) {
  const actor = npcActors[speakerId];
  return actor ? MOOD_EMOJI[actor.mood] || "🙂" : "🙂";
}

function startInteraction(actor) {
  if (dialogue.open || !state.started) return;
  const quest = questForNpc(actor.def.id);
  if (!quest) {
    // finished or locked: ambient response
    if (actor.def.id === "hana") {
      if (questStatus(questById("finale")) === "done") {
        showReport(); // journey finished — Hana re-opens the report card
        return;
      }
      if (questStatus(questById("finale")) === "locked") {
        showToast(t(UI.toastFinaleLocked));
        return;
      }
    }
    const doneQuest = questsOwnedBy(actor.def.id).find(
      (q) => questStatus(q) === "done" && q.postLine
    );
    if (doneQuest) {
      startPostDialogue(actor, doneQuest);
    } else if (questsOwnedBy(actor.def.id).some((q) => questStatus(q) === "done")) {
      showToast(`${t(actor.def.name)} 😊`);
    } else {
      showToast(t(UI.toastLocked));
    }
    return;
  }
  ensureAudio();
  if (questStatus(quest) === "available") {
    state.quests[quest.id] = "active";
    const goal = quest.learningGoal ? ` · 🎯 ${t(quest.learningGoal)}` : "";
    showToast(`${t(UI.questAccepted)} ${t(quest.title)}${goal}`, 5200);
    refreshMarkers();
    updateTracker();
    persistSave();
  }
  dialogue.open = true;
  dialogue.quest = quest;
  dialogue.nodeId = quest.start;
  dialogue.excluded = new Set();
  dialogue.actor = actor;
  dom.talkPrompt.hidden = true;
  renderDialogueNode();
}

// Short one-line "thank you" scene from an NPC whose quest is finished.
function startPostDialogue(actor, quest) {
  ensureAudio();
  dialogue.open = true;
  dialogue.quest = {
    id: "__post",
    transient: true,
    start: "p",
    nodes: { p: { speaker: actor.def.id, text: quest.postLine, end: true } }
  };
  dialogue.nodeId = "p";
  dialogue.excluded = new Set();
  dialogue.actor = actor;
  dom.talkPrompt.hidden = true;
  renderDialogueNode();
}

function currentNode() {
  return dialogue.quest.nodes[dialogue.nodeId];
}

function renderDialogueNode({ retry = false } = {}) {
  const node = currentNode();
  if (!node) {
    closeDialogue();
    return;
  }
  sfx.talk();
  dialogue.phase = node.choices ? "choices" : "line";
  dom.dialogueBox.hidden = false;
  dom.dialogueName.textContent = speakerName(node.speaker);
  dom.dialoguePortrait.textContent = speakerEmoji(node.speaker);
  if (!retry) dom.dialogueText.textContent = t(node.text);
  dom.dialogueChoices.innerHTML = "";
  dom.dialogueContinue.textContent = "";

  if (node.choices) {
    const remaining = node.choices.filter((c) => !dialogue.excluded.has(c));
    const hint = document.createElement("p");
    hint.className = "choice-hint";
    hint.textContent = retry ? t(UI.retryHint) : t(UI.choiceHint);
    dom.dialogueChoices.appendChild(hint);
    // shuffle so the strongest answer isn't always in the same slot
    const shuffled = remaining
      .map((c, i) => ({ c, key: (i * 31 + t(c.text).length * 7 + hashSeed) % 23 }))
      .sort((a, b) => a.key - b.key)
      .map((x) => x.c);
    shuffled.forEach((choice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t(choice.text);
      btn.addEventListener("click", () => pickChoice(choice));
      dom.dialogueChoices.appendChild(btn);
    });
    const firstChoice = dom.dialogueChoices.querySelector("button");
    if (firstChoice) firstChoice.focus({ preventScroll: true });
  } else {
    dom.dialogueContinue.textContent = t(UI.continueHint);
  }
}

// stable-ish per-session shuffle seed
const hashSeed = 1 + Math.floor(performance.now()) % 89;

function renderReplyView() {
  const node = currentNode();
  const choice = dialogue.lastChoice;
  if (!node || !choice) return;
  dom.dialogueChoices.innerHTML = "";
  dom.dialogueName.textContent = speakerName(node.speaker);
  dom.dialoguePortrait.textContent = speakerEmoji(node.speaker);
  dom.dialogueText.textContent = t(choice.reply);
  dom.dialogueContinue.textContent = t(UI.continueHint);
}

function pickChoice(choice) {
  sfx.choice();
  // one score per node, even across replays (reload, language toggle);
  // the tier is recorded for teacher-facing SCORM suspend_data
  const answeredKey = `${dialogue.quest.id}:${dialogue.nodeId}`;
  if (!state.answered[answeredKey]) {
    state.answered[answeredKey] = choice.tier;
    grantPoints(choice.stat, choice.tier);
  }
  if (choice.remember) {
    state[choice.remember] = choice.text;
    persistSave();
  }
  dialogue.phase = "reply";
  // poor choices hand the moment back to the learner: after the NPC's
  // "that didn't land" reply, the remaining options are offered again
  if (choice.tier === "poor") {
    dialogue.excluded.add(choice);
    dialogue.pendingNext = RETRY;
  } else {
    dialogue.pendingNext = choice.next;
  }
  dialogue.lastChoice = choice;
  dialogue.repliedAt = performance.now();
  renderReplyView();
}

function advanceDialogue() {
  if (!dialogue.open) return;
  const node = currentNode();
  if (dialogue.phase === "choices") return; // must pick a choice
  if (dialogue.phase === "reply") {
    // absorb double-clicks/taps so the reply line is actually read
    if (performance.now() - dialogue.repliedAt < 350) return;
    if (dialogue.pendingNext === RETRY) {
      dialogue.pendingNext = null;
      renderDialogueNode({ retry: true });
      return;
    }
    dialogue.nodeId = dialogue.pendingNext;
    dialogue.pendingNext = null;
    dialogue.excluded = new Set();
    if (!dialogue.nodeId) {
      finishQuestDialogue(node);
      return;
    }
    renderDialogueNode();
    return;
  }
  // linear line
  if (node.end) {
    finishQuestDialogue(node);
    return;
  }
  dialogue.nodeId = node.next;
  dialogue.excluded = new Set();
  renderDialogueNode();
}

dom.dialogueBox.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") return;
  advanceDialogue();
});
dom.talkPrompt.addEventListener("click", () => {
  ensureAudio();
  if (nearestNpc) startInteraction(nearestNpc);
});

function finishQuestDialogue(endNode) {
  const quest = dialogue.quest;
  closeDialogue();
  if (quest.transient) return; // post-quest smalltalk — nothing to complete
  if (questStatus(quest) !== "done") {
    state.quests[quest.id] = "done";
    sfx.quest();
    spawnBurst(player.position.clone().add(new THREE.Vector3(0, 1.9, 0)));
    showToast(`✅ ${t(UI.questComplete)} ${t(quest.completion)}`, 4200);
    const moods = MOOD_AFTER[quest.id];
    if (moods) {
      Object.entries(moods).forEach(([npcId, mood]) => {
        setNpcMood(npcId, mood);
        const actor = npcActors[npcId];
        if (actor && actor.group.userData.anim) actor.group.userData.anim.playOnce("cheer");
      });
    }
    refreshMarkers();
    updateTracker();
    persistSave();
  }
  if (endNode && endNode.triggersReport) {
    setTimeout(showReport, 700);
  }
}

function closeDialogue() {
  dialogue.open = false;
  dialogue.quest = null;
  dialogue.nodeId = null;
  dom.dialogueBox.hidden = true;
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

function toggleJournal(force) {
  const show = force !== undefined ? force : dom.journalOverlay.hidden;
  dom.journalOverlay.hidden = !show;
  if (show) renderJournal();
}

function renderJournal() {
  dom.journalTitle.textContent = t(UI.journalTitle);
  dom.journalList.innerHTML = "";
  const statusLabel = {
    locked: t(UI.statusLocked),
    available: t(UI.statusAvailable),
    active: t(UI.statusActive),
    done: t(UI.statusDone)
  };
  QUESTS.forEach((q) => {
    const s = questStatus(q);
    const comp = COMPETENCIES.find((c) => c.id === q.competency);
    const li = document.createElement("li");
    const goalLine =
      s !== "locked" && q.learningGoal
        ? `<p class="quest-goal">🎯 ${t(UI.goalLabel)}: ${t(q.learningGoal)}</p>`
        : "";
    li.innerHTML = `
      <div class="quest-head">
        <strong>${comp ? comp.icon + " " : "⭐ "}${t(q.title)}</strong>
        <span class="quest-status ${s}">${statusLabel[s]}</span>
      </div>
      <p class="quest-summary">${s === "locked" ? "???" : t(q.summary)}</p>${goalLine}`;
    dom.journalList.appendChild(li);
  });
}

dom.journalButton.addEventListener("click", () => toggleJournal());
dom.journalClose.addEventListener("click", () => toggleJournal(false));
dom.journalOverlay.addEventListener("click", (e) => {
  if (e.target === dom.journalOverlay) toggleJournal(false);
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function computeScore() {
  let earned = 0;
  let max = 0;
  COMPETENCIES.forEach((c) => {
    earned += state.stats[c.id];
    max += state.statMax[c.id];
  });
  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
}

function showReport() {
  state.reportShown = true;
  persistSave();
  scormSubmit(computeScore());
  renderReport();
  dom.reportOverlay.hidden = false;
}

function renderReport() {
  const score = computeScore();
  const grade = score >= 90 ? "S" : score >= 75 ? "A" : "B";
  dom.reportTitle.textContent = state.playerName
    ? state.lang === "ko"
      ? `${state.playerName}의 ${t(UI.reportTitle)}`
      : `${state.playerName}'s ${t(UI.reportTitle)}`
    : t(UI.reportTitle);
  dom.reportBadgeText.textContent = t(UI.reportBadge);
  dom.reportScoreLabel.textContent = t(UI.reportScore);
  dom.reportScoreValue.textContent = String(score);
  dom.reportGradeLabel.textContent = t(UI.reportGradeLabel);
  dom.reportGradeValue.textContent = t(UI.grades[grade]);
  dom.reportHedge.textContent = t(UI.reportHedge);
  dom.reportReflection.textContent = state.commitment
    ? `🌱 ${t(UI.commitmentLabel)}: ${t(state.commitment)}${
        state.commitmentWhen ? ` — ${t(state.commitmentWhen)}` : ""
      }`
    : t(UI.reportReflection);
  dom.reportReplay.textContent = t(UI.reportReplay);
  dom.reportClose.textContent = t(UI.reportClose);

  dom.reportBars.innerHTML = "";
  COMPETENCIES.forEach((c) => {
    const max = Math.max(state.statMax[c.id], 1);
    const pct = state.statMax[c.id] === 0 ? 0 : Math.round((state.stats[c.id] / max) * 100);
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="bar-name">${t(c.label)}</span>
      <span class="bar-icon">${c.icon}</span>
      <span class="bar-track"><span class="bar-fill" style="background:${c.color};width:0%"></span></span>
      <span class="bar-pct">${pct}%</span>`;
    dom.reportBars.appendChild(li);
    requestAnimationFrame(() => {
      li.querySelector(".bar-fill").style.width = `${pct}%`;
    });
  });

  dom.reportScorm.textContent = scorm.active ? t(UI.scormSent) : t(UI.scormLocal);
}

dom.reportClose.addEventListener("click", () => {
  dom.reportOverlay.hidden = true;
});
dom.reportReplay.addEventListener("click", () => {
  clearSave();
  location.reload();
});

// ---------------------------------------------------------------------------
// Language + reset + start
// ---------------------------------------------------------------------------

function applyLanguage() {
  document.documentElement.lang = state.lang;
  dom.langButton.textContent = state.lang === "ko" ? "EN" : "한";
  dom.startLangButton.textContent = state.lang === "ko" ? "English" : "한국어";
  dom.startTitle.textContent = t(UI.gameTitle);
  dom.startSubtitle.textContent = t(UI.gameSubtitle);
  dom.startBody.textContent = t(UI.introBody);
  dom.controlsTitle.textContent = t(UI.controlsTitle);
  dom.controlsMove.textContent = t(UI.controlsMove);
  dom.controlsCamera.textContent = t(UI.controlsCamera);
  dom.controlsTalk.textContent = t(UI.controlsTalk);
  dom.controlsJournal.textContent = t(UI.controlsJournal);
  dom.startButton.textContent = hasSave ? t(UI.continueButton) : t(UI.startButton);
  dom.talkPrompt.textContent = t(UI.talkPrompt);
  dom.soundTitle.textContent = t(UI.soundTitle);
  dom.musicLabel.textContent = t(UI.musicLabel);
  dom.sfxLabel.textContent = t(UI.sfxLabel);
  dom.customizeTitle.textContent = t(UI.customizeTitle);
  dom.playerNameInput.placeholder = t(UI.namePlaceholder);
  dom.colorLabel.textContent = t(UI.colorLabel);
  buildSwatches();
  document.title = `${t(UI.gameTitle)} — TeachPlay`;
  if (dom.levelWord) dom.levelWord.textContent = t(UI.level);
  buildCompetencyHud();
  updateTracker();
  updateScormBadge();
  refreshNpcNameSprites();
  if (!dom.journalOverlay.hidden) renderJournal();
  if (dialogue.open) {
    // phase-aware: re-answering an already-scored node must not be possible
    if (dialogue.phase === "reply") renderReplyView();
    else renderDialogueNode();
  }
  if (!dom.reportOverlay.hidden) renderReport();
  persistSave();
}

dom.langButton.addEventListener("click", () => {
  state.lang = state.lang === "ko" ? "en" : "ko";
  applyLanguage();
});
dom.startLangButton.addEventListener("click", () => {
  state.lang = state.lang === "ko" ? "en" : "ko";
  applyLanguage();
});

dom.musicButton.addEventListener("click", () => {
  ensureAudio();
  dom.soundPanel.hidden = !dom.soundPanel.hidden;
});

dom.musicVolInput.addEventListener("input", () => {
  ensureAudio();
  state.musicVol = Number(dom.musicVolInput.value) / 100;
  applyVolumes();
  persistSave();
});

dom.sfxVolInput.addEventListener("input", () => {
  ensureAudio();
  state.sfxVol = Number(dom.sfxVolInput.value) / 100;
  applyVolumes();
  sfx.talk(); // audible preview of the new level
  persistSave();
});

dom.resetButton.addEventListener("click", () => {
  if (confirm(t(UI.resetConfirm))) {
    clearSave();
    location.reload();
  }
});

dom.startButton.addEventListener("click", () => {
  ensureAudio();
  state.started = true;
  dom.startOverlay.hidden = true;
  if (!hasSave) showToast(t(UI.toastLocked), 4200);
});

// ---------------------------------------------------------------------------
// Movement + camera + interaction proximity
// ---------------------------------------------------------------------------

let nearestNpc = null;
let saveTicker = 0;
let stepTicker = 0;

function movementVector() {
  let x = 0;
  let y = 0;
  if (input.keys.has("w") || input.keys.has("arrowup")) y -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) y += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) x -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) x += 1;
  if (input.joy.active) {
    x += input.joy.x;
    y += input.joy.y;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y, mag: Math.min(len, 1) };
}

function resolveCollisions(px, pz) {
  let x = px;
  let z = pz;
  // two passes: a push-out from one collider (or the world clamp) may land
  // inside a neighboring collider, so resolve again before settling
  for (let pass = 0; pass < 2; pass += 1) {
    for (const c of colliders) {
      const dx = x - c.x;
      const dz = z - c.z;
      const dist = Math.hypot(dx, dz);
      const minDist = c.r + PLAYER_RADIUS;
      if (dist < minDist && dist > 0.0001) {
        const push = (minDist - dist) / dist;
        x += dx * push;
        z += dz * push;
      }
    }
    x = THREE.MathUtils.clamp(x, -WORLD_BOUND, WORLD_BOUND);
    z = THREE.MathUtils.clamp(z, -WORLD_BOUND, WORLD_BOUND);
  }
  return { x, z };
}

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const arrowWorld = new THREE.Vector3();
let sprinting = false;

// Level-2 unlock: an edge-of-screen arrow pointing at the next quest NPC.
function updateQuestArrow() {
  const active =
    state.level >= 2 &&
    state.started &&
    !dialogue.open &&
    dom.journalOverlay.hidden &&
    dom.reportOverlay.hidden;
  let targetQuest = null;
  if (active) {
    const candidates = QUESTS
      .map((q) => ({ q, s: questStatus(q) }))
      .filter(({ s }) => s === "active" || s === "available")
      .sort((a, b) => (a.s === "active" ? -1 : 1) - (b.s === "active" ? -1 : 1) || a.q.order - b.q.order);
    targetQuest = candidates.length ? candidates[0].q : null;
  }
  if (!targetQuest) {
    dom.questArrow.hidden = true;
    return;
  }
  const def = NPCS[targetQuest.npc];
  arrowWorld.set(def.position.x, 2.4, def.position.z).project(camera);
  let x = arrowWorld.x;
  let y = arrowWorld.y;
  const behind = arrowWorld.z > 1;
  if (behind) {
    x = -x;
    y = -y;
  }
  if (!behind && Math.abs(x) < 0.9 && Math.abs(y) < 0.82) {
    dom.questArrow.hidden = true; // NPC is on screen — the ! marker suffices
    return;
  }
  const scale = 0.88 / Math.max(Math.abs(x), Math.abs(y), 0.0001);
  x *= scale;
  y *= scale;
  const rect = renderer.domElement.getBoundingClientRect();
  const sx = rect.left + ((x + 1) / 2) * rect.width;
  const sy = rect.top + ((1 - y) / 2) * rect.height;
  const angle = Math.atan2(-(y), x); // screen-space direction from center
  dom.questArrow.hidden = false;
  dom.questArrow.style.left = `${sx - 15}px`;
  dom.questArrow.style.top = `${sy - 15}px`;
  dom.questArrow.style.transform = `rotate(${angle}rad)`;
}

function updateCamera(dt) {
  const targetFov = sprinting ? 61 : 55;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 5);
    camera.updateProjectionMatrix();
  }
  const { yaw, pitch } = input.cam;
  let dist = input.cam.dist;
  const target = cameraTarget.set(player.position.x, 1.7, player.position.z);
  // conversation framing: pull in and center between the two speakers
  if (dialogue.open && dialogue.actor) {
    const npcPos = dialogue.actor.group.position;
    target.set((player.position.x + npcPos.x) / 2, 1.55, (player.position.z + npcPos.z) / 2);
    dist = Math.min(dist, 5.4);
  }
  const offX = Math.sin(yaw) * Math.cos(pitch) * dist;
  const offY = Math.sin(pitch) * dist;
  const offZ = Math.cos(yaw) * Math.cos(pitch) * dist;
  cameraDesired.set(target.x + offX, target.y + offY, target.z + offZ);
  camera.position.lerp(cameraDesired, Math.min(1, dt * 7));
  camera.lookAt(target);
}

function updateProximity(dt) {
  let best = null;
  let bestDist = 3.4;
  for (const actor of npcList) {
    const d = actor.group.position.distanceTo(player.position);
    if (d < bestDist) {
      best = actor;
      bestDist = d;
    }
    // NPCs turn toward the player when close, drift back otherwise
    let desired = actor.baseFacing;
    if (d < 5) {
      desired = Math.atan2(
        player.position.x - actor.group.position.x,
        player.position.z - actor.group.position.z
      );
    }
    actor.group.rotation.y += wrapAngle(desired - actor.group.rotation.y) * Math.min(1, dt * 6);
  }
  nearestNpc = best;
  dom.talkPrompt.hidden = !(best && state.started && !dialogue.open);
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.08);
  const now = performance.now();

  let moving = false;
  if (state.started && !dialogue.open && dom.journalOverlay.hidden && dom.reportOverlay.hidden) {
    const mv = movementVector();
    if (mv.mag > 0.05) {
      moving = true;
      const run = input.keys.has("shift");
      const speed = (run ? 8.2 : 5.1) * mv.mag;
      // camera-relative movement: forward = (-sin(yaw), -cos(yaw))
      const yaw = input.cam.yaw;
      const dirX = Math.sin(yaw) * mv.y + Math.cos(yaw) * mv.x;
      const dirZ = Math.cos(yaw) * mv.y - Math.sin(yaw) * mv.x;
      const nx = player.position.x + dirX * speed * dt;
      const nz = player.position.z + dirZ * speed * dt;
      const resolved = resolveCollisions(nx, nz);
      player.position.x = resolved.x;
      player.position.z = resolved.z;
      const targetRot = Math.atan2(dirX, dirZ);
      player.rotation.y += wrapAngle(targetRot - player.rotation.y) * Math.min(1, dt * 14);

      stepTicker += dt;
      if (stepTicker > (run ? 0.24 : 0.34)) {
        stepTicker = 0;
        sfx.step(run);
      }

      saveTicker += dt;
      if (saveTicker > 5) {
        saveTicker = 0;
        persistSave();
      }
    }
  }
  sprinting = moving && input.keys.has("shift");
  updateBursts(dt);
  animateWalk(player, now, moving, input.keys.has("shift") ? 1.4 : 1, dt);

  for (const actor of npcList) {
    animateWalk(actor.group, now + actor.def.position.x * 313, false, 1, dt);
    // gentle marker bob
    if (actor.markerSprite.visible) {
      actor.markerSprite.position.y = 3.72 + Math.sin(now / 320 + actor.def.position.z) * 0.12;
    }
  }

  wanderers.forEach((w) => {
    if (w.wait > 0) {
      w.wait -= dt;
      animateWalk(w.group, now, false, 1, dt);
      return;
    }
    const [tx, tz] = w.path[w.target];
    const dx = tx - w.group.position.x;
    const dz = tz - w.group.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.2) {
      w.target = (w.target + 1) % w.path.length;
      w.wait = 1.2 + Math.abs(Math.sin(now / 900)) * 2;
      return;
    }
    w.group.position.x += (dx / d) * w.speed * dt;
    w.group.position.z += (dz / d) * w.speed * dt;
    const rot = Math.atan2(dx, dz);
    w.group.rotation.y += wrapAngle(rot - w.group.rotation.y) * Math.min(1, dt * 8);
    animateWalk(w.group, now, true, 0.85, dt);
  });

  butterflies.forEach((b) => {
    const u = b.userData;
    const a = now / 1000 * u.speed + u.phase;
    b.position.set(
      u.cx + Math.cos(a) * u.r,
      1.4 + Math.sin(a * 2.3) * 0.5,
      u.cz + Math.sin(a) * u.r
    );
    b.rotation.y = -a + Math.PI / 2;
    const flap = Math.sin(now / 55 + u.phase) * 0.9;
    u.w1.rotation.y = flap;
    u.w2.rotation.y = -flap;
  });

  clouds.forEach((c, i) => {
    c.position.x += dt * (0.4 + (i % 3) * 0.14);
    if (c.position.x > 70) c.position.x = -70;
  });

  if (fountainWater) {
    fountainWater.scale.y = 1 + Math.sin(now / 400) * 0.12;
    fountainWater.material.emissiveIntensity = 0.3 + (Math.sin(now / 500) + 1) * 0.1;
  }

  updateProximity(dt);
  updateCamera(dt);
  updateQuestArrow();
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

// test/debug handle (harmless in production)
window.__selquest = { state, player, npcActors, camera, renderer };

window.__selquestBootOk = true;
applyVolumes();
dom.playerNameInput.value = state.playerName;
dom.playerNameInput.addEventListener("change", () => {
  setPlayerName(dom.playerNameInput.value);
  persistSave();
});
if (state.playerColor) setPlayerColor(state.playerColor);
if (state.playerName) setPlayerName(state.playerName);
dom.startButton.disabled = false;
applyLanguage();
applyMoodsFromState();
refreshMarkers();
updateTracker();
updateStatusHud();
tick();
