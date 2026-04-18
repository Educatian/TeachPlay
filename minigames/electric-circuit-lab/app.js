import * as THREE from "./vendor/three/three.module.js";
import { OrbitControls } from "./vendor/three/OrbitControls.js";

const root = document.getElementById("simulationRoot");
const ui = {
  objectiveTitle: document.getElementById("objectiveTitle"),
  objectiveText: document.getElementById("objectiveText"),
  scoreValue: document.getElementById("scoreValue"),
  efficiencyValue: document.getElementById("efficiencyValue"),
  alignedValue: document.getElementById("alignedValue"),
  currentValue: document.getElementById("currentValue"),
  timeValue: document.getElementById("timeValue"),
  selectedValue: document.getElementById("selectedValue"),
  statusText: document.getElementById("statusText"),
  toast: document.getElementById("toast"),
  learnerName: document.getElementById("learnerName"),
  scormStatusText: document.getElementById("scormStatusText"),
  restartButton: document.getElementById("restartButton")
};

const COMPONENTS = [
  {
    id: "battery",
    name: "Battery",
    color: "#e06162",
    socketIndex: 0,
    start: new THREE.Vector3(-12.5, 1.7, -11.5),
    targetQuarter: 0
  },
  {
    id: "resistor",
    name: "Resistor",
    color: "#d9a95f",
    socketIndex: 1,
    start: new THREE.Vector3(12.5, 1.7, -11.5),
    targetQuarter: 1
  },
  {
    id: "switch",
    name: "Switch",
    color: "#4db7aa",
    socketIndex: 2,
    start: new THREE.Vector3(-12.5, 1.7, 11.5),
    targetQuarter: 0
  },
  {
    id: "lamp",
    name: "Lamp",
    color: "#6474e1",
    socketIndex: 3,
    start: new THREE.Vector3(12.5, 1.7, 11.5),
    targetQuarter: 1
  }
];

const SOCKETS = [
  { index: 0, name: "Battery Slot", color: "#e06162", position: new THREE.Vector3(-8.4, 0.72, 0), connectorQuarter: 0 },
  { index: 1, name: "Resistor Slot", color: "#d9a95f", position: new THREE.Vector3(0, 0.72, -8.4), connectorQuarter: 1 },
  { index: 2, name: "Switch Slot", color: "#4db7aa", position: new THREE.Vector3(8.4, 0.72, 0), connectorQuarter: 0 },
  { index: 3, name: "Lamp Slot", color: "#6474e1", position: new THREE.Vector3(0, 0.72, 8.4), connectorQuarter: 1 }
];

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#eef4fb");
scene.fog = new THREE.Fog("#eef4fb", 24, 48);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 140);
camera.position.set(18, 15, 21);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 14;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 3.5, 0);

scene.add(new THREE.AmbientLight("#f6fbff", 1.4));

const sun = new THREE.DirectionalLight("#fff8db", 1.75);
sun.position.set(14, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
scene.add(sun);

const coolFill = new THREE.PointLight("#7db2ff", 25, 60, 2.1);
coolFill.position.set(-16, 12, -8);
scene.add(coolFill);

const warmFill = new THREE.PointLight("#6affd2", 22, 54, 2.1);
warmFill.position.set(14, 10, 14);
scene.add(warmFill);

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.7);
const dragHit = new THREE.Vector3();
const dragOffset = new THREE.Vector3();
const clock = new THREE.Clock();

const state = {
  score: 0,
  efficiency: 0,
  current: 0,
  timeLeft: 95,
  running: true,
  gameOver: false,
  phase: "placement",
  selectedComponent: null,
  draggedComponent: null,
  pointerDown: false,
  clickMoved: false,
  switchClosed: false,
  probesHit: 0,
  scormConnected: false,
  lastLocation: ""
};

const components = [];
const sockets = [];
const interactiveObjects = [];
const probes = [];
const wireSegments = [];
const decorativeNodes = [];
let bulbGlass;
let bulbCore;
let meterRing;
let switchLever = null;
let switchLeverPivot = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeQuarter(value) {
  return ((value % 4) + 4) % 4;
}

function quarterToRadians(quarter) {
  return normalizeQuarter(quarter) * (Math.PI / 2);
}

function setToast(message, tone = "") {
  ui.toast.textContent = message;
  ui.toast.className = "toast-pill";
  if (tone) {
    ui.toast.classList.add(`toast-${tone}`);
  }
}

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function setScormStatus(text) {
  ui.scormStatusText.textContent = text;
}

