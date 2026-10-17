// The city board in noir: black-and-white districts, colored agents, tokens and brainrots.
import { CameraControls, Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BRAINROT } from '../game/cards';
import { DISTRICTS, GENERAL, SPACE, SPACES, capacityOf } from '../game/content';
import { canPlace, helperIndexes, patrol } from '../game/engine';
import type { DistrictId, GameState, Res, SpaceId } from '../game/types';
import { RES } from '../game/types';
import { NoirEffect } from '../noir/NoirEffect';
import { markHero } from '../noir/pipeline';
import { buildBuilding, buildCoolingTower, buildDataCenter, buildHangingLamp, buildStreetLamp } from '../noir/props';
import { buildDarthBerry, buildToy } from '../toys/build';
import { G, group, m, mat } from '../toys/kit';
import { useUI } from '../ui/uiStore';
import { DISTRICT_RECTS, LINEUP_POS, PAD_POS, PAD_R } from './cityLayout';
import { buildMeeple, buildResToken } from './tokens';

export function CityScene({ game, viewer, onPad }: { game: GameState; viewer: number; onPad: (s: SpaceId) => void }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 17, 16.5], fov: 40, near: 0.5, far: 120 }} gl={{ antialias: false }}>
      <color attach="background" args={['#141417']} />
      <Suspense fallback={null}>
        <Lights />
        <Board />
        {(Object.keys(DISTRICT_RECTS) as DistrictId[]).map((d) => (
          <District key={d} id={d} game={game} />
        ))}
        {SPACES.map((def) => (
          <Pad key={def.id} game={game} viewer={viewer} space={def.id} onPad={onPad} />
        ))}
        <Lineup game={game} />
        <Patrol game={game} />
        <Giant />
        <Rig />
        <NoirEffect lineWidth={1.25} dotSize={4} grain={0.035} contrast={1.2} />
      </Suspense>
    </Canvas>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[-8, 16, 10]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0005} />
      <directionalLight position={[10, 6, -6]} intensity={0.6} />
    </>
  );
}

/** Fit the whole board on screen whatever the window shape, from a 3/4 view. */
function Rig() {
  const ref = useRef<CameraControls>(null);
  const { size, camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vfov = (cam.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    // board is ~26 wide and ~17 deep (plus the giant behind); fit both
    const dW = 14.5 / Math.tan(hfov / 2);
    const dH = 11.5 / Math.tan(vfov / 2);
    const d = Math.max(dW, dH);
    ref.current?.setLookAt(0, d * 0.74, d * 0.68 + 0.6, 0, 0, 0.6, false);
  }, [size.width, size.height, camera]);
  return <CameraControls ref={ref} makeDefault minDistance={10} maxDistance={60} maxPolarAngle={1.15} minPolarAngle={0.35} minAzimuthAngle={-0.6} maxAzimuthAngle={0.6} smoothTime={0.4} />;
}

function Board() {
  return (
    <group>
      <mesh geometry={G.rbox(0.03)} material={mat('#3a3a3f', 'matte')} scale={[25.4, 0.4, 16]} position={[0, -0.2, -0.6]} receiveShadow />
      {/* streets */}
      <mesh geometry={G.box()} material={mat('#8d8d93', 'matte')} scale={[25, 0.02, 0.6]} position={[0, 0.01, -0.6]} receiveShadow />
      {[-4.1, 4.1].map((x) => (
        <mesh key={x} geometry={G.box()} material={mat('#8d8d93', 'matte')} scale={[0.5, 0.02, 6]} position={[x, 0.01, -3.9]} receiveShadow />
      ))}
      {[-6.95, -0.35, 4.15].map((x) => (
        <mesh key={x} geometry={G.box()} material={mat('#8d8d93', 'matte')} scale={[0.4, 0.02, 5.6]} position={[x, 0.01, 2.7]} receiveShadow />
      ))}
      {[-11, -5, 5, 11].map((x) => (
        <group key={x} position={[x, 0, -0.6]}>
          <primitive object={buildStreetLamp(1.6)} />
        </group>
      ))}
    </group>
  );
}

