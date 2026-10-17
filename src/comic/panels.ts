// The comic's panels as 3D dioramas. Each returns a scene + camera; the noir pipeline turns it into ink.
// Anything passed through `hero()` stays in color; the rest of the world is black and white.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BRAINROT as CARD } from '../game/cards';
import type { ToyRecipe } from '../game/types';
import { buildDarkBerry, buildStrawbaby, buildToy } from '../toys/build';
import { G, m, mat } from '../toys/kit';
import { markHero as hero, type NoirOptions } from '../noir/pipeline';
import {
  buildBuilding, buildCoolingTower, buildDataCenter, buildHangingLamp, buildHondaFit, buildPalanquin, buildPhone, buildRain, buildRoad,
  buildScreen, buildSteam, buildStreetLamp, buildTable, textTexture,
} from '../noir/props';

export interface PanelScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  noir?: NoirOptions;
}
export type PanelBuilder = (aspect: number, env: THREE.Texture) => PanelScene;

const PI = Math.PI;
type V3 = [number, number, number];

export const SABRINA: ToyRecipe = {
  head: 'kid', body: 'bean', c1: '#f3c89b', c2: '#4a2c1d', c3: '#ffcc1f', arms: 'nubs', legs: 'boots', eyes: 'big', acc: ['pigtails', 'blush'],
};
const HUMAN = (i: number): ToyRecipe => ({
  head: 'kid', body: 'bean', c1: ['#e0ac69', '#c68642', '#f1c27d', '#8d5524'][i % 4], c2: ['#2b2b2b', '#5a3825', '#1c1c1c', '#7a5c3a'][i % 4], c3: '#77777c', arms: 'nubs', legs: 'nubs', eyes: i % 3 === 0 ? 'sleepy' : 'dot',
});
export const GLITTER_BUNBUN: ToyRecipe = { head: 'bunny', body: 'bean', c1: '#ff7ad9', c2: '#fff0fb', c3: '#b06cff', eyes: 'big', arms: 'nubs', legs: 'nubs', acc: ['blush'] };

function stage(bg: string, env: THREE.Texture, envIntensity = 0.35) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.environment = env;
  scene.environmentIntensity = envIntensity;
  return scene;
}
function cam(aspect: number, pos: V3, look: V3, fov = 35) {
  const c = new THREE.PerspectiveCamera(fov, aspect, 0.1, 120);
  c.position.set(...pos);
  c.lookAt(...look);
  return c;
}
function key(scene: THREE.Scene, pos: V3, intensity = 2.6, color = '#ffffff', target: V3 = [0, 0, 0]) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  l.target.position.set(...target);
  scene.add(l, l.target);
  return l;
}
function spot(scene: THREE.Scene, pos: V3, target: V3, intensity = 60, angle = 0.5, color = '#ffffff') {
  const l = new THREE.SpotLight(color, intensity, 0, angle, 0.5, 1.6);
  l.position.set(...pos);
  l.target.position.set(...target);
  scene.add(l, l.target);
  return l;
}
function ambient(scene: THREE.Scene, i = 0.25) {
  scene.add(new THREE.AmbientLight('#ffffff', i));
}
function ground(scene: THREE.Scene, color = '#4a4a4e', size = 80, rough = 0.85) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color, roughness: rough }));
  g.rotation.x = -PI / 2;
  scene.add(g);
  return g;
}
function place<T extends THREE.Object3D>(o: T, pos: V3, rotY = 0, scale = 1): T {
  o.position.set(...pos);
  o.rotation.y = rotY;
  o.scale.setScalar(scale);
  return o;
}

/** World position of a toy's head (for close-ups). */
function headOf(toy: THREE.Object3D, scene: THREE.Scene) {
  scene.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  (toy.userData.head as THREE.Object3D).getWorldPosition(v);
  return v;
}
function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

let ENV: THREE.Texture | null = null;
export function envFor(renderer: THREE.WebGLRenderer) {
  if (!ENV) ENV = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  return ENV;
}

