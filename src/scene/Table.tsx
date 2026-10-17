// The whole tabletop scene.
import { CameraControls, ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { useStore } from '../store';
import { G, mat } from '../toys/kit';
import { GachaMachine, SoftWorld, WordOfMouth } from './Center';
import { Hideout } from './Hideout';
import { StudioLights } from './Lights';
import { GACHA_POS, seatFor, TRAY_POS } from './layout';

export function TableScene({ game, viewer }: { game: GameState; viewer: number }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 15, 17], fov: 38 }} gl={{ antialias: true }}>
      <color attach="background" args={['#24162e']} />
      <fog attach="fog" args={['#24162e', 32, 60]} />
      <Suspense fallback={null}>
        <StudioLights warm />
        <TableTop />
        <SoftWorld game={game} />
        <GachaMachine game={game} />
        <WordOfMouth game={game} />
        {game.players.map((p) => {
          const rel = (p.id - viewer + game.players.length) % game.players.length;
          const seat = seatFor(rel, game.players.length);
          return <Hideout key={p.id} game={game} player={p} mine={rel === 0} position={seat.pos} rotation-y={seat.rotY} scale={seat.scale} />;
        })}
        <ContactShadows position={[0, 0.011, 0]} scale={34} blur={2.4} opacity={0.35} far={4} />
        <Rig game={game} viewer={viewer} />
      </Suspense>
    </Canvas>
  );
}

function TableTop() {
  return (
    <group>
      <mesh geometry={G.rbox(0.04)} material={mat('#f3c9d6', 'fabric')} scale={[30, 0.4, 22]} position={[0, -0.2, 0]} receiveShadow />
      <mesh geometry={G.rbox(0.04)} material={mat('#8a4b62', 'vinyl')} scale={[30.8, 0.5, 22.8]} position={[0, -0.32, 0]} receiveShadow />
      <mesh geometry={G.rbox(0.04)} material={mat('#2c1b36', 'matte')} scale={[80, 0.2, 80]} position={[0, -4, 0]} receiveShadow />
    </group>
  );
}

/** Camera: follow the action, but let the player orbit freely. */
function Rig({ game, viewer }: { game: GameState; viewer: number }) {
  const ref = useRef<CameraControls>(null);
  const focus = useStore((s) => s.focus);
  const pr = game.prompt;
  const key = (() => {
    if (focus.kind === 'player') return 'p' + focus.id;
    if (!pr) return 'table';
    const me = game.players[pr.player];
    if (me.bot) return 'table';
    if (pr.type === 'gacha') return 'gacha';
    if (pr.type === 'draw') return 'tray';
    if (pr.type === 'setup') return 'table';
    return 'mine';
  })();
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const n = game.players.length;
    switch (key) {
      case 'gacha':
        c.setLookAt(GACHA_POS[0] + 1.5, 6.5, GACHA_POS[2] + 7.5, GACHA_POS[0] + 0.6, 1.0, GACHA_POS[2], true);
        break;
      case 'tray':
        c.setLookAt(TRAY_POS[0] - 0.5, 7.5, TRAY_POS[2] + 7, TRAY_POS[0] + 0.3, 0, TRAY_POS[2], true);
        break;
      case 'mine':
        c.setLookAt(0, 15.5, 17.5, 0, 0, 4.6, true);
        break;
      default: {
        if (key.startsWith('p')) {
          const id = Number(key.slice(1));
          const rel = (id - viewer + n) % n;
          const seat = seatFor(rel, n);
          const [x, , z] = seat.pos;
          const away = { x: Math.sin(seat.rotY) * 7.5, z: Math.cos(seat.rotY) * 7.5 };
          c.setLookAt(x + away.x, 8.5, z + away.z, x, 0, z, true);
        } else c.setLookAt(0, 17.5, 16.5, 0, 0, 1.2, true);
      }
    }
  }, [key, viewer, game.players.length]);
  return <CameraControls ref={ref} makeDefault minDistance={5} maxDistance={34} maxPolarAngle={1.35} smoothTime={0.55} />;
}