function initializeScorm() {
  if (!window.Scorm12) {
    setScormStatus("SCORM driver not found. Running in local preview mode.");
    return;
  }

  const connected = window.Scorm12.init();
  state.scormConnected = connected;

  if (!connected) {
    setScormStatus("No LMS API detected. Running in local preview mode.");
    return;
  }

  const learner = window.Scorm12.get("cmi.core.student_name");
  if (learner) {
    ui.learnerName.textContent = `Learner: ${learner}`;
  } else {
    ui.learnerName.textContent = "Learner: LMS session";
  }

  state.lastLocation = window.Scorm12.get("cmi.core.lesson_location") || "";
  if (state.lastLocation) {
    setScormStatus(`Connected to LMS. Last recorded location: ${state.lastLocation}.`);
  } else {
    setScormStatus("Connected to LMS. Progress will be saved during play.");
  }

  window.Scorm12.set("cmi.core.score.min", 0);
  window.Scorm12.set("cmi.core.score.max", 100);
  window.Scorm12.set("cmi.core.lesson_status", "incomplete");
  window.Scorm12.commit();
}

function persistScorm() {
  if (!state.scormConnected || !window.Scorm12) {
    return;
  }

  const scoreRaw = clamp(Math.round(state.score / 8), 0, 100);
  let lessonStatus = "incomplete";

  if (state.phase === "complete") {
    lessonStatus = scoreRaw >= 80 ? "passed" : "completed";
  } else if (state.phase === "failed") {
    lessonStatus = "failed";
  }

  window.Scorm12.set("cmi.core.lesson_location", state.phase);
  window.Scorm12.set("cmi.core.score.raw", scoreRaw);
  window.Scorm12.set("cmi.core.lesson_status", lessonStatus);
  window.Scorm12.commit();
}

function finishScorm() {
  if (!state.scormConnected || !window.Scorm12) {
    return;
  }
  persistScorm();
  window.Scorm12.finish();
}

function makeMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.44,
    metalness: 0.24
  });
}

function componentBodyMaterial(color) {
  const material = makeMaterial(color);
  material.emissive = new THREE.Color(color);
  material.emissiveIntensity = 0.08;
  return material;
}

function addWire(points, color = "#4f77bc") {
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.18, 12, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.18,
    roughness: 0.2,
    metalness: 0.45
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  wireSegments.push(mesh);
}

