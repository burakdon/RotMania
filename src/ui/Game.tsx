// The game screen: the noir city in 3D, with the HUD drawn over it like comic captions.
import { useEffect, useRef, useState } from 'react';
import { BRAINROT } from '../game/cards';
import { DISTRICTS, GENERAL, OBJECTIVES, RES_NAMES, SPACE, capacityOf } from '../game/content';
import {
  CHECKINS, ROUNDS, bagTotal, brainrot, brainrotCost, canPlace, feedCapacity, helperIndexes, objectiveValue, patrol, scorePlayer, spaceCost, tollFor,
} from '../game/engine';
import type { GameState, Player, Res, SpaceId } from '../game/types';
import { RES } from '../game/types';
import { CityScene } from '../scene/City';
import { useStore } from '../store';
import { useGeneralPortrait } from '../toys/portraits';
import { BrainrotCard } from './BrainrotCard';
import { BagView, Meeple, ResIcon, Star } from './icons';
import { useUI } from './uiStore';

export function GameScreen() {
  const game = useStore((s) => s.game)!;
  const viewer = useStore((s) => s.viewer);
  const answer = useStore((s) => s.answer);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);
  const handoff = useStore((s) => s.handoffPending);
  const setPending = useUI((u) => u.setPending);
  const me = game.players[viewer];
  const myTurn = game.prompt?.type === 'place' && game.prompt.player === viewer && !me.bot && !handoff;

  useEffect(() => {
    if (!myTurn) setPending(null);
  }, [myTurn, setPending]);

  /** Clicking a space: place right away when there's nothing to decide, otherwise open the choice panel. */
  const onPad = (space: SpaceId) => {
    if (!myTurn) return;
    const needsChoice = space === 'deprogram' || space === 'backdoor' || space === 'oddjobs';
    const helpers = helperIndexes(me, SPACE[space].district).filter((h) => canPlace(game, me, space, { helper: h }).ok);
    const agentOk = canPlace(game, me, space).ok;
    if (!needsChoice && helpers.length === 0 && agentOk) return answer({ type: 'place', space });
    if (!needsChoice && helpers.length === 1 && !agentOk) return answer({ type: 'place', space, helper: helpers[0] });
    setPending(space);
  };

  return (
    <div className="game">
      <CityScene game={game} viewer={viewer} onPad={onPad} />
      <TopBar game={game} />
      <PlayerList game={game} viewer={viewer} />
      {!me.bot && <MyCell game={game} me={me} />}
      <LineupBar game={game} me={me} myTurn={myTurn} />
      {myTurn && <ChoicePanel game={game} me={me} />}
      <SpaceTip game={game} me={me} />
      <CardTip />
      <Ticker game={game} />
      <LogPanel game={game} />
      {!handoff && game.prompt?.type === 'objective' && game.prompt.player === viewer && !me.bot && <ObjectiveModal game={game} />}
      {!handoff && game.prompt?.type === 'pawn' && game.prompt.player === viewer && !me.bot && <PawnPanel game={game} me={me} />}
      <Waiting game={game} viewer={viewer} />
      <Handoff game={game} viewer={viewer} />
      <RulesSheet />
      {myTurn && <div className="your-move">Your move. Pick a space.</div>}
      {error && (
        <div className="toast" onClick={clearError}>
          {error}
        </div>
      )}
      {game.phase === 'over' && <div className="banner-over">Night six ends.</div>}
    </div>
  );
}

