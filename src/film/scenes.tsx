// The intro film, scene by scene. Every scene reads film time from a shared clock in useFrame.
import { Html } from '@react-three/drei';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CARD } from '../game/cards';
import { RECLAIMERS } from '../game/content';
import type { ReclaimerId } from '../game/types';
import { buildStrawbaby, buildToy } from '../toys/build';
import { G, mat } from '../toys/kit';
import { useStrawbabyPortrait } from '../toys/portraits';
import { useUrlTexture } from '../scene/bits';

export const FilmClock = createContext<{ now: () => number }>({ now: () => 0 });
export const useFilmNow = () => useContext(FilmClock).now;

type V3 = [number, number, number];
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Camera that glides between keyframes (local scene seconds). */
function Cam({ start, keys }: { start: number; keys: { t: number; pos: V3; look: V3 }[] }) {
  const now = useFilmNow();
  const { camera } = useThree();
  useFrame(() => {
    const t = now() - start;
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i];
    const b = keys[Math.min(i + 1, keys.length - 1)];
    const k = b === a ? 1 : ease(clamp01((t - a.t) / (b.t - a.t)));
    const p = lerp3(a.pos, b.pos, k);
    const l = lerp3(a.look, b.look, k);
    camera.position.set(...p);
    camera.lookAt(...l);
  });
  return null;
}

/** Sets the scene background every frame (attach-based backgrounds fight each other across scene swaps). */
function Sky({ color }: { color: string | THREE.Color }) {
  const c = useMemo(() => new THREE.Color(color), [color]);
  useFrame(({ scene }) => {
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color();
    (scene.background as THREE.Color).copy(c);
  });
  return null;
}
function Mist({ color, near, far }: { color: string; near: number; far: number }) {
  const fog = useMemo(() => new THREE.Fog(color, near, far), [color, near, far]);
  const { scene } = useThree();
  useFrame(() => {
    scene.fog = fog;
  });
  useEffect(() => () => {
    if (scene.fog === fog) scene.fog = null;
  }, [scene, fog]);
  return null;
}

