// Set pieces for the comic and the city board: a red Honda Fit, streets, rain, the data center, screens.
import * as THREE from 'three';
import { G, group, m, mat } from '../toys/kit';

const PI = Math.PI;
type V3 = [number, number, number];

/** A red Honda Fit: tall one-box hatchback, steep windshield, short hood, big rear hatch. Length ≈ 4. */
export function buildHondaFit(color = '#c8102e') {
  const g = new THREE.Group();
  const prof = new THREE.Shape();
  // side profile, x = length (front at 0), y = height
  prof.moveTo(0.02, 0.32);
  prof.lineTo(0.0, 0.6);
  prof.quadraticCurveTo(0.05, 0.78, 0.35, 0.84);
  prof.lineTo(0.9, 0.95);
  prof.quadraticCurveTo(1.35, 1.38, 1.75, 1.55);
  prof.lineTo(3.45, 1.58);
  prof.quadraticCurveTo(3.78, 1.55, 3.86, 1.25);
  prof.lineTo(3.95, 0.65);
  prof.lineTo(3.95, 0.32);
  prof.lineTo(0.02, 0.32);
  const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: 1.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16 });
  bodyGeo.translate(-2, 0, -0.775);
  g.add(m(bodyGeo, mat(color)));
  // greenhouse: dark glass inset on both sides + windshield
  const glass = new THREE.Shape();
  glass.moveTo(1.0, 1.02);
  glass.quadraticCurveTo(1.4, 1.38, 1.8, 1.48);
  glass.lineTo(3.4, 1.5);
  glass.quadraticCurveTo(3.68, 1.46, 3.74, 1.2);
  glass.lineTo(3.76, 1.02);
  glass.lineTo(1.0, 1.02);
  const glassGeo = new THREE.ExtrudeGeometry(glass, { depth: 1.78, bevelEnabled: false });
  glassGeo.translate(-2, 0, -0.89);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#2a3340', roughness: 0.08, metalness: 0.3, clearcoat: 1 });
  g.add(m(glassGeo, glassMat));
  // pillars
  for (const x of [-0.45, 0.55]) g.add(m(G.box(), mat(color), [x, 1.28, 0], [0.12, 0.52, 1.8]));
  // windshield
  const ws = m(G.box(), glassMat, [-0.66, 1.22, 0], [0.04, 0.72, 1.45], [0, 0, -0.95]);
  g.add(ws);
  // wheels
  for (const x of [-1.3, 1.25]) for (const z of [-0.8, 0.8]) {
    g.add(m(G.cyl(), mat('#151515', 'matte'), [x, 0.36, z], [0.37, 0.24, 0.37], [PI / 2, 0, 0]));
    g.add(m(G.cyl(), mat('#b8bcc2', 'metal'), [x, 0.36, z + Math.sign(z) * 0.1], [0.22, 0.06, 0.22], [PI / 2, 0, 0]));
    // wheel arch
    g.add(m(G.tor(0.12, Math.PI), mat('#1b1b1d', 'matte'), [x, 0.36, z + Math.sign(z) * 0.06], [0.42, 0.42, 0.42], [0, 0, 0]));
  }
  // lower body trim
  g.add(m(G.box(), mat('#1b1b1d', 'matte'), [0, 0.38, 0], [3.7, 0.12, 1.74]));
  // lights, grille, mirror, handles
  for (const z of [-0.55, 0.55]) {
    g.add(m(G.rbox(0.3), mat('#fff6d6', 'glow'), [-2.0, 0.72, z], [0.08, 0.14, 0.32]));
    g.add(m(G.rbox(0.3), mat('#ff1f3d', 'glow'), [1.96, 1.0, z * 1.18], [0.06, 0.38, 0.12]));
  }
  g.add(m(G.rbox(0.2), mat('#222', 'matte'), [-2.02, 0.5, 0], [0.04, 0.14, 0.9]));
  g.add(m(G.rbox(0.3), mat(color), [-0.5, 1.02, 0.86], [0.18, 0.1, 0.1]));
  g.userData.kind = 'hondafit';
  return g;
}

export function buildRoad(len = 40, width = 7) {
  const g = new THREE.Group();
  g.add(m(G.box(), mat('#3a3a3e', 'matte'), [0, -0.05, 0], [len, 0.1, width]));
  for (let i = -len / 2; i < len / 2; i += 2.4) g.add(m(G.box(), mat('#e8e8e8', 'matte'), [i, 0.005, 0], [1.2, 0.02, 0.14]));
  g.add(m(G.box(), mat('#7a7a80', 'metal'), [0, 0.45, -width / 2 - 0.2], [len, 0.12, 0.08]));
  for (let i = -len / 2; i < len / 2; i += 2) g.add(m(G.box(), mat('#7a7a80', 'metal'), [i, 0.25, -width / 2 - 0.2], [0.08, 0.5, 0.08]));
  return g;
}