// ───────────────────────── page 1 ─────────────────────────
export const route9: PanelBuilder = (aspect, env) => {
  const s = stage('#7d7d84', env);
  ambient(s, 0.35);
  key(s, [-6, 9, 6], 2.4);
  ground(s, '#5d5d62');
  s.add(buildRoad(60, 7));
  s.add(hero(place(buildHondaFit(), [0, 0, 1.2], 0.12)));
  for (let x = -24; x < 24; x += 8) s.add(place(buildStreetLamp(5), [x, 0, -4.3], PI));
  for (let i = 0; i < 9; i++) s.add(place(buildBuilding(3 + (i % 3), 3 + ((i * 7) % 5), 3, '#5a5a60', true, i + 2), [-22 + i * 5.5, 0, -11 - (i % 2) * 2]));
  const camPos: V3 = [-6.0, 1.3, 5.6];
  s.add(buildRain(420, [26, 10, 14], [0, 4, 0], 7, { at: camPos, r: 3 }));
  return { scene: s, camera: cam(aspect, camPos, [0.3, 1.0, 0.8], 32) };
};

export const backseat: PanelBuilder = (aspect, env) => {
  const s = stage('#3a3a40', env);
  ambient(s, 0.3);
  key(s, [3, 5, 4], 2.2);
  spot(s, [-2, 4, 3], [0, 1, 0], 40, 0.6, '#fff1d6');
  // back seat
  s.add(m(G.rbox(0.25), mat('#55555a', 'fabric'), [0, 0.45, -0.25], [3.4, 0.9, 1.2]));
  s.add(m(G.rbox(0.25), mat('#55555a', 'fabric'), [0, 1.35, -0.85], [3.4, 1.6, 0.4]));
  // window behind, rain outside
  s.add(m(G.box(), mat('#2b2b30', 'matte'), [0, 2.6, -1.1], [4.2, 0.2, 0.2]));
  s.add(m(G.box(), new THREE.MeshPhysicalMaterial({ color: '#9aa0a8', roughness: 0.1, transparent: true, opacity: 0.35 }), [0, 2.2, -1.1], [3.8, 0.8, 0.02]));
  const sab = hero(place(buildToy(SABRINA), [-0.35, 0.9, 0.1], 0.35, 1.25));
  s.add(sab);
  const sb = hero(place(buildStrawbaby({ coat: false }), [0.45, 0.95, 0.35], -0.4, 0.95));
  s.add(sb);
  // a hug: one of Sabrina's arms across
  s.add(hero(m(G.cap(1), mat('#ffcc1f'), [0.15, 1.45, 0.45], [0.09, 0.22, 0.09], [0, 0, PI / 2 - 0.2])));
  s.add(buildRain(80, [4, 1.2, 0.3], [0, 2.2, -1.3], 3));
  return { scene: s, camera: cam(aspect, [0.1, 1.6, 4.2], [0.05, 1.35, 0], 34) };
};

export const phoneGlow: PanelBuilder = (aspect, env) => {
  // Sabrina's point of view: the phone fills her world; Strawbaby sits at the edge of it
  const s = stage('#1a1a1e', env, 0.2);
  ambient(s, 0.25);
  key(s, [-2, 4, 3], 0.9);
  const tex = textTexture(
    [
      { text: 'NEW DROP', size: 70, color: '#ffffff' },
      { text: '✨ GLITTER ✨', size: 58, color: '#ffe066' },
      { text: 'BUNBUN', size: 92, color: '#ff7ad9' },
      { text: 'everyone has one', size: 34, color: '#ffffff' },
    ],
    360, 680, '#2a0f3a',
  );
  s.add(m(G.rbox(0.25), mat('#3a3a40', 'fabric'), [0, 0.3, 1], [4, 0.6, 2.4]));
  const phone = hero(buildPhone(tex));
  phone.position.set(0.25, 1.45, 0.75);
  phone.rotation.set(0.35, 0.08, -0.06);
  phone.scale.setScalar(1.35);
  s.add(phone);
  // little hands holding it
  for (const x of [0.03, 0.47]) s.add(m(G.sph(), mat('#f3c89b', 'matte'), [x, 1.13, 0.86], [0.1, 0.09, 0.08]));
  const glow = new THREE.PointLight('#ff7ad9', 6, 3, 1.5);
  glow.position.set(0.15, 1.6, 1.2);
  s.add(glow);
  s.add(hero(place(buildStrawbaby({ coat: false }), [-0.55, 0.6, 0.3], 0.35, 0.7)));
  return { scene: s, camera: cam(aspect, [0.15, 2.3, 2.7], [-0.05, 1.1, 0.5], 44), noir: { contrast: 1.3 } };
};