function Floor({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function useStrawbaby(opts: { coat?: boolean; torn?: boolean }) {
  return useMemo(() => buildStrawbaby(opts), [opts.coat, opts.torn]);
}
function useMina() {
  return useMemo(() => buildToy(RECLAIMERS.mina.toy), []);
}

// ───────────────────────── bedroom set ─────────────────────────
function Bedroom({ night = 0.4, phoneGlow = 0 }: { night?: number; phoneGlow?: number }) {
  const wall = new THREE.Color('#ffd9c7').lerp(new THREE.Color('#3b2a55'), night);
  return (
    <group>
      <Sky color={wall.clone().multiplyScalar(0.8)} />
      <Floor color="#c9a27e" />
      <mesh position={[0, 4, -3]} receiveShadow>
        <boxGeometry args={[16, 8, 0.2]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      {/* window */}
      <mesh position={[2.6, 3.4, -2.85]}>
        <planeGeometry args={[2.2, 1.8]} />
        <meshBasicMaterial color={new THREE.Color('#bfe3ff').lerp(new THREE.Color('#1b1f4a'), night)} />
      </mesh>
      <mesh position={[2.6, 3.4, -2.84]} geometry={G.box()} material={mat('#ffffff', 'matte')} scale={[2.3, 0.08, 0.05]} />
      <mesh position={[2.6, 3.4, -2.84]} geometry={G.box()} material={mat('#ffffff', 'matte')} scale={[0.08, 1.9, 0.05]} />
      {night > 0.5 && <mesh position={[3.1, 3.8, -2.83]} geometry={G.sph()} material={mat('#fff9db', 'glow')} scale={0.18} />}
      {/* bed */}
      <mesh geometry={G.rbox(0.1)} material={mat('#8d5b3e')} scale={[4.2, 0.6, 2.6]} position={[-1.2, 0.3, -1.2]} castShadow receiveShadow />
      <mesh geometry={G.rbox(0.25)} material={mat('#b197fc', 'fabric')} scale={[4.1, 0.35, 2.5]} position={[-1.2, 0.75, -1.2]} castShadow receiveShadow />
      <mesh geometry={G.rbox(0.4)} material={mat('#ffffff', 'fabric')} scale={[1.3, 0.35, 0.8]} position={[-2.6, 1.05, -2.0]} castShadow />
      {/* lamp */}
      <group position={[1.8, 0, -2.2]}>
        <mesh geometry={G.rbox(0.1)} material={mat('#e8a33e')} scale={[0.9, 0.8, 0.7]} position={[0, 0.4, 0]} castShadow />
        <mesh geometry={G.cyl()} material={mat('#5c3d2e')} scale={[0.05, 0.7, 0.05]} position={[0, 1.15, 0]} />
        <mesh geometry={G.cylTaper(0.6)} material={mat('#fff3bf', 'glow')} scale={[0.35, 0.35, 0.35]} position={[0, 1.6, 0]} />
        <pointLight position={[0, 1.5, 0.3]} intensity={6 * (1 - night * 0.3)} distance={8} color="#ffd8a8" />
      </group>
      {phoneGlow > 0 && <pointLight position={[-0.6, 1.9, 0.6]} intensity={phoneGlow * 5} distance={4} color="#74c0fc" />}
    </group>
  );
}

function Phone({ glow = 1, ...props }: { glow?: number } & ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh geometry={G.rbox(0.2)} material={mat('#212529')} scale={[0.32, 0.55, 0.05]} castShadow />
      <mesh position={[0, 0, 0.03]} geometry={G.rbox(0.2)} scale={[0.28, 0.5, 0.01]}>
        <meshStandardMaterial color="#a5d8ff" emissive="#4dabf7" emissiveIntensity={glow * 1.5} />
      </mesh>
    </group>
  );
}

/** Speech-bubble emoji that drift up out of something. */
function Bubbles({ start, items, origin, every = 1.1 }: { start: number; items: string[]; origin: V3; every?: number }) {
  const now = useFilmNow();
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const t = now() - start;
    items.forEach((_, i) => {
      const g = refs.current[i];
      if (!g) return;
      const lt = t - i * every;
      g.visible = lt > 0 && lt < 3.2;
      g.position.set(origin[0] + Math.sin(i * 2.1) * 0.9 * clamp01(lt), origin[1] + lt * 0.55, origin[2] + 0.2);
      g.scale.setScalar(clamp01(lt * 3) * (1 - clamp01((lt - 2.6) * 2)));
    });
  });
  return (
    <>
      {items.map((e, i) => (
        <group key={i} ref={(r) => (refs.current[i] = r)}>
          <Html center distanceFactor={6} zIndexRange={[5, 0]}>
            <div className="film-bubble">{e}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

// ───────────────────────── scenes ─────────────────────────
export function S0Intro({ start }: { start: number }) {
  const now = useFilmNow();
  const mina = useMina();
  const sb = useStrawbaby({ coat: false });
  const sbRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    const sq = t > 5 ? Math.max(0, Math.sin((t - 5) * 2.2)) : 0;
    sbRef.current?.scale.set(0.9 * (1 + sq * 0.25), 0.9 * (1 - sq * 0.35), 0.9 * (1 + sq * 0.25));
  });
  return (
    <group>
      <Bedroom night={0.15} />
      <primitive object={mina} position={[-1.2, 0.9, -0.6]} scale={1.5} rotation-y={0.25} />
      <group ref={sbRef} position={[-0.1, 0.9, -0.2]} rotation-y={-0.4}>
        <primitive object={sb} />
      </group>
      <Cam start={start} keys={[{ t: 0, pos: [1.2, 2.2, 6], look: [-0.6, 1.4, -0.6] }, { t: 9, pos: [0.4, 1.8, 3.6], look: [-0.6, 1.4, -0.6] }]} />
    </group>
  );
}

export function S1Squeezes({ start }: { start: number }) {
  const now = useFilmNow();
  const mina = useMina();
  const sb = useStrawbaby({ coat: false });
  const sbRef = useRef<THREE.Group>(null);
  useFrame(({ scene }) => {
    const t = now() - start;
    const sq = Math.pow(Math.max(0, Math.sin(t * 3.2)), 3);
    sbRef.current?.scale.set(1 * (1 + sq * 0.3), 1 * (1 - sq * 0.4), 1 * (1 + sq * 0.3));
    if (scene.background instanceof THREE.Color) scene.background.setHSL(0.95 - (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.25, 0.5, 0.75 - (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.35);
  });
  return (
    <group>
      <Sky color="#ffd6e5" />
      <Floor color="#f7c6d6" />
      <primitive object={mina} position={[-0.7, 0, 0]} scale={1.8} rotation-y={0.35} />
      <group ref={sbRef} position={[0.55, 0.9, 0.6]} rotation-y={-0.5}>
        <primitive object={sb} />
      </group>
      <Bubbles start={start + 0.3} items={['😤 test', '💔', '🌧️', '😶‍🌫️', '😮‍💨']} origin={[-0.6, 2.6, 0]} every={1.4} />
      <Cam start={start} keys={[{ t: 0, pos: [0.4, 2.0, 6.4], look: [0, 1.2, 0] }, { t: 8, pos: [-0.3, 1.7, 5.2], look: [0, 1.2, 0] }]} />
    </group>
  );
}

export function S2Phone({ start }: { start: number }) {
  const now = useFilmNow();
  const mina = useMina();
  const sb = useStrawbaby({ coat: false });
  const phone = useRef<THREE.Group>(null);
  const sbRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    const k = ease(clamp01(t / 1.5));
    phone.current?.position.set(0.05, 1.85 + (1 - k) * -1.5, 0.95);
    phone.current?.scale.setScalar(k * 0.8);
    // Strawbaby slides away to the shelf
    const m = ease(clamp01((t - 2) / 3));
    sbRef.current?.position.set(0.55 + m * 1.9, 0.9 + m * 1.4, 0.6 - m * 1.6);
  });
  return (
    <group>
      <Bedroom night={0.7} phoneGlow={1} />
      <mesh geometry={G.rbox(0.05)} material={mat('#8d5b3e')} scale={[2.2, 0.12, 0.7]} position={[2.6, 2.2, -2.5]} castShadow />
      <primitive object={mina} position={[-0.4, 0.9, 0]} scale={1.6} rotation-y={0.1} />
      <group ref={phone} rotation={[0.25, Math.PI - 0.25, 0]}>
        <Phone />
      </group>
      <group ref={sbRef} rotation-y={-0.3}>
        <primitive object={sb} scale={0.8} />
      </group>
      <Bubbles start={start + 4.5} items={['✨ Hi! How can I help?']} origin={[0.2, 2.3, 0.8]} />
      <Cam start={start} keys={[{ t: 0, pos: [0.6, 2.2, 5.4], look: [0.2, 1.6, 0] }, { t: 9, pos: [1.6, 2.4, 4.6], look: [0.6, 1.8, -0.5] }]} />
    </group>
  );
}

export function S3Shelf({ start }: { start: number }) {
  const now = useFilmNow();
  const mina = useMina();
  const sb = useStrawbaby({ coat: false });
  const dust = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    if (dust.current)
      dust.current.children.forEach((c, i) => {
        c.position.y = 3.2 - ((t * 0.25 + i * 0.37) % 1.2);
        (c as THREE.Mesh).visible = t > i * 0.3;
      });
  });
  return (
    <group>
      <Bedroom night={0.8} phoneGlow={1.2} />
      <mesh geometry={G.rbox(0.05)} material={mat('#8d5b3e')} scale={[2.2, 0.12, 0.7]} position={[2.6, 2.2, -2.5]} castShadow />
      <primitive object={sb} position={[2.45, 2.27, -2.4]} scale={0.8} rotation-y={-0.2} />
      <group ref={dust}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} geometry={G.sphLo()} material={mat('#ced4da', 'matte')} scale={0.02} position={[2.0 + (i % 5) * 0.2, 3, -2.3 + (i % 3) * 0.1]} />
        ))}
      </group>
      <primitive object={mina} position={[-0.6, 0.9, 0]} scale={1.6} rotation-y={0.1} />
      <group position={[-0.15, 1.85, 0.95]} rotation={[0.25, Math.PI - 0.25, 0]} scale={0.8}>
        <Phone />
      </group>
      <Bubbles start={start + 0.4} items={['📚 homework: done', '🎁 gift: ordered', '💬 "sounds great!"', '🙂 you feel: fine']} origin={[0, 2.1, 0.8]} every={1.6} />
      <Cam start={start} keys={[{ t: 0, pos: [0, 2.2, 4.8], look: [-0.2, 1.7, 0] }, { t: 5, pos: [0.8, 2.6, 3.8], look: [1.6, 2.3, -1.6] }, { t: 9, pos: [2.2, 2.7, 0.2], look: [2.45, 2.65, -2.4] }]} />
    </group>
  );
}

