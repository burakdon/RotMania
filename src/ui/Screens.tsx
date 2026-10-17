// Title, lobby and results, in noir.
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { BRAINROTS } from '../game/cards';
import { OBJECTIVES } from '../game/content';
import { standings, type SeatConfig } from '../game/engine';
import { victory } from '../comic/panels';
import { renderCustom } from '../comic/render';
import { NoirEffect } from '../noir/NoirEffect';
import { markHero } from '../noir/pipeline';
import { buildBuilding, buildRain, buildStreetLamp } from '../noir/props';
import { useStore } from '../store';
import { preloadPortraits } from '../toys/portraits';
import { buildDarkBerry } from '../toys/build';
import { Star } from './icons';

function TitleScene() {
  const scene = useMemo(() => {
    const g = new THREE.Group();
    const db = markHero(buildDarkBerry());
    db.scale.setScalar(1.6);
    db.position.x = 0.2;
    g.add(db);
    g.add(buildStreetLamp(5.5).translateX(-1.4).translateZ(-0.5));
    for (let i = 0; i < 8; i++) g.add(buildBuilding(2.6, 5 + (i % 3) * 2.2, 2.6, '#57575d', true, 31 + i).translateX(-10 + i * 2.9).translateZ(-6 - (i % 2) * 1.6));
    g.add(buildRain(420, [14, 12, 8], [0, 5, -1], 9, { at: [1.6, 1.4, 7.2], r: 3 }));
    return g;
  }, []);
  return (
    <>
      <color attach="background" args={['#202024']} />
      <ambientLight intensity={0.3} />
      <spotLight position={[-0.5, 5.4, -0.5]} angle={0.6} penumbra={0.5} intensity={220} decay={1.6} />
      <directionalLight position={[3, 3, -4]} intensity={1.4} color="#ff4d6d" />
      <directionalLight position={[-4, 6, 4]} intensity={0.5} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.2} metalness={0.4} />
      </mesh>
      <primitive object={scene} />
      <NoirEffect lineWidth={1.4} dotSize={4.5} grain={0.04} contrast={1.35} />
    </>
  );
}

export function Title() {
  const go = useStore((s) => s.go);
  useEffect(() => preloadPortraits(BRAINROTS.map((b) => b.id)), []);
  return (
    <div className="title-screen">
      <Canvas camera={{ position: [1.6, 1.4, 7.2], fov: 38 }} dpr={[1, 1.5]} onCreated={({ camera }) => camera.lookAt(-0.2, 2.1, 0)}>
        <TitleScene />
      </Canvas>
      <div className="title-overlay">
        <h1>ROTMANIA</h1>
        <div className="title-sub">2048</div>
        <div className="title-cap">DarkBerry runs the city. Humans serve brainrots. Your cell has six nights to take some of it back.</div>
        <div className="title-btns">
          <button className="go" onClick={() => go('comic')}>Read the story</button>
          <button className="go alt" onClick={() => go('lobby')}>Play</button>
        </div>
        <div className="title-small">2–4 players · about 45 minutes · bots included</div>
      </div>
    </div>
  );
}

const BOT_NAMES = ['Cell Rossa', 'Cell Blu', 'Cell Giallo', 'Cell Viola'];

export function Lobby() {
  const start = useStore((s) => s.start);
  const go = useStore((s) => s.go);
  const [seats, setSeats] = useState<SeatConfig[]>([
    { name: 'You', bot: false },
    { name: BOT_NAMES[1], bot: true },
    { name: BOT_NAMES[2], bot: true },
  ]);
  const set = (i: number, patch: Partial<SeatConfig>) => setSeats(seats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Who’s in the cell?</h2>
        <div className="seg">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={seats.length === n ? 'on' : ''}
              onClick={() => {
                const next = seats.slice(0, n);
                while (next.length < n) next.push({ name: BOT_NAMES[next.length], bot: true });
                setSeats(next);
              }}
            >
              {n} players
            </button>
          ))}
        </div>
        {seats.map((s, i) => (
          <div key={i} className="seat">
            <span className="seat-dot" style={{ background: ['#e03131', '#1c7ed6', '#f59f00', '#7048e8'][i] }} />
            <input value={s.name} onChange={(e) => set(i, { name: e.target.value.slice(0, 16) })} />
            <div className="seg small">
              <button className={!s.bot ? 'on' : ''} onClick={() => set(i, { bot: false })}>Human</button>
              <button className={s.bot ? 'on' : ''} onClick={() => set(i, { bot: true })}>Bot</button>
            </div>
          </div>
        ))}
        <p className="hint">Humans can share one screen: the game asks you to pass the device between turns.</p>
        <div className="row-btns">
          <button className="go alt" onClick={() => go('title')}>Back</button>
          <button className="go" onClick={() => start(seats.map((s, i) => ({ ...s, name: s.name.trim() || `Player ${i + 1}` })))}>
            Start night one
          </button>
        </div>
      </div>
    </div>
  );
}

export function Results() {
  const game = useStore((s) => s.game)!;
  const go = useStore((s) => s.go);
  const start = useStore((s) => s.start);
  const seats = useStore((s) => s.seats);
  const st = standings(game);
  const win = st[0].p;
  const [art, setArt] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setArt(renderCustom('victory-' + game.tick, victory(win.allies), 1400, 620)), 30);
    return () => clearTimeout(t);
  }, [game.tick, win]);
  const broadcasts = game.players.reduce((a, p) => a + p.feedCount, 0);
  const freed = game.players.reduce((a, p) => a + p.allies.length, 0);
  const cols: [keyof (typeof st)[number]['sheet'], string][] = [
    ['allies', 'Allies'], ['feed', 'Broadcasts'], ['objectives', 'Objectives'], ['recruits', 'Recruits'], ['finale', 'End powers'], ['leftovers', 'Leftovers'], ['hungry', 'Ungrounded'],
  ];
  return (
    <div className="results">
      <div className="results-art">{art ? <img src={art} alt="" /> : <div className="panel-inking">inking…</div>}</div>
      <div className="results-cap">
        Dawn after night six. DarkBerry is still out there, hat low, coat buttoned. But {freed} brainrots walked out of the Clinic this week, and {broadcasts} broadcasts cut through the feed. <b>{win.name}</b>’s cell did the most. It’s a start.
      </div>
      <table className="score-table">
        <thead>
          <tr>
            <th />
            {cols.map(([, l]) => (
              <th key={l}>{l}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {st.map(({ p, sheet }, i) => (
            <tr key={p.id} className={i === 0 ? 'win' : ''}>
              <td style={{ color: p.color }}>
                {i + 1}. {p.name}
                <small>{p.objectives.map((o) => OBJECTIVES[o].name).join(', ')}</small>
              </td>
              {cols.map(([k]) => (
                <td key={k}>{sheet[k]}</td>
              ))}
              <td className="tot">
                <Star size={14} /> {sheet.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row-btns">
        <button className="go alt" onClick={() => go('title')}>Title</button>
        <button className="go" onClick={() => start(seats)}>Play again</button>
      </div>
    </div>
  );
}
