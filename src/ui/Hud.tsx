// Always-on information: season bar, players, log, hover preview, hand-off screen.
import { useEffect, useRef } from 'react';
import { DISTRICTS, POOL_ICONS, RECLAIMERS, ROW_NAMES } from '../game/content';
import { ACTIONS, districtValue, ROUNDS, scorePlayer, softness } from '../game/engine';
import type { GameState, Player, Pool } from '../game/types';
import { useStore } from '../store';
import { useReclaimerPortrait } from '../toys/portraits';
import { CardView } from './CardView';
import { useUI } from './uiStore';

const POOLS: Pool[] = ['grass', 'bread', 'vinyl', 'yarn', 'paper', 'juice'];

export function TopBar({ game }: { game: GameState }) {
  const d = DISTRICTS[game.districts[game.round]];
  const toggleLog = useUI((u) => u.toggleLog);
  const setRules = useUI((u) => u.setRules);
  const speed = useStore((s) => s.botSpeed);
  const setSpeed = useStore((s) => s.setBotSpeed);
  const setFocus = useStore((s) => s.setFocus);
  const soft = softness(game);
  return (
    <div className="topbar">
      <div className="season">
        <div className="logo-sm">ROTMANIA</div>
        <div className="season-dots">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span key={i} className={i < game.round ? 'done' : i === game.round ? 'now' : ''} title={`Season ${i + 1}: ${ACTIONS[i]} actions`}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      {game.phase === 'play' && (
        <div className="goal" style={{ borderColor: d.color }}>
          <span className="goal-k">Reclaiming</span> <b>{d.name}</b>
          <span className="goal-sep">·</span> most {d.goal.toLowerCase()}
          <div className="goal-scores">
            {game.players.map((p) => (
              <span key={p.id} style={{ color: p.color }} title={p.name}>
                ● {districtValue(p, d.id)}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="softmeter" title="How much the whole table has leaned on Strawbaby. It changes how the story ends.">
        <span>🍓</span>
        <div className="sm-bar">
          <div style={{ width: `${Math.min(100, (soft.perPlayer / 7) * 100)}%` }} />
        </div>
        <small>{soft.juice} Juice</small>
      </div>
      <div className="tb-btns">
        <button onClick={() => setFocus({ kind: 'table' })} title="Center the camera">🎥</button>
        <button onClick={() => setSpeed(speed === 1 ? 0.35 : 1)} title="Bot speed">{speed === 1 ? '🐢' : '🐇'}</button>
        <button onClick={toggleLog} title="Game log">📜</button>
        <button onClick={() => setRules(true)} title="How to play">?</button>
      </div>
    </div>
  );
}

export function PlayersPanel({ game, viewer }: { game: GameState; viewer: number }) {
  const setFocus = useStore((s) => s.setFocus);
  const focus = useStore((s) => s.focus);
  return (
    <div className="players">
      {game.players.map((p) => (
        <PlayerChip key={p.id} game={game} p={p} me={p.id === viewer} active={game.prompt?.player === p.id} focused={focus.kind === 'player' && focus.id === p.id} onClick={() => setFocus(focus.kind === 'player' && focus.id === p.id ? { kind: 'table' } : { kind: 'player', id: p.id })} />
      ))}
    </div>
  );
}

function PlayerChip({ game, p, me, active, focused, onClick }: { game: GameState; p: Player; me: boolean; active: boolean; focused: boolean; onClick: () => void }) {
  const url = useReclaimerPortrait(p.reclaimer ?? p.reclaimerOptions[0]);
  const sheet = scorePlayer(game, p);
  const soft = p.soft.reduce((a, b) => a + b, 0);
  return (
    <div className={`pchip ${active ? 'active' : ''} ${focused ? 'focused' : ''}`} style={{ ['--pc' as string]: p.color }} onClick={onClick} title="Click to look at this hideout">
      <div className="pc-avatar">{p.reclaimer && url && <img src={url} alt="" />}</div>
      <div className="pc-main">
        <div className="pc-name">
          {p.name} {me && <span className="you">you</span>} {p.bot && <span className="bot">bot</span>}
        </div>
        <div className="pc-recl">{p.reclaimer ? RECLAIMERS[p.reclaimer].name : 'choosing…'}</div>
        <div className="pc-res">
          {POOLS.map((k) =>
            p.res[k] ? (
              <span key={k} className={k === 'juice' ? 'juice' : ''}>
                {POOL_ICONS[k]}
                {p.res[k]}
              </span>
            ) : null,
          )}
          <span className="pc-hand" title="Cards in hand">🃏{p.hand.length}</span>
          {soft > 0 && <span className="pc-soft" title="Soft tokens">🫧{soft}</span>}
        </div>
      </div>
      <div className="pc-score" title="Aura so far (if the game ended now)">
        {sheet.total}
        <small>✦</small>
        <div className="pc-acts">
          {Array.from({ length: p.actionsLeft }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogPanel({ game }: { game: GameState }) {
  const show = useUI((u) => u.showLog);
  const toggle = useUI((u) => u.toggleLog);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [game.log.length, show]);
  if (!show) return null;
  return (
    <div className="log">
      <div className="log-head">
        Log <button onClick={toggle}>×</button>
      </div>
      <div className="log-body" ref={ref}>
        {game.log.map((l, i) => (
          <div key={i} className={`log-line ${l.kind ?? ''}`} style={{ borderColor: l.p !== null ? game.players[l.p].color : 'transparent' }}>
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Latest few events, floating, so you can follow the bots without opening the log. */
export function Ticker({ game }: { game: GameState }) {
  const lines = game.log.slice(-4);
  return (
    <div className="ticker">
      {lines.map((l, i) => (
        <div key={game.log.length - lines.length + i} className={`tick-line ${l.kind ?? ''}`} style={{ borderColor: l.p !== null ? game.players[l.p].color : '#fff3' }}>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

export function HoverCard() {
  const hover = useUI((u) => u.hover);
  const selected = useUI((u) => u.selected);
  if (!hover || hover.card === selected) return null;
  const left = Math.min(window.innerWidth - 270, Math.max(10, hover.x + 24));
  const top = Math.min(window.innerHeight - 420, Math.max(60, hover.y - 200));
  return (
    <div className="hovercard" style={{ left, top }}>
      <CardView id={hover.card} size="lg" />
    </div>
  );
}

export function Handoff({ game, viewer }: { game: GameState; viewer: number }) {
  const pending = useStore((s) => s.handoffPending);
  const accept = useStore((s) => s.acceptHandoff);
  if (!pending) return null;
  const p = game.players[viewer];
  return (
    <div className="modal-back dark">
      <div className="handoff" style={{ borderColor: p.color }}>
        <div className="ho-k">Pass the device to</div>
        <div className="ho-name" style={{ color: p.color }}>
          {p.name}
        </div>
        <button className="go big" onClick={accept}>
          I'm {p.name}, show my hand
        </button>
      </div>
    </div>
  );
}

export function WaitingBanner({ game, viewer }: { game: GameState; viewer: number }) {
  const pr = game.prompt;
  if (!pr || pr.player === viewer) return null;
  const p = game.players[pr.player];
  const what = pr.type === 'turn' ? 'is deciding' : pr.type === 'setup' ? 'is packing their bag' : 'is resolving a power';
  return (
    <div className="waiting" style={{ borderColor: p.color }}>
      <span className="dot" style={{ background: p.color }} /> {p.name} {what}…
    </div>
  );
}

export function RulesSheet() {
  const show = useUI((u) => u.showRules);
  const set = useUI((u) => u.setRules);
  if (!show) return null;
  return (
    <div className="modal-back" onClick={() => set(false)}>
      <div className="modal rules" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => set(false)}>×</button>
        <h2>How to play</h2>
        <p>
          <b>Four seasons.</b> Each season you get fewer actions (8, 7, 6, 5): Strawbaby takes a little more of your attention every time. Most Aura ✦ after season 4 wins.
        </p>
        <p>
          <b>On your turn, do one thing:</b>
        </p>
        <ul>
          <li>
            <b>Wake a brainrot</b> from your hand: pay its resources, put it in the leftmost empty slot of a row it likes. Slots further right also cost crafts ♡.
          </li>
          <li>
            <b>🌱 Go Outside:</b> take capsules from the gacha. More brainrots in your {ROW_NAMES[0]} row → more capsules.
          </li>
          <li>
            <b>🧶 Make Stuff:</b> make crafts ♡ on your brainrots (1 Aura each).
          </li>
          <li>
            <b>💬 Group Chat:</b> take cards from Word of Mouth or the deck.
          </li>
        </ul>
        <p>
          When you use a row, every <b>EACH TIME</b> power in it fires, right to left. That's your engine: the row gets stronger as you fill it.
        </p>
        <p>
          <b>🍓 Strawbaby will help.</b> Once per turn you can Ask Strawbaby for a Juice, which pays for anything. Juice capsules turn up in the gacha too. Every Juice puts a Soft token on one of your rows: next time you use that row, the brainrots there forget how and their powers don't fire. Leftover Soft tokens cost 1 Aura each at the end.
        </p>
        <p>
          <b>Districts.</b> At the end of each season, whoever has the most of the shown thing reclaims that district (season payouts 4/1/0 → 7/4/3).
        </p>
        <p>
          <b>Scoring:</b> Aura on brainrots + crafts + stashed resources + tucked cards + districts + finale powers + your Reclaimer's challenge − leftover Soft tokens.
        </p>
      </div>
    </div>
  );
}