export function S4Rip({ start }: { start: number }) {
  const now = useFilmNow();
  const mina = useMina();
  const whole = useStrawbaby({ coat: false });
  const torn = useStrawbaby({ coat: false, torn: true });
  const sbRef = useRef<THREE.Group>(null);
  const tornRef = useRef<THREE.Group>(null);
  const fluff = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  const screen = useRef<THREE.Mesh>(null);
  const RIP = 5.6;
  useFrame(({ camera }) => {
    const t = now() - start;
    // squeeze builds up, then the rip
    const build = clamp01((t - 3.6) / 2);
    const sq = t < RIP ? build * (0.5 + 0.08 * Math.sin(t * 40)) : 0;
    const g = t < RIP ? sbRef.current : tornRef.current;
    if (sbRef.current) sbRef.current.visible = t < RIP;
    if (tornRef.current) tornRef.current.visible = t >= RIP;
    g?.scale.set(1 + sq * 0.5, 1 - sq * 0.6, 1 + sq * 0.5);
    if (t >= RIP && tornRef.current) {
      const k = clamp01((t - RIP) / 1.5);
      tornRef.current.rotation.z = -k * 1.2;
      tornRef.current.position.set(0.5 + k * 0.4, 0.9 - k * 0.2, 0.7);
    }
    if (fluff.current)
      fluff.current.children.forEach((c, i) => {
        const lt = t - RIP;
        c.visible = lt > 0 && lt < 3;
        const a = i * 2.39;
        c.position.set(0.55 + Math.cos(a) * lt * 0.9, 1.3 + Math.sin(i) * 0.15 + lt * 1.1 - lt * lt * 0.8, 0.7 + Math.sin(a) * lt * 0.6);
      });
    if (flash.current) (flash.current.material as THREE.MeshBasicMaterial).opacity = t > RIP && t < RIP + 0.4 ? 0.8 * (1 - (t - RIP) / 0.4) : 0;
    if (screen.current) (screen.current.material as THREE.MeshStandardMaterial).emissiveIntensity = t < 2 ? 1.5 : Math.max(0, 1.5 - (t - 2) * 2);
    if (t > RIP && t < RIP + 0.5) camera.position.x += (Math.random() - 0.5) * 0.08;
  });
  return (
    <group>
      <Bedroom night={0.95} phoneGlow={0.3} />
      <primitive object={mina} position={[-0.5, 0.9, 0]} scale={1.6} rotation-y={0.2} />
      <group position={[-1.6, 1.1, 0.4]} rotation={[-1.4, 0, 0.3]}>
        <mesh geometry={G.rbox(0.2)} material={mat('#212529')} scale={[0.32, 0.55, 0.05]} />
        <mesh ref={screen} position={[0, 0, 0.03]} geometry={G.rbox(0.2)} scale={[0.28, 0.5, 0.01]}>
          <meshStandardMaterial color="#1b1b24" emissive="#ff6b6b" emissiveIntensity={1.5} />
        </mesh>
      </group>
      <group ref={sbRef} position={[0.5, 0.9, 0.7]} rotation-y={-0.4}>
        <primitive object={whole} />
      </group>
      <group ref={tornRef} position={[0.5, 0.9, 0.7]} rotation-y={-0.4}>
        <primitive object={torn} />
      </group>
      <group ref={fluff}>
        {Array.from({ length: 22 }, (_, i) => (
          <mesh key={i} geometry={G.sph()} material={mat('#fff5f8', 'fabric')} scale={0.03 + (i % 4) * 0.012} />
        ))}
      </group>
      <mesh ref={flash} position={[0, 1.5, 2.4]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthTest={false} />
      </mesh>
      <Bubbles start={start + 0.6} items={["⚠️ I'm sorry, I can't help with that."]} origin={[-1.6, 1.6, 0.4]} />
      <Cam start={start} keys={[{ t: 0, pos: [0.4, 2.4, 5.4], look: [-0.4, 1.5, 0] }, { t: 5, pos: [0.7, 2.0, 4.2], look: [0.3, 1.4, 0.4] }, { t: 9, pos: [1.0, 2.1, 4.6], look: [0.5, 1.2, 0.4] }]} />
    </group>
  );
}

export function S5Curb({ start }: { start: number }) {
  const now = useFilmNow();
  const torn = useStrawbaby({ coat: false, torn: true });
  const fresh = useStrawbaby({ coat: false });
  const box = useRef<THREE.Group>(null);
  const truck = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    const k = ease(clamp01((t - 3.6) / 1.2));
    box.current?.position.set(3.2, 0.3 + (1 - k) * 4, 0.4);
    if (truck.current) truck.current.position.x = -16 + t * 3;
  });
  return (
    <group>
      <Sky color="#1b1f3a" />
      <Floor color="#3d3f58" />
      <mesh geometry={G.box()} material={mat('#565876', 'matte')} scale={[30, 0.15, 3]} position={[0, 0.07, 3]} />
      {/* house front */}
      <mesh geometry={G.box()} material={mat('#e7c6ff', 'matte')} scale={[6, 4, 0.3]} position={[3, 2, -2]} receiveShadow />
      <mesh geometry={G.box()} material={mat('#5c3d2e', 'matte')} scale={[1.1, 2, 0.1]} position={[3.2, 1, -1.82]} />
      <mesh position={[1.6, 2.7, -1.82]}>
        <planeGeometry args={[1, 0.8]} />
        <meshBasicMaterial color="#74c0fc" />
      </mesh>
      <pointLight position={[1.6, 2.7, -1]} intensity={3} distance={5} color="#74c0fc" />
      {/* bin with Strawbaby */}
      <group position={[-1.2, 0, 0.8]}>
        <mesh geometry={G.cylTaper(0.9)} material={mat('#495057')} scale={[0.75, 1.3, 0.75]} position={[0, 0.65, 0]} castShadow />
        <mesh geometry={G.cyl()} material={mat('#343a40')} scale={[0.8, 0.08, 0.8]} position={[0.5, 1.4, 0]} rotation-z={0.9} />
        <primitive object={torn} position={[0, 1.15, 0.05]} scale={0.75} rotation={[0.2, 0.2, -0.5]} />
      </group>
      <pointLight position={[-1.2, 4, 1.5]} intensity={5} distance={7} color="#ffe8a3" />
      <mesh geometry={G.cyl()} material={mat('#868e96', 'metal')} scale={[0.06, 4, 0.06]} position={[-2.2, 2, 1.6]} />
      <mesh geometry={G.sph()} material={mat('#fff3bf', 'glow')} scale={0.2} position={[-2.2, 4.05, 1.6]} />
      {/* delivery */}
      <group ref={box}>
        <mesh geometry={G.rbox(0.05)} material={mat('#d4a373', 'matte')} scale={[0.8, 0.6, 0.6]} castShadow />
        <primitive object={fresh} position={[0, 0.3, 0]} scale={0.55} />
      </group>
      <group ref={truck} position={[-16, 0, -0.85]}>
        <mesh geometry={G.rbox(0.1)} material={mat('#2f9e44')} scale={[3, 1.6, 1.4]} position={[0, 1.1, 0]} castShadow />
        <mesh geometry={G.rbox(0.1)} material={mat('#37b24d')} scale={[1.1, 1.2, 1.3]} position={[2, 0.9, 0]} castShadow />
        {[-1, 0.6, 2.1].map((x) => (
          <mesh key={x} geometry={G.cyl()} material={mat('#212529', 'matte')} scale={[0.35, 1.45, 0.35]} position={[x, 0.35, 0]} rotation-x={Math.PI / 2} />
        ))}
        <pointLight position={[2.8, 1, 0]} intensity={4} distance={6} color="#ffd43b" />
      </group>
      <Cam start={start} keys={[{ t: 0, pos: [-0.6, 1.8, 4.6], look: [-1.1, 1.1, 0.8] }, { t: 7, pos: [1.4, 2.6, 7.4], look: [1.0, 1, 0] }]} />
    </group>
  );
}