function tile(d: DistrictId) {
  const r = DISTRICT_RECTS[d];
  return { pos: [r.x, 0.06, r.z] as [number, number, number], scale: [r.w - 0.2, 0.12, r.d - 0.2] as [number, number, number] };
}

function District({ id, game }: { id: DistrictId; game: GameState }) {
  const r = DISTRICT_RECTS[id];
  const t = tile(id);
  const patrolled = game.phase === 'play' && patrol(game).district === id;
  const deco = useMemo(() => decoFor(id), [id]);
  return (
    <group>
      <mesh geometry={G.rbox(0.05)} material={mat(id === 'underground' ? '#5d5a57' : '#b9b6b0', 'matte')} position={t.pos} scale={t.scale} receiveShadow />
      <primitive object={deco} position={[r.x, 0.12, r.z]} />
      <Html position={[r.x - r.w / 2 + 0.2, 0.2, r.z - r.d / 2 + 0.3]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`dist-tag ${patrolled ? 'patrolled' : ''}`}>{DISTRICTS[id].name}</div>
      </Html>
    </group>
  );
}

/** B&W set dressing for each district, built once. */
function decoFor(id: DistrictId): THREE.Group {
  const g = new THREE.Group();
  switch (id) {
    case 'scrapyard': {
      let s = 7;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 22; i++) {
        const k = r();
        const pos: [number, number, number] = [-3 + r() * 6, 0.15 + r() * 0.3, -2.4 + r() * 1.7];
        g.add(k < 0.4 ? m(G.rbox(0.1), mat('#6a6a70', 'matte'), pos, [0.4 + r() * 0.5, 0.3 + r() * 0.4, 0.4], [0, r() * 3, 0]) : k < 0.7 ? m(G.tor(0.45), mat('#2a2a2e', 'matte'), pos, 0.28, [r(), r(), 0]) : m(G.ico(), mat('#808086', 'matte'), pos, 0.25 + r() * 0.2));
      }
      g.add(m(G.box(), mat('#555', 'metal'), [2.6, 1.6, -2.2], [0.12, 3.2, 0.12]));
      g.add(m(G.box(), mat('#555', 'metal'), [1.6, 3.1, -2.2], [2.2, 0.1, 0.1]));
      break;
    }
    case 'serverfarm': {
      const dc = buildDataCenter();
      dc.scale.setScalar(0.42);
      dc.position.set(0, 0, -1.6);
      g.add(dc);
      g.add(group(buildCoolingTower(0.6, 2.2)).translateX(-3.2).translateZ(-2));
      break;
    }
    case 'tower': {
      const steel = mat('#4a4a50', 'metal');
      for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) g.add(m(G.cyl(), steel, [x * 0.6 + 1.6, 2.1, z * 0.6 - 1.4], [0.05, 4.2, 0.05], [z * 0.1, 0, -x * 0.1]));
      for (let y = 0.6; y < 4; y += 0.6) g.add(m(G.box(), steel, [1.6, y, -1.4], [0.7 - y * 0.08, 0.04, 0.04], [0, 0, 0.5]));
      g.add(markHero(m(G.sph(), mat('#ff2d55', 'glow'), [1.6, 4.3, -1.4], 0.12)));
      g.add(m(G.hemi(), mat('#d0d0d4', 'metal'), [-1.6, 1.2, -1.8], [0.8, 0.4, 0.8], [-1.0, 0.4, 0]));
      g.add(buildBuilding(1.8, 1.6, 1.2, '#6b6b70', true, 4).translateX(-2.4).translateZ(-1.9));
      break;
    }
    case 'park': {
      for (const [x, z, s] of [[-1.6, -1.8, 1], [1.4, -1.9, 0.8], [0, -2.1, 1.2]] as const) {
        g.add(m(G.cyl(), mat('#5c4a3c', 'matte'), [x, 0.5 * s, z], [0.12, 1 * s, 0.12]));
        g.add(m(G.sph(), mat('#6f7a6c', 'matte'), [x, 1.3 * s, z], [0.7 * s, 0.6 * s, 0.7 * s]));
      }
      // the last real grass stays green
      for (let i = 0; i < 18; i++) g.add(markHero(m(G.cone(), mat('#51cf66'), [-2 + (i % 9) * 0.5, 0.14, -0.6 + Math.floor(i / 9) * 0.35], [0.06, 0.26, 0.06])));
      break;
    }
    case 'underground': {
      g.add(m(G.cyl(), mat('#2a2a2e', 'metal'), [2.3, 0.04, -1.7], [0.7, 0.06, 0.7]));
      for (let i = 0; i < 4; i++) g.add(m(G.box(), mat('#3a3734', 'matte'), [-1.8 + i * 0.35, 0.05 + i * 0.12, -1.9], [0.35, 0.1 + i * 0.24, 1.2]));
      const lamp = buildHangingLamp(1.8);
      lamp.position.set(0.4, 0, -1.6);
      g.add(lamp);
      g.add(markHero(m(G.sph(), mat('#ffd43b', 'glow'), [0.4, 1.66, -1.6], 0.1)));
      break;
    }
    case 'mall': {
      g.add(buildBuilding(3.6, 2.4, 1.4, '#7a7a80', true, 9).translateZ(-1.9));
      g.add(markHero(m(G.rbox(0.2), mat('#f472b6', 'glow'), [0, 2.0, -1.15], [1.6, 0.35, 0.06])));
      break;
    }
    case 'clinic': {
      g.add(buildBuilding(5, 2, 1.3, '#9a9aa0', true, 13).translateZ(-1.95));
      g.add(m(G.box(), mat('#e9ecef', 'matte'), [0, 1.7, -1.25], [0.5, 0.15, 0.04]));
      g.add(m(G.box(), mat('#e9ecef', 'matte'), [0, 1.7, -1.25], [0.15, 0.5, 0.04]));
      g.add(m(G.rbox(0.1), mat('#6b5644', 'matte'), [0.5, 0.25, -0.75], [5.6, 0.12, 0.5]));
      break;
    }
  }
  return g;
}