function buildBoard() {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(28, 1.4, 28),
    new THREE.MeshStandardMaterial({ color: "#152345", roughness: 0.55, metalness: 0.38 })
  );
  base.position.y = -0.72;
  base.receiveShadow = true;
  scene.add(base);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.32, 22),
    new THREE.MeshStandardMaterial({ color: "#2b4176", roughness: 0.24, metalness: 0.3 })
  );
  top.position.y = 0.2;
  top.receiveShadow = true;
  scene.add(top);

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.2, 0.3, 48),
    new THREE.MeshStandardMaterial({ color: "#e5eefb", roughness: 0.9, metalness: 0.06 })
  );
  plate.position.y = 0.36;
  plate.receiveShadow = true;
  scene.add(plate);

  meterRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.3, 0.26, 18, 48),
    new THREE.MeshStandardMaterial({ color: "#86b6ff", emissive: "#86b6ff", emissiveIntensity: 0.32, roughness: 0.16, metalness: 0.4 })
  );
  meterRing.rotation.x = Math.PI / 2;
  meterRing.position.y = 0.6;
  scene.add(meterRing);

  const centralMeter = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 1.3, 36),
    new THREE.MeshStandardMaterial({ color: "#0c1730", roughness: 0.22, metalness: 0.4 })
  );
  centralMeter.position.y = 1.3;
  centralMeter.castShadow = true;
  centralMeter.receiveShadow = true;
  scene.add(centralMeter);

  bulbGlass = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 28, 28),
    new THREE.MeshStandardMaterial({
      color: "#d8e8ff",
      emissive: "#8bc7ff",
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.82,
      roughness: 0.04,
      metalness: 0.08
    })
  );
  bulbGlass.position.y = 3.2;
  scene.add(bulbGlass);

  bulbCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.74, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#fff9cc", emissive: "#ffd45f", emissiveIntensity: 0.2, roughness: 0.1, metalness: 0.06 })
  );
  bulbCore.position.y = 3.2;
  scene.add(bulbCore);

  const strutMaterial = new THREE.MeshStandardMaterial({ color: "#4166a2", roughness: 0.28, metalness: 0.35 });
  for (let i = 0; i < 12; i += 1) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.8, 0.5), strutMaterial);
    const angle = (i / 12) * Math.PI * 2;
    strut.position.set(Math.cos(angle) * 10.6, 1.45, Math.sin(angle) * 10.6);
    strut.castShadow = true;
    scene.add(strut);
  }

  const wireY = 1.08;
  addWire([new THREE.Vector3(-8.4, wireY, -6.4), new THREE.Vector3(-8.4, wireY, 6.4)], "#6f9ced");
  addWire([new THREE.Vector3(-6.4, wireY, -8.4), new THREE.Vector3(6.4, wireY, -8.4)], "#6f9ced");
  addWire([new THREE.Vector3(8.4, wireY, -6.4), new THREE.Vector3(8.4, wireY, 6.4)], "#6f9ced");
  addWire([new THREE.Vector3(-6.4, wireY, 8.4), new THREE.Vector3(6.4, wireY, 8.4)], "#6f9ced");
  addWire([new THREE.Vector3(-8.4, wireY, -8.4), new THREE.Vector3(-8.4, wireY, -6.4), new THREE.Vector3(-6.4, wireY, -8.4)], "#6f9ced");
  addWire([new THREE.Vector3(8.4, wireY, -8.4), new THREE.Vector3(8.4, wireY, -6.4), new THREE.Vector3(6.4, wireY, -8.4)], "#6f9ced");
  addWire([new THREE.Vector3(8.4, wireY, 8.4), new THREE.Vector3(8.4, wireY, 6.4), new THREE.Vector3(6.4, wireY, 8.4)], "#6f9ced");
  addWire([new THREE.Vector3(-8.4, wireY, 8.4), new THREE.Vector3(-8.4, wireY, 6.4), new THREE.Vector3(-6.4, wireY, 8.4)], "#6f9ced");

  for (let i = 0; i < 18; i += 1) {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 10, 10),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? "#9bc1ff" : "#6af0d6" })
    );
    node.position.set((Math.random() - 0.5) * 34, 4 + Math.random() * 10, (Math.random() - 0.5) * 34);
    node.userData.floatOffset = Math.random() * Math.PI * 2;
    decorativeNodes.push(node);
    scene.add(node);
  }
}

function buildSockets() {
  SOCKETS.forEach((socketConfig) => {
    const group = new THREE.Group();
    group.position.copy(socketConfig.position);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(socketConfig.index % 2 === 0 ? 2.4 : 3.1, 0.42, socketConfig.index % 2 === 0 ? 3.1 : 2.4),
      new THREE.MeshStandardMaterial({ color: "#edf3fb", roughness: 0.84, metalness: 0.08 })
    );
    base.receiveShadow = true;
    group.add(base);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.16, 16, 36),
      new THREE.MeshStandardMaterial({
        color: socketConfig.color,
        emissive: socketConfig.color,
        emissiveIntensity: 0.4,
        roughness: 0.16,
        metalness: 0.42
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.26;
    group.add(ring);

    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(socketConfig.index % 2 === 0 ? 0.3 : 1.4, 0.15, socketConfig.index % 2 === 0 ? 1.4 : 0.3),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.12, metalness: 0.08 })
    );
    marker.position.y = 0.38;
    group.add(marker);

    sockets.push({
      ...socketConfig,
      group,
      ring,
      pulseOffset: socketConfig.index * 0.7
    });
    scene.add(group);
  });
}

function buildBatteryComponent(config) {
  const group = new THREE.Group();
  const bodyMaterial = componentBodyMaterial(config.color);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 3.2), bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const positive = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.32, 16),
    new THREE.MeshStandardMaterial({ color: "#fdf6ed", roughness: 0.12, metalness: 0.18 })
  );
  positive.position.set(0, 0.8, 1.15);
  group.add(positive);

  const negative = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: "#dce1ea", roughness: 0.18, metalness: 0.2 })
  );
  negative.position.set(0, 0.74, -1.12);
  group.add(negative);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.16, 1.4),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.08, metalness: 0.06 })
  );
  strip.position.set(0, 0.72, 0);
  group.add(strip);

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.02, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.32, transparent: true, opacity: 0.68 })
  );
  glow.position.y = -0.66;
  group.add(glow);

  return { group, bodyMaterial, glow };
}