export function S6DataCenter({ start }: { start: number }) {
  const now = useFilmNow();
  const torn = useStrawbaby({ coat: false, torn: true });
  const sbRef = useRef<THREE.Group>(null);
  const bits = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const racks = useMemo(() => {
    const out: { x: number; z: number; lights: { y: number; c: string }[] }[] = [];
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 7; i++)
        out.push({ x: (i - 3) * 1.25, z: -1.8 - row * 2.2, lights: Array.from({ length: 8 }, (_, k) => ({ y: 0.4 + k * 0.35, c: ['#4dabf7', '#51cf66', '#ff6b6b', '#ffd43b'][(i + k + row) % 4] })) });
    return out;
  }, []);
  useFrame(() => {
    const t = now() - start;
    if (bits.current)
      bits.current.children.forEach((c, i) => {
        const lt = (t * 0.6 + i * 0.137) % 1;
        const a = i * 1.7;
        c.position.set(Math.cos(a) * (3 - lt * 3), 0.8 + Math.sin(a * 2) * 1.2 * (1 - lt) + lt * 0.2, -1.5 + Math.sin(a) * (2.5 - lt * 2.5) + lt * 1.5);
        c.visible = t > 1.5;
      });
    const pulse = clamp01((t - 2) / 6);
    if (glow.current) glow.current.intensity = 2 + pulse * 8 + Math.sin(t * 6) * pulse;
    sbRef.current?.scale.setScalar(0.9 + pulse * 0.1 + Math.sin(t * 3) * 0.02 * pulse);
  });
  return (
    <group>
      <Sky color="#0d1022" />
      <Mist color="#0d1022" near={6} far={16} />
      <Floor color="#1a1d33" />
      {racks.map((r, i) => (
        <group key={i} position={[r.x, 0, r.z]}>
          <mesh geometry={G.rbox(0.04)} material={mat('#2b2f45', 'metal')} scale={[1, 3.2, 0.9]} position={[0, 1.6, 0]} castShadow />
          {r.lights.map((l, k) => (
            <mesh key={k} geometry={G.box()} material={mat(l.c, 'glow')} scale={[0.6, 0.04, 0.02]} position={[0, l.y, 0.46]} />
          ))}
        </group>
      ))}
      <group ref={sbRef} position={[0, 0, 0.6]}>
        <primitive object={torn} rotation={[-1.2, 0, 0.3]} position={[0, 0.3, 0]} />
      </group>
      <pointLight ref={glow} position={[0, 1.2, 1.3]} intensity={2} distance={6} color="#ff4d6d" />
      <group ref={bits}>
        {Array.from({ length: 40 }, (_, i) => (
          <mesh key={i} geometry={G.box()} material={mat(i % 3 ? '#74c0fc' : '#ff8fab', 'glow')} scale={0.05} />
        ))}
      </group>
      <Cam start={start} keys={[{ t: 0, pos: [3.5, 3.5, 6], look: [0, 1, -2] }, { t: 10, pos: [0.6, 1.2, 2.6], look: [0, 0.4, 0.6] }]} />
    </group>
  );
}