function Pad({ game, viewer, space, onPad }: { game: GameState; viewer: number; space: SpaceId; onPad: (s: SpaceId) => void }) {
  const def = SPACE[space];
  const [x, z] = PAD_POS[space];
  const st = game.spaces[space];
  const me = game.players[viewer];
  const myTurn = game.prompt?.type === 'place' && game.prompt.player === viewer && !me.bot;
  const legal = myTurn && (canPlace(game, me, space).ok || helperIndexes(me, def.district).some((h) => canPlace(game, me, space, { helper: h }).ok));
  const closed = game.round + 1 < (def.fromRound ?? 1);
  const setHover = useUI((u) => u.setHoverSpace);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({ color: me.color, emissive: me.color, emissiveIntensity: 0.9 }), [me.color]);
  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.visible = legal;
      ring.current.scale.setScalar(PAD_R * (1.04 + Math.sin(clock.elapsedTime * 4) * 0.04));
    }
  });
  const cap = capacityOf(def, game.players.length);
  const pile = RES.flatMap((r) => Array.from({ length: Math.min(8, st.pile[r] ?? 0) }, () => r));
  const isLast = game.last?.space === space;
  return (
    <group position={[x, 0.12, z]}>
      <mesh
        geometry={G.cyl()}
        material={mat(closed ? '#4a4a4e' : '#efece6', 'matte')}
        scale={[PAD_R, 0.1, PAD_R]}
        position={[0, 0.05, 0]}
        receiveShadow
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(space);
          document.body.style.cursor = legal ? 'pointer' : 'default';
        }}
        onPointerOut={() => {
          setHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (legal) onPad(space);
        }}
      />
      <mesh ref={ring} geometry={G.tor(0.06)} material={ringMat} rotation-x={Math.PI / 2} position={[0, 0.12, 0]} onUpdate={(o) => markHero(o)} />
      {pile.map((r, i) => (
        <Token key={i + r} r={r} pos={[Math.cos(i * 1.9) * 0.45 * (i ? 1 : 0), 0.11, Math.sin(i * 1.9) * 0.45 * (i ? 1 : 0) - 0.15]} />
      ))}
      {st.taken.map((pid, i) => (
        <Agent key={i} color={game.players[pid].color} pos={[(i - (st.taken.length - 1) / 2) * 0.42, 0.11, 0.12]} fresh={isLast && i === st.taken.length - 1} helper={wasHelper(game, space, i)} />
      ))}
      <Html position={[0, 0, PAD_R + 0.28]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`pad-tag ${legal ? 'legal' : ''} ${closed ? 'closed' : ''}`}>
          {def.name}
          {cap > 1 && cap !== Infinity && <small> ×{cap}</small>}
          {closed && <small> · night {def.fromRound}</small>}
        </div>
      </Html>
    </group>
  );
}

