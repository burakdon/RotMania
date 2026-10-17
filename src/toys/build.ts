// Assembles a vinyl-toy brainrot from a recipe: legs → body → head → face → arms → accessories.
import * as THREE from 'three';
import type { ToyRecipe } from '../game/types';
import { HEADS, type HeadInfo } from './heads';
import { G, group, m, mat, shade } from './kit';

const K = '#16161d';
const W = '#ffffff';
const PI = Math.PI;
export const TOY_HEIGHT = 1.4;

interface Frame {
  hip: number;
  bodyTop: number;
  bodyY: number;
  bodyHalf: number;
  hasBody: boolean;
}

function legs(t: ToyRecipe, root: THREE.Group): number {
  const lc = t.legs ?? 'nubs';
  const skin = mat(t.c3 ?? shade(t.c1, -0.08));
  switch (lc) {
    case 'nubs':
      root.add(m(G.sph(), skin, [-0.13, 0.07, 0.02], [0.1, 0.08, 0.12]), m(G.sph(), skin, [0.13, 0.07, 0.02], [0.1, 0.08, 0.12]));
      return 0.1;
    case 'sneakers': {
      const sole = mat(W);
      const upper = mat(t.c2 && t.legs === 'sneakers' ? t.c2 : '#e03131');
      for (const x of [-0.14, 0.14]) {
        root.add(m(G.rbox(0.35), upper, [x, 0.09, 0.05], [0.16, 0.12, 0.26]));
        root.add(m(G.rbox(0.3), sole, [x, 0.03, 0.05], [0.17, 0.05, 0.28]));
      }
      return 0.14;
    }
    case 'boots':
      for (const x of [-0.13, 0.13]) {
        root.add(m(G.rbox(0.3), mat('#343a40'), [x, 0.12, 0], [0.15, 0.24, 0.17]));
        root.add(m(G.rbox(0.3), mat('#343a40'), [x, 0.05, 0.05], [0.16, 0.1, 0.25]));
      }
      return 0.22;
    case 'long':
      for (const x of [-0.1, 0.1]) {
        root.add(m(G.cyl(), mat(t.c3 ?? shade(t.c1, -0.1)), [x, 0.22, 0], [0.035, 0.36, 0.035]));
        root.add(m(G.sph(), mat(K), [x, 0.04, 0.03], [0.07, 0.05, 0.1]));
      }
      return 0.4;
    case 'wheels':
      for (const x of [-0.18, 0.18]) {
        root.add(m(G.tor(0.45), mat('#212529', 'matte'), [x, 0.1, 0], [0.09, 0.09, 0.09], [0, PI / 2, 0]));
        root.add(m(G.cyl(), mat('#ced4da', 'metal'), [x, 0.1, 0], [0.04, 0.05, 0.04], [0, 0, PI / 2]));
      }
      root.add(m(G.cyl(), mat('#adb5bd', 'metal'), [0, 0.1, 0], [0.02, 0.36, 0.02], [0, 0, PI / 2]));
      return 0.16;
    case 'none':
    default:
      return 0;
  }
}

function body(t: ToyRecipe, root: THREE.Group, hip: number): Frame {
  const bc = t.c3 ?? shade(t.c1, -0.06);
  const kind = t.body ?? 'bean';
  const add = (o: THREE.Object3D) => root.add(o);
  switch (kind) {
    case 'bean':
      add(m(G.cap(0.7), mat(bc), [0, hip + 0.3, 0], [0.26, 0.26, 0.24]));
      return { hip, bodyTop: hip + 0.56, bodyY: hip + 0.3, bodyHalf: 0.26, hasBody: true };
    case 'blob':
      add(m(G.sph(), mat(bc), [0, hip + 0.26, 0], [0.34, 0.28, 0.3]));
      return { hip, bodyTop: hip + 0.48, bodyY: hip + 0.26, bodyHalf: 0.33, hasBody: true };
    case 'tall':
      add(m(G.rbox(0.25), mat(bc), [0, hip + 0.3, 0], [0.5, 0.6, 0.42]));
      return { hip, bodyTop: hip + 0.58, bodyY: hip + 0.3, bodyHalf: 0.26, hasBody: true };
    case 'suit': {
      add(m(G.cap(0.7), mat(bc, 'fabric'), [0, hip + 0.3, 0], [0.27, 0.26, 0.25]));
      add(m(G.cone(), mat(W, 'matte'), [0, hip + 0.42, 0.2], [0.09, 0.22, 0.04], [PI, 0, 0]));
      add(m(G.box(), mat(shade(bc, -0.05), 'fabric'), [-0.09, hip + 0.42, 0.21], [0.05, 0.22, 0.02], [0, 0.3, 0.35]));
      add(m(G.box(), mat(shade(bc, -0.05), 'fabric'), [0.09, hip + 0.42, 0.21], [0.05, 0.22, 0.02], [0, -0.3, -0.35]));
      return { hip, bodyTop: hip + 0.56, bodyY: hip + 0.3, bodyHalf: 0.27, hasBody: true };
    }
    case 'tutu':
      add(m(G.cap(0.5), mat(t.c1), [0, hip + 0.3, 0], [0.2, 0.22, 0.19]));
      add(m(G.cone(), mat(bc, 'fabric'), [0, hip + 0.2, 0], [0.42, 0.18, 0.42]));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2;
        add(m(G.sph(), mat(bc, 'fabric'), [Math.cos(a) * 0.32, hip + 0.14, Math.sin(a) * 0.32], [0.11, 0.05, 0.11]));
      }
      return { hip, bodyTop: hip + 0.52, bodyY: hip + 0.32, bodyHalf: 0.22, hasBody: true };
    case 'coat':
      return trenchcoat(t, root, hip);
    case 'none':
    default:
      return { hip, bodyTop: hip, bodyY: hip, bodyHalf: 0, hasBody: false };
  }
}