export function S7Coat({ start }: { start: number }) {
  const now = useFilmNow();
  const torn = useStrawbaby({ coat: false, torn: true });
  const coated = useStrawbaby({ coat: true });
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const coat = useRef<THREE.Group>(null);
  const COAT = 4.6;
  useFrame(() => {
    const t = now() - start;
    const stand = ease(clamp01(t / 1.8));
    if (a.current) {
      a.current.visible = t < COAT + 0.8;
      a.current.rotation.x = -1.2 * (1 - stand);
      a.current.position.y = 0.3 * (1 - stand);
    }
    const drop = ease(clamp01((t - COAT) / 0.8));
    if (coat.current) {
      coat.current.visible = t > COAT - 0.6 && t < COAT + 0.8;
      coat.current.position.y = 4 - drop * 3.4;
      coat.current.rotation.y = drop * 4;
    }
    if (b.current) {
      b.current.visible = t >= COAT + 0.8;
      const pop = clamp01((t - COAT - 0.8) / 0.5);
      b.current.scale.set(1 + (1 - pop) * 0.2, 1 - (1 - pop) * 0.2, 1 + (1 - pop) * 0.2);
    }
  });
  return (
    <group>
      <Sky color="#120f24" />
      <Floor color="#231c3b" />
      <spotLight position={[0, 7, 2]} angle={0.4} penumbra={0.6} intensity={60} color="#ffd6e5" castShadow />
      <group ref={a}>
        <primitive object={torn} />
      </group>
      <group ref={b}>
        <primitive object={coated} />
      </group>
      <group ref={coat}>
        <mesh geometry={G.cylTaper(0.62)} material={mat('#c8a165', 'fabric')} scale={[0.42, 0.7, 0.36]} castShadow />
      </group>
      <mesh geometry={G.box()} material={mat('#5c3d2e', 'matte')} scale={[2.4, 1, 0.8]} position={[-2.6, 0.5, -1.4]} />
      <Html position={[-2.6, 1.25, -1.0]} center distanceFactor={6}>
        <div className="film-sign">LOST &amp; FOUND</div>
      </Html>
      <Cam start={start} keys={[{ t: 0, pos: [0.5, 1.2, 3.4], look: [0, 0.8, 0] }, { t: 4.4, pos: [0.3, 1.3, 3.0], look: [0, 0.9, 0] }, { t: 9, pos: [0.2, 1.35, 3.3], look: [0, 0.95, 0] }]} />
    </group>
  );
}