/** Was the i-th worker on this space a brainrot helper rather than an agent? */
function wasHelper(game: GameState, space: SpaceId, i: number) {
  const pid = game.spaces[space].taken[i];
  const k = game.spaces[space].taken.slice(0, i).filter((x) => x === pid).length;
  const mine = game.players[pid].placements.filter((pl) => pl.space === space);
  return mine[k]?.helper !== undefined;
}

function Token({ r, pos }: { r: Res; pos: [number, number, number] }) {
  const obj = useMemo(() => markHero(buildResToken(r)), [r]);
  return <primitive object={obj} position={pos} scale={1.7} />;
}

function Agent({ color, pos, fresh, helper }: { color: string; pos: [number, number, number]; fresh: boolean; helper: boolean }) {
  const obj = useMemo(() => {
    const g = new THREE.Group();
    g.add(buildMeeple(color));
    if (helper) g.add(m(G.star(), mat('#fcc419', 'metal'), [0, 0.85, 0], 0.12));
    return markHero(g);
  }, [color, helper]);
  const ref = useRef<THREE.Group>(null);
  const born = useRef(performance.now());
  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() - born.current) / 1000;
    const drop = fresh && t < 0.45 ? (1 - t / 0.45) * 2.2 : 0;
    ref.current.position.set(pos[0], pos[1] + drop, pos[2]);
  });
  return (
    <group ref={ref}>
      <primitive object={obj} />
    </group>
  );
}

function Lineup({ game }: { game: GameState }) {
  return (
    <group>
      {game.market.map((id, i) => {
        const [x, z] = LINEUP_POS[i];
        return (
          <group key={i} position={[x, 0.12, z]}>
            <mesh geometry={G.cyl()} material={mat('#d6d3cc', 'matte')} scale={[0.52, 0.16, 0.52]} position={[0, 0.08, 0]} receiveShadow />
            {id && <LineupToy id={id} />}
            {i >= 3 && id && (
              <Html position={[0, 0.2, 0.62]} center zIndexRange={[6, 0]} style={{ pointerEvents: 'none' }}>
                <div className="pad-tag deal">−1</div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function LineupToy({ id }: { id: string }) {
  const obj = useMemo(() => markHero(buildToy(BRAINROT[id].toy)), [id]);
  const ref = useRef<THREE.Group>(null);
  const setHover = useUI((u) => u.setHoverCard);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const k = Math.sin(clock.elapsedTime * 2 + id.length) * 0.02;
    ref.current.scale.set(0.72 * (1 + k), 0.72 * (1 - k), 0.72 * (1 + k));
  });
  return (
    <group
      ref={ref}
      position={[0, 0.16, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(id);
      }}
      onPointerOut={() => setHover(null)}
    >
      <primitive object={obj} />
    </group>
  );
}

function Patrol({ game }: { game: GameState }) {
  const g = game.phase === 'play' ? patrol(game) : GENERAL[game.generals[0]];
  const r = DISTRICT_RECTS[g.district];
  const obj = useMemo(() => markHero(buildToy(g.toy)), [g.id]);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.5;
  });
  return (
    <group position={[r.x + r.w / 2 - 0.9, 0.12, r.z - 0.2]}>
      <group ref={ref} scale={1.05}>
        <primitive object={obj} />
      </group>
      <Html position={[0, 2.0, 0]} center zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
        <div className="patrol-tag">
          {g.name}
          <small>toll: 1 {g.toll}</small>
        </div>
      </Html>
    </group>
  );
}

function Giant() {
  const obj = useMemo(() => markHero(buildDarthBerry()), []);
  return <primitive object={obj} position={[0, -0.5, -14]} scale={7.5} />;
}