function buildResistorComponent(config) {
  const group = new THREE.Group();
  const bodyMaterial = componentBodyMaterial(config.color);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 3.1, 20), bodyMaterial);
  tube.rotation.z = Math.PI / 2;
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);

  const bandColors = ["#fff5d7", "#8f6138", "#ffffff"];
  bandColors.forEach((color, index) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.22, 18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.24, metalness: 0.1 })
    );
    band.rotation.z = Math.PI / 2;
    band.position.x = -0.72 + index * 0.72;
    group.add(band);
  });

  const leadMaterial = new THREE.MeshStandardMaterial({ color: "#eef4ff", roughness: 0.18, metalness: 0.24 });
  const leftLead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12), leadMaterial);
  leftLead.rotation.z = Math.PI / 2;
  leftLead.position.x = -2.15;
  group.add(leftLead);

  const rightLead = leftLead.clone();
  rightLead.position.x = 2.15;
  group.add(rightLead);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.14, 0.36),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.08, metalness: 0.06 })
  );
  strip.position.y = 0.8;
  group.add(strip);

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.02, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.32, transparent: true, opacity: 0.68 })
  );
  glow.position.y = -0.66;
  group.add(glow);

  return { group, bodyMaterial, glow };
}

function buildSwitchComponent(config) {
  const group = new THREE.Group();
  const bodyMaterial = componentBodyMaterial(config.color);

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 3.0), bodyMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const padMaterial = new THREE.MeshStandardMaterial({ color: "#eef7f5", roughness: 0.16, metalness: 0.18 });
  const padA = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 14), padMaterial);
  padA.rotation.x = Math.PI / 2;
  padA.position.set(0, 0.42, -0.92);
  group.add(padA);

  const padB = padA.clone();
  padB.position.z = 0.92;
  group.add(padB);

  const leverPivot = new THREE.Group();
  leverPivot.position.set(0, 0.48, -0.92);
  group.add(leverPivot);

  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 2.05),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.08, metalness: 0.06 })
  );
  lever.position.z = 1;
  lever.castShadow = true;
  leverPivot.add(lever);

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.02, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.32, transparent: true, opacity: 0.68 })
  );
  glow.position.y = -0.42;
  group.add(glow);

  switchLever = lever;
  switchLeverPivot = leverPivot;

  return { group, bodyMaterial, glow };
}

function buildLampComponent(config) {
  const group = new THREE.Group();
  const bodyMaterial = componentBodyMaterial(config.color);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.72, 20), bodyMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 1.05, 16),
    new THREE.MeshStandardMaterial({ color: "#eff4ff", roughness: 0.16, metalness: 0.22 })
  );
  neck.position.y = 0.82;
  group.add(neck);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 20, 20),
    new THREE.MeshStandardMaterial({ color: "#dce8ff", emissive: "#91b8ff", emissiveIntensity: 0.24, transparent: true, opacity: 0.82, roughness: 0.04, metalness: 0.06 })
  );
  bulb.position.y = 1.72;
  group.add(bulb);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.14, 0.36),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.08, metalness: 0.06 })
  );
  strip.position.y = 0.36;
  group.add(strip);

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.32, transparent: true, opacity: 0.68 })
  );
  glow.position.y = -0.42;
  group.add(glow);

  return { group, bodyMaterial, glow, bulb };
}

function buildComponents() {
  COMPONENTS.forEach((config) => {
    let built;
    if (config.id === "battery") {
      built = buildBatteryComponent(config);
    } else if (config.id === "resistor") {
      built = buildResistorComponent(config);
    } else if (config.id === "switch") {
      built = buildSwitchComponent(config);
    } else {
      built = buildLampComponent(config);
    }

    const group = built.group;
    group.position.copy(config.start);
    group.rotation.y = 0;
    group.traverse((child) => {
      child.userData.componentId = config.id;
    });

    const component = {
      ...config,
      group,
      bodyMaterial: built.bodyMaterial,
      glow: built.glow,
      bulb: built.bulb || null,
      basePosition: config.start.clone(),
      currentQuarter: 0,
      snapped: false,
      aligned: false,
      placementAwarded: false,
      alignmentAwarded: false
    };

    components.push(component);
    interactiveObjects.push(group);
    scene.add(group);
  });
}