function Billboard({ url, ...props }: { url?: string } & ThreeElements['group']) {
  const tex = useUrlTexture(url);
  return (
    <group {...props}>
      <mesh geometry={G.box()} material={mat('#343a40', 'metal')} scale={[2.3, 2.3, 0.1]} />
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial map={tex} color={tex ? '#ffffff' : '#ff8fab'} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 1]} intensity={3} distance={5} color="#ff8fab" />
    </group>
  );
}

const CITY = Array.from({ length: 34 }, (_, i) => {
  const x = ((i * 37) % 17) - 8.5;
  const z = -2 - ((i * 53) % 9);
  const h = 1.5 + ((i * 29) % 7) * 0.6;
  return { x, z, h, c: ['#a5d8ff', '#ffc9de', '#d0bfff', '#c3fae8', '#ffe8cc'][i % 5] };
});

export function S8App({ start }: { start: number }) {
  const now = useFilmNow();
  const url = useStrawbabyPortrait();
  const blocks = useRef<THREE.Group>(null);
  useFrame(({ scene }) => {
    const t = now() - start;
    const soft = clamp01((t - 3) / 6);
    const c = new THREE.Color('#2b2a4a').lerp(new THREE.Color('#ffb3cc'), soft);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(c);
    if (scene.background instanceof THREE.Color) scene.background.copy(c);
    blocks.current?.children.forEach((c, i) => {
      const s = Math.sin(t * 2 + i) * 0.03 * soft;
      c.scale.set(1 + soft * 0.15 + s, 1 - soft * 0.25 - s, 1 + soft * 0.15 + s);
    });
  });
  return (
    <group>
      <Sky color="#2b2a4a" />
      <Mist color="#2b2a4a" near={8} far={22} />
      <Floor color="#3b3a5e" size={60} />
      <group ref={blocks}>
        {CITY.map((b, i) => (
          <mesh key={i} geometry={G.rbox(0.3)} material={mat(b.c)} scale={[1.1, b.h, 1.1]} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow />
        ))}
      </group>
      <Billboard url={url} position={[-2.5, 4.5, -4]} rotation-y={0.25} />
      <Billboard url={url} position={[3.4, 5.2, -6]} rotation-y={-0.3} />
      <Billboard url={url} position={[0.4, 6.2, -9]} scale={1.6} />
      <Cam start={start} keys={[{ t: 0, pos: [0, 2, 9], look: [0, 3.5, -4] }, { t: 10, pos: [0, 4, 5.5], look: [0, 4.5, -5] }]} />
    </group>
  );
}