/** Strawbaby's trench coat. Belted, popped collar, double-breasted. */
function trenchcoat(t: ToyRecipe, root: THREE.Group, hip: number): Frame {
  const cc = t.c3 ?? '#c8a165';
  const coat = mat(cc, 'fabric');
  const dark = mat(shade(cc, -0.14), 'fabric');
  const add = (o: THREE.Object3D) => root.add(o);
  add(m(G.cylTaper(0.62), coat, [0, hip + 0.28, 0], [0.34, 0.56, 0.3]));
  add(m(G.sph(), coat, [0, hip + 0.56, 0], [0.22, 0.1, 0.19]));
  // skirt flare
  add(m(G.cylTaper(0.85), coat, [0, hip + 0.06, 0], [0.37, 0.14, 0.33]));
  // belt + buckle
  add(m(G.cyl(), dark, [0, hip + 0.3, 0], [0.285, 0.05, 0.255]));
  add(m(G.rbox(0.2), mat('#8d6e3c', 'metal'), [0, hip + 0.3, 0.255], [0.08, 0.06, 0.02]));
  add(m(G.cap(1), dark, [0.08, hip + 0.22, 0.255], [0.02, 0.07, 0.02], [0, 0, 0.3]));
  // buttons
  for (const y of [0.42, 0.18, 0.08]) for (const x of [-0.07, 0.07]) add(m(G.cyl(), mat('#5c3d2e'), [x, hip + y, 0.26 - (0.42 - y) * 0.06], [0.022, 0.012, 0.022], [PI / 2 - 0.1, 0, 0]));
  // lapels
  add(m(G.box(), dark, [-0.08, hip + 0.48, 0.18], [0.1, 0.16, 0.02], [0.25, 0.3, 0.5]));
  add(m(G.box(), dark, [0.08, hip + 0.48, 0.18], [0.1, 0.16, 0.02], [0.25, -0.3, -0.5]));
  // popped collar
  add(m(G.cylTaper(1.25), coat, [0, hip + 0.66, -0.02], [0.2, 0.16, 0.18], [0, 0, 0]));
  return { hip, bodyTop: hip + 0.64, bodyY: hip + 0.32, bodyHalf: 0.3, hasBody: true };
}