/** Diagonal rain streaks: thin boxes, white, catch the ink outlines. */
export function buildRain(n = 260, area: V3 = [16, 9, 10], center: V3 = [0, 4, 0], seed = 1, avoid?: { at: V3; r: number }) {
  const g = new THREE.Group();
  const geo = G.box();
  const mtl = new THREE.MeshBasicMaterial({ color: '#f4f1ea', transparent: true, opacity: 0.85 });
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const me = new THREE.Mesh(geo, mtl);
    me.position.set(center[0] + (rnd() - 0.5) * area[0], center[1] + (rnd() - 0.5) * area[1], center[2] + (rnd() - 0.5) * area[2]);
    if (avoid && me.position.distanceTo(new THREE.Vector3(...avoid.at)) < avoid.r) continue;
    me.scale.set(0.012, 0.4 + rnd() * 0.5, 0.012);
    me.rotation.z = 0.25;
    g.add(me);
  }
  return g;
}

export function buildStreetLamp(height = 5) {
  return group(
    m(G.cyl(), mat('#2b2b2e', 'metal'), [0, height / 2, 0], [0.07, height, 0.07]),
    m(G.cyl(), mat('#2b2b2e', 'metal'), [0.45, height, 0], [0.04, 0.9, 0.04], [0, 0, PI / 2]),
    m(G.cylTaper(0.3), mat('#2b2b2e', 'metal'), [0.9, height - 0.12, 0], [0.32, 0.24, 0.32]),
    m(G.sph(), mat('#fff6d6', 'glow'), [0.9, height - 0.26, 0], [0.18, 0.08, 0.18]),
  );
}

export function buildBuilding(w: number, h: number, d: number, tone = '#56565c', windows = true, seed = 3) {
  const g = new THREE.Group();
  g.add(m(G.box(), mat(tone, 'matte'), [0, h / 2, 0], [w, h, d]));
  if (windows) {
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const lit = mat('#fff3c4', 'glow');
    const dark = mat('#1e1e22', 'matte');
    for (let y = 0.8; y < h - 0.4; y += 0.9)
      for (let x = -w / 2 + 0.5; x < w / 2 - 0.3; x += 0.75) g.add(m(G.box(), rnd() > 0.78 ? lit : dark, [x, y, d / 2 + 0.01], [0.38, 0.5, 0.02]));
  }
  g.add(m(G.box(), mat('#2c2c30', 'matte'), [0, h + 0.08, 0], [w + 0.15, 0.16, d + 0.15]));
  return g;
}

/** Hyperboloid cooling tower. */
export function buildCoolingTower(r = 1.4, h = 4) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push(new THREE.Vector2(r * (0.62 + 0.38 * Math.pow(2 * t - 1, 2)) * (1 - 0.15 * t), t * h));
  }
  const geo = new THREE.LatheGeometry(pts, 40);
  return group(m(geo, new THREE.MeshStandardMaterial({ color: '#8a8a90', roughness: 0.9, side: THREE.DoubleSide })));
}

export function buildSteam(n = 9, seed = 5) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(m(G.sph(), mat('#e9e6df', 'matte'), [(rnd() - 0.5) * 1.2, i * 0.45 + rnd() * 0.3, (rnd() - 0.5) * 1.2], 0.4 + rnd() * 0.5 + i * 0.05));
  return g;
}

export function buildDataCenter() {
  const g = new THREE.Group();
  g.add(m(G.box(), mat('#9a9aa0', 'matte'), [0, 1.5, 0], [12, 3, 5]));
  // rooftop fan units
  for (let x = -5; x <= 5; x += 1.25)
    for (const z of [-1.3, 1.3]) {
      g.add(m(G.cyl(), mat('#5e5e64', 'metal'), [x, 3.12, z], [0.48, 0.25, 0.48]));
      g.add(m(G.cyl(), mat('#2a2a2e', 'matte'), [x, 3.26, z], [0.38, 0.04, 0.38]));
    }
  // vertical vents on the facade
  for (let x = -5.5; x <= 5.5; x += 0.55) g.add(m(G.box(), mat('#6c6c72', 'matte'), [x, 1.5, 2.51], [0.1, 2.4, 0.04]));
  g.add(m(G.box(), mat('#2b2b2e', 'matte'), [-4.5, 0.9, 2.52], [1.2, 1.8, 0.04]));
  // logo sign
  g.add(m(G.rbox(0.2), mat('#ff2d55', 'glow'), [3.6, 2.4, 2.56], [1.6, 0.35, 0.06]));
  // fence
  for (let x = -7; x <= 7; x += 0.5) g.add(m(G.cyl(), mat('#4a4a4e', 'metal'), [x, 0.6, 4.2], [0.025, 1.2, 0.025]));
  g.add(m(G.box(), mat('#4a4a4e', 'metal'), [0, 1.15, 4.2], [14, 0.04, 0.04]));
  return g;
}