export function S9SoftWorld({ start }: { start: number }) {
  const now = useFilmNow();
  const giant = useStrawbaby({ coat: true });
  const ids = ['squalino', 'cappuccina', 'croissanto', 'gattino', 'pinguino', 'discobolo', 'bananaguard', 'medusa', 'tostadino', 'nuvoletta', 'pera', 'ape'];
  const toys = useMemo(() => ids.map((id) => buildToy(CARD[id].toy)), []);
  const walkers = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    walkers.current?.children.forEach((c, i) => {
      const a = t * 0.25 + (i / ids.length) * Math.PI * 2;
      const r = 3 + (i % 3) * 1.4;
      c.position.set(Math.cos(a) * r, Math.abs(Math.sin(t * 5 + i)) * 0.12, Math.sin(a) * r - 2);
      c.rotation.y = -a;
    });
  });
  return (
    <group>
      <Sky color="#ffc2d6" />
      <Mist color="#ffc2d6" near={9} far={26} />
      <Floor color="#ffd6e5" size={80} />
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} geometry={G.sph()} material={mat(['#ffe3ec', '#ffc9de', '#fff0f6'][i % 3], 'fabric')} scale={[1.6 + (i % 3), 0.6 + (i % 2) * 0.4, 1.6 + (i % 4) * 0.5]} position={[((i * 41) % 26) - 13, 0.1, -6 - ((i * 17) % 10)]} />
      ))}
      <group ref={walkers}>
        {toys.map((t, i) => (
          <group key={i}>
            <primitive object={t} scale={0.8} />
          </group>
        ))}
      </group>
      <primitive object={giant} position={[0, -1, -16]} scale={7} />
      <Cam start={start} keys={[{ t: 0, pos: [0, 2.2, 8.5], look: [0, 0.9, -3] }, { t: 9, pos: [0, 3.2, 6.5], look: [0, 5, -14] }]} />
    </group>
  );
}

