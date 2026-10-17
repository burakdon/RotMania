// Panels for every decision that isn't the main turn choice.
import { useMemo, useState } from 'react';
import { CARD } from '../game/cards';
import { POOL_COLORS, POOL_ICONS, POOL_NAMES, RECLAIMERS, ROW_COLORS, ROW_NAMES } from '../game/content';
import { canTakeJuice, cardOf, craftRoom, SETUP_KEEP } from '../game/engine';
import { fxText } from '../game/text';
import type { GameState, Player, Pool, Prompt, ReclaimerId, Res, Row } from '../game/types';
import { RES, ROWS } from '../game/types';
import { useStore } from '../store';
import { useCardPortrait, useReclaimerPortrait } from '../toys/portraits';
import { CardView } from './CardView';

export function PromptPanel({ game, me }: { game: GameState; me: Player }) {
  const pr = game.prompt;
  if (!pr || pr.player !== me.id || pr.type === 'turn' || pr.type === 'setup') return null;
  return (
    <div className="prompt-panel">
      <Body pr={pr} game={game} me={me} />
    </div>
  );
}

function Body({ pr, game, me }: { pr: Prompt; game: GameState; me: Player }) {
  const answer = useStore((s) => s.answer);
  switch (pr.type) {
    case 'gacha':
      return (
        <>
          <h3>Pick a capsule from the gacha {pr.left > 1 && <small>({pr.left} to go)</small>}</h3>
          <div className="chips">
            {game.gacha.map((f, i) => {
              const ok = f !== 'juice' || canTakeJuice(me);
              return (
                <button key={i} className={`chip ${f === 'juice' ? 'juice' : ''}`} disabled={!ok} style={{ ['--c' as string]: POOL_COLORS[f] }} onClick={() => answer({ type: 'gacha', index: i })}>
                  <span className="chip-ico">{POOL_ICONS[f]}</span>
                  {POOL_NAMES[f]}
                  {f === 'juice' && <small>wild, but brings a Soft token</small>}
                </button>
              );
            })}
          </div>
          <p className="hint">You can also click the capsules in the machine.</p>
        </>
      );
    case 'draw':
      return (
        <>
          <h3>Word of Mouth: take a card {pr.left > 1 && <small>({pr.left} to go)</small>}</h3>
          <div className="draw-row">
            {game.tray.map((id, i) => (id ? <CardView key={id} id={id} size="md" onClick={() => answer({ type: 'draw', tray: i })} /> : null))}
            <button className="deck-btn" onClick={() => answer({ type: 'draw', tray: 'deck' })}>
              <span>🃏</span>
              Top of the deck
              <small>{game.deck.length} left</small>
            </button>
          </div>
        </>
      );
    case 'crafts':
      return <CraftPicker n={pr.n} me={me} />;
    case 'soft':
      return (
        <>
          <h3>🍓 Where does the Soft token land?</h3>
          <p className="hint">Next time you use that row, its brainrot powers don't fire (the token then wears off). Left over at the end: −1 Aura each.</p>
          <div className="chips">
            {pr.rows.map((r) => (
              <button key={r} className="chip" style={{ ['--c' as string]: ROW_COLORS[r] }} onClick={() => answer({ type: 'soft', row: r })}>
                {ROW_NAMES[r]}
                <small>
                  {me.rows[r].filter((s) => cardOf(s.card).power?.when === 'each').length} power(s) here{me.soft[r] ? ` · already ${me.soft[r]} Soft` : ''}
                </small>
              </button>
            ))}
          </div>
        </>
      );
    case 'bonus':
      return <BonusPicker row={pr.row} me={me} />;
    case 'tuck': {
      const host = CARD[me.rows[pr.at[0]][pr.at[1]].card];
      const reward = pr.then === 'draw' ? 'draw 1 card' : pr.then === 'any' ? 'gain any resource' : `gain ${POOL_NAMES[pr.then]}`;
      return (
        <>
          <h3>
            {host.name}: tuck a card to {reward}?
          </h3>
          <p className="hint">Tucked cards are worth 1 Aura each at the end.</p>
          <HandPicker me={me} onPick={(id) => answer({ type: 'tuck', card: id })} />
          <button className="skip" onClick={() => answer({ type: 'tuck', card: null })}>
            Skip
          </button>
        </>
      );
    }
    case 'trade':
      return <TradePicker pr={pr} me={me} />;
    case 'pickRes':
      return (
        <>
          <h3>{pr.why}: choose a resource {pr.n > 1 && <small>({pr.n} to go)</small>}</h3>
          <ResChips onPick={(r) => answer({ type: 'pickRes', res: r })} />
        </>
      );
    case 'unsoft':
      return (
        <>
          <h3>Shake off a Soft token</h3>
          <div className="chips">
            {ROWS.filter((r) => me.soft[r] > 0).map((r) => (
              <button key={r} className="chip" style={{ ['--c' as string]: ROW_COLORS[r] }} onClick={() => answer({ type: 'unsoft', row: r })}>
                {ROW_NAMES[r]} <small>{me.soft[r]} Soft</small>
              </button>
            ))}
          </div>
        </>
      );
    case 'repeat':
      return (
        <>
          <h3>Repeat which power?</h3>
          <div className="chips col">
            {pr.options.map((col) => {
              const c = cardOf(me.rows[pr.row][col].card);
              return (
                <button key={col} className="chip wide" onClick={() => answer({ type: 'repeat', col })}>
                  <b>{c.name}</b>
                  <small>{fxText(c.power!.fx)}</small>
                </button>
              );
            })}
          </div>
        </>
      );
    default:
      return null;
  }
}