// ───────────────────────── top bar ─────────────────────────
function TopBar({ game }: { game: GameState }) {
  const g = game.phase === 'play' ? patrol(game) : GENERAL[game.generals[0]];
  const next = game.round + 1 < ROUNDS ? GENERAL[game.generals[game.round + 1]] : null;
  const portrait = useGeneralPortrait(g.id);
  const toggleLog = useUI((u) => u.toggleLog);
  const setRules = useUI((u) => u.setRules);
  const speed = useStore((s) => s.botSpeed);
  const setSpeed = useStore((s) => s.setBotSpeed);
  return (
    <div className="topbar">
      <div className="nights">
        <span className="nights-k">NIGHT</span>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`night ${i < game.round ? 'done' : i === game.round ? 'now' : ''}`} title={CHECKINS.includes(i + 1) ? 'Check-in at the end of this night: 1 Grass per agent' : undefined}>
            {i + 1}
            {CHECKINS.includes(i + 1) && <i className="checkin">🌱</i>}
          </span>
        ))}
      </div>
      <div className="patrol">
        <div className="patrol-face">{portrait && <img src={portrait} alt="" />}</div>
        <div>
          <div className="patrol-name">{g.name}</div>
          <div className="patrol-where">
            patrols <b>{DISTRICTS[g.district].name}</b> · toll <ResIcon r={g.toll} size={14} />
          </div>
          {next && (
            <div className="patrol-next">
              next night: {next.name} → {DISTRICTS[next.district].name}
            </div>
          )}
        </div>
      </div>
      <div className="tb-btns">
        <button onClick={() => setSpeed(speed === 1 ? 0.3 : 1)} title="Bot speed">{speed === 1 ? 'Bots: normal' : 'Bots: fast'}</button>
        <button onClick={toggleLog}>Log</button>
        <button onClick={() => setRules(true)}>How to play</button>
      </div>
    </div>
  );
}