function eyes(t: ToyRecipe, h: HeadInfo, head: THREE.Group) {
  const kind = t.eyes ?? 'dot';
  const { y, z, spread, size } = h.face;
  if (kind === 'none' || size === 0) return;
  const black = mat(K);
  const white = mat(W, 'glow');
  const add = (o: THREE.Object3D) => head.add(o);
  const xs = spread === 0 ? [0] : [-spread, spread];
  switch (kind) {
    case 'dot':
      for (const x of xs) add(m(G.sph(), black, [x, y, z], [size * 0.75, size * 0.9, size * 0.5]));
      break;
    case 'big':
      for (const x of xs) {
        add(m(G.sph(), black, [x, y, z], [size, size * 1.25, size * 0.55]));
        add(m(G.sph(), white, [x + size * 0.35, y + size * 0.45, z + size * 0.4], size * 0.32));
        add(m(G.sph(), white, [x - size * 0.3, y - size * 0.4, z + size * 0.35], size * 0.16));
      }
      break;
    case 'sleepy':
      for (const x of xs) add(m(G.tor(0.18, PI), black, [x, y + size * 0.2, z], [size * 0.85, size * 0.7, size * 0.6], [0, 0, PI]));
      break;
    case 'angry':
      for (const x of xs) {
        add(m(G.sph(), black, [x, y, z], [size * 0.85, size, size * 0.5]));
        add(m(G.sph(), white, [x + size * 0.3, y + size * 0.35, z + size * 0.35], size * 0.25));
        add(m(G.rbox(0.4), black, [x, y + size * 1.6, z], [size * 1.9, size * 0.45, size * 0.4], [0, 0, x < 0 ? -0.45 : 0.45]));
      }
      break;
    case 'dizzy':
      for (const x of xs) add(m(G.tor(0.25), black, [x, y, z], size));
      break;
    case 'one':
      add(m(G.sph(), white, [0, y, z], [size * 1.7, size * 1.7, size * 0.8]));
      add(m(G.sph(), black, [0, y, z + size * 0.5], [size * 0.9, size * 0.9, size * 0.5]));
      break;
    case 'shades': {
      const lens = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.05, metalness: 0.4, clearcoat: 1 });
      for (const x of xs) add(m(G.rbox(0.35), lens, [x, y, z + size * 0.2], [size * 2.4, size * 1.6, size * 0.4]));
      add(m(G.box(), lens, [0, y + size * 0.4, z + size * 0.2], [spread * 0.8, size * 0.3, size * 0.25]));
      break;
    }
  }
  if (h.mouth && kind !== 'one') {
    if (kind === 'angry') add(m(G.cap(1), black, [0, y - size * 2.2, z - size * 0.15], [size * 0.18, size * 0.5, size * 0.18], [0, 0, PI / 2]));
    else add(m(G.tor(0.2, PI), black, [0, y - size * 1.7, z - size * 0.1], [size * 0.7, size * 0.6, size * 0.5], [0, 0, PI]));
  }
}

function arms(t: ToyRecipe, root: THREE.Group, f: Frame, h: HeadInfo, headY: number, hs: number) {
  const kind = t.arms ?? 'nubs';
  const ac = t.c3 ?? shade(t.c1, -0.06);
  const x0 = f.hasBody ? f.bodyHalf : h.half * hs;
  const y0 = f.hasBody ? f.bodyY + 0.08 : headY - 0.05;
  const add = (o: THREE.Object3D) => root.add(o);
  for (const side of [-1, 1]) {
    const x = side * (x0 + 0.02);
    switch (kind) {
      case 'nubs':
        add(m(G.sph(), mat(ac), [x, y0, 0.02], [0.09, 0.11, 0.09], [0, 0, side * 0.4]));
        break;
      case 'sticks':
        add(m(G.cyl(), mat(K), [x + side * 0.1, y0 - 0.06, 0], [0.018, 0.26, 0.018], [0, 0, side * 0.9]));
        add(m(G.sph(), mat(W), [x + side * 0.21, y0 - 0.14, 0], 0.05));
        break;
      case 'claws': {
        const cm = mat(t.c3 ?? '#fa5252');
        add(m(G.cyl(), cm, [x + side * 0.08, y0, 0], [0.035, 0.2, 0.035], [0, 0, side * 0.8]));
        add(m(G.sph(), cm, [x + side * 0.2, y0 + 0.12, 0.02], [0.1, 0.12, 0.08]));
        add(m(G.cone(), cm, [x + side * 0.24, y0 + 0.26, 0.02], [0.05, 0.16, 0.05], [0, 0, -side * 0.3]));
        add(m(G.cone(), cm, [x + side * 0.15, y0 + 0.25, 0.02], [0.04, 0.12, 0.04], [0, 0, side * 0.4]));
        break;
      }
      case 'wings':
        add(m(G.sph(), mat(ac), [x + side * 0.02, y0 - 0.02, -0.02], [0.06, 0.18, 0.13], [0, 0, side * 0.35]));
        break;
      case 'fins':
        add(m(G.sph(), mat(ac), [x + side * 0.03, y0 - 0.04, 0], [0.05, 0.17, 0.1], [0, 0, side * 0.7]));
        break;
      case 'tentacles':
        break;
      case 'none':
        break;
    }
  }
  if (kind === 'tentacles') {
    const tm = mat(t.c1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + 0.3;
      const r = h.half * hs * 0.6;
      const pts = [0, 1, 2, 3].map((k) => new THREE.Vector3(Math.cos(a) * (r + k * 0.06), headY + h.bottom * hs * 0.6 - k * 0.12, Math.sin(a) * (r + k * 0.06) + Math.sin(k * 1.4 + i) * 0.04));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.045, 10, false);
      add(m(tube, tm));
      add(m(G.sph(), tm, pts[3].toArray() as [number, number, number], 0.045));
    }
  }
}

