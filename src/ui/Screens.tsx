// Title, lobby and results, in noir.
import { useEffect, useState } from 'react';
import { BRAINROTS } from '../game/cards';
import { OBJECTIVES } from '../game/content';
import { standings, type SeatConfig } from '../game/engine';
import { PANEL_ART } from '../comic/art';
import { victory } from '../comic/panels';
import { renderCustom } from '../comic/render';
import { useStore } from '../store';
import { preloadPortraits } from '../toys/portraits';
import { Star } from './icons';

export function Title() {
  const go = useStore((s) => s.go);
  useEffect(() => preloadPortraits(BRAINROTS.map((b) => b.id)), []);
  return (
    <div className="title-screen">
      <picture>
        <source media="(max-aspect-ratio: 4/5)" srcSet={PANEL_ART.splash} />
        <img className="title-art" src={PANEL_ART.skyline} alt="Darth Berry looms over the city at night" />
      </picture>
      <div className="title-shade" />
      <div className="title-overlay">
        <h1>ROTMANIA</h1>
        <div className="title-sub">2048</div>
        <div className="title-cap">Darth Berry runs the city. Humans serve brainrots. Your cell has six nights to take some of it back.</div>
        <div className="title-btns">
          <button className="go" onClick={() => go('comic')}>Read the story</button>
          <button className="go alt" onClick={() => go('lobby')}>Play</button>
          <button className="go alt" onClick={() => go('handbook')}>Rulebook</button>
        </div>
        <div className="title-small">2–4 players · 30–45 minutes · bots included</div>
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
        Dawn after night six. Darth Berry is still out there, hat low, coat buttoned. But {freed} brainrots walked out of the Clinic this week, and {broadcasts} broadcasts cut through the feed. <b>{win.name}</b>’s cell did the most. It’s a start.
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