// ───────────────────────── page 2 ─────────────────────────
export const toss: PanelBuilder = (aspect, env) => {
  const s = stage('#8a8a90', env);
  ambient(s, 0.35);
  key(s, [-5, 8, 7], 2.4);
  ground(s, '#5d5d62');
  s.add(place(buildRoad(70, 7), [0, 0, 0]));
  s.add(hero(place(buildHondaFit(), [-1.6, 0, 1.0], 0)));
  // Strawbaby tumbling out of the rear window
  const sb = hero(buildStrawbaby({ coat: false }));
  sb.position.set(1.7, 1.7, 3.0);
  sb.rotation.set(0.6, 0.8, -1.2);
  sb.scale.setScalar(1.05);
  s.add(sb);
  // motion lines
  for (let i = 0; i < 9; i++) s.add(m(G.box(), new THREE.MeshBasicMaterial({ color: '#f4f1ea' }), [3.0 + i * 0.22, 1.3 + (i % 5) * 0.28, 2.9 + (i % 3) * 0.15], [1.5, 0.025, 0.025]));
  for (let x = -20; x < 24; x += 8) s.add(place(buildStreetLamp(5), [x, 0, -4.3], PI));
  const camPos: V3 = [3.8, 2.1, 9.4];
  s.add(buildRain(380, [26, 10, 14], [0, 4, 0], 11, { at: camPos, r: 3.5 }));
  return { scene: s, camera: cam(aspect, camPos, [0.4, 1.3, 1.2], 34) };
};

export const ditch: PanelBuilder = (aspect, env) => {
  const s = stage('#5e5e64', env);
  ambient(s, 0.3);
  key(s, [4, 7, 3], 2);
  const mud = mat('#3e3a36', 'matte');
  for (let i = 0; i < 14; i++) s.add(m(G.sph(), mud, [-7 + i * 1.1, -0.35, 0.6 + Math.sin(i) * 0.4], [1.2, 0.5, 1.4]));
  ground(s, '#4a4744');
  s.add(place(buildRoad(60, 6), [0, 0.05, -4.5]));
  for (const [x, z, r] of [[0.8, 1.6, 1.1], [-2.2, 0.9, 0.7], [2.8, 0.6, 0.8]] as const) {
    const pd = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.05, metalness: 0.6 }));
    pd.rotation.x = -PI / 2;
    pd.position.set(x, 0.02, z);
    s.add(pd);
  }
  const sb = hero(buildStrawbaby({ coat: false }));
  sb.position.set(0.2, 0.2, 1.1);
  sb.rotation.set(-1.35, 0.3, 0.2);
  s.add(sb);
  for (const z of [-0.35, 0.35]) s.add(hero(m(G.sph(), mat('#ff1f3d', 'glow'), [-16, 0.9, -4.3 + z], 0.14)));
  s.add(m(G.rbox(0.2), mat('#333', 'matte'), [-16.1, 0.8, -4.3], [0.4, 0.9, 1.4]));
  const camPos: V3 = [2.4, 0.9, 4.2];
  s.add(buildRain(380, [16, 8, 10], [-1, 4, -2], 13, { at: camPos, r: 2.6 }));
  return { scene: s, camera: cam(aspect, camPos, [-1.5, 0.4, 0.2], 36) };
};