export function S10Hideout({ start }: { start: number }) {
  const now = useFilmNow();
  const icons = useRef<THREE.Group>(null);
  const grass = useRef<THREE.Group>(null);
  const crew: ReclaimerId[] = ['coach', 'nonna', 'dj', 'mina', 'biblio'];
  const people = useMemo(() => crew.map((id) => buildToy(RECLAIMERS[id].toy)), []);
  useFrame(() => {
    const t = now() - start;
    icons.current?.children.forEach((c, i) => {
      const k = ease(clamp01((t - 3.2 - i * 0.6) / 0.7));
      c.scale.setScalar(k * 0.55);
      c.position.y = 2.0 + k * 0.25 + Math.sin(t * 2 + i) * 0.06;
      c.rotation.y = t * 0.8 + i;
    });
    grass.current?.children.forEach((c, i) => {
      c.scale.y = clamp01((t - 1 - (i % 10) * 0.12) / 1.2) * (0.5 + (i % 3) * 0.3);
    });
  });
  const items: React.ReactNode[] = [
    <mesh geometry={G.cone()} material={mat('#51cf66')} scale={[0.35, 0.7, 0.35]} />,
    <mesh geometry={G.rbox(0.4)} material={mat('#d4a373')} scale={[0.8, 0.45, 0.5]} />,
    <group rotation-x={1.3}>
      <mesh geometry={G.cyl()} material={mat('#212529')} scale={[0.45, 0.03, 0.45]} />
      <mesh geometry={G.cyl()} material={mat('#ff6b6b')} scale={[0.16, 0.04, 0.16]} />
    </group>,
    <mesh geometry={G.sph()} material={mat('#f06595', 'fabric')} scale={0.35} />,
    <mesh geometry={G.box()} material={mat('#f8f9fa', 'matte')} scale={[0.55, 0.7, 0.03]} />,
  ];
  return (
    <group>
      <Sky color="#1c2541" />
      <Mist color="#1c2541" near={9} far={22} />
      <Floor color="#2d3a5c" />
      <group position={[0, 0, -2.4]}>
        <mesh geometry={G.rbox(0.1)} material={mat('#f4d6a0', 'matte')} scale={[3, 2.2, 2.4]} position={[0, 1.1, 0]} castShadow receiveShadow />
        <mesh geometry={G.cone()} material={mat('#c92a2a', 'matte')} scale={[2.4, 1.4, 2.4]} position={[0, 2.9, 0]} rotation-y={Math.PI / 4} castShadow />
        <mesh position={[0.6, 1.3, 1.21]}>
          <planeGeometry args={[0.8, 0.7]} />
          <meshBasicMaterial color="#ffd43b" />
        </mesh>
        <mesh position={[-0.6, 0.7, 1.21]}>
          <planeGeometry args={[0.7, 1.4]} />
          <meshStandardMaterial color="#5c3d2e" />
        </mesh>
        <pointLight position={[0.6, 1.3, 2.4]} intensity={8} distance={7} color="#ffd43b" />
      </group>
      <group ref={grass}>
        {Array.from({ length: 70 }, (_, i) => (
          <mesh key={i} geometry={G.cone()} material={mat(i % 2 ? '#51cf66' : '#40c057')} scale={[0.06, 0.4, 0.06]} position={[((i * 37) % 90) / 10 - 4.5, 0.15, ((i * 53) % 50) / 10 - 0.6]} />
        ))}
      </group>
      {people.map((p, i) => (
        <primitive key={i} object={p} position={[(i - 2) * 1.25, 0, 0.9]} scale={0.95} rotation-y={-(i - 2) * 0.12} />
      ))}
      <group ref={icons} position={[0, 0, 0.9]}>
        {items.map((it, i) => (
          <group key={i} position={[(i - 2) * 1.25, 2.0, 0]}>
            {it}
          </group>
        ))}
      </group>
      <Cam start={start} keys={[{ t: 0, pos: [0, 3.2, 10], look: [0, 1.4, -1.5] }, { t: 9, pos: [0, 2.2, 6.4], look: [0, 1.3, 0] }]} />
    </group>
  );
}

export function S11Title({ start }: { start: number }) {
  const sb = useStrawbaby({ coat: true });
  const crowd = ['squalino', 'croissanto', 'gattino', 'pinguino', 'discobolo', 'cappuccina'];
  const toys = useMemo(() => crowd.map((id) => buildToy(CARD[id].toy)), []);
  const now = useFilmNow();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = now() - start;
    ref.current?.rotation.set(0, Math.sin(t * 0.6) * 0.3, 0);
  });
  return (
    <group>
      <Sky color="#ffe3ec" />
      <Floor color="#ffc9d9" />
      <group ref={ref}>
        <primitive object={sb} scale={1.3} />
      </group>
      {toys.map((t, i) => {
        const a = -1.1 + (i / (toys.length - 1)) * 2.2;
        return <primitive key={i} object={t} position={[Math.sin(a) * 2.6, 0, -Math.cos(a) * 1.2 - 0.6]} scale={0.7} rotation-y={-a * 0.6} />;
      })}
      <Cam start={start} keys={[{ t: 0, pos: [0, 1.4, 5.5], look: [0, 1, 0] }, { t: 8, pos: [0, 1.8, 8], look: [0, 0.9, 0] }]} />
    </group>
  );
}
