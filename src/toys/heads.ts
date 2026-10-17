// Head builders. Each returns a group centered at the head's middle plus where the face goes.
import * as THREE from 'three';
import type { ToyRecipe } from '../game/types';
import { G, group, m, mat, shade } from './kit';

export interface HeadInfo {
  g: THREE.Group;
  /** y of the top of the head, relative to its center */
  top: number;
  /** y of the bottom */
  bottom: number;
  face: { y: number; z: number; spread: number; size: number };
  half: number;
  mouth?: boolean;
}

const W = '#ffffff';
const K = '#1b1b24';
const PI = Math.PI;

/** Seeds sit exactly on the (possibly deformed) surface: sample the geometry's own vertices. */
function seedsOn(parent: THREE.Group, geom: THREE.BufferGeometry, scale: number, offsetY: number, color: string, every = 9) {
  const sm = mat(color);
  const pos = geom.attributes.position;
  const nor = geom.attributes.normal;
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += every) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0.72 || y < -1.05) continue;
    // keep the face clear
    if (z > 0.55 && y > -0.45 && y < 0.55 && Math.abs(x) < 0.75) continue;
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
    const p = new THREE.Vector3(x, y, z).multiplyScalar(scale);
    p.y += offsetY;
    const s = m(G.sphLo(), sm, [p.x, p.y, p.z], [0.022, 0.034, 0.016]);
    s.lookAt(p.clone().add(n));
    parent.add(s);
  }
}

function leafCrown(color: string, y: number, n = 5, size = 0.22) {
  const g = new THREE.Group();
  const lm = mat(color);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const leaf = m(G.sph(), lm, [Math.cos(a) * size * 0.8, y, Math.sin(a) * size * 0.8], [size * 0.55, 0.05, size * 0.28], [0, -a, 0.35]);
    g.add(leaf);
  }
  g.add(m(G.cyl(), lm, [0.02, y + 0.06, 0], [0.035, 0.1, 0.035], [0.2, 0, -0.35]));
  return g;
}

const sphereHead = (c: string, r = 0.46, sy = 1, kind: 'vinyl' | 'matte' | 'fabric' = 'vinyl'): HeadInfo => ({
  g: group(m(G.sph(), mat(c, kind), [0, 0, 0], [r, r * sy, r])),
  top: r * sy,
  bottom: -r * sy,
  face: { y: 0.02, z: r * 0.93, spread: r * 0.42, size: r * 0.2 },
  half: r,
  mouth: true,
});