function buildProbes() {
  const probePositions = [
    new THREE.Vector3(-8.4, 1.5, -8.4),
    new THREE.Vector3(8.4, 1.5, -8.4),
    new THREE.Vector3(8.4, 1.5, 8.4)
  ];

  probePositions.forEach((position, index) => {
    const group = new THREE.Group();
    group.position.copy(position);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.3, 12),
      new THREE.MeshStandardMaterial({ color: "#edf3ff", roughness: 0.16, metalness: 0.22 })
    );
    stem.position.y = 0.65;
    group.add(stem);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 18, 18),
      new THREE.MeshStandardMaterial({ color: "#dff5ff", emissive: "#59cbff", emissiveIntensity: 0.2, roughness: 0.08, metalness: 0.18 })
    );
    head.position.y = 1.38;
    group.add(head);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.05, 12, 28),
      new THREE.MeshBasicMaterial({ color: "#7bddff", transparent: true, opacity: 0.28 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.38;
    group.add(halo);

    const probe = {
      index,
      group,
      head,
      halo,
      activated: false,
      active: false,
      pulseOffset: index * 0.8
    };

    head.userData.probe = probe;
    probes.push(probe);
    interactiveObjects.push(head);
    scene.add(group);
  });
}

function buildScene() {
  buildBoard();
  buildSockets();
  buildComponents();
  buildProbes();
}

