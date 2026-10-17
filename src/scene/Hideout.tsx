// One player's hideout mat: three rows of five slots, brainrot toys standing in them.
import { Html } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CARD } from '../game/cards';
import { ROW_COLORS, ROW_NAMES } from '../game/content';
import { CRAFT_COST, payPlan } from '../game/engine';
import type { GameState, Player, Row } from '../game/types';
import { ROWS } from '../game/types';
import { useStore } from '../store';
import { buildToy } from '../toys/build';
import { G, mat } from '../toys/kit';
import { useUI } from '../ui/uiStore';
import { Craft, SoftBlob, StashBead } from './bits';
import { MAT_D, MAT_W, slotPos } from './layout';

const ROW_ICON: Record<Row, string> = { 0: '🌱', 1: '🧶', 2: '💬' };

interface Pulse {
  row: Row;
  at: number;
  kind: 'wake' | 'act' | 'ask';
  col?: number;
}

export function Hideout({ game, player, mine, ...props }: { game: GameState; player: Player; mine: boolean } & ThreeElements['group']) {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const selected = useUI((u) => u.selected);
  const answer = useStore((s) => s.answer);
  const myTurn = game.prompt?.type === 'turn' && game.prompt.player === player.id && !player.bot;
  const active = game.prompt?.player === player.id;
  useEffect(() => {
    const l = game.last;
    if (l && l.p === player.id && l.row !== undefined) setPulse({ row: l.row, at: performance.now(), kind: l.kind, col: l.col });
  }, [game.tick, game.last, player.id]);

  const placeable = useMemo(() => {
    if (!mine || !myTurn || !selected) return new Set<Row>();
    const c = CARD[selected];
    return new Set(c.rows.filter((r) => player.rows[r].length < 5 && payPlan(player, c.cost, player.rows[r].length)));
  }, [mine, myTurn, selected, player]);

  return (
    <group {...props}>
      {/* mat */}
      <mesh geometry={G.rbox(0.06)} material={mat('#fff4ea', 'matte')} scale={[MAT_W, 0.16, MAT_D]} position={[-0.35, 0.02, 0]} receiveShadow />
      <mesh geometry={G.rbox(0.06)} material={mat(player.color, 'matte')} scale={[MAT_W + 0.24, 0.12, MAT_D + 0.24]} position={[-0.35, 0, 0]} receiveShadow />
      {active && <ActiveGlow color={player.color} />}
      {ROWS.map((r) => (
        <RowStrip key={r} row={r} player={player} pulse={pulse} placeable={placeable.has(r)} onPlace={() => selected && answer({ type: 'wake', card: selected, row: r })} mine={mine} />
      ))}
      {/* attention tokens: actions left this season */}
      {Array.from({ length: player.actionsLeft }, (_, i) => (
        <mesh key={i} geometry={G.rbox(0.3)} material={mat(player.color)} scale={0.22} position={[-4.2 + i * 0.3, 0.24, MAT_D / 2 - 0.25]} castShadow />
      ))}
      <Html position={[0.5, 0.2, MAT_D / 2 + 0.45]} center distanceFactor={mine ? 9 : 12} zIndexRange={[10, 0]}>
        <div className="nametag" style={{ borderColor: player.color }}>
          <span className="dot" style={{ background: player.color }} />
          {player.name}
          {player.bot && <span className="bot">bot</span>}
        </div>
      </Html>
    </group>
  );
}