export const HEADS: Record<string, (t: ToyRecipe) => HeadInfo> = {
  strawberry: (t) => {
    const h = new THREE.Group();
    const body = m(G.sph(), mat(t.c1), [0, -0.04, 0], [0.5, 0.5, 0.5]);
    // strawberry: fatter top, pointed bottom
    const g = G.sph().clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = y < 0 ? 1 + y * 0.42 : 1 + y * 0.06;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
      if (y < 0) pos.setY(i, y * 1.12);
    }
    g.computeVertexNormals();
    body.geometry = g;
    h.add(body);
    seedsOn(h, g, 0.5, -0.04, t.seed ?? '#ffe9a8', 7);
    h.add(leafCrown(t.c2 ?? '#51cf66', 0.45, 6, 0.28));
    return { g: h, top: 0.6, bottom: -0.6, face: { y: 0.05, z: 0.47, spread: 0.2, size: 0.1 }, half: 0.5, mouth: true };
  },
  croissant: (t) => {
    const h = new THREE.Group();
    const cm = mat(t.c1);
    const dark = mat(shade(t.c1, -0.12));
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = PI * (0.15 + (0.7 * i) / (n - 1));
      const s = 0.26 - Math.abs(i - 2) * 0.05;
      h.add(m(G.sph(), i % 2 ? dark : cm, [Math.cos(a) * 0.36, Math.sin(a) * 0.2 - 0.12, 0], [s * 1.1, s, s * 1.2], [0, 0, a - PI / 2]));
    }
    return { g: h, top: 0.26, bottom: -0.25, face: { y: 0.05, z: 0.3, spread: 0.12, size: 0.07 }, half: 0.55, mouth: true };
  },
  cup: (t) => {
    const h = group(
      m(G.cylTaper(1.1), mat(t.c1), [0, 0, 0], [0.36, 0.55, 0.36], [PI, 0, 0]),
      m(G.cyl(), mat(t.c2 ?? '#a47148', 'matte'), [0, 0.27, 0], [0.37, 0.03, 0.37]),
      m(G.heart(), mat('#f8f1e5', 'matte'), [0, 0.3, 0], 0.13, [-PI / 2, 0, 0]),
      m(G.tor(0.28), mat(t.c1), [0.44, 0, 0], [0.13, 0.13, 0.13]),
    );
    return { g: h, top: 0.3, bottom: -0.28, face: { y: -0.02, z: 0.39, spread: 0.13, size: 0.07 }, half: 0.4, mouth: true };
  },
  toaster: (t) => {
    const h = group(
      m(G.rbox(0.22), mat(t.c1, 'metal'), [0, 0, 0], [0.8, 0.6, 0.5]),
      m(G.rbox(0.1), mat(t.c2 ?? '#d4a373', 'matte'), [-0.16, 0.33, 0], [0.24, 0.2, 0.32]),
      m(G.rbox(0.1), mat(t.c2 ?? '#d4a373', 'matte'), [0.16, 0.36, 0], [0.24, 0.24, 0.32]),
      m(G.box(), mat(K), [0.42, 0.05, 0], [0.06, 0.06, 0.2]),
    );
    return { g: h, top: 0.48, bottom: -0.3, face: { y: 0, z: 0.26, spread: 0.18, size: 0.08 }, half: 0.42, mouth: true };
  },
  banana: (t) => {
    const h = new THREE.Group();
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.12, -0.5, 0), new THREE.Vector3(-0.32, 0, 0), new THREE.Vector3(0.12, 0.55, 0));
    const tube = new THREE.TubeGeometry(curve, 32, 0.22, 24, false);
    h.add(m(tube, mat(t.c1)));
    h.add(m(G.sph(), mat(t.c1), [0.12, -0.5, 0], 0.22));
    h.add(m(G.cyl(), mat(t.c2 ?? '#5c3d2e'), [0.12, 0.62, 0], [0.06, 0.16, 0.06]));
    return { g: h, top: 0.7, bottom: -0.7, face: { y: 0.05, z: 0.2, spread: 0.1, size: 0.065 }, half: 0.3, mouth: true };
  },
  watermelon: (t) => {
    const h = group(m(G.sph(), mat(t.c1), [0, 0, 0], [0.5, 0.46, 0.5]));
    const stripe = mat(shade(t.c1, -0.12));
    for (let i = 0; i < 8; i++) h.add(m(G.sph(), stripe, [0, 0, 0], [0.505, 0.465, 0.06], [0, (i / 8) * PI, 0]));
    return { g: h, top: 0.46, bottom: -0.46, face: { y: 0.04, z: 0.49, spread: 0.2, size: 0.09 }, half: 0.5, mouth: true };
  },
  fridge: (t) => {
    const h = group(
      m(G.rbox(0.12), mat(t.c1), [0, 0, 0], [0.62, 0.95, 0.55]),
      m(G.box(), mat(shade(t.c1, -0.15)), [0, 0.12, 0.28], [0.6, 0.015, 0.01]),
      m(G.cap(1), mat('#adb5bd', 'metal'), [0.22, 0.3, 0.3], [0.025, 0.08, 0.025]),
      m(G.cap(1), mat('#adb5bd', 'metal'), [0.22, -0.15, 0.3], [0.025, 0.08, 0.025]),
    );
    return { g: h, top: 0.48, bottom: -0.48, face: { y: -0.12, z: 0.29, spread: 0.13, size: 0.07 }, half: 0.32, mouth: true };
  },
  shark: (t) => {
    const h = group(
      m(G.sph(), mat(t.c1), [0, 0, 0], [0.42, 0.42, 0.55]),
      m(G.sph(), mat(t.c2 ?? W), [0, -0.12, 0.1], [0.36, 0.3, 0.46]),
      m(G.cone(), mat(t.c1), [0, 0.45, -0.1], [0.12, 0.3, 0.2], [-0.4, 0, 0]),
    );
    for (let i = -2; i <= 2; i++) h.add(m(G.cone(), mat(W), [i * 0.06, -0.12, 0.5], [0.025, 0.06, 0.025], [PI, 0, 0]));
    return { g: h, top: 0.55, bottom: -0.42, face: { y: 0.1, z: 0.45, spread: 0.18, size: 0.07 }, half: 0.42 };
  },
  croc: (t) => {
    const h = group(
      m(G.rbox(0.2), mat(t.c1), [0, 0, 0], [0.62, 0.5, 0.55]),
      m(G.rbox(0.15), mat(t.c1), [0, -0.08, 0.38], [0.5, 0.26, 0.5]),
      m(G.sph(), mat(t.c1), [-0.17, 0.27, 0.15], 0.12),
      m(G.sph(), mat(t.c1), [0.17, 0.27, 0.15], 0.12),
      m(G.sph(), mat(K), [-0.08, -0.02, 0.63], 0.025),
      m(G.sph(), mat(K), [0.08, -0.02, 0.63], 0.025),
    );
    for (let i = -3; i <= 3; i++) h.add(m(G.cone(), mat(W), [i * 0.065, -0.2, 0.62], [0.025, 0.06, 0.025], [PI, 0, 0]));
    return { g: h, top: 0.39, bottom: -0.25, face: { y: 0.27, z: 0.27, spread: 0.17, size: 0.06 }, half: 0.32 };
  },
  sneaker: (t) => {
    const h = group(
      m(G.rbox(0.25), mat(t.c1), [0, 0, 0.04], [0.5, 0.45, 0.85]),
      m(G.rbox(0.2), mat(t.c2 ?? '#7048e8'), [0, -0.25, 0.04], [0.54, 0.12, 0.9]),
      m(G.rbox(0.3), mat(t.c1), [0, 0.28, -0.22], [0.46, 0.35, 0.4]),
      m(G.tor(0.15, PI), mat(t.c2 ?? '#7048e8'), [0.26, 0, 0.05], [0.18, 0.12, 0.12], [0, PI / 2, 0]),
    );
    for (let i = 0; i < 3; i++) h.add(m(G.box(), mat(W), [0, 0.15 + i * 0.03, 0.12 + i * 0.09], [0.3, 0.02, 0.04], [0.4, 0, 0]));
    return { g: h, top: 0.46, bottom: -0.31, face: { y: 0.05, z: 0.47, spread: 0.13, size: 0.07 }, half: 0.28 };
  },
  pizza: (t) => {
    const h = group(
      m(G.tri(), mat(t.c1), [0, 0.05, 0], [0.5, 0.52, 0.35], [0, 0, PI]),
      m(G.cap(1), mat('#c98a3c'), [0, 0.36, 0], [0.11, 0.36, 0.13], [0, 0, PI / 2]),
    );
    for (const [x, y] of [[-0.2, 0.12], [0.2, 0.1], [0, -0.22], [0.08, 0.14]]) h.add(m(G.cyl(), mat(t.c2 ?? '#d1495b'), [x, y, 0.27], [0.065, 0.03, 0.065], [PI / 2, 0, 0]));
    return { g: h, top: 0.47, bottom: -0.5, face: { y: -0.02, z: 0.28, spread: 0.12, size: 0.06 }, half: 0.46, mouth: true };
  },
  donut: (t) => {
    const h = group(
      m(G.tor(0.55), mat(t.c2 ?? '#a0522d'), [0, 0, 0], [0.36, 0.36, 0.5]),
      m(G.tor(0.5), mat(t.c1), [0, 0, 0.06], [0.37, 0.37, 0.44]),
    );
    const cols = ['#ffd43b', '#74c0fc', '#ffffff', '#69db7c', '#e599f7'];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2;
      const r = 0.36 + ((i * 7) % 5) * 0.025 - 0.05;
      h.add(m(G.cap(1), mat(cols[i % 5]), [Math.cos(a) * r, Math.sin(a) * r, 0.2], [0.012, 0.03, 0.012], [0, 0, a * 3]));
    }
    return { g: h, top: 0.56, bottom: -0.56, face: { y: 0.36, z: 0.18, spread: 0.12, size: 0.06 }, half: 0.56, mouth: false };
  },
  egg: (t) => {
    const g = G.sph().clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = 1 - y * 0.18;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    g.computeVertexNormals();
    return { g: group(m(g, mat(t.c1), [0, 0, 0], [0.42, 0.55, 0.42])), top: 0.55, bottom: -0.55, face: { y: -0.05, z: 0.43, spread: 0.16, size: 0.08 }, half: 0.45, mouth: true };
  },
  cactus: (t) => {
    const cm = mat(t.c1);
    const h = group(
      m(G.cap(1.2), cm, [0, 0, 0], [0.32, 0.32, 0.32]),
      m(G.cap(0.8), cm, [-0.36, 0.05, 0], [0.12, 0.12, 0.12]),
      m(G.cap(0.8), cm, [0.36, -0.05, 0], [0.12, 0.12, 0.12]),
      m(G.sph(), mat(t.c2 ?? '#ffd43b'), [0.05, 0.55, 0], 0.08),
    );
    for (let i = 0; i < 6; i++) h.add(m(G.sph(), mat(shade(t.c1, -0.08)), [0, 0, 0], [0.325, 0.5, 0.04], [0, (i / 6) * PI, 0]));
    return { g: h, top: 0.55, bottom: -0.5, face: { y: 0.12, z: 0.31, spread: 0.13, size: 0.07 }, half: 0.4, mouth: true };
  },
  pineapple: (t) => {
    const h = group(m(G.sph(), mat(t.c1), [0, 0, 0], [0.4, 0.5, 0.4]));
    const dm = mat(shade(t.c1, -0.18));
    for (let i = 0; i < 6; i++) {
      h.add(m(G.tor(0.04), dm, [0, 0, 0], [0.4, 0.5, 0.4], [0, (i / 6) * PI, 0.6]));
      h.add(m(G.tor(0.04), dm, [0, 0, 0], [0.4, 0.5, 0.4], [0, (i / 6) * PI, -0.6]));
    }
    const lm = mat(t.c2 ?? '#2f9e44');
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2;
      h.add(m(G.cone(), lm, [Math.cos(a) * 0.07, 0.62, Math.sin(a) * 0.07], [0.06, 0.38, 0.03], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]));
    }
    return { g: h, top: 0.75, bottom: -0.5, face: { y: 0.02, z: 0.39, spread: 0.15, size: 0.07 }, half: 0.4, mouth: true };
  },
  tv: (t) => {
    const h = group(
      m(G.rbox(0.15), mat(t.c1), [0, 0, 0], [0.8, 0.62, 0.55]),
      m(G.rbox(0.2), mat(t.c2 ?? '#74c0fc', 'glow'), [-0.06, 0, 0.26], [0.55, 0.45, 0.05]),
      m(G.cyl(), mat(K), [0.32, 0.12, 0.28], [0.04, 0.03, 0.04], [PI / 2, 0, 0]),
      m(G.cyl(), mat(K), [0.32, -0.02, 0.28], [0.04, 0.03, 0.04], [PI / 2, 0, 0]),
    );
    return { g: h, top: 0.31, bottom: -0.31, face: { y: 0.02, z: 0.3, spread: 0.14, size: 0.07 }, half: 0.4, mouth: true };
  },
  teapot: (t) => {
    const cm = mat(t.c1);
    const h = group(
      m(G.sph(), cm, [0, 0, 0], [0.45, 0.38, 0.45]),
      m(G.cyl(), cm, [0, 0.36, 0], [0.18, 0.06, 0.18]),
      m(G.sph(), mat(t.c2 ?? W), [0, 0.43, 0], 0.06),
      m(G.cylTaper(0.4), cm, [0.48, 0.08, 0], [0.08, 0.36, 0.08], [0, 0, -0.9]),
      m(G.tor(0.22), cm, [-0.46, 0.02, 0], [0.16, 0.16, 0.16]),
    );
    return { g: h, top: 0.48, bottom: -0.38, face: { y: 0, z: 0.44, spread: 0.16, size: 0.08 }, half: 0.46, mouth: true };
  },
  kettle: (t) => {
    const cm = mat(t.c1);
    const h = group(
      m(G.cylTaper(0.75), cm, [0, 0, 0], [0.42, 0.62, 0.42]),
      m(G.sph(), cm, [0, 0.31, 0], [0.32, 0.08, 0.32]),
      m(G.tor(0.12, PI), mat(K), [0, 0.32, 0], [0.24, 0.24, 0.24]),
      m(G.cylTaper(0.4), cm, [0.42, 0.05, 0], [0.07, 0.34, 0.07], [0, 0, -1.0]),
    );
    return { g: h, top: 0.56, bottom: -0.31, face: { y: -0.02, z: 0.38, spread: 0.15, size: 0.08 }, half: 0.42, mouth: true };
  },
  cloud: (t) => {
    const cm = mat(t.c1, 'fabric');
    const h = group(
      m(G.sph(), cm, [0, 0.05, 0], 0.38),
      m(G.sph(), cm, [-0.34, -0.08, 0], 0.27),
      m(G.sph(), cm, [0.34, -0.08, 0], 0.27),
      m(G.sph(), cm, [-0.16, 0.25, -0.05], 0.24),
      m(G.sph(), cm, [0.18, 0.22, -0.05], 0.26),
    );
    return { g: h, top: 0.48, bottom: -0.35, face: { y: 0.0, z: 0.37, spread: 0.14, size: 0.07 }, half: 0.6, mouth: true };
  },
  lemon: (t) => ({
    ...sphereHead(t.c1, 0.42, 0.9),
    g: group(
      m(G.sph(), mat(t.c1), [0, 0, 0], [0.48, 0.38, 0.38], [0, 0, 0.3]),
      m(G.sph(), mat(t.c1), [-0.45, -0.14, 0], 0.08),
      m(G.sph(), mat(t.c1), [0.45, 0.14, 0], 0.08),
      m(G.sph(), mat(t.c2 ?? '#74b816'), [0.32, 0.32, 0], [0.14, 0.04, 0.08], [0, 0, 0.6]),
    ),
  }),
  pear: (t) => {
    const g = G.sph().clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = y > 0 ? 1 - y * 0.42 : 1;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    g.computeVertexNormals();
    const h = group(m(g, mat(t.c1), [0, 0, 0], [0.45, 0.6, 0.45]), m(G.cyl(), mat(t.c2 ?? '#5c3d2e'), [0, 0.65, 0], [0.03, 0.14, 0.03], [0, 0, 0.3]));
    return { g: h, top: 0.7, bottom: -0.6, face: { y: -0.12, z: 0.42, spread: 0.15, size: 0.075 }, half: 0.45, mouth: true };
  },
  avocado: (t) => {
    const g = G.sph().clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = y > 0 ? 1 - y * 0.3 : 1;
      pos.setX(i, pos.getX(i) * k);
    }
    g.computeVertexNormals();
    const h = group(
      m(g, mat(shade(t.c1, -0.2)), [0, 0, -0.02], [0.44, 0.56, 0.32]),
      m(g, mat(t.c2 ?? '#f2e8a5', 'matte'), [0, 0, 0.04], [0.38, 0.5, 0.3]),
      m(G.sph(), mat('#8d5524'), [0, -0.18, 0.24], 0.15),
    );
    return { g: h, top: 0.56, bottom: -0.56, face: { y: 0.18, z: 0.3, spread: 0.13, size: 0.07 }, half: 0.44, mouth: false };
  },
  mushroom: (t) => {
    const h = group(
      m(G.hemi(), mat(t.c1), [0, 0.02, 0], [0.55, 0.42, 0.55]),
      m(G.cyl(), mat(t.c2 ?? '#fff4e6'), [0, -0.22, 0], [0.26, 0.48, 0.26]),
    );
    for (const [x, y, z] of [[0.25, 0.3, 0.25], [-0.3, 0.25, 0.2], [0, 0.4, -0.1], [0.1, 0.25, -0.4], [-0.38, 0.12, -0.2]]) h.add(m(G.sph(), mat(W), [x, y, z], 0.07));
    return { g: h, top: 0.44, bottom: -0.46, face: { y: -0.2, z: 0.26, spread: 0.11, size: 0.06 }, half: 0.55, mouth: true };
  },
  duck: (t) => {
    const s = sphereHead(t.c1, 0.42);
    s.g.add(m(G.sph(), mat(t.c2 ?? '#ff922b'), [0, -0.06, 0.42], [0.2, 0.07, 0.16]));
    s.g.add(m(G.sph(), mat(t.c1), [0, 0.45, 0], [0.05, 0.1, 0.05], [0, 0, 0.4]));
    s.face.y = 0.12;
    s.mouth = false;
    return s;
  },
  cat: (t) => {
    const s = sphereHead(t.c1, 0.44, 0.92);
    s.g.add(m(G.cone(), mat(t.c1), [-0.25, 0.4, 0], [0.13, 0.25, 0.1], [0, 0, 0.35]));
    s.g.add(m(G.cone(), mat(t.c1), [0.25, 0.4, 0], [0.13, 0.25, 0.1], [0, 0, -0.35]));
    s.g.add(m(G.sph(), mat('#ffa8a8'), [0, -0.05, 0.43], 0.035));
    for (const sx of [-1, 1]) for (const dy of [-0.03, 0.02]) s.g.add(m(G.cyl(), mat(K), [sx * 0.3, -0.06 + dy, 0.36], [0.006, 0.18, 0.006], [0, 0, PI / 2 + sx * dy * 4]));
    return s;
  },
  goat: (t) => {
    const s = sphereHead(t.c1, 0.42, 1);
    s.g.add(m(G.sph(), mat(t.c1), [-0.42, 0.08, 0], [0.18, 0.06, 0.09], [0, 0, -0.4]));
    s.g.add(m(G.sph(), mat(t.c1), [0.42, 0.08, 0], [0.18, 0.06, 0.09], [0, 0, 0.4]));
    s.g.add(m(G.cone(), mat(t.c1), [0, -0.46, 0.25], [0.08, 0.2, 0.06], [PI, 0, 0]));
    return s;
  },
  frog: (t) => {
    const s = sphereHead(t.c1, 0.48, 0.78);
    s.g.add(m(G.sph(), mat(t.c1), [-0.2, 0.32, 0.12], 0.15));
    s.g.add(m(G.sph(), mat(t.c1), [0.2, 0.32, 0.12], 0.15));
    s.face = { y: 0.33, z: 0.25, spread: 0.2, size: 0.08 };
    return s;
  },
  owl: (t) => {
    const s = sphereHead(t.c1, 0.45, 0.95);
    s.g.add(m(G.sph(), mat(t.c2 ?? '#ffe8cc'), [-0.15, 0.04, 0.33], [0.16, 0.16, 0.08]));
    s.g.add(m(G.sph(), mat(t.c2 ?? '#ffe8cc'), [0.15, 0.04, 0.33], [0.16, 0.16, 0.08]));
    s.g.add(m(G.cone(), mat('#ffa94d'), [0, -0.12, 0.43], [0.05, 0.1, 0.05], [PI + 0.4, 0, 0]));
    s.g.add(m(G.cone(), mat(t.c1), [-0.28, 0.45, 0], [0.08, 0.2, 0.06], [0, 0, 0.4]));
    s.g.add(m(G.cone(), mat(t.c1), [0.28, 0.45, 0], [0.08, 0.2, 0.06], [0, 0, -0.4]));
    s.face = { y: 0.04, z: 0.4, spread: 0.15, size: 0.08 };
    s.mouth = false;
    return s;
  },
  hedgehog: (t) => {
    const s = sphereHead(t.c2 ?? '#ffe0b2', 0.4);
    const sm = mat(t.c1);
    for (let i = 0; i < 40; i++) {
      const y = 1 - ((i + 0.5) / 40) * 1.6;
      const a = i * 2.39996;
      const rr = Math.sqrt(1 - y * y);
      const x = Math.sin(a) * rr;
      const z = Math.cos(a) * rr;
      if (z > 0.35 && y < 0.6) continue;
      const sp = m(G.cone(), sm, [x * 0.42, y * 0.42, z * 0.42], [0.07, 0.22, 0.07]);
      sp.lookAt(x * 2, y * 2, z * 2);
      sp.rotateX(PI / 2);
      s.g.add(sp);
    }
    s.g.add(m(G.sph(), mat(K), [0, -0.06, 0.42], 0.04));
    return s;
  },
  snail: (t) => {
    const h = new THREE.Group();
    const shell = mat(t.c1);
    h.add(m(G.sph(), shell, [0, 0.12, -0.05], [0.38, 0.38, 0.3]));
    h.add(m(G.tor(0.3), mat(shade(t.c1, -0.15)), [0, 0.12, 0.06], [0.2, 0.2, 0.2]));
    h.add(m(G.cap(1), mat(t.c2 ?? '#9c6644'), [0.2, -0.3, 0.12], [0.16, 0.36, 0.16], [0, 0, PI / 2]));
    h.add(m(G.sph(), mat(t.c2 ?? '#9c6644'), [0.48, -0.12, 0.12], 0.17));
    h.add(m(G.cyl(), mat(t.c2 ?? '#9c6644'), [0.44, 0.08, 0.12], [0.02, 0.22, 0.02], [0, 0, 0.3]));
    h.add(m(G.cyl(), mat(t.c2 ?? '#9c6644'), [0.54, 0.08, 0.12], [0.02, 0.22, 0.02], [0, 0, -0.3]));
    return { g: h, top: 0.5, bottom: -0.46, face: { y: -0.1, z: 0.28, spread: 0.07, size: 0.045 }, half: 0.5, mouth: false };
  },
  turtle: (t) => {
    const h = group(
      m(G.hemi(), mat(t.c2 ?? '#343a40'), [0, -0.12, -0.05], [0.5, 0.42, 0.45]),
      m(G.sph(), mat(t.c1), [0, 0.02, 0.36], 0.24),
    );
    h.add(m(G.rbox(0.1), mat('#ff6b6b'), [0, 0.12, -0.05], [0.45, 0.22, 0.04], [-0.6, 0, 0]));
    return { g: h, top: 0.3, bottom: -0.15, face: { y: 0.06, z: 0.58, spread: 0.09, size: 0.05 }, half: 0.5, mouth: true };
  },
  crab: (t) => {
    const s = sphereHead(t.c1, 0.42, 0.68);
    s.g.add(m(G.cyl(), mat(t.c1), [-0.12, 0.33, 0.1], [0.025, 0.2, 0.025]));
    s.g.add(m(G.cyl(), mat(t.c1), [0.12, 0.33, 0.1], [0.025, 0.2, 0.025]));
    s.face = { y: 0.44, z: 0.1, spread: 0.12, size: 0.065 };
    s.top = 0.5;
    return s;
  },
  bread: (t) => {
    const h = group(
      m(G.rbox(0.3), mat(t.c1), [0, -0.05, 0], [0.82, 0.48, 0.55]),
      m(G.sph(), mat(t.c1), [0, 0.15, 0], [0.42, 0.24, 0.29]),
    );
    for (let i = -1; i <= 1; i++) h.add(m(G.cap(1), mat(t.c2 ?? '#faedcd', 'matte'), [i * 0.22, 0.32, 0], [0.025, 0.1, 0.025], [0.2, 0, PI / 2 + 0.6]));
    return { g: h, top: 0.39, bottom: -0.29, face: { y: -0.02, z: 0.28, spread: 0.15, size: 0.07 }, half: 0.42, mouth: true };
  },
  icecream: (t) => {
    const h = group(
      m(G.cone(), mat(t.c2 ?? '#e9b872', 'matte'), [0, -0.3, 0], [0.26, 0.6, 0.26], [PI, 0, 0]),
      m(G.sph(), mat(t.c1), [0, 0.1, 0], [0.38, 0.32, 0.38]),
      m(G.sph(), mat(t.c1), [0, 0.32, 0], [0.24, 0.2, 0.24]),
      m(G.sph(), mat('#e03131'), [0, 0.54, 0], 0.07),
    );
    return { g: h, top: 0.6, bottom: -0.6, face: { y: 0.1, z: 0.36, spread: 0.13, size: 0.065 }, half: 0.38, mouth: true };
  },
  onigiri: (t) => {
    const h = group(
      m(G.tri(), mat(t.c1, 'matte'), [0, 0, 0], [0.5, 0.52, 0.5]),
      m(G.rbox(0.05), mat(t.c2 ?? '#1b2a1f'), [0, -0.25, 0.04], [0.42, 0.28, 0.48]),
    );
    return { g: h, top: 0.55, bottom: -0.38, face: { y: 0.06, z: 0.33, spread: 0.12, size: 0.06 }, half: 0.5, mouth: true };
  },
  cassette: (t) => {
    const h = group(
      m(G.rbox(0.08), mat(t.c1), [0, 0, 0], [0.9, 0.58, 0.16]),
      m(G.rbox(0.05), mat(W, 'matte'), [0, 0.12, 0.08], [0.7, 0.22, 0.02]),
      m(G.rbox(0.05), mat(t.c2 ?? '#343a40'), [0, -0.1, 0.08], [0.5, 0.18, 0.02]),
      m(G.cyl(), mat(W), [-0.15, -0.1, 0.09], [0.06, 0.02, 0.06], [PI / 2, 0, 0]),
      m(G.cyl(), mat(W), [0.15, -0.1, 0.09], [0.06, 0.02, 0.06], [PI / 2, 0, 0]),
    );
    return { g: h, top: 0.29, bottom: -0.29, face: { y: 0.13, z: 0.1, spread: 0.13, size: 0.06 }, half: 0.45, mouth: false };
  },
  bulb: (t) => {
    const h = group(
      m(G.sph(), mat(t.c1, 'glow'), [0, 0.08, 0], [0.4, 0.42, 0.4]),
      m(G.cylTaper(1.3), mat(t.c2 ?? '#868e96', 'metal'), [0, -0.42, 0], [0.17, 0.26, 0.17], [PI, 0, 0]),
    );
    for (let i = 0; i < 3; i++) h.add(m(G.tor(0.15), mat(t.c2 ?? '#868e96', 'metal'), [0, -0.36 - i * 0.07, 0], [0.18, 0.18, 0.3], [PI / 2, 0, 0]));
    return { g: h, top: 0.5, bottom: -0.56, face: { y: 0.08, z: 0.38, spread: 0.14, size: 0.07 }, half: 0.4, mouth: true };
  },
  dice: (t) => {
    const h = group(m(G.rbox(0.2), mat(t.c1), [0, 0, 0], 0.72));
    const pm = mat(t.c2 ?? K);
    const pips: [number, number][] = [[-0.18, 0.18], [0.18, 0.18], [0, 0], [-0.18, -0.18], [0.18, -0.18]];
    for (const [x, y] of pips) h.add(m(G.sph(), pm, [x, y, 0.36], [0.06, 0.06, 0.02]));
    for (const [x, y] of [[-0.15, 0.15], [0.15, -0.15]]) h.add(m(G.sph(), pm, [0.36, y, x], [0.02, 0.06, 0.06]));
    for (const [x, z] of [[-0.18, -0.18], [0, 0], [0.18, 0.18]]) h.add(m(G.sph(), pm, [x, 0.36, z], [0.06, 0.02, 0.06]));
    return { g: h, top: 0.36, bottom: -0.36, face: { y: 0, z: 0.36, spread: 0.18, size: 0 }, half: 0.36, mouth: false };
  },
  potato: (t) => {
    const g = G.sph().clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const k = 1 + 0.06 * Math.sin(x * 5) * Math.cos(y * 4) + 0.05 * Math.sin(z * 6);
      pos.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals();
    const h = group(m(g, mat(t.c1, 'matte'), [0, 0, 0], [0.48, 0.4, 0.4]));
    for (const [x, y] of [[0.2, 0.2], [-0.3, -0.1], [0.32, -0.15]]) h.add(m(G.sph(), mat(shade(t.c1, -0.15)), [x, y, 0.33], 0.03));
    return { g: h, top: 0.42, bottom: -0.42, face: { y: 0.04, z: 0.38, spread: 0.15, size: 0.075 }, half: 0.48, mouth: true };
  },
  bee: (t) => {
    const s = sphereHead(t.c1, 0.45);
    for (const y of [-0.2, 0.08]) s.g.add(m(G.tor(0.12), mat(t.c2 ?? K), [0, y, 0], [0.43 - Math.abs(y) * 0.3, 0.43 - Math.abs(y) * 0.3, 0.43], [PI / 2, 0, 0]));
    s.g.add(m(G.cyl(), mat(K), [-0.12, 0.5, 0], [0.015, 0.2, 0.015], [0, 0, 0.3]));
    s.g.add(m(G.cyl(), mat(K), [0.12, 0.5, 0], [0.015, 0.2, 0.015], [0, 0, -0.3]));
    s.g.add(m(G.sph(), mat(K), [-0.16, 0.6, 0], 0.04));
    s.g.add(m(G.sph(), mat(K), [0.16, 0.6, 0], 0.04));
    s.face.y = 0.25;
    s.face.z = 0.35;
    return s;
  },
  penguin: (t) => {
    const s = sphereHead(t.c1, 0.44, 0.95);
    s.g.add(m(G.sph(), mat(t.c2 ?? W), [0, -0.02, 0.12], [0.36, 0.34, 0.34]));
    s.g.add(m(G.cone(), mat('#ffa94d'), [0, -0.08, 0.48], [0.07, 0.14, 0.05], [PI / 2, 0, 0]));
    s.face.y = 0.1;
    s.face.z = 0.43;
    s.mouth = false;
    return s;
  },
  octopus: (t) => {
    const s = sphereHead(t.c1, 0.48, 1.05);
    for (const [x, y, z] of [[0.3, 0.25, 0.25], [-0.32, 0.3, 0.2], [0.1, 0.42, 0.18]]) s.g.add(m(G.sph(), mat(shade(t.c1, 0.1)), [x, y, z], 0.06));
    return s;
  },
  cone: (t) => {
    const h = group(
      m(G.cone(), mat(t.c1), [0, 0.05, 0], [0.38, 0.95, 0.38]),
      m(G.cylTaper(0.82), mat(t.c2 ?? W), [0, 0.02, 0], [0.252, 0.18, 0.252]),
      m(G.rbox(0.08), mat(t.c1), [0, -0.44, 0], [0.7, 0.08, 0.7]),
    );
    return { g: h, top: 0.52, bottom: -0.48, face: { y: -0.18, z: 0.29, spread: 0.11, size: 0.06 }, half: 0.38, mouth: true };
  },
  disco: (t) => {
    const g = new THREE.SphereGeometry(1, 16, 12).toNonIndexed();
    g.computeVertexNormals();
    const h = group(
      m(g, mat(t.c1, 'metal'), [0, 0, 0], 0.46),
      m(G.cyl(), mat('#868e96', 'metal'), [0, 0.5, 0], [0.04, 0.12, 0.04]),
    );
    (h.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: t.c1, metalness: 0.55, roughness: 0.18, flatShading: true });
    return { g: h, top: 0.55, bottom: -0.46, face: { y: 0, z: 0.46, spread: 0.16, size: 0.08 }, half: 0.46, mouth: false };
  },
  mic: (t) => {
    const h = group(
      m(G.sph(), mat(t.c2 ?? '#ced4da', 'metal'), [0, 0.12, 0], 0.4),
      m(G.cylTaper(1.4), mat(t.c1), [0, -0.38, 0], [0.18, 0.4, 0.18], [PI, 0, 0]),
      m(G.tor(0.1), mat(t.c1), [0, -0.14, 0], [0.3, 0.3, 0.3], [PI / 2, 0, 0]),
    );
    const grid = mat(shade(t.c2 ?? '#ced4da', -0.15), 'metal');
    for (let i = 0; i < 4; i++) h.add(m(G.tor(0.015), grid, [0, 0.12, 0], 0.402, [0, (i / 4) * PI, 0]));
    return { g: h, top: 0.52, bottom: -0.58, face: { y: 0.12, z: 0.39, spread: 0.14, size: 0.07 }, half: 0.4, mouth: true };
  },
  cheese: (t) => {
    const h = group(m(G.tri(), mat(t.c1), [0, 0, 0], [0.48, 0.52, 0.55]));
    for (const [x, y, z] of [[-0.15, -0.18, 0.3], [0.2, -0.2, 0.3], [0.32, 0.05, 0.1], [-0.3, 0.0, -0.1]]) h.add(m(G.sph(), mat(shade(t.c1, -0.15)), [x, y, z], 0.08));
    return { g: h, top: 0.55, bottom: -0.38, face: { y: 0.05, z: 0.36, spread: 0.13, size: 0.07 }, half: 0.5, mouth: true };
  },
  jelly: (t) => {
    const h = group(
      m(G.hemi(), mat(t.c1, 'glass'), [0, -0.05, 0], [0.5, 0.48, 0.5]),
      m(G.sph(), mat(t.c2 ?? '#ffec99', 'glow'), [0, 0.12, 0], 0.16),
    );
    return { g: h, top: 0.43, bottom: -0.1, face: { y: 0.06, z: 0.43, spread: 0.16, size: 0.07 }, half: 0.5, mouth: true };
  },
  carrot: (t) => {
    const h = group(m(G.cone(), mat(t.c1), [0, -0.05, 0], [0.32, 1.0, 0.32], [PI, 0, 0]));
    for (let i = 0; i < 4; i++) h.add(m(G.tor(0.04), mat(shade(t.c1, -0.12)), [0, 0.2 - i * 0.2, 0], [0.28 - i * 0.06, 0.28 - i * 0.06, 0.3], [PI / 2, 0, 0]));
    const lm = mat(t.c2 ?? '#40c057');
    for (let i = 0; i < 3; i++) h.add(m(G.cone(), lm, [(i - 1) * 0.08, 0.62, 0], [0.06, 0.3, 0.06], [0, 0, (i - 1) * 0.4]));
    return { g: h, top: 0.75, bottom: -0.55, face: { y: 0.18, z: 0.25, spread: 0.11, size: 0.06 }, half: 0.32, mouth: true };
  },
  burger: (t) => {
    const h = group(
      m(G.hemi(), mat(t.c1), [0, 0.08, 0], [0.48, 0.36, 0.48]),
      m(G.cyl(), mat('#69db7c'), [0, 0.04, 0], [0.5, 0.05, 0.5]),
      m(G.cyl(), mat('#ffd43b'), [0, -0.02, 0], [0.49, 0.04, 0.49], [0, 0.4, 0]),
      m(G.cyl(), mat(t.c2 ?? '#7a3e1d'), [0, -0.1, 0], [0.48, 0.13, 0.48]),
      m(G.cyl(), mat(t.c1), [0, -0.24, 0], [0.47, 0.14, 0.47]),
    );
    for (let i = 0; i < 9; i++) {
      const a = i * 2.2;
      h.add(m(G.sph(), mat('#fff3bf'), [Math.cos(a) * 0.3, 0.3 + (i % 3) * 0.04, Math.sin(a) * 0.3], [0.03, 0.015, 0.02]));
    }
    return { g: h, top: 0.44, bottom: -0.31, face: { y: -0.1, z: 0.47, spread: 0.17, size: 0.07 }, half: 0.5, mouth: false };
  },
  sushi: (t) => {
    const h = group(
      m(G.rbox(0.3), mat(t.c2 ?? '#f8f4ec', 'matte'), [0, -0.1, 0], [0.75, 0.4, 0.5]),
      m(G.rbox(0.25), mat(t.c1), [0, 0.16, 0], [0.82, 0.18, 0.55], [0, 0, 0.05]),
      m(G.rbox(0.05), mat(t.c3 ?? '#22313f'), [0, 0, 0], [0.15, 0.62, 0.56]),
    );
    for (let i = 0; i < 3; i++) h.add(m(G.box(), mat(shade(t.c1, 0.15)), [-0.25 + i * 0.25, 0.25, 0], [0.04, 0.02, 0.5], [0, 0.5, 0]));
    return { g: h, top: 0.27, bottom: -0.3, face: { y: -0.08, z: 0.26, spread: 0.2, size: 0.07 }, half: 0.42, mouth: true };
  },
  tomato: (t) => {
    const s = sphereHead(t.c1, 0.46, 0.85);
    s.g.add(leafCrown(t.c2 ?? '#2b8a3e', 0.37, 5, 0.18));
    return s;
  },
  juicebox: (t) => {
    const h = group(
      m(G.rbox(0.08), mat(t.c1), [0, 0, 0], [0.55, 0.85, 0.38]),
      m(G.rbox(0.06), mat(t.c2 ?? '#ffd6e0', 'matte'), [0, -0.05, 0.19], [0.42, 0.42, 0.02]),
      m(G.heart(), mat('#ff2d55'), [0, -0.05, 0.21], 0.14),
    );
    return { g: h, top: 0.43, bottom: -0.43, face: { y: 0.22, z: 0.2, spread: 0.12, size: 0.06 }, half: 0.28, mouth: false };
  },
  pillow: (t) => {
    const g = G.rbox(0.45).clone();
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const k = 1 - 0.5 * (Math.abs(x) * 2) * (Math.abs(y) * 2);
      pos.setZ(i, z * Math.max(0.35, k));
    }
    g.computeVertexNormals();
    const h = group(m(g, mat(t.c1, 'fabric'), [0, 0, 0], [0.95, 0.75, 0.5]));
    for (const [x, y] of [[-0.45, 0.35], [0.45, 0.35], [-0.45, -0.35], [0.45, -0.35]]) h.add(m(G.cone(), mat(t.c1, 'fabric'), [x, y, 0], [0.06, 0.12, 0.06], [0, 0, Math.atan2(y, x) - PI / 2]));
    return { g: h, top: 0.38, bottom: -0.38, face: { y: 0.02, z: 0.25, spread: 0.18, size: 0.07 }, half: 0.48, mouth: true };
  },
  sponge: (t) => {
    const h = group(m(G.rbox(0.06), mat(t.c1, 'matte'), [0, 0, 0], [0.62, 0.78, 0.36]), m(G.rbox(0.06), mat(t.c2 ?? '#94d82d', 'matte'), [0, 0.42, 0], [0.62, 0.12, 0.36]));
    for (let i = 0; i < 9; i++) h.add(m(G.sph(), mat(shade(t.c1, -0.18)), [((i * 37) % 50) / 100 - 0.25, ((i * 53) % 60) / 100 - 0.32, 0.17], [0.035, 0.035, 0.02]));
    return { g: h, top: 0.48, bottom: -0.39, face: { y: 0.1, z: 0.19, spread: 0.13, size: 0.07 }, half: 0.31, mouth: true };
  },
  pencil: (t) => {
    const h = group(
      m(new THREE.CylinderGeometry(1, 1, 1, 6), mat(t.c1), [0, 0, 0], [0.2, 0.9, 0.2]),
      m(G.cone(), mat('#f4d6a0', 'matte'), [0, -0.58, 0], [0.2, 0.26, 0.2], [PI, 0, 0]),
      m(G.cone(), mat('#343a40'), [0, -0.68, 0], [0.06, 0.08, 0.06], [PI, 0, 0]),
      m(G.cyl(), mat('#ced4da', 'metal'), [0, 0.5, 0], [0.205, 0.12, 0.205]),
      m(G.cap(0.2), mat(t.c2 ?? '#ffa8a8'), [0, 0.62, 0], [0.19, 0.12, 0.19]),
    );
    return { g: h, top: 0.75, bottom: -0.72, face: { y: 0.15, z: 0.19, spread: 0.08, size: 0.05 }, half: 0.2, mouth: true };
  },
  kiwi: (t) => {
    const s = sphereHead(t.c1, 0.42, 0.95, 'fabric');
    s.g.add(m(G.cyl(), mat(t.c2 ?? '#94d82d'), [0, 0, 0.36], [0.28, 0.06, 0.28], [PI / 2, 0, 0]));
    s.g.add(m(G.cyl(), mat('#f8f9fa'), [0, 0, 0.395], [0.08, 0.02, 0.08], [PI / 2, 0, 0]));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      s.g.add(m(G.sph(), mat(K), [Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.4], [0.015, 0.025, 0.01], [0, 0, a]));
    }
    s.face = { y: 0.3, z: 0.25, spread: 0.12, size: 0.055 };
    s.mouth = false;
    return s;
  },
  popcorn: (t) => {
    const h = group(m(G.cylTaper(1.3), mat(t.c2 ?? '#e03131'), [0, -0.12, 0], [0.32, 0.62, 0.32], [PI, 0, 0]));
    for (let i = 0; i < 6; i++) h.add(m(G.box(), mat(W, 'matte'), [0, -0.12, 0], [0.03, 0.62, 0.36], [0, (i / 6) * PI, 0]));
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39996;
      const r = 0.12 + (i % 4) * 0.06;
      h.add(m(G.ico(), mat(t.c1, 'matte'), [Math.cos(a) * r, 0.24 + ((i * 7) % 5) * 0.03, Math.sin(a) * r], 0.1));
    }
    return { g: h, top: 0.45, bottom: -0.43, face: { y: -0.08, z: 0.36, spread: 0.13, size: 0.065 }, half: 0.4, mouth: true };
  },
  camera: (t) => {
    const h = group(
      m(G.rbox(0.12), mat(t.c1), [0, 0, 0], [0.8, 0.52, 0.4]),
      m(G.rbox(0.1), mat(t.c2 ?? '#f1f3f5'), [0, 0.12, 0], [0.82, 0.16, 0.42]),
      m(G.cyl(), mat('#212529'), [0, -0.03, 0.22], [0.2, 0.12, 0.2], [PI / 2, 0, 0]),
      m(G.cyl(), mat('#74c0fc', 'glass'), [0, -0.03, 0.29], [0.15, 0.02, 0.15], [PI / 2, 0, 0]),
      m(G.rbox(0.2), mat(K), [-0.25, 0.32, 0], [0.18, 0.1, 0.18]),
    );
    return { g: h, top: 0.37, bottom: -0.26, face: { y: -0.03, z: 0.31, spread: 0, size: 0.06 }, half: 0.4, mouth: false };
  },
  handheld: (t) => {
    const h = group(
      m(G.rbox(0.1), mat(t.c1), [0, 0, 0], [0.6, 0.92, 0.2]),
      m(G.rbox(0.1), mat('#495057'), [0, 0.18, 0.1], [0.48, 0.4, 0.02]),
      m(G.rbox(0.1), mat(t.c2 ?? '#8fbc8f', 'glow'), [0, 0.18, 0.115], [0.36, 0.3, 0.01]),
      m(G.box(), mat(K), [-0.14, -0.22, 0.11], [0.14, 0.04, 0.03]),
      m(G.box(), mat(K), [-0.14, -0.22, 0.11], [0.04, 0.14, 0.03]),
      m(G.sph(), mat('#c2255c'), [0.12, -0.18, 0.11], 0.04),
      m(G.sph(), mat('#c2255c'), [0.2, -0.24, 0.11], 0.04),
    );
    return { g: h, top: 0.46, bottom: -0.46, face: { y: 0.2, z: 0.13, spread: 0.08, size: 0.05 }, half: 0.3, mouth: true };
  },
  flipphone: (t) => {
    const h = group(
      m(G.rbox(0.1), mat(t.c1), [0, -0.2, 0], [0.42, 0.5, 0.12]),
      m(G.rbox(0.1), mat(t.c1), [0, 0.28, -0.04], [0.42, 0.48, 0.1], [-0.2, 0, 0]),
      m(G.rbox(0.1), mat(t.c2 ?? '#a9e34b', 'glow'), [0, 0.29, 0.02], [0.32, 0.32, 0.01], [-0.2, 0, 0]),
      m(G.cyl(), mat('#adb5bd', 'metal'), [0.16, 0.56, -0.06], [0.02, 0.2, 0.02]),
    );
    for (let i = 0; i < 9; i++) h.add(m(G.rbox(0.3), mat('#dee2e6'), [-0.1 + (i % 3) * 0.1, -0.1 - Math.floor(i / 3) * 0.1, 0.07], [0.07, 0.05, 0.02]));
    return { g: h, top: 0.66, bottom: -0.45, face: { y: 0.3, z: 0.05, spread: 0.08, size: 0.045 }, half: 0.22, mouth: true };
  },
  tire: (t) => {
    const h = group(
      m(G.tor(0.45), mat(t.c1, 'matte'), [0, 0, 0], [0.36, 0.36, 0.5]),
      m(G.cyl(), mat(t.c2 ?? '#adb5bd', 'metal'), [0, 0, 0], [0.22, 0.14, 0.22], [PI / 2, 0, 0]),
    );
    for (let i = 0; i < 12; i++) h.add(m(G.box(), mat(shade(t.c1, 0.08), 'matte'), [Math.cos((i / 12) * PI * 2) * 0.52, Math.sin((i / 12) * PI * 2) * 0.52, 0], [0.06, 0.04, 0.3], [0, 0, (i / 12) * PI * 2]));
    return { g: h, top: 0.53, bottom: -0.53, face: { y: 0.02, z: 0.08, spread: 0.1, size: 0.05 }, half: 0.53, mouth: true };
  },
  mower: (t) => {
    const h = group(
      m(G.rbox(0.2), mat(t.c1), [0, 0, 0], [0.75, 0.38, 0.7]),
      m(G.cyl(), mat('#343a40'), [0, 0.24, 0], [0.18, 0.1, 0.18]),
      m(G.cyl(), mat('#adb5bd', 'metal'), [0, 0.38, -0.4], [0.025, 0.7, 0.025], [-0.8, 0, 0]),
    );
    for (let i = 0; i < 7; i++) h.add(m(G.cap(1), mat(t.c2 ?? '#ffe066', 'matte'), [-0.3 + i * 0.1, -0.2, 0.36], [0.02, 0.06, 0.02], [0.3, 0, 0.3]));
    return { g: h, top: 0.5, bottom: -0.19, face: { y: 0.02, z: 0.35, spread: 0.18, size: 0.07 }, half: 0.38, mouth: true };
  },
  globe: (t) => {
    const s = sphereHead(t.c1, 0.44);
    for (const [x, y, z, sc] of [[0.2, 0.15, 0.35, 0.16], [-0.25, -0.12, 0.32, 0.14], [0.05, -0.32, 0.28, 0.1], [-0.3, 0.25, -0.2, 0.15], [0.32, -0.1, -0.25, 0.13]] as const)
      s.g.add(m(G.sph(), mat(t.c2 ?? '#51cf66', 'matte'), [x, y, z], [sc, sc * 0.8, 0.12]));
    s.g.children.slice(1).forEach((c) => c.lookAt(c.position.clone().multiplyScalar(3)));
    return s;
  },
  lamppost: (t) => {
    const h = group(
      m(G.cyl(), mat(t.c1, 'metal'), [0, -0.3, 0], [0.06, 0.8, 0.06]),
      m(G.cylTaper(0.6), mat(t.c1, 'metal'), [0, 0.15, 0], [0.24, 0.12, 0.24], [PI, 0, 0]),
      m(G.sph(), mat(t.c2 ?? '#ffe066', 'glow'), [0, 0.32, 0], [0.22, 0.24, 0.22]),
      m(G.cone(), mat(t.c1, 'metal'), [0, 0.6, 0], [0.26, 0.2, 0.26]),
    );
    return { g: h, top: 0.72, bottom: -0.7, face: { y: 0.32, z: 0.21, spread: 0.08, size: 0.045 }, half: 0.26, mouth: true };
  },
  bunny: (t) => {
    const s = sphereHead(t.c1, 0.42, 0.95);
    for (const x of [-1, 1]) {
      s.g.add(m(G.cap(1.6), mat(t.c1), [x * 0.16, 0.62, -0.02], [0.1, 0.16, 0.08], [0, 0, -x * 0.18]));
      s.g.add(m(G.cap(1.6), mat(t.c2 ?? '#ffc2d6'), [x * 0.16, 0.62, 0.05], [0.055, 0.12, 0.04], [0, 0, -x * 0.18]));
    }
    s.top = 1.0;
    return s;
  },
  kid: (t) => {
    // humans: skin c1, hair c2
    const s = sphereHead(t.c1, 0.42, 0.98, 'matte');
    s.g.add(m(G.hemi(), mat(t.c2 ?? '#3b2f2f', 'matte'), [0, 0.04, -0.03], [0.44, 0.42, 0.44], [-0.35, 0, 0]));
    s.g.add(m(G.sph(), mat(t.c1, 'matte'), [-0.42, 0, 0], [0.06, 0.1, 0.06]));
    s.g.add(m(G.sph(), mat(t.c1, 'matte'), [0.42, 0, 0], [0.06, 0.1, 0.06]));
    s.face.y = -0.02;
    return s;
  },
};