// ───────────────────────── page 3 ─────────────────────────
export const buried: PanelBuilder = (aspect, env) => {
  const s = stage('#1a1a1c', env, 0.25);
  ambient(s, 0.55);
  key(s, [2, 6, 8], 1.8);
  const layers: [number, number, string][] = [
    [0.2, 0.4, '#c9c9c9'],
    [-0.2, 0.4, '#9a9a9a'],
    [-1.3, 1.8, '#77716b'],
    [-3.0, 1.6, '#5d5853'],
    [-4.6, 1.6, '#48443f'],
  ];
  for (const [y, h, c] of layers) s.add(m(G.box(), mat(c, 'matte'), [0, y - h / 2 + 0.2, 0], [4, h, 2]));
  const r = rnd(17);
  for (let i = 0; i < 34; i++) s.add(m(G.ico(), mat(i % 2 ? '#8a8a8a' : '#5e5e5e', 'matte'), [(r() - 0.5) * 3.6, -0.4 - r() * 5.6, 1.0], 0.06 + r() * 0.14));
  for (let x = -1.6; x <= 1.6; x += 0.4) s.add(m(G.cyl(), mat('#555', 'metal'), [x, 0.5, 0.9], [0.025, 1.0, 0.025]));
  s.add(m(G.box(), mat('#a5a5ab', 'matte'), [0, 2.6, 0], [4, 4.4, 2]));
  for (let y = 1.2; y < 4.8; y += 0.6) s.add(m(G.box(), mat('#6c6c72', 'matte'), [0, y, 1.01], [3.6, 0.06, 0.02]));
  const sb = hero(buildStrawbaby({ coat: false }));
  sb.position.set(0.2, -3.7, 1.0);
  sb.rotation.set(0.2, 0.3, 1.2);
  sb.scale.setScalar(0.75);
  s.add(sb);
  return { scene: s, camera: cam(aspect, [0, -0.6, 13.5], [0, -0.6, 0], 38), noir: { dotSize: 4 } };
};

export const dataCenter: PanelBuilder = (aspect, env) => {
  const s = stage('#1d1d22', env, 0.35);
  ambient(s, 0.5);
  key(s, [-6, 10, 8], 2.2);
  ground(s, '#46464b');
  const dc = buildDataCenter();
  dc.position.set(1.5, 0, -1);
  dc.traverse((o) => {
    const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (mm?.emissive && mm.emissive.getHexString() === 'ff2d55') o.layers.enable(1);
  });
  s.add(dc);
  s.add(place(buildCoolingTower(1.8, 7), [-2.6, 0, -6]));
  s.add(place(buildSteam(6, 9), [-2.6, 7.4, -6], 0, 0.7));
  s.add(place(buildCoolingTower(1.5, 6), [3.6, 0, -9]));
  s.add(place(buildSteam(5, 3), [3.6, 6.4, -9], 0, 0.6));
  spot(s, [-8, 9, 8], [0, 1.5, -2], 500, 0.5);
  spot(s, [8, 9, 6], [0, 4, -6], 400, 0.5);
  return { scene: s, camera: cam(aspect, [4.5, 1.4, 19], [0.4, 4.4, -4], 42) };
};

// ───────────────────────── page 4 ─────────────────────────
export const underground: PanelBuilder = (aspect, env) => {
  const s = stage('#0c0c0e', env, 0.2);
  ambient(s, 0.2);
  key(s, [2, 5, 6], 0.8);
  const cave = new THREE.Mesh(G.sph(), new THREE.MeshStandardMaterial({ color: '#5a5552', roughness: 1, side: THREE.BackSide }));
  cave.scale.set(7, 3.2, 5);
  cave.position.y = 1.4;
  s.add(cave);
  const pipe = mat('#8a8a90', 'metal');
  for (const [x, z] of [[-2.6, -1], [-0.9, -2], [1.6, -1.6], [3, -0.5]] as const) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 4.6, z), new THREE.Vector3(x * 0.7, 2.6, z * 0.6), new THREE.Vector3(x * 0.3, 1.2, z * 0.2 + 0.3)]);
    s.add(m(new THREE.TubeGeometry(curve, 20, 0.07, 10, false), pipe));
  }
  for (let i = 0; i < 9; i++) s.add(hero(m(G.sph(), mat('#2ee6ff', 'glow'), [-0.6 + (i % 3) * 0.6, 1.5 + Math.floor(i / 3) * 0.5, 0.3], [0.05, 0.09, 0.05])));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 3.2, 3.4, Math.sin(a) * 2), new THREE.Vector3(Math.cos(a) * 1.6, 1.8, Math.sin(a) * 1.2), new THREE.Vector3(0, 0.75, 0.4)]);
    s.add(hero(m(new THREE.TubeGeometry(curve, 24, 0.025, 6, false), mat('#ff3d7f', 'glow'))));
  }
  const sb = hero(buildStrawbaby({ coat: false }));
  sb.position.set(0, 0.05, 0.4);
  sb.rotation.set(-0.2, 0.1, 0.1);
  s.add(sb);
  const glow = new THREE.PointLight('#ff6b9a', 30, 5, 1.2);
  glow.position.set(0.3, 1.5, 1.8);
  s.add(glow);
  ground(s, '#4b4744');
  return { scene: s, camera: cam(aspect, [0.5, 1.3, 4.0], [0, 1.0, 0], 42), noir: { contrast: 1.35 } };
};