function resize() {
  const width = root.clientWidth || 960;
  const height = root.clientHeight || 880;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function selectComponent(component) {
  state.selectedComponent = component;
  components.forEach((item) => {
    item.bodyMaterial.emissiveIntensity = item === component ? 0.34 : 0.08;
    item.glow.material.opacity = item === component ? 1 : 0.68;
  });
  syncHud();
}

function clearSelection() {
  state.selectedComponent = null;
  components.forEach((item) => {
    item.bodyMaterial.emissiveIntensity = 0.08;
    item.glow.material.opacity = 0.68;
  });
  syncHud();
}

function updateEfficiency() {
  const placedCount = components.filter((component) => component.snapped).length;
  const alignedCount = components.filter((component) => component.aligned).length;
  const probeFactor = state.probesHit * 10;
  state.efficiency = clamp(placedCount * 12 + alignedCount * 18 + Math.round(state.current * 0.2) + probeFactor, 0, 100);
}

function updatePhase() {
  if (state.gameOver) {
    return;
  }

  const placedCount = components.filter((component) => component.snapped).length;
  const alignedCount = components.filter((component) => component.aligned).length;

  if (state.current >= 100) {
    state.phase = "complete";
    return;
  }

  if (state.switchClosed) {
    state.phase = "diagnostic";
  } else if (alignedCount === components.length) {
    state.phase = "switch";
  } else if (placedCount === components.length) {
    state.phase = "alignment";
  } else {
    state.phase = "placement";
  }
}

function syncHud() {
  const alignedCount = components.filter((component) => component.aligned).length;
  const placedCount = components.filter((component) => component.snapped).length;

  ui.scoreValue.textContent = String(state.score);
  ui.efficiencyValue.textContent = `${state.efficiency}%`;
  ui.alignedValue.textContent = `${alignedCount} / 4`;
  ui.currentValue.textContent = `${state.current} / 100`;
  ui.timeValue.textContent = `${Math.max(0, Math.ceil(state.timeLeft))}s`;
  ui.selectedValue.textContent = state.selectedComponent ? state.selectedComponent.name : "None";

  if (state.phase === "placement") {
    ui.objectiveTitle.textContent = "Place the four circuit components.";
    ui.objectiveText.textContent =
      "Match each component to its colored slot. When it snaps in, rotate it so the connector strip follows the wire direction.";
    ui.statusText.textContent = `${placedCount} component${placedCount === 1 ? "" : "s"} placed. Drag a part or orbit empty space.`;
  } else if (state.phase === "alignment") {
    ui.objectiveTitle.textContent = "Align every component with the wire path.";
    ui.objectiveText.textContent =
      "Use the mouse wheel or Q and E to rotate the selected component until the white connector strip lines up with the board.";
    ui.statusText.textContent = `${alignedCount} component${alignedCount === 1 ? "" : "s"} aligned. Battery and switch should run vertically; resistor and lamp horizontally.`;
  } else if (state.phase === "switch") {
    ui.objectiveTitle.textContent = "Click the switch to close the circuit.";
    ui.objectiveText.textContent =
      "Every part is aligned. Click the teal switch on the right side of the board to close the loop and energize the system.";
    ui.statusText.textContent = "The circuit is ready to close. Click the switch component.";
  } else if (state.phase === "diagnostic") {
    ui.objectiveTitle.textContent = "Activate the diagnostic probes.";
    ui.objectiveText.textContent =
      "The loop is closed. Click the glowing corner probes to confirm current around the circuit.";
    ui.statusText.textContent = `${state.probesHit} of 3 probes activated. The lamp grows brighter as current increases.`;
  } else if (state.phase === "complete") {
    ui.objectiveTitle.textContent = "Circuit completed successfully.";
    ui.objectiveText.textContent =
      "You placed, aligned, closed, and verified the circuit. Restart the lab to run another attempt.";
    ui.statusText.textContent = "The lamp is fully energized and the circuit meter is stable.";
  } else if (state.phase === "failed") {
    ui.objectiveTitle.textContent = "Lab attempt timed out.";
    ui.objectiveText.textContent =
      "The timer expired before the circuit reached full current. Restart the lab and try a cleaner sequence.";
    ui.statusText.textContent = "Use restart to run another attempt.";
  }
}

function setProbeActiveState() {
  const active = state.phase === "diagnostic";
  probes.forEach((probe) => {
    probe.active = active && !probe.activated;
  });
}

function refreshComponentAlignment(component, silent = false) {
  const socket = SOCKETS[component.socketIndex];
  const alignedNow = component.snapped && component.currentQuarter === socket.connectorQuarter;

  if (alignedNow && !component.alignmentAwarded) {
    component.alignmentAwarded = true;
    state.score += 55;
    if (!silent) {
      setToast(`${component.name} aligned with the wire path.`, "success");
    }
  }

  component.aligned = alignedNow;
  component.glow.material.color.set(alignedNow ? "#f7fff6" : component.color);
  updateEfficiency();
  updatePhase();
  setProbeActiveState();
  syncHud();
  persistScorm();
}

function rotateSelected(step) {
  if (!state.running || !state.selectedComponent || state.phase === "switch" || state.phase === "diagnostic" || state.phase === "complete") {
    return;
  }
  const component = state.selectedComponent;
  component.currentQuarter = normalizeQuarter(component.currentQuarter + step);
  component.group.rotation.y = quarterToRadians(component.currentQuarter);
  refreshComponentAlignment(component);
  setToast(`${component.name} rotated.`, "warning");
}

function nearestSocket(component) {
  let best = null;
  let bestDistance = Infinity;
  sockets.forEach((socket) => {
    const distance = socket.position.distanceTo(component.group.position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = socket;
    }
  });
  return { socket: best, distance: bestDistance };
}

function trySnapComponent(component) {
  const { socket, distance } = nearestSocket(component);
  if (!socket) return;

  if (distance < 2.3 && socket.index === component.socketIndex) {
    component.group.position.set(socket.position.x, component.group.position.y, socket.position.z);
    component.snapped = true;
    if (!component.placementAwarded) {
      component.placementAwarded = true;
      state.score += 110;
      setToast(`${component.name} snapped into the ${socket.name}. Rotate it to match the wire direction.`, "success");
    }
    refreshComponentAlignment(component, true);
    return;
  }

  if (distance < 2.3 && socket.index !== component.socketIndex) {
    state.score = Math.max(0, state.score - 20);
    component.group.position.copy(component.basePosition);
    component.group.rotation.y = 0;
    component.currentQuarter = 0;
    component.snapped = false;
    component.aligned = false;
    setToast(`${component.name} does not belong in that slot. Match the component and socket colors.`, "danger");
    updateEfficiency();
    updatePhase();
    syncHud();
    persistScorm();
    return;
  }

  component.snapped = false;
  component.aligned = false;
  updateEfficiency();
  updatePhase();
  syncHud();
  persistScorm();
}

function resolveComponentHit(intersection) {
  let current = intersection.object;
  while (current && !current.userData.componentId) {
    current = current.parent;
  }
  if (!current) return null;
  return components.find((component) => component.id === current.userData.componentId) || null;
}

function closeSwitch() {
  const switchComponent = components.find((component) => component.id === "switch");
  if (!switchComponent || !switchComponent.aligned || !switchComponent.snapped) {
    setToast("The switch can only close after every component is placed and aligned.", "warning");
    return;
  }
  if (state.switchClosed) {
    setToast("The switch is already closed. Activate the probes next.", "warning");
    return;
  }

  state.switchClosed = true;
  state.score += 90;
  setToast("Circuit closed. Click the glowing probes to verify current flow.", "success");
  updateEfficiency();
  updatePhase();
  setProbeActiveState();
  syncHud();
  persistScorm();
}

function activateProbe(probe) {
  if (!probe.active || state.phase !== "diagnostic" || !state.running) {
    setToast("Probes activate only after the circuit is closed.", "warning");
    return;
  }

  if (probe.activated) {
    setToast("That probe has already been checked.", "warning");
    return;
  }

  probe.activated = true;
  probe.active = false;
  state.probesHit += 1;
  state.current = clamp(state.current + 34, 0, 100);
  state.score += 45;

  if (state.probesHit >= 3) {
    state.current = 100;
    state.score += 140;
    state.phase = "complete";
    state.running = false;
    state.gameOver = true;
    setToast("Current verified. The circuit is complete and the lamp is fully powered.", "success");
  } else {
    setToast("Probe confirmed current flow. Activate the remaining probes.", "success");
  }

  updateEfficiency();
  updatePhase();
  setProbeActiveState();
  syncHud();
  persistScorm();
}

function resetLab() {
  state.score = 0;
  state.efficiency = 0;
  state.current = 0;
  state.timeLeft = 95;
  state.running = true;
  state.gameOver = false;
  state.phase = "placement";
  state.selectedComponent = null;
  state.draggedComponent = null;
  state.pointerDown = false;
  state.clickMoved = false;
  state.switchClosed = false;
  state.probesHit = 0;

  components.forEach((component) => {
    component.group.position.copy(component.basePosition);
    component.group.rotation.y = 0;
    component.currentQuarter = 0;
    component.snapped = false;
    component.aligned = false;
    component.placementAwarded = false;
    component.alignmentAwarded = false;
    component.bodyMaterial.emissiveIntensity = 0.08;
    component.glow.material.opacity = 0.68;
    component.glow.material.color.set(component.color);
    if (component.bulb) {
      component.bulb.material.emissiveIntensity = 0.24;
    }
  });

  probes.forEach((probe) => {
    probe.activated = false;
    probe.active = false;
  });

  if (switchLeverPivot) {
    switchLeverPivot.rotation.x = 0;
  }

  clearSelection();
  setToast("The circuit is open. Place the components first.");
  updateEfficiency();
  updatePhase();
  setProbeActiveState();
  syncHud();
  persistScorm();
}

function onPointerDown(event) {
  updatePointer(event);
  state.pointerDown = true;
  state.clickMoved = false;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveObjects, true);
  if (!intersections.length) {
    clearSelection();
    renderer.domElement.style.cursor = "grab";
    return;
  }

  const component = resolveComponentHit(intersections[0]);
  if (component && state.phase !== "diagnostic" && state.phase !== "complete") {
    selectComponent(component);
    state.draggedComponent = component;
    controls.enabled = false;
    raycaster.ray.intersectPlane(dragPlane, dragHit);
    dragOffset.copy(component.group.position).sub(dragHit);
    renderer.domElement.style.cursor = "grabbing";
    return;
  }

  if (intersections[0].object.userData.probe) {
    renderer.domElement.style.cursor = "pointer";
  }
}

