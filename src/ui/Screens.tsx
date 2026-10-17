// Title, lobby, game shell and results.
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { CARDS } from '../game/cards';
import { RECLAIMERS } from '../game/content';
import { softness, standings } from '../game/engine';
import type { SeatConfig } from '../game/engine';
import { StudioLights } from '../scene/Lights';
import { TableScene } from '../scene/Table';
import { useStore } from '../store';
import { preloadPortraits } from '../toys/portraits';
import { Strawbaby, Toy } from '../toys/Toy';
import { ActionBar, Hand } from './Hand';
import { Handoff, HoverCard, LogPanel, PlayersPanel, RulesSheet, Ticker, TopBar, WaitingBanner } from './Hud';
import { PromptPanel, SetupModal } from './Prompts';
import { useUI } from './uiStore';

export function Title() {
  const go = useStore((s) => s.go);
  const crowd = ['squalino', 'cappuccina', 'croissanto', 'gattino', 'pinguino', 'discobolo'];
  return (
    <div className="title-screen">
      <Canvas shadows camera={{ position: [0, 1.7, 8.4], fov: 35 }}>
        <color attach="background" args={['#ffe3ec']} />
        <StudioLights />
        <Strawbaby position={[0, 0, 0]} scale={1.3} />
        {crowd.map((id, i) => {
          const c = CARDS.find((x) => x.id === id)!;
          const a = -1.1 + (i / (crowd.length - 1)) * 2.2;
          return <Toy key={id} recipe={c.toy} seed={i} position={[Math.sin(a) * 2.6, 0, -Math.cos(a) * 1.2 - 0.6]} scale={0.7} rotation-y={-a * 0.6} />;
        })}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial color="#ffc9d9" />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.1} maxPolarAngle={1.45} target={[0, 0.55, 0]} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
      <div className="title-overlay">
        <h1>
          ROTMANIA
          <span>Soft Power</span>
        </h1>
        <p className="tagline">A strawberry squishy in a trench coat took over the world by being helpful. Take it back, one weird little guy at a time.</p>
        <div className="title-btns">
          <button className="go big" onClick={() => go('film')}>▶ Watch the story</button>
          <button className="go big alt" onClick={() => go('lobby')}>Play</button>
        </div>
        <p className="small">3–4 players · ~40 minutes · bots included</p>
      </div>
    </div>
  );
}

const BOT_NAMES = ['Tralalina', 'Bombardino', 'Crocodilla', 'Patapim', 'Cappuccetto', 'Brr Brr Bruno'];

export function Lobby() {
  const start = useStore((s) => s.start);
  const go = useStore((s) => s.go);
  const [seats, setSeats] = useState<SeatConfig[]>([
    { name: 'You', bot: false },
    { name: BOT_NAMES[0], bot: true },
    { name: BOT_NAMES[1], bot: true },
  ]);
  const set = (i: number, patch: Partial<SeatConfig>) => setSeats(seats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  preloadPortraits(CARDS.map((c) => c.id));
  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Who's at the table?</h2>
        <div className="seat-count">
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
            <span className="seat-dot" style={{ background: ['#ff6b6b', '#4dabf7', '#ffd43b', '#b197fc'][i] }} />
            <input value={s.name} onChange={(e) => set(i, { name: e.target.value.slice(0, 16) })} />
            <div className="seg">
              <button className={!s.bot ? 'on' : ''} onClick={() => set(i, { bot: false })}>Human</button>
              <button className={s.bot ? 'on' : ''} onClick={() => set(i, { bot: true })}>Bot</button>
            </div>
          </div>
        ))}
        <p className="hint">Several humans can share one screen: the game asks you to pass the device between turns.</p>
        <div className="row-btns">
          <button className="skip" onClick={() => go('title')}>Back</button>
          <button className="go big" disabled={!seats.some((s) => !s.bot) && false} onClick={() => start(seats.map((s, i) => ({ ...s, name: s.name.trim() || `Player ${i + 1}` })))}>
            Deal me in →
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameScreen() {
  const game = useStore((s) => s.game)!;
  const viewer = useStore((s) => s.viewer);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);
  const me = game.players[viewer];
  const setupMine = game.prompt?.type === 'setup' && game.prompt.player === viewer && !me.bot;
  const handoff = useStore((s) => s.handoffPending);
  const setHover = useUI((u) => u.setHover);
  const select = useUI((u) => u.select);
  useEffect(() => {
    // anything that moves cards around invalidates hover previews and selections
    setHover(null);
    if (game.prompt?.type !== 'turn') select(null);
  }, [game.tick, setHover, select, game.prompt?.type]);
  return (
    <div className="game">
      <TableScene game={game} viewer={viewer} />
      <TopBar game={game} />
      <PlayersPanel game={game} viewer={viewer} />
      <Ticker game={game} />
      <LogPanel game={game} />
      {!handoff && !me.bot && game.phase === 'play' && (
        <>
          <Hand game={game} me={me} />
          <ActionBar game={game} me={me} />
          <PromptPanel game={game} me={me} />
        </>
      )}
      <WaitingBanner game={game} viewer={viewer} />
      {setupMine && !handoff && <SetupModal key={viewer} me={me} />}
      <HoverCard />
      <RulesSheet />
      <Handoff game={game} viewer={viewer} />
      {error && (
        <div className="toast" onClick={clearError}>
          {error}
        </div>
      )}
      {game.phase === 'over' && <div className="banner-over">The fourth season ends…</div>}
    </div>
  );
}

