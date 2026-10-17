// The middle of the table: the Soft World (districts + Strawbaby), the gacha machine, Word of Mouth.
import { Html } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CARD } from '../game/cards';
import { DISTRICTS, VIBE_COLORS } from '../game/content';
import { canTakeJuice } from '../game/engine';
import type { GameState } from '../game/types';
import { useStore } from '../store';
import { buildStrawbaby } from '../toys/build';
import { G, mat } from '../toys/kit';
import { useCardPortrait } from '../toys/portraits';
import { useUI } from '../ui/uiStore';
import { CardBack, CardMesh, Capsule } from './bits';
import { BOARD_R, GACHA_POS, TRAY_POS } from './layout';

export function SoftWorld({ game }: { game: GameState }) {
  const angles = [-0.75, 0.75, 2.39, -2.39].map((a) => a - Math.PI / 2);
  return (
    <group>
      <mesh geometry={G.cyl()} material={mat('#ffd6e5', 'fabric')} scale={[BOARD_R, 0.1, BOARD_R]} position={[0, 0.05, 0]} receiveShadow />
      <mesh geometry={G.tor(0.04)} material={mat('#ff8fb8')} scale={[BOARD_R, BOARD_R, 1.6]} rotation-x={Math.PI / 2} position={[0, 0.1, 0]} />
      <Cushion />
      <StrawbabyBoss game={game} />
      {game.districts.map((d, i) => (
        <DistrictTile key={d} game={game} index={i} angle={angles[i]} />
      ))}
    </group>
  );
}

function Cushion() {
  return (
    <group position={[0, 0.1, 0]}>
      <mesh geometry={G.sph()} material={mat('#ff8fb8', 'fabric')} scale={[0.95, 0.22, 0.95]} position={[0, 0.12, 0]} receiveShadow castShadow />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={G.sph()} material={mat('#ff6b9a', 'fabric')} scale={0.08} position={[Math.cos((i * Math.PI) / 2 + 0.78) * 0.88, 0.14, Math.sin((i * Math.PI) / 2 + 0.78) * 0.88]} />
      ))}
    </group>
  );
}

function StrawbabyBoss({ game }: { game: GameState }) {
  const obj = useMemo(() => buildStrawbaby(), []);
  const ref = useRef<THREE.Group>(null);
  const [askAt, setAskAt] = useState(-9999);
  const [askColor, setAskColor] = useState('#ff4d6d');
  useEffect(() => {
    const l = game.last;
    if (l?.kind === 'ask') {
      setAskAt(performance.now());
      setAskColor(game.players[l.p].color);
    }
  }, [game.tick, game.last, game.players]);
  // also react to Juice capsules and Juice cards: the log says it
  const lastLog = game.log[game.log.length - 1];
  useEffect(() => {
    if (lastLog?.kind === 'soft' && lastLog.msg.includes('Juice')) setAskAt(performance.now());
  }, [lastLog]);
  const sparkles = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (performance.now() - askAt) / 1000;
    const idle = Math.sin(clock.elapsedTime * 1.8) * 0.03;
    if (t < 1.2) {
      const k = t / 1.2;
      g.position.y = 0.3 + Math.sin(k * Math.PI) * 0.6;
      g.rotation.y = k * Math.PI * 2;
      g.scale.setScalar(1.25 * (1 + Math.sin(k * Math.PI * 3) * 0.06));
    } else {
      g.position.y = 0.3;
      g.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.35;
      g.scale.set(1.25 * (1 + idle), 1.25 * (1 - idle), 1.25 * (1 + idle));
    }
    if (sparkles.current) {
      sparkles.current.visible = t < 1.6;
      sparkles.current.children.forEach((c, i) => {
        const a = i * 1.1 + t * 3;
        const r = 0.6 + t * 1.4;
        c.position.set(Math.cos(a) * r, 0.8 + t * 1.2 + Math.sin(i) * 0.3, Math.sin(a) * r);
        c.scale.setScalar(Math.max(0, 0.12 * (1 - t / 1.6)));
      });
    }
  });
  return (
    <group>
      <group ref={ref} position={[0, 0.3, 0]}>
        <primitive object={obj} />
      </group>
      <group ref={sparkles}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} geometry={G.heart()} material={mat(i % 2 ? '#ff4d6d' : askColor, 'glow')} />
        ))}
      </group>
    </group>
  );
}