function onPointerMove(event) {
  updatePointer(event);
  if (state.pointerDown) {
    state.clickMoved = true;
  }

  if (state.draggedComponent) {
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, dragHit)) {
      state.draggedComponent.group.position.x = clamp(dragHit.x + dragOffset.x, -13.5, 13.5);
      state.draggedComponent.group.position.z = clamp(dragHit.z + dragOffset.z, -13.5, 13.5);
      state.draggedComponent.snapped = false;
      state.draggedComponent.aligned = false;
      syncHud();
    }
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveObjects, true);
  if (!intersections.length) {
    renderer.domElement.style.cursor = "grab";
    return;
  }

  const component = resolveComponentHit(intersections[0]);
  const probe = intersections[0].object.userData.probe;
  if (component || probe) {
    renderer.domElement.style.cursor = "pointer";
  } else {
    renderer.domElement.style.cursor = "grab";
  }
}

function onPointerUp(event) {
  updatePointer(event);
  state.pointerDown = false;
  controls.enabled = true;

  if (state.draggedComponent) {
    const releasedComponent = state.draggedComponent;
    const clickOnly = !state.clickMoved;
    trySnapComponent(releasedComponent);
    state.draggedComponent = null;
    if (clickOnly && releasedComponent.id === "switch" && state.phase === "switch") {
      closeSwitch();
    }
    renderer.domElement.style.cursor = "grab";
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveObjects, true);
  if (!intersections.length || state.clickMoved) {
    renderer.domElement.style.cursor = "grab";
    return;
  }

  const component = resolveComponentHit(intersections[0]);
  if (component) {
    selectComponent(component);
    if (component.id === "switch" && state.phase === "switch") {
      closeSwitch();
    } else {
      setToast(`${component.name} selected. Rotate it with the mouse wheel or Q and E.`, "warning");
    }
    renderer.domElement.style.cursor = "pointer";
    return;
  }

  const probe = intersections[0].object.userData.probe;
  if (probe) {
    activateProbe(probe);
    renderer.domElement.style.cursor = "pointer";
    return;
  }

  renderer.domElement.style.cursor = "grab";
}

