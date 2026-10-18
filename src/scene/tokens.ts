// Game pieces: meeple agents and resource tokens.
import * as THREE from 'three';
import type { Res } from '../game/types';
import { G, geo, group, m, mat } from '../toys/kit';

/** Classic meeple silhouette, extruded. About 0.6 tall. */
export function meepleGeo() {
  return geo('meeple', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.28, 0);
    s.lineTo(-0.12, 0.26);
    s.lineTo(-0.3, 0.3);
    s.quadraticCurveTo(-0.36, 0.36, -0.3, 0.42);
    s.lineTo(-0.1, 0.44);
    s.absarc(0, 0.53, 0.1, -Math.PI * 0.85, Math.PI * 1.85, false);
    s.lineTo(0.3, 0.42);
    s.quadraticCurveTo(0.36, 0.36, 0.3, 0.3);
    s.lineTo(0.12, 0.26);
    s.lineTo(0.28, 0);
    s.lineTo(0.06, 0);
    s.lineTo(0, 0.12);
    s.lineTo(-0.06, 0);
    s.lineTo(-0.28, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3 });
    g.translate(0, 0, -0.08);
    return g;
  });
}

export function buildMeeple(color: string) {
  const me = m(meepleGeo(), mat(color));
  me.scale.setScalar(1.1);
  return me;
}

export function buildResToken(r: Res): THREE.Object3D {
  switch (r) {
    case 'grass': {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) g.add(m(G.cone(), mat('#51cf66'), [(i - 2) * 0.05, 0.12, (i % 2) * 0.04], [0.035, 0.24 + (i % 3) * 0.05, 0.035], [0, 0, (i - 2) * 0.15]));
      g.add(m(G.cyl(), mat('#5c3d2e', 'matte'), [0, 0.02, 0], [0.13, 0.04, 0.1]));
      return g;
    }
    case 'coolant':
      return group(
        m(G.cyl(), mat('#22d3ee', 'glass'), [0, 0.13, 0], [0.08, 0.22, 0.08]),
        m(G.cyl(), mat('#22d3ee', 'glow'), [0, 0.1, 0], [0.065, 0.14, 0.065]),
        m(G.cyl(), mat('#adb5bd', 'metal'), [0, 0.26, 0], [0.085, 0.04, 0.085]),
      );
    case 'pcb': {
      const g = group(m(G.rbox(0.1), mat('#7c3aed'), [0, 0.03, 0], [0.26, 0.04, 0.2]));
      for (let i = 0; i < 3; i++) g.add(m(G.box(), mat('#fcc419', 'metal'), [-0.07 + i * 0.07, 0.055, 0], [0.02, 0.01, 0.16]));
      g.add(m(G.box(), mat('#1b1b24'), [0.06, 0.065, 0.03], [0.07, 0.03, 0.07]));
      return g;
    }
    case 'glitter':
      return group(m(G.star(), mat('#f472b6', 'metal'), [0, 0.13, 0], 0.13, [0, 0, 0]));
    case 'copper':
      return group(m(G.tor(0.28), mat('#e8590c', 'metal'), [0, 0.06, 0], [0.11, 0.11, 0.18], [Math.PI / 2, 0, 0]), m(G.tor(0.28), mat('#e8590c', 'metal'), [0, 0.12, 0], [0.11, 0.11, 0.18], [Math.PI / 2, 0, 0.6]));
  }
}