export const eyeReflect: PanelBuilder = (aspect, env) => {
  const s = stage('#0e0e10', env, 0.25);
  ambient(s, 0.3);
  key(s, [2, 3, 5], 1.8);
  const sb = buildStrawbaby({ coat: false });
  const head = sb.userData.head as THREE.Group;
  for (const x of [-0.2, 0.2])
    for (let k = 0; k < 3; k++) head.add(m(G.box(), mat(['#2ee6ff', '#ff3d7f', '#ffe066'][k], 'glow'), [x + (k - 1) * 0.03, 0.09 - k * 0.025, 0.53], [0.025, 0.018, 0.005]));
  head.add(m(G.sph(), mat('#7fd3ff', 'glass'), [0.27, -0.06, 0.5], [0.03, 0.05, 0.02]));
  s.add(hero(sb));
  const h = headOf(sb, s);
  return { scene: s, camera: cam(aspect, [h.x + 0.12, h.y + 0.08, h.z + 1.7], [h.x, h.y - 0.02, h.z], 34) };
};

export const redEyes: PanelBuilder = (aspect, env) => {
  const s = stage('#060607', env, 0.15);
  ambient(s, 0.15);
  key(s, [-3, 2, 4], 1.4);
  const db = buildDarkBerry({ hat: false });
  s.add(hero(db));
  const h = headOf(db, s);
  const glow = new THREE.PointLight('#ff1f3d', 8, 3, 1.5);
  glow.position.set(h.x, h.y - 0.2, h.z + 0.9);
  s.add(glow);
  return { scene: s, camera: cam(aspect, [h.x - 0.25, h.y - 0.08, h.z + 1.6], [h.x, h.y + 0.02, h.z], 34), noir: { contrast: 1.5 } };
};

// ───────────────────────── page 5: the splash ─────────────────────────
export const darkberrySplash: PanelBuilder = (aspect, env) => {
  const s = stage('#232328', env, 0.25);
  ambient(s, 0.22);
  key(s, [-4, 6, 3], 0.8);
  ground(s, '#3c3c40', 80, 0.15);
  s.add(place(buildStreetLamp(5.5), [-1.2, 0, -0.4], 0));
  spot(s, [-0.3, 5.3, -0.4], [0, 0, 0.2], 260, 0.55, '#fff3d6');
  const rim = new THREE.DirectionalLight('#ff4d6d', 1.6);
  rim.position.set(2, 3, -4);
  s.add(rim);
  for (let i = 0; i < 6; i++) s.add(place(buildBuilding(2.6, 6 + (i % 3) * 2, 2.6, '#55555b', true, 11 + i), [-7 + i * 2.8, 0, -6 - (i % 2) * 1.5]));
  const db = hero(buildDarkBerry());
  db.position.set(0.15, 0, 0.3);
  db.rotation.y = -0.15;
  db.scale.setScalar(1.7);
  s.add(db);
  const pd = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.MeshStandardMaterial({ color: '#7a7f88', roughness: 0.03, metalness: 0.8 }));
  pd.rotation.x = -PI / 2;
  pd.position.set(0.4, 0.01, 1.2);
  s.add(pd);
  const camPos: V3 = [0.8, 1.2, 5.6];
  s.add(buildRain(500, [12, 12, 8], [0, 5, -1], 17, { at: camPos, r: 3 }));
  return { scene: s, camera: cam(aspect, camPos, [0, 1.75, 0], 38), noir: { contrast: 1.4, dotSize: 5 } };
};

// ───────────────────────── page 6 ─────────────────────────
export const screensWall = (dbPortrait: THREE.Texture): PanelBuilder => (aspect, env) => {
  const s = stage('#141418', env, 0.15);
  ambient(s, 0.2);
  key(s, [5, 8, 6], 1.2);
  ground(s, '#2c2c30');
  for (let i = 0; i < 7; i++) {
    const b = buildBuilding(3.2, 7 + (i % 3) * 2.5, 3, '#4a4a50', true, 21 + i);
    s.add(place(b, [-10 + i * 3.4, 0, -4 - (i % 2) * 2]));
    // a billboard on every building
    const sc = hero(buildScreen(dbPortrait, 2.2, 2.2));
    sc.position.set(-10 + i * 3.4, 4.5 + (i % 3) * 1.6, -2.4 - (i % 2) * 2);
    s.add(sc);
  }
  return { scene: s, camera: cam(aspect, [0, 3.2, 12], [0, 5.5, -3], 40) };
};

