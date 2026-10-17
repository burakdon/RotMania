// The viewer's hand and the main turn actions.
import { CARD } from '../game/cards';
import { POOL_ICONS, ROW_COLORS, ROW_GAINS, ROW_NAMES, ROW_VERBS } from '../game/content';
import { BONUS_AT, canAsk, canTakeJuice, cardOf, payPlan, ROW_GAIN, wakeOptions } from '../game/engine';
import type { GameState, Player, Pool, Row } from '../game/types';
import { ROWS } from '../game/types';
import { useStore } from '../store';
import { CardView } from './CardView';
import { useUI } from './uiStore';

const ROW_EMOJI: Record<Row, string> = { 0: '🌱', 1: '🧶', 2: '💬' };
const GAIN_ICON: Record<Row, string> = { 0: '🎲', 1: '♡', 2: '🃏' };
const BONUS_TEXT: Record<Row, string> = { 0: 'discard a card → +1 capsule', 1: 'pay 1 resource → +1 craft', 2: 'spend 1 craft → +1 card' };

export function Hand({ game, me }: { game: GameState; me: Player }) {
  const selected = useUI((u) => u.selected);
  const select = useUI((u) => u.select);
  const setHover = useUI((u) => u.setHover);
  const answer = useStore((s) => s.answer);
  const myTurn = game.prompt?.type === 'turn' && game.prompt.player === me.id;
  const opts = myTurn ? wakeOptions(me) : [];
  const playable = new Set(opts.map((o) => o.card));
  const n = me.hand.length;
  return (
    <div className="hand-wrap">
      {selected && me.hand.includes(selected) && myTurn && <WakePanel me={me} id={selected} onWake={(row) => { answer({ type: 'wake', card: selected, row }); select(null); }} />}
      <div className="hand">
        {me.hand.map((id, i) => {
          const spread = Math.min(80, 760 / Math.max(1, n));
          const off = (i - (n - 1) / 2) * spread;
          const rot = (i - (n - 1) / 2) * Math.min(4, 30 / Math.max(1, n));
          return (
            <div
              key={id}
              className={`hand-card ${selected === id ? 'up' : ''}`}
              style={{ transform: `translateX(${off}px) rotate(${rot}deg)`, zIndex: selected === id ? 50 : i }}
              onMouseEnter={(e) => setHover({ card: id, x: e.clientX, y: e.clientY - 40 })}
              onMouseLeave={() => setHover(null)}
            >
              <CardView id={id} size="md" selected={selected === id} dim={myTurn && !playable.has(id)} onClick={() => select(selected === id ? null : id)} />
            </div>
          );
        })}
        {n === 0 && <div className="hand-empty">No cards in hand. Group Chat to hear about new brainrots.</div>}
      </div>
    </div>
  );
}

function WakePanel({ me, id, onWake }: { me: Player; id: string; onWake: (r: Row) => void }) {
  const c = CARD[id];
  return (
    <div className="wake-panel">
      <div className="wake-title">Wake {c.name}</div>
      <div className="wake-rows">
        {c.rows.map((r) => {
          const col = me.rows[r].length;
          const plan = col < 5 ? payPlan(me, c.cost, col) : null;
          return (
            <button key={r} className="wake-row" disabled={!plan} style={{ ['--row' as string]: ROW_COLORS[r] }} onClick={() => plan && onWake(r)}>
              <span className="wr-name">
                {ROW_EMOJI[r]} {ROW_NAMES[r]}
              </span>
              {col >= 5 ? (
                <span className="wr-pay">row is full</span>
              ) : plan ? (
                <span className="wr-pay">
                  pays {payIcons(plan.pay)}
                  {plan.crafts > 0 && <> + {'♡'.repeat(plan.crafts)}</>}
                </span>
              ) : (
                <span className="wr-pay">can't afford yet</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="wake-hint">Tip: you can also click a glowing row on your mat.</div>
    </div>
  );
}

function payIcons(pay: Record<Pool, number>) {
  return (Object.keys(pay) as Pool[]).flatMap((k) => Array.from({ length: pay[k] }, () => POOL_ICONS[k])).join('');
}

export function ActionBar({ game, me }: { game: GameState; me: Player }) {
  const answer = useStore((s) => s.answer);
  const select = useUI((u) => u.select);
  const myTurn = game.prompt?.type === 'turn' && game.prompt.player === me.id;
  if (!myTurn) return null;
  const askOk = canAsk(game, me);
  const askWhy = me.askedThisTurn ? 'Already asked this turn.' : !canTakeJuice(me) ? 'Strawbaby needs a brainrot of yours to soften first.' : '';
  return (
    <div className="action-bar">
      <div className="ab-title">
        Your turn · {me.actionsLeft} action{me.actionsLeft === 1 ? '' : 's'} left this season
        <span className="ab-sub">Wake a brainrot from your hand, or use a row:</span>
      </div>
      <div className="ab-rows">
        {ROWS.map((r) => {
          const count = me.rows[r].length;
          let gain = ROW_GAIN[r][count];
          if (r === 1 && me.reclaimer === 'mina') gain++;
          if (r === 2 && me.reclaimer === 'biblio' && !me.perkUsed) gain++;
          const powers = me.rows[r].filter((s) => cardOf(s.card).power?.when === 'each').length;
          const soft = me.soft[r];
          return (
            <button key={r} className="ab-row" style={{ ['--row' as string]: ROW_COLORS[r] }} onClick={() => { select(null); answer({ type: 'act', row: r }); }}>
              <div className="abr-verb">
                {ROW_EMOJI[r]} {ROW_VERBS[r]}
              </div>
              <div className="abr-gain">
                +{gain} {GAIN_ICON[r]} <small>{ROW_GAINS[r]}</small>
              </div>
              {BONUS_AT.includes(count) && <div className="abr-bonus">bonus: {BONUS_TEXT[r]}</div>}
              {powers > 0 && (soft ? <div className="abr-soft">🍓 Soft: {powers} power{powers > 1 ? 's' : ''} skipped once</div> : <div className="abr-powers">⚡ {powers} power{powers > 1 ? 's' : ''} fire</div>)}
            </button>
          );
        })}
      </div>
      <button className="ask" disabled={!askOk} title={askWhy} onClick={() => answer({ type: 'ask' })}>
        <span className="ask-top">🍓 Ask Strawbaby</span>
        <span className="ask-sub">{askOk ? '+1 Juice (pays for anything). A Soft token lands on one of your rows.' : askWhy}</span>
      </button>
    </div>
  );
}