function accessories(t: ToyRecipe, root: THREE.Group, head: THREE.Group, h: HeadInfo, f: Frame, headY: number, hs: number) {
  const list = t.acc ?? [];
  const { y: fy, z: fz, spread, size } = h.face;
  const addH = (o: THREE.Object3D) => head.add(o);
  const addR = (o: THREE.Object3D) => root.add(o);
  const neckY = f.hasBody ? f.bodyTop - 0.04 : headY + h.bottom * hs;
  const handX = (f.hasBody ? f.bodyHalf : h.half * hs) + 0.16;
  const handY = f.hasBody ? f.bodyY - 0.02 : headY - 0.12;
  for (const a of list) {
    switch (a) {
      case 'blush':
        for (const x of [-1, 1]) addH(m(G.sph(), mat('#ff8fab', 'matte'), [x * (spread + size * 1.2), fy - size * 1.4, fz - size * 0.4], [size * 0.9, size * 0.5, size * 0.3]));
        break;
      case 'fuse':
        addH(m(G.cyl(), mat('#495057'), [0.1, h.top + 0.08, 0], [0.02, 0.18, 0.02], [0, 0, -0.4]));
        addH(m(G.sph(), mat('#ffa94d', 'glow'), [0.15, h.top + 0.18, 0], 0.05));
        break;
      case 'headband':
        addH(m(G.tor(0.12), mat('#e03131', 'fabric'), [0, fy + size * 2.4, 0], [h.half * 1.0, h.half * 1.0, h.half * 1.0], [PI / 2, 0, 0]));
        addH(m(G.cap(1), mat('#e03131', 'fabric'), [h.half * 0.7, fy + size * 2.2, -h.half * 0.75], [0.03, 0.1, 0.02], [0.3, 0, -0.9]));
        break;
      case 'ghosttail':
        addH(m(G.cone(), mat('#ffd43b'), [0, h.bottom - 0.15, -0.05], [0.25, 0.35, 0.2], [PI + 0.3, 0, 0]));
        break;
      case 'helmet':
        addH(m(G.sph(), mat('#e7f5ff', 'glass'), [0, 0.02, 0], h.half * 1.3));
        break;
      case 'bowtie':
        for (const x of [-1, 1]) addR(m(G.cone(), mat('#e03131'), [x * 0.06, neckY, 0.2], [0.05, 0.1, 0.04], [0, 0, (x * PI) / 2]));
        addR(m(G.sph(), mat('#c92a2a'), [0, neckY, 0.21], 0.03));
        break;
      case 'glasses':
        for (const x of [-spread, spread]) addH(m(G.tor(0.12), mat('#212529'), [x, fy, fz + size * 0.3], size * 1.5));
        addH(m(G.cyl(), mat('#212529'), [0, fy + size * 0.3, fz + size * 0.3], [0.008, Math.max(0.01, spread * 2 - size * 3), 0.008], [0, 0, PI / 2]));
        break;
      case 'headphones':
        addH(m(G.tor(0.08, PI), mat('#212529'), [0, 0.02, 0], [h.half * 1.08, h.top * 1.12, h.half], [0, 0, 0]));
        for (const x of [-1, 1]) addH(m(G.cyl(), mat('#e64980'), [x * h.half * 1.02, 0, 0], [0.12, 0.08, 0.12], [0, 0, PI / 2]));
        break;
      case 'mask':
        addH(m(G.cyl(), mat('#343a40', 'fabric'), [0, fy, 0], [h.half * 0.98, size * 2.6, h.half * 0.98]));
        break;
      case 'beret':
        addH(m(G.sph(), mat('#3d5a80', 'fabric'), [0.05, h.top * 0.9, 0], [h.half * 0.8, 0.08, h.half * 0.75], [0, 0, -0.25]));
        addH(m(G.cyl(), mat('#3d5a80'), [0.05, h.top * 0.9 + 0.09, 0], [0.015, 0.05, 0.015]));
        break;
      case 'mustache':
        for (const x of [-1, 1]) addH(m(G.cap(1), mat('#3b2f2f'), [x * size * 1.1, fy - size * 1.3, fz + size * 0.2], [size * 0.45, size * 0.9, size * 0.4], [0, 0, (x * PI) / 2.6]));
        break;
      case 'chain':
        addR(m(G.tor(0.08), mat('#fcc419', 'metal'), [0, neckY - 0.04, 0.05], [0.2, 0.2, 0.2], [PI / 2 - 0.4, 0, 0]));
        addR(m(G.cyl(), mat('#fcc419', 'metal'), [0, neckY - 0.2, 0.25], [0.06, 0.02, 0.06], [PI / 2 - 0.3, 0, 0]));
        break;
      case 'straw':
        addH(m(G.cyl(), mat('#f8f9fa'), [0.12, h.top + 0.14, 0], [0.025, 0.3, 0.025]));
        addH(m(G.cyl(), mat('#f8f9fa'), [0.17, h.top + 0.3, 0], [0.025, 0.12, 0.025], [0, 0, -1]));
        break;
      case 'fridgedoor':
        addR(m(G.cap(1), mat('#adb5bd', 'metal'), [0.18, f.bodyY + 0.05, 0.22], [0.02, 0.1, 0.02]));
        break;
      case 'toast':
        addH(m(G.rbox(0.25), mat('#d4a373', 'matte'), [0, h.top + 0.06, -0.15], [0.3, 0.26, 0.06]));
        break;
      case 'phone':
        addR(m(G.rbox(0.2), mat('#212529'), [handX, handY + 0.1, 0.12], [0.12, 0.22, 0.03], [0, -0.3, 0.1]));
        addR(m(G.rbox(0.2), mat('#ff8fab', 'glow'), [handX - 0.005, handY + 0.1, 0.14], [0.1, 0.19, 0.01], [0, -0.3, 0.1]));
        break;
      case 'wings':
        for (const x of [-1, 1]) addH(m(G.sph(), mat('#e7f5ff', 'glass'), [x * h.half * 0.7, h.top * 0.5, -h.half * 0.8], [0.22, 0.12, 0.03], [0.2, x * 0.6, x * 0.5]));
        break;
      case 'cocktail':
        addR(m(G.cone(), mat('#e7f5ff', 'glass'), [handX, handY + 0.12, 0.1], [0.08, 0.1, 0.08], [PI, 0, 0]));
        addR(m(G.cyl(), mat('#e7f5ff', 'glass'), [handX, handY, 0.1], [0.01, 0.14, 0.01]));
        addR(m(G.sph(), mat('#ff922b'), [handX, handY + 0.13, 0.1], [0.06, 0.02, 0.06]));
        break;
      case 'crown': {
        const gm = mat('#fcc419', 'metal');
        addH(m(G.cylTaper(1.1), gm, [0, h.top + 0.04, 0], [0.18, 0.12, 0.18]));
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * PI * 2;
          addH(m(G.cone(), gm, [Math.cos(ang) * 0.17, h.top + 0.14, Math.sin(ang) * 0.17], [0.05, 0.1, 0.05]));
        }
        addH(m(G.sph(), mat('#e03131'), [0, h.top + 0.06, 0.19], 0.03));
        break;
      }
      case 'drum':
        addR(m(G.cyl(), mat('#f8f9fa'), [0, f.hasBody ? f.bodyY : headY - 0.25, 0.32], [0.17, 0.14, 0.17], [PI / 2, 0, 0]));
        addR(m(G.cyl(), mat('#e03131'), [0, f.hasBody ? f.bodyY : headY - 0.25, 0.32], [0.175, 0.04, 0.175], [PI / 2, 0, 0]));
        break;
      case 'horns':
        for (const x of [-1, 1]) addH(m(G.cone(), mat('#e9ecef'), [x * 0.18, h.top * 0.9, -0.05], [0.06, 0.25, 0.06], [-0.4, 0, -x * 0.5]));
        break;
      case 'scarf':
        addR(m(G.tor(0.3), mat(t.c2 ?? '#e03131', 'fabric'), [0, neckY, 0], [0.24, 0.24, 0.24], [PI / 2, 0, 0]));
        addR(m(G.rbox(0.3), mat(t.c2 ?? '#e03131', 'fabric'), [0.12, neckY - 0.12, 0.2], [0.08, 0.22, 0.04], [0, 0, 0.2]));
        break;
      case 'raincloud': {
        const cm = mat('#868e96', 'fabric');
        for (const [x, sz] of [[-0.12, 0.13], [0.08, 0.16], [0.22, 0.11]]) addH(m(G.sph(), cm, [x, h.top + 0.3, 0], sz));
        for (const x of [-0.1, 0.05, 0.18]) addH(m(G.sph(), mat('#4dabf7', 'glass'), [x, h.top + 0.1, 0], [0.025, 0.04, 0.025]));
        break;
      }
      case 'antenna':
        for (const x of [-1, 1]) {
          addH(m(G.cyl(), mat('#868e96', 'metal'), [x * 0.12, h.top + 0.18, 0], [0.012, 0.38, 0.012], [0, 0, -x * 0.5]));
          addH(m(G.sph(), mat('#e03131'), [x * 0.21, h.top + 0.35, 0], 0.03));
        }
        break;
      case 'tear':
        addH(m(G.sph(), mat('#4dabf7', 'glass'), [spread + size * 0.6, fy - size * 1.6, fz], [size * 0.4, size * 0.65, size * 0.3]));
        break;
      case 'steam':
        for (let i = 0; i < 3; i++) addH(m(G.sph(), mat('#f8f9fa', 'glass'), [0.5 + i * 0.06, 0.25 + i * 0.14, 0], 0.05 + i * 0.02));
        break;
      case 'magnets':
        addH(m(G.star(), mat('#fcc419'), [-0.12, 0.25, h.face.z + 0.02], 0.06));
        addH(m(G.heart(), mat('#e64980'), [0.1, 0.32, h.face.z + 0.02], 0.08));
        break;
      case 'earpiece':
        addH(m(G.tor(0.15), mat('#212529'), [h.half, 0, 0.05], 0.05, [0, PI / 2, 0]));
        addH(m(G.cyl(), mat('#212529'), [h.half - 0.02, -0.18, 0.05], [0.008, 0.3, 0.008]));
        break;
      case 'glowstick':
        addR(m(G.cap(1), mat('#ff2d55', 'glow'), [handX, handY + 0.12, 0.08], [0.025, 0.12, 0.025], [0, 0, -0.4]));
        break;
      case 'pearls':
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * PI * 2;
          addR(m(G.sph(), mat('#fff', 'vinyl'), [Math.cos(ang) * 0.17, neckY - 0.02 + (Math.sin(ang) < 0 ? -0.04 : 0), Math.sin(ang) * 0.17], 0.025));
        }
        break;
      case 'mic':
        addR(m(G.sph(), mat('#ced4da', 'metal'), [handX, handY + 0.2, 0.12], 0.05));
        addR(m(G.cylTaper(1.5), mat('#212529'), [handX, handY + 0.1, 0.12], [0.022, 0.14, 0.022], [PI, 0, 0]));
        break;
      case 'backpack':
        addR(m(G.rbox(0.3), mat('#e8590c', 'fabric'), [0, f.bodyY + 0.05, -0.3], [0.32, 0.36, 0.16]));
        break;
      case 'hoodie':
        addR(m(G.tor(0.35), mat(t.c3 ?? '#ffd166', 'fabric'), [0, neckY + 0.02, -0.06], [0.24, 0.24, 0.2], [PI / 2 + 0.3, 0, 0]));
        for (const x of [-0.05, 0.05]) addR(m(G.cyl(), mat(W), [x, neckY - 0.12, 0.24], [0.008, 0.14, 0.008]));
        break;
      case 'bun':
        addH(m(G.sph(), mat(t.c2 ?? '#3b2f2f', 'matte'), [0, h.top + 0.06, -0.12], 0.14));
        break;
      case 'buns2':
        for (const x of [-1, 1]) addH(m(G.sph(), mat(t.c2 ?? '#3b2f2f', 'matte'), [x * 0.28, h.top * 0.85, -0.05], 0.13));
        break;
      case 'whistle':
        addR(m(G.tor(0.05), mat('#e03131'), [0, neckY - 0.04, 0.02], [0.2, 0.2, 0.2], [PI / 2 - 0.4, 0, 0]));
        addR(m(G.rbox(0.3), mat('#ced4da', 'metal'), [0, neckY - 0.2, 0.26], [0.08, 0.05, 0.05]));
        break;
      case 'cap':
        addH(m(G.hemi(), mat(t.c3 ?? '#1971c2', 'fabric'), [0, h.top * 0.55, 0], [h.half * 1.03, h.half * 0.75, h.half * 1.03]));
        addH(m(G.cyl(), mat(t.c3 ?? '#1971c2', 'fabric'), [0, h.top * 0.58, h.half * 0.85], [h.half * 0.6, 0.02, h.half * 0.4]));
        break;
      case 'postcap':
        addH(m(G.cyl(), mat('#1864ab', 'fabric'), [0, h.top + 0.03, 0], [h.half * 0.62, 0.12, h.half * 0.62]));
        addH(m(G.cyl(), mat('#212529'), [0, h.top - 0.02, h.half * 0.45], [h.half * 0.4, 0.02, h.half * 0.25]));
        addH(m(G.cyl(), mat('#fcc419', 'metal'), [0, h.top + 0.03, h.half * 0.62], [0.04, 0.01, 0.04], [PI / 2, 0, 0]));
        break;
      case 'ponytail':
        addH(m(G.cap(1), mat(t.c2 ?? '#3b2f2f', 'matte'), [0, h.top * 0.35, -h.half * 1.02], [0.12, 0.16, 0.12], [0.5, 0, 0]));
        addH(m(G.tor(0.3), mat('#ff6b6b'), [0, h.top * 0.62, -h.half * 0.88], 0.07, [1.1, 0, 0]));
        addH(m(G.sph(), mat(t.c2 ?? '#3b2f2f', 'matte'), [0, h.top * 0.55, h.half * 0.62], [h.half * 0.62, 0.08, 0.14], [0.5, 0, 0]));
        break;
      case 'pigtails':
        for (const x of [-1, 1]) {
          addH(m(G.cap(1), mat(t.c2 ?? '#3b2f2f', 'matte'), [x * h.half * 1.05, -h.half * 0.15, -0.05], [0.11, 0.17, 0.11], [0, 0, x * 0.35]));
          addH(m(G.tor(0.3), mat('#ff6b6b'), [x * h.half * 0.98, h.half * 0.12, -0.05], 0.06, [Math.PI / 2, 0, 0]));
        }
        break;
      case 'officercap': {
        const capc = t.c3 ?? '#2b2d42';
        addH(m(G.cylTaper(1.15), mat(capc, 'fabric'), [0, h.top + 0.06, 0], [h.half * 0.75, 0.16, h.half * 0.75]));
        addH(m(G.cyl(), mat('#111', 'vinyl'), [0, h.top - 0.01, h.half * 0.5], [h.half * 0.5, 0.025, h.half * 0.35]));
        addH(m(G.star(), mat('#fcc419', 'metal'), [0, h.top + 0.08, h.half * 0.82], 0.07));
        break;
      }
      case 'medals':
        for (let i = 0; i < 3; i++) {
          addR(m(G.box(), mat(['#e03131', '#1971c2', '#fcc419'][i], 'fabric'), [-0.12 + i * 0.07, f.bodyY + 0.12, (f.bodyHalf || 0.25) * 0.92], [0.05, 0.08, 0.02]));
          addR(m(G.cyl(), mat('#fcc419', 'metal'), [-0.12 + i * 0.07, f.bodyY + 0.05, (f.bodyHalf || 0.25) * 0.95], [0.025, 0.01, 0.025], [Math.PI / 2, 0, 0]));
        }
        break;
      case 'collar':
      case 'cassetteshell':
        break;
    }
  }
}