export const kidsPhones: PanelBuilder = (aspect, env) => {
  const s = stage('#1c1c20', env, 0.2);
  ambient(s, 0.25);
  key(s, [3, 6, 5], 1.0);
  const tex = textTexture([{ text: '▶', size: 220, color: '#ff3d7f' }], 256, 512, '#2a0f3a');
  // three rows of kids on benches, staggered, all looking down
  for (let row = 0; row < 3; row++) {
    const z = -row * 1.5;
    const y = row * 0.55;
    s.add(m(G.rbox(0.1), mat('#5a4636', 'matte'), [0, 0.55 + y, z], [4.2, 0.18, 0.9]));
    for (let i = 0; i < 3; i++) {
      const x = -1.3 + i * 1.3 + (row % 2) * 0.4;
      const kid = place(buildToy(HUMAN(i + row * 3)), [x, 0.6 + y, z], 0, 1.0);
      kid.rotation.x = 0.25;
      s.add(kid);
      const ph = hero(place(buildPhone(tex), [x, 1.2 + y, z + 0.5], 0, 0.75));
      ph.rotation.x = -0.9;
      s.add(ph);
      const glow = new THREE.PointLight('#ff3d7f', 3, 1.4, 1.5);
      glow.position.set(x, 1.45 + y, z + 0.65);
      s.add(glow);
    }
    if (row > 0) s.add(m(G.box(), mat('#2a2a2e', 'matte'), [0, y / 2 + 0.25, z + 0.2], [4.4, y + 0.5, 0.6]));
  }
  ground(s, '#333337');
  return { scene: s, camera: cam(aspect, [0.2, 2.6, 5.2], [0, 1.3, -1.2], 44), noir: { contrast: 1.35 } };
};

const GENERALS = ['squalino', 'coccodrillo', 'discobolo', 'televisore'];
export const generals: PanelBuilder = (aspect, env) => {
  const s = stage('#101012', env, 0.2);
  ambient(s, 0.25);
  spot(s, [0, 7, 5], [0, 0.8, 0], 220, 0.6);
  ground(s, '#2c2c30');
  s.add(place(buildDarkBerry(), [0, 0, -3.4], 0, 3.4));
  GENERALS.forEach((id, i) => {
    const t = { ...CARD[id].toy, acc: [...(CARD[id].toy.acc ?? []), 'officercap', 'medals'] };
    const front = i === 1 || i === 2;
    s.add(hero(place(buildToy(t), [-1.15 + i * 0.77, 0, front ? 1.0 : 0.1], -(i - 1.5) * 0.18, front ? 1.0 : 0.9)));
  });
  return { scene: s, camera: cam(aspect, [0, 0.9, 6.6], [0, 1.9, 0], 44) };
};

// ───────────────────────── page 7 ─────────────────────────
export const palanquin: PanelBuilder = (aspect, env) => {
  const s = stage('#5a5a60', env);
  ambient(s, 0.35);
  key(s, [-4, 8, 6], 2.2);
  ground(s, '#454549');
  for (let i = 0; i < 7; i++) s.add(place(buildBuilding(3, 6 + (i % 3) * 2, 3, '#5d5d63', true, 31 + i), [-10 + i * 3.3, 0, -6]));
  s.add(place(buildPalanquin(), [0, 0, 0]));
  [[-1.6, -0.85], [1.6, -0.85], [-1.6, 0.85], [1.6, 0.85]].forEach(([x, z], i) => s.add(place(buildToy(HUMAN(i)), [x, 0, z], PI / 2, 1.05)));
  s.add(hero(place(buildToy(CARD.discobolo.toy), [0, 1.42, 0], 0.2, 1.0)));
  for (let i = 0; i < 6; i++) {
    const h = place(buildToy(HUMAN(i + 2)), [-3.6 + i * 1.45, 0, 2.6], 0, 0.95);
    h.rotation.x = 0.5;
    s.add(h);
  }
  return { scene: s, camera: cam(aspect, [0.5, 2.2, 7.4], [0, 1.6, 0], 36) };
};