function ResChips({ onPick, allow }: { onPick: (r: Res) => void; allow?: (r: Res) => boolean }) {
  return (
    <div className="chips">
      {RES.map((r) => (
        <button key={r} className="chip" disabled={allow ? !allow(r) : false} style={{ ['--c' as string]: POOL_COLORS[r] }} onClick={() => onPick(r)}>
          <span className="chip-ico">{POOL_ICONS[r]}</span>
          {POOL_NAMES[r]}
        </button>
      ))}
    </div>
  );
}

function HandPicker({ me, onPick }: { me: Player; onPick: (id: string) => void }) {
  return (
    <div className="draw-row small">
      {me.hand.map((id) => (
        <CardView key={id} id={id} size="sm" onClick={() => onPick(id)} />
      ))}
    </div>
  );
}

function CraftPicker({ n, me }: { n: number; me: Player }) {
  const answer = useStore((s) => s.answer);
  const slots = useMemo(() => ROWS.flatMap((r) => me.rows[r].map((sl, col) => ({ r, col, sl, room: cardOf(sl.card).cap - sl.crafts }))).filter((x) => x.room > 0), [me]);
  const room = craftRoom(me);
  const need = Math.min(n, room);
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const used = Object.values(alloc).reduce((a, b) => a + b, 0);
  const auto = () => {
    const a: Record<string, number> = {};
    let left = need;
    const list = [...slots].sort((x, y) => y.room - x.room);
    while (left > 0) {
      const best = list.map((x) => ({ x, free: x.room - (a[x.r + ':' + x.col] ?? 0) })).sort((p, q) => q.free - p.free)[0];
      if (!best || best.free <= 0) break;
      const k = best.x.r + ':' + best.x.col;
      a[k] = (a[k] ?? 0) + 1;
      left--;
    }
    setAlloc(a);
  };
  const confirm = () => {
    const targets: [Row, number][] = [];
    for (const [k, v] of Object.entries(alloc)) {
      const [r, col] = k.split(':').map(Number);
      for (let i = 0; i < v; i++) targets.push([r as Row, col]);
    }
    answer({ type: 'crafts', targets });
  };
  return (
    <>
      <h3>
        Make {n} craft{n > 1 ? 's' : ''}: put them on your brainrots <small>{used}/{need} placed</small>
      </h3>
      <p className="hint">Each craft is worth 1 Aura at the end, and pays for waking brainrots further along a row.</p>
      <div className="craft-grid">
        {slots.map((x) => {
          const k = x.r + ':' + x.col;
          const a = alloc[k] ?? 0;
          return (
            <div key={k} className="craft-slot" style={{ borderColor: ROW_COLORS[x.r] }}>
              <MiniPortrait id={x.sl.card} />
              <div className="cs-name">{CARD[x.sl.card].name}</div>
              <div className="cs-hearts">
                {'♥'.repeat(x.sl.crafts)}
                <b>{'♥'.repeat(a)}</b>
                {'♡'.repeat(x.room - a)}
              </div>
              <div className="cs-btns">
                <button disabled={a === 0} onClick={() => setAlloc({ ...alloc, [k]: a - 1 })}>−</button>
                <button disabled={a >= x.room || used >= need} onClick={() => setAlloc({ ...alloc, [k]: a + 1 })}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="row-btns">
        <button className="skip" onClick={auto}>Auto-place</button>
        <button className="go" disabled={used !== need} onClick={confirm}>Done</button>
      </div>
    </>
  );
}

function MiniPortrait({ id }: { id: string }) {
  const url = useCardPortrait(id);
  return <div className="mini-portrait">{url && <img src={url} alt="" />}</div>;
}

function BonusPicker({ row, me }: { row: Row; me: Player }) {
  const answer = useStore((s) => s.answer);
  const skip = () => answer({ type: 'bonus', use: false });
  if (row === 0)
    return (
      <>
        <h3>Bonus: discard a card from your hand to take 1 more capsule?</h3>
        <HandPicker me={me} onPick={(id) => answer({ type: 'bonus', use: true, card: id })} />
        <button className="skip" onClick={skip}>No thanks</button>
      </>
    );
  if (row === 1)
    return (
      <>
        <h3>Bonus: pay 1 resource to make 1 more craft?</h3>
        <div className="chips">
          {(Object.keys(me.res) as Pool[])
            .filter((k) => me.res[k] > 0)
            .map((k) => (
              <button key={k} className="chip" style={{ ['--c' as string]: POOL_COLORS[k] }} onClick={() => answer({ type: 'bonus', use: true, res: k })}>
                <span className="chip-ico">{POOL_ICONS[k]}</span>
                {POOL_NAMES[k]} <small>you have {me.res[k]}</small>
              </button>
            ))}
        </div>
        <button className="skip" onClick={skip}>No thanks</button>
      </>
    );
  return (
    <>
      <h3>Bonus: spend 1 craft to draw 1 more card?</h3>
      <div className="row-btns">
        <button className="skip" onClick={skip}>No thanks</button>
        <button className="go" onClick={() => answer({ type: 'bonus', use: true })}>Spend a craft</button>
      </div>
    </>
  );
}

function TradePicker({ pr, me }: { pr: Extract<Prompt, { type: 'trade' }>; me: Player }) {
  const answer = useStore((s) => s.answer);
  const host = CARD[me.rows[pr.at[0]][pr.at[1]].card];
  const skip = () => answer({ type: 'trade', use: false });
  const then = fxText(pr.then);
  return (
    <>
      <h3>{host.name}</h3>
      <p className="hint">Optional: {fxText({ k: 'trade', pay: pr.pay, then: pr.then })}</p>
      {pr.pay === 'card' && <HandPicker me={me} onPick={(id) => answer({ type: 'trade', use: true, card: id })} />}
      {pr.pay === 'craft' && (
        <button className="go" onClick={() => answer({ type: 'trade', use: true })}>
          Spend a craft → {then}
        </button>
      )}
      {pr.pay !== 'card' && pr.pay !== 'craft' && (
        <div className="chips">
          {(Object.keys(me.res) as Pool[])
            .filter((k) => me.res[k] > 0 && (pr.pay === 'any' || k === pr.pay || k === 'juice'))
            .map((k) => (
              <button key={k} className="chip" style={{ ['--c' as string]: POOL_COLORS[k] }} onClick={() => answer({ type: 'trade', use: true, res: k })}>
                <span className="chip-ico">{POOL_ICONS[k]}</span>
                Pay {POOL_NAMES[k]}
              </button>
            ))}
        </div>
      )}
      <button className="skip" onClick={skip}>Skip</button>
    </>
  );
}

// ───────────────────────── setup ─────────────────────────
export function SetupModal({ me }: { me: Player }) {
  const answer = useStore((s) => s.answer);
  const [recl, setRecl] = useState<ReclaimerId | null>(null);
  const [cards, setCards] = useState<string[]>([]);
  const [res, setRes] = useState<Res[]>([]);
  const offer = me.offer!;
  const kept = cards.length + res.length;
  const toggle = <T,>(list: T[], x: T, set: (v: T[]) => void) => {
    if (list.includes(x)) set(list.filter((y) => y !== x));
    else if (kept < SETUP_KEEP) set([...list, x]);
  };
  return (
    <div className="modal-back">
      <div className="modal setup">
        <h2>{me.name}, get ready</h2>
        <h4>1 · Who are you?</h4>
        <div className="recl-row">
          {me.reclaimerOptions.map((id) => (
            <ReclaimerCard key={id} id={id} selected={recl === id} onClick={() => setRecl(id)} />
          ))}
        </div>
        <h4>
          2 · Pack your bag: keep {SETUP_KEEP} things <small>({kept}/{SETUP_KEEP})</small>
        </h4>
        <p className="hint">Brainrot cards you might wake, and resources to pay for them. Most people keep 2–3 cards.</p>
        <div className="draw-row">
          {offer.cards.map((id) => (
            <CardView key={id} id={id} size="md" selected={cards.includes(id)} dim={!cards.includes(id) && kept >= SETUP_KEEP} onClick={() => toggle(cards, id, setCards)} />
          ))}
        </div>
        <div className="chips">
          {offer.res.map((r) => (
            <button key={r} className={`chip ${res.includes(r) ? 'on' : ''}`} style={{ ['--c' as string]: POOL_COLORS[r] }} onClick={() => toggle(res, r, setRes)}>
              <span className="chip-ico">{POOL_ICONS[r]}</span>
              {POOL_NAMES[r]}
            </button>
          ))}
        </div>
        <div className="row-btns">
          <button className="go big" disabled={!recl || kept !== SETUP_KEEP} onClick={() => answer({ type: 'setup', reclaimer: recl!, keepCards: cards, keepRes: res })}>
            {!recl ? 'Pick who you are' : kept !== SETUP_KEEP ? `Keep ${SETUP_KEEP - kept} more` : 'Into the Soft World →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReclaimerCard({ id, selected, onClick, compact }: { id: ReclaimerId; selected?: boolean; onClick?: () => void; compact?: boolean }) {
  const r = RECLAIMERS[id];
  const url = useReclaimerPortrait(id);
  return (
    <div className={`recl ${selected ? 'selected' : ''} ${onClick ? 'clickable' : ''} ${compact ? 'compact' : ''}`} onClick={onClick}>
      <div className="recl-portrait">{url && <img src={url} alt="" />}</div>
      <div className="recl-body">
        <div className="recl-name">{r.name}</div>
        <div className="recl-tag">{r.tagline}</div>
        <div className="recl-perk">
          <b>Perk</b> {r.perk}
        </div>
        <div className="recl-chal">
          <b>Challenge: {r.challengeName}</b> {r.challenge}
        </div>
      </div>
    </div>
  );
}