export function buildToy(t: ToyRecipe): THREE.Group {
  const root = new THREE.Group();
  const hip = legs(t, root);
  const f = body(t, root, hip);
  const make = HEADS[t.head] ?? HEADS.egg;
  const h = make(t);
  const head = h.g;
  // heads without a body are the body: make them a bit bigger
  const hs = f.hasBody ? 0.92 : 1.12;
  head.scale.setScalar(hs);
  const headY = f.hasBody ? f.bodyTop - h.bottom * hs * 0.82 : hip - h.bottom * hs - (t.legs === 'none' ? 0 : 0.04);
  head.position.y = headY;
  eyes(t, h, head);
  root.add(head);
  arms(t, root, f, h, headY, hs);
  accessories(t, root, head, h, f, headY, hs);
  // normalise height so every figure stands about the same size on the board
  const box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - Math.min(0, box.min.y);
  const k = (TOY_HEIGHT / Math.max(0.6, height)) * (t.scale ?? 1);
  root.scale.setScalar(Math.min(k, 1.25));
  if (box.min.y < 0) root.position.y = -box.min.y * root.scale.y;
  const wrap = new THREE.Group();
  wrap.add(root);
  wrap.userData.head = head;
  wrap.userData.headY = headY * root.scale.y;
  return wrap;
}