const EPILOGUE = {
  sewn: {
    title: 'The seam',
    text: "You barely leaned on it. Somewhere in the Soft World, Strawbaby takes off the trench coat for the first time in years. There's a seam where it tore. Mina sits down next to it with a needle and some yellow yarn. It takes a while. That's the point.",
  },
  stalemate: {
    title: 'Loosened',
    text: "The Soft World loosened its grip, a little. Strawbaby is still out there, coat buttoned, app open, ready to help. But people are touching grass again some of the time. Most of the time. Okay, on weekends.",
  },
  soft: {
    title: 'Comfortable',
    text: "Strawbaby smiles. You needed it so often that it never had to win; you handed it the seasons one Juice at a time. The coat stays on. The seam stays hidden. Next time, maybe, you'll try doing it yourself.",
  },
};

export function Results() {
  const game = useStore((s) => s.game)!;
  const go = useStore((s) => s.go);
  const start = useStore((s) => s.start);
  const seats = useStore((s) => s.seats);
  const st = standings(game);
  const soft = softness(game);
  const ep = EPILOGUE[soft.ending];
  const cols: [keyof (typeof st)[number]['sheet'], string][] = [
    ['cards', 'Brainrots'], ['crafts', 'Crafts'], ['stash', 'Stash'], ['lore', 'Tucked'], ['districts', 'Districts'], ['finale', 'Finale'], ['challenge', 'Challenge'], ['soft', 'Soft'],
  ];
  return (
    <div className="results">
      <div className="results-3d">
        <Canvas shadows camera={{ position: [0, 1.8, 7.2], fov: 35 }}>
          <color attach="background" args={[soft.ending === 'soft' ? '#ffd1e0' : soft.ending === 'sewn' ? '#e6f7ec' : '#fff1e0']} />
          <StudioLights />
          <Strawbaby coat={soft.ending !== 'sewn'} torn={soft.ending === 'sewn'} scale={1.5} />
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <circleGeometry args={[8, 48]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <OrbitControls enablePan={false} enableZoom={false} target={[0, 0.85, 0]} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      </div>
      <div className="results-body">
        <h2>
          {st[0].p.name} wins with {st[0].sheet.total} Aura
        </h2>
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
                  <small>{p.reclaimer && RECLAIMERS[p.reclaimer].name}</small>
                </td>
                {cols.map(([k]) => (
                  <td key={k}>{sheet[k]}</td>
                ))}
                <td className="tot">{sheet.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="epilogue">
          <h3>Epilogue: {ep.title}</h3>
          <p>{ep.text}</p>
          <small>
            The table took {soft.juice} Juice in total ({soft.perPlayer.toFixed(1)} each).
          </small>
        </div>
        <div className="row-btns">
          <button className="skip" onClick={() => go('title')}>Title</button>
          <button className="go big" onClick={() => start(seats)}>Play again</button>
        </div>
      </div>
    </div>
  );
}