function DistrictTile({ game, index, angle }: { game: GameState; index: number; angle: number }) {
  const d = DISTRICTS[game.districts[index]];
  const current = game.phase === 'play' && game.round === index;
  const res = game.results.find((r) => r.round === index);
  const winners = res ? res.scores.filter((x) => x.place === 1).map((x) => game.players[x.player].color) : [];
  const r = BOARD_R * 0.66;
  const pos: [number, number, number] = [Math.cos(angle) * r, 0.14, Math.sin(angle) * r];
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = current ? 0.18 + Math.sin(clock.elapsedTime * 2.5) * 0.04 : 0.1;
  });
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <mesh geometry={G.rbox(0.25)} material={mat(res ? (winners.length ? '#ffffff' : '#ffc2d6') : d.color, 'vinyl')} scale={[1.25, 0.18, 1.25]} castShadow receiveShadow />
        {res && winners.length === 0 && <mesh geometry={G.sph()} material={mat('#ff8fb8', 'glass')} scale={[0.5, 0.25, 0.5]} position={[0, 0.12, 0]} />}
        {winners.map((c, i) => (
          <Flag key={i} color={c} position={[(i - (winners.length - 1) / 2) * 0.35, 0.1, 0]} />
        ))}
      </group>
      <Html position={[0, 0.6, 0]} center distanceFactor={11} zIndexRange={[10, 0]}>
        <div className={`district ${current ? 'now' : ''} ${res ? 'done' : ''}`} style={{ borderColor: d.color }}>
          <div className="dname">S{index + 1} · {d.name}</div>
          {current && <div className="dgoal">{d.goal}</div>}
        </div>
      </Html>
    </group>
  );
}

function Flag({ color, ...props }: { color: string } & ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh geometry={G.cyl()} material={mat('#f8f9fa', 'metal')} scale={[0.025, 0.8, 0.025]} position={[0, 0.4, 0]} castShadow />
      <mesh geometry={G.box()} material={mat(color, 'fabric')} scale={[0.32, 0.22, 0.02]} position={[0.17, 0.66, 0]} castShadow />
    </group>
  );
}

// ───────────────────────── gacha machine ─────────────────────────
export function GachaMachine({ game }: { game: GameState }) {
  const answer = useStore((s) => s.answer);
  const pr = game.prompt;
  const picker = pr?.type === 'gacha' ? game.players[pr.player] : null;
  const canPick = !!picker && !picker.bot;
  const glassRef = useRef<THREE.Mesh>(null);
  const slots = useMemo(
    () => [
      [-0.32, 1.55, 0.18],
      [0.3, 1.5, 0.2],
      [0, 1.42, -0.25],
      [-0.12, 1.85, 0.05],
      [0.26, 1.82, -0.12],
    ] as [number, number, number][],
    [],
  );
  const [shakeAt, setShakeAt] = useState(0);
  const sig = game.gacha.join(',');
  useEffect(() => setShakeAt(performance.now()), [sig]);
  const body = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = (performance.now() - shakeAt) / 1000;
    if (body.current) body.current.rotation.z = t < 0.4 ? Math.sin(t * 50) * 0.03 * (1 - t / 0.4) : 0;
  });
  return (
    <group position={GACHA_POS}>
      <group ref={body}>
        <mesh geometry={G.rbox(0.25)} material={mat('#ff4d6d')} scale={[1.5, 1.1, 1.3]} position={[0, 0.55, 0]} castShadow receiveShadow />
        <mesh geometry={G.rbox(0.3)} material={mat('#ffffff')} scale={[0.5, 0.3, 0.1]} position={[0, 0.45, 0.66]} />
        <mesh geometry={G.cyl()} material={mat('#fcc419', 'metal')} scale={[0.17, 0.1, 0.17]} position={[0.42, 0.75, 0.68]} rotation-x={Math.PI / 2} />
        <mesh geometry={G.box()} material={mat('#fcc419', 'metal')} scale={[0.26, 0.06, 0.06]} position={[0.42, 0.75, 0.74]} />
        <mesh geometry={G.cyl()} material={mat('#c92a2a')} scale={[0.8, 0.12, 0.8]} position={[0, 1.15, 0]} castShadow />
        <mesh ref={glassRef} geometry={G.sph()} material={mat('#ffffff', 'glass')} scale={0.82} position={[0, 1.7, 0]} />
        <mesh geometry={G.cyl()} material={mat('#c92a2a')} scale={[0.2, 0.12, 0.2]} position={[0, 2.55, 0]} />
        <Html position={[0, 0.55, 0.75]} center distanceFactor={11} zIndexRange={[10, 0]}>
          <div className="machine-label">GACHA</div>
        </Html>
      </group>
      {game.gacha.map((f, i) => {
        const pickable = canPick && (f !== 'juice' || canTakeJuice(picker!));
        return <PickCapsule key={i + f + sig} face={f} pos={slots[i]} pickable={pickable} onPick={() => answer({ type: 'gacha', index: i })} />;
      })}
    </group>
  );
}