/** The headliner: a strawberry-headed baby squishy in a trench coat. `torn` shows the stitched seam. */
export function buildStrawbaby(opts: { coat?: boolean; torn?: boolean; glow?: boolean } = {}): THREE.Group {
  const coat = opts.coat ?? true;
  const recipe: ToyRecipe = {
    head: 'strawberry', body: coat ? 'coat' : 'bean', c1: '#ff3b5c', c2: '#3fbf5f', c3: coat ? '#c8a165' : '#ffd1dc',
    arms: 'nubs', legs: 'nubs', eyes: 'big', acc: ['blush'],
  };
  const toy = buildToy(recipe);
  const root = toy.children[0] as THREE.Group;
  const head = toy.userData.head as THREE.Group;
  // pacifier: baby squishy
  head.add(m(G.cyl(), mat('#ffd6e0'), [0, -0.16, 0.46], [0.09, 0.03, 0.09], [PI / 2, 0, 0]));
  head.add(m(G.tor(0.25), mat('#ff8fab'), [0, -0.16, 0.5], 0.05));
  if (opts.torn) {
    // the seam where it tore, stitched with yarn
    const seam = mat('#7a1f2b', 'matte');
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 0.18, 0.0), new THREE.Vector3(-0.05, 0.26, 0.01), new THREE.Vector3(0.05, 0.3, 0.0), new THREE.Vector3(0.15, 0.36, -0.01),
    ]);
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0, coat ? 0.31 : 0.25);
    bodyGroup.add(m(new THREE.TubeGeometry(curve, 20, 0.008, 6, false), seam));
    for (let i = 0; i <= 6; i++) {
      const p = curve.getPoint(i / 6);
      bodyGroup.add(m(G.cyl(), mat('#ffe066', 'matte'), [p.x, p.y, p.z + 0.005], [0.006, 0.06, 0.006], [0, 0, 0.6]));
    }
    root.add(bodyGroup);
  }
  if (opts.glow) {
    head.add(m(G.sph(), new THREE.MeshBasicMaterial({ color: '#ff4d6d', transparent: true, opacity: 0.18 }), [0, 0, 0], 0.75));
  }
  return toy;
}

