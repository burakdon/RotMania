// The game on a phone: the city as a list of tappable spaces, with the 3D board one tab away.
import { useEffect, useState } from 'react';
import { BRAINROT } from '../game/cards';
import { DISTRICTS, GENERAL, SPACES, capacityOf, type SpaceDef } from '../game/content';
import { CHECKINS, ROUNDS, bagTotal, brainrotCost, canPlace, helperIndexes, patrol, scorePlayer, tollFor } from '../game/engine';
import type { DistrictId, GameState, Player, SpaceId } from '../game/types';
import { RES } from '../game/types';
import { CityScene } from '../scene/City';
import { useStore } from '../store';
import { useGeneralPortrait } from '../toys/portraits';
import { BrainrotCard } from './BrainrotCard';
import { ChoicePanel, Handoff, MyCell, ObjectiveModal, PawnPanel, PlayerList, RulesSheet } from './Game';
import { BagView, Meeple, ResIcon, Star } from './icons';
import { useUI } from './uiStore';
import { useView } from './viewMode';

type Tab = 'city' | 'clinic' | 'cell' | 'table' | 'board';
const TABS: [Tab, string][] = [['city', 'City'], ['clinic', 'Clinic'], ['cell', 'Cell'], ['table', 'Table'], ['board', 'Board']];
const DISTRICT_ORDER: DistrictId[] = ['park', 'serverfarm', 'scrapyard', 'mall', 'clinic', 'underground', 'tower'];