function PickCapsule({ face, pos, pickable, onPick }: { face: GameState['gacha'][number]; pos: [number, number, number]; pickable: boolean; onPick: () => void }) {
  const [hover, setHover] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const born = useRef(performance.now());
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const age = (performance.now() - born.current) / 1000;
    const drop = age < 0.5 ? (1 - age / 0.5) * 0.6 : 0;
    ref.current.position.set(pos[0], pos[1] + drop + (pickable ? Math.sin(clock.elapsedTime * 4 + pos[0] * 9) * 0.04 : 0), pos[2]);
    ref.current.rotation.y += 0.01;
    ref.current.scale.setScalar(hover && pickable ? 1.25 : 1);
  });
  return (
    <group
      ref={ref}
      onClick={(e) => {
        if (!pickable) return;
        e.stopPropagation();
        onPick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        if (pickable) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = '';
      }}
    >
      <Capsule face={face} rotation={[0.3, 0, 0.2]} />
    </group>
  );
}

// ───────────────────────── word of mouth tray + deck ─────────────────────────
export function WordOfMouth({ game }: { game: GameState }) {
  const answer = useStore((s) => s.answer);
  const pr = game.prompt;
  const canDraw = pr?.type === 'draw' && !game.players[pr.player].bot;
  const deckH = Math.min(30, game.deck.length) * 0.012;
  return (
    <group position={TRAY_POS}>
      <mesh geometry={G.rbox(0.15)} material={mat('#8d5b3e')} scale={[4.6, 0.12, 2.1]} position={[0.5, 0.06, 0]} receiveShadow castShadow />
      {game.tray.map((id, i) =>
        id ? <TrayCard key={id} cardId={id} position={[-0.8 + i * 1.25, 0.15, 0]} pickable={canDraw} onPick={() => answer({ type: 'draw', tray: i })} /> : null,
      )}
      <group
        position={[2.85, 0.13 + deckH / 2, 0]}
        onClick={(e) => {
          if (!canDraw) return;
          e.stopPropagation();
          answer({ type: 'draw', tray: 'deck' });
        }}
      >
        <mesh geometry={G.rbox(0.08)} material={mat('#3b1f4a', 'matte')} scale={[1.1, Math.max(0.04, deckH), 1.55]} castShadow />
        <CardBack position={[0, deckH / 2, 0]} />
      </group>
      <Html position={[0.5, 0.2, 1.35]} center distanceFactor={11} zIndexRange={[10, 0]}>
        <div className="machine-label wom">WORD OF MOUTH</div>
      </Html>
    </group>
  );
}

function TrayCard({ cardId: id, pickable, onPick, ...props }: { cardId: string; pickable: boolean; onPick: () => void } & ThreeElements['group']) {
  const url = useCardPortrait(id);
  const setHover = useUI((u) => u.setHover);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = pickable ? 0.08 + Math.sin(clock.elapsedTime * 3 + id.length) * 0.05 : 0;
  });
  return (
    <group {...props}>
      <group
        ref={ref}
        onClick={(e) => {
          if (!pickable) return;
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover({ card: id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
          if (pickable) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(null);
          document.body.style.cursor = '';
        }}
      >
        <CardMesh portrait={url} band={VIBE_COLORS[CARD[id].vibe]} />
      </group>
    </group>
  );
}