function onWheel(event) {
  if (!state.selectedComponent || !state.running) {
    return;
  }
  event.preventDefault();
  rotateSelected(event.deltaY > 0 ? 1 : -1);
}

function onKeyDown(event) {
  if (!state.running || !state.selectedComponent) {
    return;
  }
  if (event.key === "q" || event.key === "Q") {
    rotateSelected(-1);
  } else if (event.key === "e" || event.key === "E") {
    rotateSelected(1);
  }
}

function animate(delta, elapsed) {
  components.forEach((component, index) => {
    if (!component.snapped && component !== state.draggedComponent) {
      component.group.position.y = 1.7 + Math.sin(elapsed * 2.3 + index * 0.7) * 0.14;
    } else {
      component.group.position.y += (1.7 - component.group.position.y) * 0.14;
    }

    if (component.id === "lamp" && component.bulb) {
      const intensity = state.current > 0 ? 0.24 + state.current / 42 : 0.24;
      component.bulb.material.emissiveIntensity = intensity;
    }
  });

  sockets.forEach((socket) => {
    const matching = components.find((component) => component.socketIndex === socket.index);
    socket.ring.material.emissiveIntensity = matching && matching.aligned
      ? 0.96
      : 0.4 + Math.sin(elapsed * 2.2 + socket.pulseOffset) * 0.08;
  });

  wireSegments.forEach((wire, index) => {
    wire.material.emissiveIntensity = state.switchClosed
      ? 0.5 + Math.sin(elapsed * 4.5 + index * 0.3) * 0.12
      : 0.18;
  });

  probes.forEach((probe, index) => {
    const pulse = 1 + Math.sin(elapsed * 6 + probe.pulseOffset) * 0.12;
    probe.head.scale.setScalar(probe.active ? pulse : probe.activated ? 0.88 : 0.74);
    probe.head.material.emissiveIntensity = probe.activated ? 0.3 : probe.active ? 1.7 : 0.18;
    probe.halo.material.opacity = probe.activated ? 0.1 : probe.active ? 0.78 : 0.18;
  });

  decorativeNodes.forEach((node) => {
    node.position.y += Math.sin(elapsed * 1.2 + node.userData.floatOffset) * 0.002;
  });

  if (switchLeverPivot) {
    const targetX = state.switchClosed ? -0.8 : 0;
    switchLeverPivot.rotation.x += (targetX - switchLeverPivot.rotation.x) * 0.12;
  }

  meterRing.rotation.z += delta * 0.25;
  bulbGlass.scale.setScalar(1 + (state.current / 100) * 0.12 + Math.sin(elapsed * 5) * 0.01);
  bulbCore.scale.setScalar(1 + (state.current / 100) * 0.2);
  bulbCore.material.emissiveIntensity = 0.2 + state.current / 55;
}

function tick() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  if (state.running && !state.gameOver) {
    state.timeLeft -= delta;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.running = false;
      state.gameOver = true;
      state.phase = "failed";
      setToast("Time expired before the circuit reached full current.", "danger");
      persistScorm();
    }
  }

  animate(delta, elapsed);
  controls.update();
  syncHud();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

buildScene();
resize();
initializeScorm();
resetLab();
renderer.domElement.style.cursor = "grab";

window.addEventListener("resize", resize);
renderer.domElement.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("keydown", onKeyDown);
ui.restartButton.addEventListener("click", resetLab);
window.addEventListener("beforeunload", finishScorm);

tick();