/** DarkBerry: what climbed out of the hole. Crimson, scarred, fedora and black trench coat. */
export function buildDarkBerry(opts: { hat?: boolean; glowEyes?: boolean } = {}): THREE.Group {
  const recipe: ToyRecipe = {
    head: 'strawberry', body: 'coat', c1: '#8c0d26', c2: '#2f4a2c', c3: '#2a2523', seed: '#a8864c',
    arms: 'nubs', legs: 'nubs', eyes: 'angry',
  };
  const toy = buildToy(recipe);
  const head = toy.userData.head as THREE.Group;
  const yarn = mat('#d9c48a', 'matte');
  // stitched scars: one long seam across the face, two X-stitches
  const seam = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.36, 0.32, 0.22), new THREE.Vector3(-0.12, 0.2, 0.44), new THREE.Vector3(0.1, 0.02, 0.47), new THREE.Vector3(0.3, -0.2, 0.36)]);
  head.add(m(new THREE.TubeGeometry(seam, 24, 0.012, 6, false), mat('#3a0610', 'matte')));
  for (let i = 0; i <= 7; i++) {
    const p = seam.getPoint(i / 7);
    const tan = seam.getTangent(i / 7);
    const st = m(G.cyl(), yarn, [p.x, p.y, p.z + 0.01], [0.01, 0.09, 0.01]);
    st.rotation.z = Math.atan2(tan.y, tan.x) + Math.PI / 2 + 0.5;
    head.add(st);
  }
  for (const [x, y] of [[0.3, 0.3], [-0.32, -0.18]]) {
    head.add(m(G.cyl(), yarn, [x, y, 0.42], [0.012, 0.11, 0.012], [0, 0, 0.8]));
    head.add(m(G.cyl(), yarn, [x, y, 0.42], [0.012, 0.11, 0.012], [0, 0, -0.8]));
  }
  if (opts.glowEyes ?? true) {
    for (const x of [-0.2, 0.2]) head.add(m(G.sph(), mat('#ff1f3d', 'glow'), [x * 1.0, 0.07, 0.5], 0.035));
  }
  if (opts.hat ?? true) {
    const felt = mat('#1c1a1a', 'fabric');
    const hat = new THREE.Group();
    hat.add(m(G.cyl(), felt, [0, 0, 0], [0.62, 0.035, 0.6]));
    hat.add(m(G.cylTaper(0.86), felt, [0, 0.16, 0], [0.36, 0.3, 0.34]));
    hat.add(m(G.cyl(), mat('#9b1028', 'fabric'), [0, 0.06, 0], [0.365, 0.07, 0.345]));
    hat.add(m(G.box(), felt, [0, 0.31, 0], [0.4, 0.04, 0.12]));
    hat.position.set(0.02, 0.5, -0.02);
    hat.rotation.set(-0.12, 0, -0.14);
    head.add(hat);
  }
  return toy;
}

export function disposeNothing() {
  // geometries and materials are shared and cached for the app lifetime
}

export { group };