function ActiveGlow({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(clock.elapsedTime * 3) * 0.12;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[-0.35, 0.005, 0]}>
      <planeGeometry args={[MAT_W + 1.2, MAT_D + 1.2]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

function RowStrip({ row, player, pulse, placeable, onPlace, mine }: { row: Row; player: Player; pulse: Pulse | null; placeable: boolean; onPlace: () => void; mine: boolean }) {
  const slots = player.rows[row];
  const z = slotPos(row, 0)[2];
  const glow = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!glow.current) return;
    const m = glow.current.material as THREE.MeshBasicMaterial;
    const since = pulse && pulse.row === row && pulse.kind === 'act' ? (performance.now() - pulse.at) / 1000 : 9;
    const base = placeable ? 0.45 + Math.sin(performance.now() / 180) * 0.15 : 0;
    m.opacity = Math.max(base, since < 1.4 ? 0.6 * (1 - since / 1.4) : 0);
  });
  return (
    <group>
      <mesh geometry={G.rbox(0.2)} material={mat(ROW_COLORS[row], 'matte')} scale={[MAT_W - 0.5, 0.06, 1.2]} position={[-0.35, 0.1, z]} receiveShadow />
      <mesh ref={glow} rotation-x={-Math.PI / 2} position={[-0.35, 0.14, z]} onClick={(e) => { if (placeable) { e.stopPropagation(); onPlace(); } }}>
        <planeGeometry args={[MAT_W - 0.4, 1.3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* slot circles with craft costs */}
      {[0, 1, 2, 3, 4].map((c) => (
        <group key={c} position={slotPos(row, c)}>
          <mesh geometry={G.cyl()} material={mat(c < slots.length ? '#ffffff' : '#fff8f0', 'matte')} scale={[0.5, 0.03, 0.5]} receiveShadow />
          {c >= slots.length && CRAFT_COST[c] > 0 && (
            <group>
              {Array.from({ length: CRAFT_COST[c] }, (_, k) => (
                <Craft key={k} position={[(k - (CRAFT_COST[c] - 1) / 2) * 0.24, 0.05, 0.05]} />
              ))}
            </group>
          )}
        </group>
      ))}
      {slots.map((sl, c) => (
        <SlotToy key={sl.card + c} cardId={sl.card} row={row} col={c} crafts={sl.crafts} stash={sl.stash} lore={sl.lore} pulse={pulse} interactive={mine || true} />
      ))}
      <SoftBlob count={player.soft[row]} position={[-3.45, 0.1, z]} />
      <Html position={[-4.25, 0.15, z]} center distanceFactor={mine ? 9 : 12} zIndexRange={[10, 0]}>
        <div className="rowtag" style={{ background: ROW_COLORS[row] }}>
          <span>{ROW_ICON[row]}</span>
          <b>{ROW_NAMES[row]}</b>
        </div>
      </Html>
      {placeable && (
        <Html position={[slotPos(row, slots.length)[0], 1.1, z]} center zIndexRange={[20, 0]}>
          <button className="place-here" onClick={onPlace}>Wake here</button>
        </Html>
      )}
    </group>
  );
}

function SlotToy({ cardId, row, col, crafts, stash, lore, pulse }: { cardId: string; row: Row; col: number; crafts: number; stash: number; lore: number; pulse: Pulse | null; interactive: boolean }) {
  const c = CARD[cardId];
  const obj = useMemo(() => buildToy(c.toy), [c]);
  const ref = useRef<THREE.Group>(null);
  const born = useRef(performance.now());
  const setHover = useUI((u) => u.setHover);
  const pos = slotPos(row, col);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const now = performance.now();
    // pop in when woken
    const age = (now - born.current) / 1000;
    let s = age < 0.6 ? easeOutBack(Math.min(1, age / 0.6)) : 1;
    let y = 0;
    // hop when the row activates (right to left)
    if (pulse && pulse.row === row && pulse.kind === 'act') {
      const delay = (4 - col) * 0.12 + 0.25;
      const t = (now - pulse.at) / 1000 - delay;
      if (t > 0 && t < 0.5) {
        y = Math.sin((t / 0.5) * Math.PI) * 0.35;
        s *= 1 + Math.sin((t / 0.5) * Math.PI) * 0.08;
      }
    }
    const idle = Math.sin(clock.elapsedTime * 2.1 + col * 1.3 + row) * 0.02;
    g.scale.set(s * 0.82 * (1 + idle), s * 0.82 * (1 - idle), s * 0.82 * (1 + idle));
    g.position.y = pos[1] + y;
  });
  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover({ card: cardId, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        }}
        onPointerOut={() => setHover(null)}
      >
        <primitive object={obj} />
      </group>
      {Array.from({ length: crafts }, (_, k) => (
        <Craft key={'c' + k} position={[0.42, 0.06 + k * 0.07, 0.3 - k * 0.0]} />
      ))}
      {Array.from({ length: stash }, (_, k) => (
        <StashBead key={'s' + k} color="#fcc419" position={[-0.42, 0.07, 0.32 - k * 0.16]} />
      ))}
      {lore > 0 && (
        <group position={[0, 0.03, -0.12]}>
          {Array.from({ length: Math.min(lore, 6) }, (_, k) => (
            <mesh key={k} geometry={G.rbox(0.1)} material={mat(k % 2 ? '#3b1f4a' : '#5f3dc4', 'matte')} scale={[0.7, 0.025, 0.95]} position={[0.02 * k, 0.025 * k, -0.02 * k]} rotation={[0, 0.06 * k, 0]} />
          ))}
        </group>
      )}
    </group>
  );
}

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