// ───────────────────────── players ─────────────────────────
function PlayerList({ game, viewer }: { game: GameState; viewer: number }) {
  return (
    <div className="plist">
      {game.players.map((p) => {
        const active = game.prompt?.player === p.id;
        const sheet = scorePlayer(p);
        const first = game.firstPlayer === p.id;
        return (
          <div key={p.id} className={`pcard ${active ? 'active' : ''}`} style={{ ['--pc' as string]: p.color }}>
            <div className="pcard-top">
              <span className="pcard-name">
                {p.name}
                {p.id === viewer && !p.bot && <span className="tag">you</span>}
                {p.bot && <span className="tag">bot</span>}
                {first && <span className="tag first" title="Goes first tonight">1st</span>}
              </span>
              <span className="pcard-pts" title="Points if the game ended now (secret objectives included)">
                <Star size={13} /> {sheet.total}
              </span>
            </div>
            <div className="pcard-agents" title="Agents: filled = still to place tonight">
              {Array.from({ length: p.agents }, (_, i) => (
                <Meeple key={i} color={p.color} ghost={i >= p.agentsFree} />
              ))}
              {Array.from({ length: p.rookies }, (_, i) => (
                <span key={'r' + i} className="rookie" title="Recruit: starts next night">
                  <Meeple color={p.color} ghost />+
                </span>
              ))}
              <span className="pcard-allies" title="Allies">{p.allies.length} allies</span>
            </div>
            <div className="pcard-res">
              {RES.map((r) => (
                <span key={r} className={p.res[r] ? '' : 'zero'} title={RES_NAMES[r]}>
                  <ResIcon r={r} size={15} />
                  {p.res[r]}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────── your cell ─────────────────────────
function MyCell({ game, me }: { game: GameState; me: Player }) {
  const setHoverCard = useUI((u) => u.setHoverCard);
  const nextCheck = CHECKINS.find((c) => c >= game.round + 1);
  const agents = me.agents + me.rookies;
  const fed = feedCapacity(me);
  const needGrass = Math.max(0, agents - fed);
  return (
    <div className="mycell">
      <div className="mycell-h">Your cell</div>
      {nextCheck && (
        <div className={`checkin-note ${me.res.grass < needGrass ? 'short' : ''}`}>
          Check-in after night {nextCheck}: {agents} agent{agents > 1 ? 's' : ''}
          {fed > 0 && <> − {fed} grounded by allies</>} = <b>{needGrass}</b> <ResIcon r="grass" size={13} /> needed (you have {me.res.grass})
        </div>
      )}
      <div className="mycell-sub">Secret objectives</div>
      {me.objectives.map((o) => (
        <div key={o} className="objective">
          <b>{OBJECTIVES[o].name}</b> <span className="obj-val">{objectiveValue(me, o)} pts now</span>
          <div>{OBJECTIVES[o].text}</div>
        </div>
      ))}
      <div className="mycell-sub">Allies ({me.allies.length})</div>
      <div className="ally-list">
        {me.allies.length === 0 && <div className="empty">Nobody yet. Deprogram brainrots at the Clinic.</div>}
        {me.allies.map((id, i) => {
          const b = brainrot(id);
          const used = me.helpersUsed.includes(i);
          return (
            <div key={id} className="ally-row" onMouseEnter={() => setHoverCard(id)} onMouseLeave={() => setHoverCard(null)}>
              <span className="ally-str">
                <Star size={11} />
                {b.strength}
              </span>
              <span className="ally-name">{b.name}</span>
              {b.ability?.k === 'helper' && <span className={`ally-shift ${used ? 'used' : ''}`}>{used ? 'worked' : 'shift ready'}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── lineup ─────────────────────────
function LineupBar({ game, me, myTurn }: { game: GameState; me: Player; myTurn: boolean }) {
  const setPending = useUI((u) => u.setPending);
  const pending = useUI((u) => u.pending);
  if (pending === 'deprogram' || pending === 'backdoor') return null;
  const clinicOpen = myTurn && (canPlace(game, me, 'deprogram').ok || canPlace(game, me, 'backdoor').ok);
  return (
    <div className="lineup">
      <div className="lineup-h">
        The Clinic waiting room <small>older brainrots (right) cost 1 less</small>
      </div>
      <div className="lineup-cards">
        {game.market.map((id, slot) =>
          id ? (
            <BrainrotCard
              key={id}
              id={id}
              size="sm"
              cost={brainrotCost(game, me, slot)}
              dim={myTurn && !clinicOpen}
              onClick={clinicOpen ? () => setPending('deprogram') : undefined}
            />
          ) : (
            <div key={slot} className="bcard bcard-sm empty-slot">
              taken
              <small>refills at dawn</small>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ───────────────────────── choices for a clicked space ─────────────────────────
function ChoicePanel({ game, me }: { game: GameState; me: Player }) {
  const pending = useUI((u) => u.pending);
  const setPending = useUI((u) => u.setPending);
  const answer = useStore((s) => s.answer);
  const [worker, setWorker] = useState<number | 'agent'>('agent');
  useEffect(() => setWorker('agent'), [pending]);
  if (!pending) return null;
  const def = SPACE[pending];
  const clinic = pending === 'deprogram' || pending === 'backdoor';
  const spaces: SpaceId[] = clinic ? (['deprogram', 'backdoor'] as SpaceId[]).filter((s) => canPlace(game, me, s).ok || helperIndexes(me, 'clinic').some((h) => canPlace(game, me, s, { helper: h }).ok)) : [pending];
  const helpers = helperIndexes(me, def.district).filter((h) => spaces.some((s) => canPlace(game, me, s, { helper: h }).ok));
  const agentOk = spaces.some((s) => canPlace(game, me, s).ok);
  const w = worker === 'agent' ? undefined : worker;
  const go = (space: SpaceId, extra: { slot?: number; res?: Res } = {}) => {
    setPending(null);
    answer({ type: 'place', space, helper: w, ...extra });
  };
  return (
    <div className={`choice ${clinic ? 'wide' : ''}`}>
      <div className="choice-h">
        {clinic ? 'Deprogram a brainrot' : def.name}
        <button className="x" onClick={() => setPending(null)}>×</button>
      </div>
      {helpers.length > 0 && (
        <div className="choice-workers">
          Send:
          {agentOk && (
            <button className={worker === 'agent' ? 'on' : ''} onClick={() => setWorker('agent')}>
              <Meeple color={me.color} /> an agent
            </button>
          )}
          {helpers.map((h) => (
            <button key={h} className={worker === h ? 'on' : ''} onClick={() => setWorker(h)}>
              ★ {brainrot(me.allies[h]).name}
            </button>
          ))}
        </div>
      )}
      {clinic && (
        <div className="choice-cards">
          {game.market.map((id, slot) => {
            if (!id) return null;
            return (
              <div key={id} className="choice-card">
                <BrainrotCard id={id} size="md" cost={brainrotCost(game, me, slot)} />
                <div className="choice-btns">
                  {spaces.map((s) => {
                    const ok = canPlace(game, me, s, { slot, helper: w });
                    return (
                      <button key={s} disabled={!ok.ok} title={ok.why} onClick={() => go(s, { slot })}>
                        {SPACE[s].name}
                        <BagView bag={spaceCost(game, me, s, slot)} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {pending === 'oddjobs' && (
        <div className="choice-res">
          {RES.map((r) => (
            <button key={r} onClick={() => go('oddjobs', { res: r })}>
              <ResIcon r={r} size={26} />
              {RES_NAMES[r]}
            </button>
          ))}
        </div>
      )}
      {!clinic && pending !== 'oddjobs' && (
        <div className="choice-res">
          <button className="go" onClick={() => go(pending)}>
            Place on {def.name}
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── tooltips ─────────────────────────
function SpaceTip({ game, me }: { game: GameState; me: Player }) {
  const space = useUI((u) => u.hoverSpace);
  const pending = useUI((u) => u.pending);
  if (!space || pending) return null;
  const def = SPACE[space];
  const st = game.spaces[space];
  const check = canPlace(game, me, space);
  const toll = tollFor(game, me, space);
  const cap = capacityOf(def, game.players.length);
  return (
    <div className="spacetip">
      <div className="spacetip-d">{DISTRICTS[def.district].name}</div>
      <div className="spacetip-n">{def.name}</div>
      <div className="spacetip-t">{def.text}</div>
      {bagTotal(st.pile) > 0 && (
        <div className="spacetip-row">
          Piled here: <BagView bag={st.pile} />
        </div>
      )}
      {def.cost && (
        <div className="spacetip-row">
          Costs: <BagView bag={def.cost} />
        </div>
      )}
      {bagTotal(toll) > 0 && (
        <div className="spacetip-row warn">
          Patrol toll: <BagView bag={toll} />
        </div>
      )}
      <div className="spacetip-row">
        {cap === Infinity ? 'Open to everyone' : `${st.taken.length}/${cap} taken`}
        {st.taken.map((pid, i) => (
          <Meeple key={i} color={game.players[pid].color} size={14} />
        ))}
      </div>
      {game.prompt?.type === 'place' && game.prompt.player === me.id && !check.ok && <div className="spacetip-row no">{check.why}</div>}
    </div>
  );
}

function CardTip() {
  const id = useUI((u) => u.hoverCard);
  if (!id || !BRAINROT[id]) return null;
  return (
    <div className="cardtip">
      <BrainrotCard id={id} size="lg" />
    </div>
  );
}

// ───────────────────────── prompts ─────────────────────────
function ObjectiveModal({ game }: { game: GameState }) {
  const answer = useStore((s) => s.answer);
  const pr = game.prompt;
  if (pr?.type !== 'objective') return null;
  const p = game.players[pr.player];
  return (
    <div className="modal-back">
      <div className="modal objectives">
        <h2>{pr.setup ? 'Your secret objective' : 'From the archive'}</h2>
        <p className="hint">Keep one. Nobody else sees it. It scores at the end.</p>
        <div className="obj-choices">
          {pr.options.map((o) => (
            <button key={o} className="obj-choice" onClick={() => answer({ type: 'objective', keep: o })}>
              <div className="obj-name">{OBJECTIVES[o].name}</div>
              <div className="obj-text">{OBJECTIVES[o].text}</div>
              {!pr.setup && <div className="obj-now">worth {objectiveValue(p, o)} right now</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PawnPanel({ game, me }: { game: GameState; me: Player }) {
  const answer = useStore((s) => s.answer);
  const pr = game.prompt;
  const oneForOne = me.allies.some((id) => brainrot(id).ability?.k === 'pawnRate');
  const need = oneForOne ? 1 : 2;
  const [give, setGive] = useState<Res[]>([]);
  useEffect(() => setGive([]), [game.tick]);
  if (pr?.type !== 'pawn') return null;
  const counts = (r: Res) => give.filter((x) => x === r).length;
  return (
    <div className="choice">
      <div className="choice-h">
        Pawn Shop <small>{pr.left} trade{pr.left > 1 ? 's' : ''} left · {need} for 1</small>
      </div>
      <div className="pawn-row">
        Give:
        {RES.map((r) => (
          <button key={r} disabled={me.res[r] - counts(r) <= 0 || give.length >= need} onClick={() => setGive([...give, r])}>
            <ResIcon r={r} size={22} />
            <small>{me.res[r] - counts(r)}</small>
          </button>
        ))}
        {give.length > 0 && <button onClick={() => setGive([])}>clear</button>}
      </div>
      <div className="pawn-row">
        Get:
        {RES.map((r) => (
          <button key={r} disabled={give.length !== need} onClick={() => answer({ type: 'pawn', give, get: r })}>
            <ResIcon r={r} size={22} />
          </button>
        ))}
      </div>
      <div className="choice-res">
        <button onClick={() => answer({ type: 'pawn', done: true })}>Done trading</button>
      </div>
    </div>
  );
}

// ───────────────────────── chrome ─────────────────────────
function Ticker({ game }: { game: GameState }) {
  const lines = game.log.slice(-4);
  return (
    <div className="ticker">
      {lines.map((l, i) => (
        <div key={game.log.length - lines.length + i} className={`tick ${l.kind ?? ''}`} style={{ borderColor: l.p !== null ? game.players[l.p].color : '#ece6da' }}>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

function LogPanel({ game }: { game: GameState }) {
  const show = useUI((u) => u.showLog);
  const toggle = useUI((u) => u.toggleLog);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [game.log.length, show]);
  if (!show) return null;
  return (
    <div className="log">
      <div className="log-h">
        Case file <button onClick={toggle}>×</button>
      </div>
      <div className="log-b" ref={ref}>
        {game.log.map((l, i) => (
          <div key={i} className={`log-l ${l.kind ?? ''}`} style={{ borderColor: l.p !== null ? game.players[l.p].color : 'transparent' }}>
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function Waiting({ game, viewer }: { game: GameState; viewer: number }) {
  const pr = game.prompt;
  if (!pr || pr.player === viewer) return null;
  const p = game.players[pr.player];
  return (
    <div className="waiting" style={{ borderColor: p.color }}>
      <Meeple color={p.color} /> {p.name} {pr.type === 'objective' ? 'is reading the files' : 'is making a move'}…
    </div>
  );
}

function Handoff({ game, viewer }: { game: GameState; viewer: number }) {
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
        <button className="go" onClick={accept}>
          I’m {p.name}. Show me.
        </button>
      </div>
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
        <button className="x" onClick={() => set(false)}>×</button>
        <h2>How to play</h2>
        <p>
          <b>Six nights.</b> Most points after night six wins.
        </p>
        <p>
          <b>Each night</b>, players take turns placing one agent on a free space in the city and doing what it says. Most spaces fit one agent: if someone got there first, go elsewhere. Odd Jobs always has room. When everyone is out of agents, the night ends and agents come home.
        </p>
        <p>
          <b>Resources.</b> <ResIcon r="grass" /> Grass, <ResIcon r="coolant" /> GPU Coolant, <ResIcon r="pcb" /> PCBs, <ResIcon r="glitter" /> Glitter and <ResIcon r="copper" /> Copper Wiring. Some spaces pile up resources every night they go untaken.
        </p>
        <p>
          <b>Deprogram brainrots</b> at the Clinic to turn them into allies. Each ally is worth its <Star /> strength at the end and has a permanent ability. Some can even work a night shift in one district like an extra agent.
        </p>
        <p>
          <b>Grow your cell.</b> Recruit (from night 2) to get more agents next night, up to 5. Each recruit is worth {2} points at the end.
        </p>
        <p>
          <b>Patrols.</b> Every night one of DarkBerry’s generals patrols a district. Using a space there costs a 1-resource toll.
        </p>
        <p>
          <b>Check-ins</b> after nights 3 and 6: every agent needs 1 Grass to stay grounded. Each one you can’t ground costs 2 points.
        </p>
        <p>
          <b>Points:</b> ally strength, broadcasts (Hijack the Feed / Pirate Broadcast), secret objectives, recruits, end-game abilities, 1 per 3 leftover resources, minus ungrounded agents.
        </p>
      </div>
    </div>
  );
}