export function PhoneGame() {
  const game = useStore((s) => s.game)!;
  const viewer = useStore((s) => s.viewer);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);
  const handoff = useStore((s) => s.handoffPending);
  const pending = useUI((u) => u.pending);
  const setPending = useUI((u) => u.setPending);
  const [tab, setTab] = useState<Tab>('city');
  const [menu, setMenu] = useState(false);
  const me = game.players[viewer];
  const myTurn = game.prompt?.type === 'place' && game.prompt.player === viewer && !me.bot && !handoff;

  useEffect(() => {
    if (!myTurn) setPending(null);
  }, [myTurn, setPending]);

  /** On a phone every placement goes through a sheet first, so a stray tap never spends an agent. */
  const pick = (space: SpaceId) => {
    if (myTurn) setPending(space);
  };

  return (
    <div className="ph">
      <Header game={game} viewer={viewer} onMenu={() => setMenu(true)} />
      <Status game={game} viewer={viewer} myTurn={myTurn} onGo={() => setTab('city')} />
      <main className={`ph-body ${tab === 'board' ? 'board' : ''}`}>
        {tab === 'city' && <CityList game={game} me={me} myTurn={myTurn} pick={pick} />}
        {tab === 'clinic' && <ClinicList game={game} me={me} myTurn={myTurn} pick={pick} />}
        {tab === 'cell' && (me.bot ? <p className="ph-hint">Bots keep their objectives to themselves.</p> : <MyCell game={game} me={me} />)}
        {tab === 'table' && <Table game={game} viewer={viewer} />}
        {tab === 'board' && (
          <>
            <CityScene game={game} viewer={viewer} onPad={pick} lite />
            <div className="ph-board-hint">Pinch to zoom, drag to turn. On your move, tap a glowing space.</div>
          </>
        )}
      </main>
      <ResStrip me={me} />
      <nav className="ph-tabs">
        {TABS.map(([t, label]) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </nav>

      {myTurn && pending && <div className="ph-scrim" onClick={() => setPending(null)} />}
      {myTurn && <ChoicePanel game={game} me={me} phone />}
      {!handoff && game.prompt?.type === 'objective' && game.prompt.player === viewer && !me.bot && <ObjectiveModal game={game} />}
      {!handoff && game.prompt?.type === 'pawn' && game.prompt.player === viewer && !me.bot && <PawnPanel game={game} me={me} />}
      <CardSheet />
      {menu && <Menu onClose={() => setMenu(false)} />}
      <Handoff game={game} viewer={viewer} />
      <RulesSheet />
      {error && (
        <div className="toast" onClick={clearError}>
          {error}
        </div>
      )}
      {game.phase === 'over' && <div className="banner-over">Night six ends.</div>}
    </div>
  );
}

// ───────────────────────── header ─────────────────────────
function Header({ game, viewer, onMenu }: { game: GameState; viewer: number; onMenu: () => void }) {
  const g = game.phase === 'play' ? patrol(game) : GENERAL[game.generals[0]];
  const portrait = useGeneralPortrait(g.id);
  return (
    <header className="ph-head">
      <div className="ph-top">
        <div className="ph-nights" aria-label={`Night ${game.round + 1} of ${ROUNDS}`}>
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span key={i} className={`night ${i < game.round ? 'done' : i === game.round ? 'now' : ''}`}>
              {i + 1}
              {CHECKINS.includes(i + 1) && <i className="checkin">🌱</i>}
            </span>
          ))}
        </div>
        <div className="ph-patrol">
          <div className="ph-patrol-face">{portrait && <img src={portrait} alt="" />}</div>
          <div>
            <b>{g.name}</b>
            <small>
              patrols {DISTRICTS[g.district].name} · toll <ResIcon r={g.toll} size={12} />
            </small>
          </div>
        </div>
        <button className="ph-menu-btn" onClick={onMenu} aria-label="Menu">
          ☰
        </button>
      </div>
      <div className="ph-scores">
        {game.players.map((p) => (
          <div key={p.id} className={`ph-score ${game.prompt?.player === p.id ? 'active' : ''}`} style={{ ['--pc' as string]: p.color }}>
            <span className="ph-score-n">
              {p.name}
              {p.id === viewer && !p.bot && <span className="tag">you</span>}
              {game.firstPlayer === p.id && <span className="tag first">1st</span>}
            </span>
            <span className="ph-score-row">
              <span className="ph-score-a">
                {Array.from({ length: p.agents }, (_, i) => (
                  <Meeple key={i} color={p.color} ghost={i >= p.agentsFree} size={12} />
                ))}
              </span>
              <span className="ph-score-pts">
                <Star size={11} /> {scorePlayer(p).total}
              </span>
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}

function Status({ game, viewer, myTurn, onGo }: { game: GameState; viewer: number; myTurn: boolean; onGo: () => void }) {
  const pr = game.prompt;
  if (myTurn) {
    return (
      <button className="ph-status mine" onClick={onGo}>
        Your move. Pick a space.
      </button>
    );
  }
  if (!pr || pr.player === viewer) return <div className="ph-status" />;
  const p = game.players[pr.player];
  return (
    <div className="ph-status" style={{ borderColor: p.color }}>
      <Meeple color={p.color} size={14} /> {p.name} {pr.type === 'objective' ? 'is reading the files' : 'is making a move'}…
    </div>
  );
}

// ───────────────────────── city ─────────────────────────
function CityList({ game, me, myTurn, pick }: { game: GameState; me: Player; myTurn: boolean; pick: (s: SpaceId) => void }) {
  const patrolled = game.phase === 'play' ? patrol(game).district : null;
  return (
    <div className="ph-city">
      {DISTRICT_ORDER.map((d) => (
        <section key={d} className="ph-dist">
          <h3>
            {DISTRICTS[d].name}
            {patrolled === d && <span className="ph-patrolled">patrolled</span>}
          </h3>
          <div className="ph-spaces">
            {SPACES.filter((s) => s.district === d).map((def) => (
              <SpaceCard key={def.id} game={game} me={me} def={def} myTurn={myTurn} pick={pick} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SpaceCard({ game, me, def, myTurn, pick }: { game: GameState; me: Player; def: SpaceDef; myTurn: boolean; pick: (s: SpaceId) => void }) {
  const st = game.spaces[def.id];
  const cap = capacityOf(def, game.players.length);
  const closed = game.round + 1 < (def.fromRound ?? 1);
  const check = canPlace(game, me, def.id);
  const legal = myTurn && (check.ok || helperIndexes(me, def.district).some((h) => canPlace(game, me, def.id, { helper: h }).ok));
  const toll = tollFor(game, me, def.id);
  const last = game.last?.space === def.id;
  return (
    <button className={`ph-space ${legal ? 'legal' : ''} ${myTurn && !legal ? 'nope' : ''} ${last ? 'last' : ''}`} disabled={!legal} onClick={() => pick(def.id)}>
      <span className="ph-space-n">{def.name}</span>
      <span className="ph-space-t">{def.text}</span>
      {bagTotal(st.pile) > 0 && (
        <span className="ph-space-row">
          Here now <BagView bag={st.pile} />
        </span>
      )}
      {def.cost && (
        <span className="ph-space-row">
          Costs <BagView bag={def.cost} />
        </span>
      )}
      {bagTotal(toll) > 0 && (
        <span className="ph-space-row warn">
          Toll <BagView bag={toll} />
        </span>
      )}
      <span className="ph-space-occ">
        {st.taken.map((pid, i) => (
          <Meeple key={i} color={game.players[pid].color} size={14} />
        ))}
        <small>{cap === Infinity ? 'open to all' : `${st.taken.length}/${cap}`}</small>
      </span>
      {closed ? (
        <span className="ph-space-why">Opens on night {def.fromRound}</span>
      ) : (
        myTurn && !legal && <span className="ph-space-why">{check.why}</span>
      )}
    </button>
  );
}

// ───────────────────────── clinic ─────────────────────────
function ClinicList({ game, me, myTurn, pick }: { game: GameState; me: Player; myTurn: boolean; pick: (s: SpaceId) => void }) {
  const setCard = useUI((u) => u.setHoverCard);
  const open =
    myTurn &&
    (['deprogram', 'backdoor'] as SpaceId[]).some((s) => canPlace(game, me, s).ok || helperIndexes(me, 'clinic').some((h) => canPlace(game, me, s, { helper: h }).ok));
  return (
    <div>
      <p className="ph-hint">
        The Clinic waiting room. The last two have waited longest and cost 1 less.{' '}
        {open ? <b>Tap one to deprogram it.</b> : 'Tap a card to read it.'}
      </p>
      <div className="ph-cards">
        {game.market.map((id, slot) =>
          id ? (
            <BrainrotCard key={id} id={id} size="md" cost={brainrotCost(game, me, slot)} onClick={open ? () => pick('deprogram') : () => setCard(id)} />
          ) : (
            <div key={slot} className="bcard bcard-md empty-slot">
              taken
              <small>refills at dawn</small>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ───────────────────────── table: players and the log ─────────────────────────
function Table({ game, viewer }: { game: GameState; viewer: number }) {
  return (
    <div className="ph-table">
      <PlayerList game={game} viewer={viewer} />
      <h3 className="ph-sub">Case file</h3>
      <div className="ph-log">
        {game.log
          .slice()
          .reverse()
          .map((l, i) => (
            <div key={game.log.length - i} className={`log-l ${l.kind ?? ''}`} style={{ borderColor: l.p !== null ? game.players[l.p].color : 'transparent' }}>
              {l.msg}
            </div>
          ))}
      </div>
    </div>
  );
}

// ───────────────────────── bits ─────────────────────────
function ResStrip({ me }: { me: Player }) {
  return (
    <div className="ph-res">
      {RES.map((r) => (
        <span key={r} className={me.res[r] ? '' : 'zero'}>
          <ResIcon r={r} size={18} />
          {me.res[r]}
        </span>
      ))}
      <span className="ph-res-agents" title="Agents left tonight">
        {Array.from({ length: me.agents }, (_, i) => (
          <Meeple key={i} color={me.color} ghost={i >= me.agentsFree} size={14} />
        ))}
      </span>
    </div>
  );
}

function CardSheet() {
  const id = useUI((u) => u.hoverCard);
  const set = useUI((u) => u.setHoverCard);
  if (!id || !BRAINROT[id]) return null;
  return (
    <div className="modal-back" onClick={() => set(null)}>
      <div className="ph-cardsheet">
        <BrainrotCard id={id} size="lg" />
        <small>tap anywhere to close</small>
      </div>
    </div>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const setRules = useUI((u) => u.setRules);
  const speed = useStore((s) => s.botSpeed);
  const setSpeed = useStore((s) => s.setBotSpeed);
  const go = useStore((s) => s.go);
  const setMode = useView((v) => v.setMode);
  const act = (f: () => void) => () => {
    f();
    onClose();
  };
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="ph-menu" onClick={(e) => e.stopPropagation()}>
        <button onClick={act(() => setRules(true))}>How to play</button>
        <button onClick={act(() => setSpeed(speed === 1 ? 0.3 : 1))}>Bots: {speed === 1 ? 'normal' : 'fast'} (tap to change)</button>
        <button onClick={act(() => setMode('desktop'))}>Switch to desktop view</button>
        <button onClick={act(() => go('title'))}>Quit to title</button>
        <button className="alt" onClick={onClose}>
          Back to the game
        </button>
      </div>
    </div>
  );
}