export function buildServerRack(seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = group(m(G.rbox(0.04), mat('#2b2f45', 'metal'), [0, 1.6, 0], [1, 3.2, 0.9]));
  for (let k = 0; k < 9; k++) g.add(m(G.box(), mat(rnd() > 0.7 ? '#ff2d55' : '#cfd6e6', 'glow'), [0, 0.35 + k * 0.32, 0.46], [0.6, 0.04, 0.02]));
  return g;
}

/** A screen showing a texture (canvas or portrait). */
export function buildScreen(tex: THREE.Texture | null, w = 1.6, h = 1.1, frame = '#1b1b1e') {
  const face = new THREE.MeshBasicMaterial({ color: tex ? '#ffffff' : '#ff8fab', map: tex ?? null, toneMapped: false });
  return group(
    m(G.rbox(0.08), mat(frame, 'matte'), [0, 0, 0], [w + 0.14, h + 0.14, 0.12]),
    new THREE.Mesh(new THREE.PlaneGeometry(w, h), face).translateZ(0.065),
  );
}

export function buildPhone(tex: THREE.Texture | null) {
  return group(
    m(G.rbox(0.2), mat('#18181b'), [0, 0, 0], [0.32, 0.6, 0.04]),
    new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.54), new THREE.MeshBasicMaterial({ map: tex, color: tex ? '#fff' : '#ff8fab', toneMapped: false })).translateZ(0.025),
  );
}

/** Text drawn into a canvas texture (phone screens, signs, headlines). */
export function textTexture(lines: { text: string; size: number; color: string; font?: string }[], w = 512, h = 512, bg = '#000') {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const total = lines.reduce((a, l) => a + l.size * 1.2, 0);
  let y = h / 2 - total / 2;
  for (const l of lines) {
    x.font = `${l.font ?? '900'} ${l.size}px Bangers, Impact, sans-serif`;
    x.fillStyle = l.color;
    y += l.size * 0.6;
    x.fillText(l.text, w / 2, y);
    y += l.size * 0.6;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function imageTexture(url: string) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPalanquin() {
  const wood = mat('#6b5644', 'matte');
  return group(
    m(G.rbox(0.1), wood, [0, 1.25, 0], [2.2, 0.16, 1.4]),
    m(G.rbox(0.1), mat('#d8d0c4', 'fabric'), [0, 1.38, 0], [2.0, 0.12, 1.2]),
    m(G.cyl(), wood, [0, 1.15, -0.85], [0.05, 3.6, 0.05], [0, 0, PI / 2]),
    m(G.cyl(), wood, [0, 1.15, 0.85], [0.05, 3.6, 0.05], [0, 0, PI / 2]),
    ...[-0.9, 0.9].flatMap((x) => [-0.6, 0.6].map((z) => m(G.cyl(), wood, [x, 1.95, z], [0.04, 1.2, 0.04]))),
    m(G.cone(), mat('#d8d0c4', 'fabric'), [0, 2.75, 0], [1.5, 0.6, 1.1], [0, PI / 4, 0]),
  );
}

export function buildTable(w = 3, d = 2) {
  const wood = mat('#5a4636', 'matte');
  return group(
    m(G.box(), wood, [0, 1, 0], [w, 0.1, d]),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => m(G.box(), wood, [sx * (w / 2 - 0.1), 0.5, sz * (d / 2 - 0.1)], [0.1, 1, 0.1]))),
  );
}

export function buildHangingLamp(y = 3.2) {
  return group(
    m(G.cyl(), mat('#222', 'matte'), [0, y + 0.9, 0], [0.01, 1.8, 0.01]),
    m(G.cylTaper(0.25), mat('#2b2b2e', 'metal'), [0, y, 0], [0.45, 0.35, 0.45]),
    m(G.sph(), mat('#fff3c4', 'glow'), [0, y - 0.15, 0], 0.12),
  );
}
