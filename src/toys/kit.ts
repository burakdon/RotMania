// Shared geometry/material kit for the procedural vinyl toys. Everything is cached and reused.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const geoCache = new Map<string, THREE.BufferGeometry>();
export function geo(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

export type MatKind = 'vinyl' | 'matte' | 'glow' | 'metal' | 'glass' | 'fabric';
const matCache = new Map<string, THREE.Material>();
export function mat(color: string, kind: MatKind = 'vinyl'): THREE.Material {
  const key = color + kind;
  let m = matCache.get(key);
  if (!m) {
    const c = new THREE.Color(color);
    switch (kind) {
      case 'vinyl':
        m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.2 });
        break;
      case 'matte':
        m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
        break;
      case 'fabric':
        m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.9, sheen: 1, sheenColor: c.clone().offsetHSL(0, 0, 0.2), sheenRoughness: 0.6 });
        break;
      case 'glow':
        m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, roughness: 0.4 });
        break;
      case 'metal':
        m = new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.25 });
        break;
      case 'glass':
        m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.05, transmission: 0.6, thickness: 0.4, transparent: true, opacity: 0.85 });
        break;
    }
    matCache.set(key, m!);
  }
  return m!;
}

export const G = {
  sph: () => geo('sph', () => new THREE.SphereGeometry(1, 36, 26)),
  sphLo: () => geo('sphLo', () => new THREE.SphereGeometry(1, 14, 10)),
  hemi: () => geo('hemi', () => new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 32)),
  cylTaper: (top: number) => geo('cylT' + top, () => new THREE.CylinderGeometry(top, 1, 1, 32)),
  cone: () => geo('cone', () => new THREE.ConeGeometry(1, 1, 32)),
  tor: (tube: number, arc = Math.PI * 2) => geo(`tor${tube}_${arc.toFixed(3)}`, () => new THREE.TorusGeometry(1, tube, 18, 48, arc)),
  cap: (len: number) => geo('cap' + len, () => new THREE.CapsuleGeometry(1, len, 10, 24)),
  rbox: (r = 0.18) => geo('rbox' + r, () => new RoundedBoxGeometry(1, 1, 1, 5, r)),
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  ico: () => geo('ico', () => new THREE.IcosahedronGeometry(1, 1)),
  oct: () => geo('oct', () => new THREE.OctahedronGeometry(1, 0)),
  tri: () =>
    geo('tri', () => {
      // rounded triangle prism (onigiri, pizza)
      const shape = new THREE.Shape();
      const r = 0.22;
      const pts = [new THREE.Vector2(0, 1), new THREE.Vector2(-0.95, -0.6), new THREE.Vector2(0.95, -0.6)];
      for (let i = 0; i < 3; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % 3];
        const c = pts[(i + 2) % 3];
        const p1 = a.clone().lerp(c, r);
        const p2 = a.clone().lerp(b, r);
        if (i === 0) shape.moveTo(p1.x, p1.y);
        else shape.lineTo(p1.x, p1.y);
        shape.quadraticCurveTo(a.x, a.y, p2.x, p2.y);
      }
      const g = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 5, curveSegments: 10 });
      g.translate(0, 0, -0.3);
      return g;
    }),
  heart: () =>
    geo('heart', () => {
      const s = new THREE.Shape();
      s.moveTo(0, -0.6);
      s.bezierCurveTo(-0.2, -0.4, -1, 0, -0.6, 0.5);
      s.bezierCurveTo(-0.3, 0.85, 0, 0.6, 0, 0.35);
      s.bezierCurveTo(0, 0.6, 0.3, 0.85, 0.6, 0.5);
      s.bezierCurveTo(1, 0, 0.2, -0.4, 0, -0.6);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4 });
      g.center();
      return g;
    }),
  star: () =>
    geo('star', () => {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.45 : 1;
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 });
      g.center();
      return g;
    }),
};

type V3 = [number, number, number];
export function m(
  g: THREE.BufferGeometry, material: THREE.Material, pos: V3 = [0, 0, 0], scale: number | V3 = 1, rot: V3 = [0, 0, 0],
): THREE.Mesh {
  const me = new THREE.Mesh(g, material);
  me.position.set(...pos);
  if (typeof scale === 'number') me.scale.setScalar(scale);
  else me.scale.set(...scale);
  me.rotation.set(...rot);
  me.castShadow = true;
  me.receiveShadow = true;
  return me;
}

export function group(...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

export function shade(color: string, l: number) {
  return '#' + new THREE.Color(color).offsetHSL(0, 0, l).getHexString();
}