export const basement = (mapTex: THREE.Texture): PanelBuilder => (aspect, env) => {
  const s = stage('#0b0b0d', env, 0.1);
  ambient(s, 0.06);
  s.add(buildTable(3.4, 2.2));
  const lamp = buildHangingLamp(2.9);
  s.add(lamp);
  ambient(s, 0.3);
  key(s, [3, 5, 4], 0.6);
  spot(s, [0, 2.75, 0], [0, 1, 0], 260, 0.9, '#fff1cc');
  const map = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.9 }));
  map.rotation.x = -PI / 2;
  map.position.y = 1.06;
  s.add(map);
  const res = ['#51cf66', '#3bc9db', '#7048e8', '#f783ac', '#e8590c'];
  res.forEach((c, i) => s.add(hero(m(G.rbox(0.3), mat(c), [-0.8 + i * 0.4, 1.12, 0.55], 0.14))));
  [[-1.9, 0, PI / 2], [1.9, 0, -PI / 2], [-0.8, -1.4, 0.2], [0.8, -1.4, -0.2]].forEach(([x, z, r], i) => s.add(place(buildToy(HUMAN(i)), [x, 0, z], r, 1.15)));
  ground(s, '#26262a');
  return { scene: s, camera: cam(aspect, [2.6, 3.3, 4.4], [0, 1.0, -0.2], 40), noir: { contrast: 1.3 } };
};

export const skyline: PanelBuilder = (aspect, env) => {
  const s = stage('#16161a', env, 0.25);
  ambient(s, 0.3);
  key(s, [-6, 8, 10], 1.2);
  ground(s, '#26262a');
  for (let i = 0; i < 16; i++) s.add(place(buildBuilding(2.2 + (i % 3), 4 + ((i * 7) % 6), 2.4, '#4a4a50', true, 41 + i), [-20 + i * 2.7, 0, -2 - (i % 3) * 2]));
  s.add(place(buildDataCenter(), [0, 0, -12], 0, 1.2));
  const db = hero(place(buildDarkBerry(), [0, 2.5, -28], 0, 17));
  s.add(db);
  spot(s, [0, 6, -6], [0, 16, -28], 4200, 0.6, '#ff8fa3');
  for (const x of [-8, 8]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.2, 22, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#d9d4c7', transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    beam.position.set(x, 10, -10);
    beam.rotation.z = x > 0 ? 0.45 : -0.45;
    s.add(beam);
  }
  return { scene: s, camera: cam(aspect, [0, 2.0, 15], [0, 10.5, -10], 50) };
};


// ───────────────────────── results ─────────────────────────
/** Dawn on a rooftop: the winning cell's allies, in color, over a black-and-white city. */
export const victory = (allies: string[]): PanelBuilder => (aspect, env) => {
  const s = stage('#d9d4c7', env, 0.4);
  ambient(s, 0.5);
  key(s, [-6, 4, -8], 2.2);
  key(s, [4, 6, 6], 1.0);
  for (let i = 0; i < 14; i++) s.add(place(buildBuilding(2 + (i % 3), 3 + ((i * 7) % 6), 2.4, '#7a7a80', true, 61 + i), [-18 + i * 2.8, -4, -10 - (i % 3) * 2]));
  s.add(m(G.sph(), mat('#fff8e6', 'glow'), [5, 3.5, -30], 3.5));
  s.add(m(G.box(), mat('#55555b', 'matte'), [0, -0.5, 0], [12, 1, 4]));
  s.add(m(G.box(), mat('#3d3d42', 'matte'), [0, 0.15, 1.9], [12, 0.3, 0.2]));
  const shown = allies.slice(0, 7);
  shown.forEach((id, i) => {
    const x = (i - (shown.length - 1) / 2) * 1.25;
    s.add(hero(place(buildToy(CARD[id].toy), [x, 0, 0.4 + (i % 2) * 0.35], -x * 0.06, 1.0)));
  });
  for (let i = 0; i < 3; i++) s.add(place(buildToy(HUMAN(i)), [-4.8 + i * 4.8, 0, -0.9], 0, 1.1));
  return { scene: s, camera: cam(aspect, [0, 1.3, 7.4], [0, 1.0, 0], 40), noir: { contrast: 1.2 } };
};
