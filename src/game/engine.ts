// Rules engine. Pure state machine: newGame() → state with a prompt; apply(state, answer) → next state.
// Six nights. Each night players take turns placing one agent on a free space in the city and doing what it says.
import { BRAINROT, BRAINROTS } from './cards';
import { capacityOf, GENERAL, GENERALS, OBJECTIVES, PLAYER_COLORS, RES_NAMES, SPACE, SPACES } from './content';
import type { Answer, Bag, Brainrot, DistrictId, GameState, ObjectiveId, Player, Prompt, Res, SpaceId } from './types';
import { RES, TYPES } from './types';

export const ROUNDS = 6;
export const MARKET_SIZE = 5;
/** the two oldest lineup cards are 1 resource cheaper */
export const OLD_SLOTS = [3, 4];
export const MAX_AGENTS = 5;
/** Check-ins (feeding) happen at the end of these nights (1-based) */
export const CHECKINS = [3, 6];
export const HUNGRY_PENALTY = 2;
export const RECRUIT_POINTS = 2;
/** paying discounts come off the scarcest resource first */
const SCARCITY: Res[] = ['coolant', 'pcb', 'copper', 'glitter', 'grass'];

export interface SeatConfig {
  name: string;
  bot: boolean;
}

// ───────────────────────── rng ─────────────────────────
function rand(s: GameState): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(s: GameState, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────────────────── helpers ─────────────────────────
export const brainrot = (id: string): Brainrot => BRAINROT[id];
const zero = (): Record<Res, number> => ({ grass: 0, coolant: 0, pcb: 0, glitter: 0, copper: 0 });
/** "Cell Blu’s", but "Your" for the default human seat named You */
export const possessive = (name: string) => (name === 'You' ? 'Your' : `${name}’s`);

export const bagTotal = (b: Bag) => RES.reduce((a, r) => a + (b[r] ?? 0), 0);
function addBag(a: Bag, b: Bag): Bag {
  const out: Bag = { ...a };
  for (const r of RES) if (b[r]) out[r] = (out[r] ?? 0) + b[r]!;
  return out;
}
export function canAfford(p: Player, cost: Bag) {
  return RES.every((r) => p.res[r] >= (cost[r] ?? 0));
}
function pay(p: Player, cost: Bag) {
  for (const r of RES) p.res[r] -= cost[r] ?? 0;
}
function gain(p: Player, b: Bag) {
  for (const r of RES) p.res[r] += b[r] ?? 0;
}
export function bagText(b: Bag) {
  return RES.filter((r) => b[r]).map((r) => `${b[r]} ${RES_NAMES[r]}`).join(', ') || 'nothing';
}
function log(s: GameState, p: number | null, msg: string, kind: 'act' | 'round' | 'ally' | 'info' | 'warn' = 'info') {
  s.log.push({ p, msg, kind });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}
const hasAbility = (p: Player, k: string) => p.allies.some((id) => brainrot(id).ability?.k === k);

export function patrol(s: GameState, round = s.round) {
  return GENERAL[s.generals[round]];
}

/** Remove `n` resources' worth from a cost, scarcest first. */
function discount(cost: Bag, n: number): Bag {
  const out = { ...cost };
  for (let i = 0; i < n; i++) {
    const r = SCARCITY.find((x) => (out[x] ?? 0) > 0);
    if (!r) break;
    out[r]! -= 1;
  }
  return out;
}

export function brainrotCost(s: GameState, p: Player, slot: number): Bag {
  const id = s.market[slot];
  if (!id) return {};
  let n = 0;
  if (OLD_SLOTS.includes(slot)) n++;
  if (hasAbility(p, 'turnDiscount')) n++;
  return discount(brainrot(id).cost, n);
}

export function tollFor(s: GameState, p: Player, space: SpaceId): Bag {
  const g = patrol(s);
  if (!g || SPACE[space].district !== g.district) return {};
  if (hasAbility(p, 'tollProof')) return {};
  return { [g.toll]: 1 };
}

export function spaceCost(s: GameState, p: Player, space: SpaceId, slot?: number): Bag {
  let c: Bag = { ...(SPACE[space].cost ?? {}) };
  if ((space === 'recruit' || space === 'safehouse') && hasAbility(p, 'recruitDiscount')) c = discount(c, 1);
  if ((space === 'deprogram' || space === 'backdoor') && slot !== undefined) c = addBag(c, brainrotCost(s, p, slot));
  return addBag(c, tollFor(s, p, space));
}

export function helperIndexes(p: Player, district?: DistrictId): number[] {
  return p.allies
    .map((id, i) => ({ a: brainrot(id).ability, i }))
    .filter((x) => x.a?.k === 'helper' && !p.helpersUsed.includes(x.i) && (!district || x.a.district === district))
    .map((x) => x.i);
}

export interface Check {
  ok: boolean;
  why?: string;
}

/** Can player p put a worker (agent or helper) on this space right now? */
export function canPlace(s: GameState, p: Player, space: SpaceId, opts: { helper?: number; slot?: number; res?: Res } = {}): Check {
  const def = SPACE[space];
  const st = s.spaces[space];
  if (s.round + 1 < (def.fromRound ?? 1)) return { ok: false, why: `Opens on night ${def.fromRound}.` };
  if (st.taken.length >= capacityOf(def, s.players.length)) return { ok: false, why: 'Already taken tonight.' };
  if (opts.helper !== undefined) {
    const a = p.allies[opts.helper] && brainrot(p.allies[opts.helper]).ability;
    if (!a || a.k !== 'helper') return { ok: false, why: 'That ally can’t work a shift.' };
    if (p.helpersUsed.includes(opts.helper)) return { ok: false, why: 'Already worked tonight.' };
    if (a.district !== def.district) return { ok: false, why: 'Wrong district for this ally.' };
  } else if (p.agentsFree <= 0) return { ok: false, why: 'No agents left tonight.' };
  if (space === 'recruit' || space === 'safehouse') {
    if (p.agents + p.rookies >= MAX_AGENTS) return { ok: false, why: `Your cell is full (${MAX_AGENTS} agents).` };
  }
  if (space === 'deprogram' || space === 'backdoor') {
    if (opts.slot === undefined) {
      const any = s.market.some((id, i) => id && canAfford(p, spaceCost(s, p, space, i)));
      return any ? { ok: true } : { ok: false, why: 'You can’t afford anyone in the lineup.' };
    }
    if (!s.market[opts.slot]) return { ok: false, why: 'Nobody in that slot.' };
  }
  if (space === 'archive' && s.objectiveDeck.length < 1) return { ok: false, why: 'The archive is empty.' };
  if (space === 'pawn' && bagTotal(p.res) < (hasAbility(p, 'pawnRate') ? 1 : 2)) return { ok: false, why: 'Nothing to trade.' };
  const cost = spaceCost(s, p, space, opts.slot);
  if (!canAfford(p, cost)) return { ok: false, why: `Costs ${bagText(cost)}.` };
  return { ok: true };
}

/** Every way the player could place right now (one entry per space; helper variants flagged). */
export function placeOptions(s: GameState, p: Player) {
  const out: { space: SpaceId; helper?: number }[] = [];
  for (const def of SPACES) {
    if (canPlace(s, p, def.id).ok) out.push({ space: def.id });
    for (const h of helperIndexes(p, def.district)) if (canPlace(s, p, def.id, { helper: h }).ok) out.push({ space: def.id, helper: h });
  }
  return out;
}

function canAct(s: GameState, p: Player) {
  if (p.agentsFree > 0) return true;
  return helperIndexes(p).some((h) => SPACES.some((d) => canPlace(s, p, d.id, { helper: h }).ok));
}

// ───────────────────────── setup ─────────────────────────
export function newGame(seats: SeatConfig[], seed = Date.now()): GameState {
  if (seats.length < 2 || seats.length > 4) throw new Error('RotMania plays 2–4');
  const s: GameState = {
    rng: seed | 0,
    players: [],
    deck: BRAINROTS.map((b) => b.id),
    discard: [],
    market: [],
    spaces: Object.fromEntries(SPACES.map((d) => [d.id, { id: d.id, taken: [], pile: {} }])) as unknown as GameState['spaces'],
    generals: [],
    objectiveDeck: Object.keys(OBJECTIVES) as ObjectiveId[],
    round: 0,
    firstPlayer: 0,
    nextFirst: null,
    turn: 0,
    phase: 'setup',
    prompt: null,
    setupQueue: [],
    log: [],
    tick: 0,
  };
  shuffle(s, s.deck);
  shuffle(s, s.objectiveDeck);
  s.generals = shuffle(s, GENERALS.map((g) => g.id)).slice(0, ROUNDS);
  seats.forEach((seat, i) => {
    const res = zero();
    res.grass = 2 + i;
    res.copper = 1;
    res.glitter = 1;
    s.players.push({
      id: i, name: seat.name, bot: seat.bot, color: PLAYER_COLORS[i], res,
      agentsFree: 0, agents: 2, rookies: 0, allies: [], helpersUsed: [], objectives: [],
      feedPoints: 0, feedCount: 0, hungry: 0, placements: [],
    });
  });
  s.market = Array.from({ length: MARKET_SIZE }, () => s.deck.shift() ?? null);
  s.setupQueue = s.players.map((p) => p.id);
  log(s, null, '2048. Darth Berry runs the city. Your cell has six nights.', 'round');
  nextSetup(s);
  return s;
}

function nextSetup(s: GameState) {
  const id = s.setupQueue.shift();
  if (id === undefined) {
    s.phase = 'play';
    startRound(s, 0);
    return;
  }
  s.prompt = { type: 'objective', player: id, options: s.objectiveDeck.splice(0, 2), setup: true };
}

// ───────────────────────── main entry ─────────────────────────
export function apply(prev: GameState, ans: Answer): GameState {
  const s: GameState = structuredClone(prev);
  const pr = s.prompt;
  if (!pr) throw new Error('No decision pending');
  if (pr.type !== ans.type) throw new Error(`Expected ${pr.type}, got ${ans.type}`);
  s.tick++;
  const p = s.players[pr.player];
  switch (ans.type) {
    case 'objective': {
      const po = pr as Extract<Prompt, { type: 'objective' }>;
      if (!po.options.includes(ans.keep)) throw new Error('Not one of your options');
      p.objectives.push(ans.keep);
      s.objectiveDeck.push(...po.options.filter((o) => o !== ans.keep));
      s.prompt = null;
      if (po.setup) {
        log(s, p.id, `${p.name} picked a secret objective.`);
        nextSetup(s);
      } else {
        log(s, p.id, `${p.name} kept a new secret objective.`);
        advance(s);
      }
      return s;
    }
    case 'pawn': {
      const pp = pr as Extract<Prompt, { type: 'pawn' }>;
      if (ans.done || !ans.give || !ans.get) {
        s.prompt = null;
        advance(s);
        return s;
      }
      const need = hasAbility(p, 'pawnRate') ? 1 : 2;
      if (ans.give.length !== need) throw new Error(`Give ${need} resource${need > 1 ? 's' : ''}`);
      const giveBag: Bag = {};
      for (const r of ans.give) giveBag[r] = (giveBag[r] ?? 0) + 1;
      if (!canAfford(p, giveBag)) throw new Error('You don’t have those');
      pay(p, giveBag);
      p.res[ans.get]++;
      log(s, p.id, `${p.name} pawned ${bagText(giveBag)} for ${RES_NAMES[ans.get]}.`);
      s.prompt = null;
      if (pp.left > 1 && bagTotal(p.res) >= need) s.prompt = { type: 'pawn', player: p.id, left: pp.left - 1 };
      else advance(s);
      return s;
    }
    case 'place': {
      const ok = canPlace(s, p, ans.space, { helper: ans.helper, slot: ans.slot, res: ans.res });
      if (!ok.ok) throw new Error(ok.why);
      if ((ans.space === 'deprogram' || ans.space === 'backdoor') && ans.slot === undefined) throw new Error('Choose who to deprogram');
      if (ans.space === 'oddjobs' && !ans.res) throw new Error('Choose a resource');
      s.prompt = null;
      place(s, p, ans.space, ans.helper, ans.slot, ans.res);
      if (!s.prompt) advance(s);
      return s;
    }
  }
}

function place(s: GameState, p: Player, space: SpaceId, helper: number | undefined, slot: number | undefined, choice: Res | undefined) {
  const def = SPACE[space];
  const cost = spaceCost(s, p, space, slot);
  pay(p, cost);
  if (helper !== undefined) p.helpersUsed.push(helper);
  else p.agentsFree--;
  s.spaces[space].taken.push(p.id);
  p.placements.push({ space, helper });
  const who = helper !== undefined ? `${possessive(p.name)} ${brainrot(p.allies[helper]).name}` : p.name;
  const toll = tollFor(s, p, space);
  if (bagTotal(toll)) log(s, p.id, `${patrol(s).name} takes a bribe: ${bagText(toll)}.`, 'warn');
  s.last = { p: p.id, space };

  const take: Bag = {};
  const add = (b: Bag) => Object.assign(take, addBag(take, b));
  switch (space) {
    case 'grass': case 'coolant': case 'copper': case 'pcb': case 'glitter':
      add(s.spaces[space].pile);
      s.spaces[space].pile = {};
      break;
    case 'lookout':
      add({ grass: 1 });
      s.nextFirst = p.id;
      break;
    case 'redteam':
      add({ pcb: 1, coolant: 1 });
      break;
    case 'oddjobs':
      add({ [choice!]: 1 });
      break;
    case 'pawn':
      s.prompt = { type: 'pawn', player: p.id, left: 3 };
      break;
    case 'deprogram': case 'backdoor': {
      const id = s.market[slot!]!;
      s.market[slot!] = null;
      p.allies.push(id);
      s.last.card = id;
      const b = brainrot(id);
      log(s, p.id, `${who} deprogrammed ${b.name}. They join the cell.`, 'ally');
      const ab = b.ability;
      if (ab?.k === 'instant') {
        if (ab.gain) add(ab.gain);
        if (ab.tempAgent) {
          p.agentsFree++;
          log(s, p.id, `${b.name} brings a friend: +1 agent tonight.`, 'ally');
        }
        if (ab.objective && s.objectiveDeck.length) s.prompt = { type: 'objective', player: p.id, options: s.objectiveDeck.splice(0, 2), setup: false };
      }
      break;
    }
    case 'recruit': case 'safehouse':
      p.rookies++;
      log(s, p.id, `${who} recruited someone new. They start next night.`, 'act');
      break;
    case 'archive':
      s.prompt = { type: 'objective', player: p.id, options: s.objectiveDeck.splice(0, 2), setup: false };
      break;
    case 'hijack': case 'pirate': {
      const bonus = p.allies.reduce((a, id) => a + (brainrot(id).ability?.k === 'feedBonus' ? (brainrot(id).ability as { n: number }).n : 0), 0);
      const pts = (space === 'hijack' ? 2 + (s.round + 1) : 3) + bonus;
      p.feedPoints += pts;
      p.feedCount++;
      log(s, p.id, `${who} ${space === 'hijack' ? 'hijacked the feed' : 'ran a pirate broadcast'}: +${pts} points.`, 'act');
      break;
    }
  }
  // allies that make this space better
  for (const id of p.allies) {
    const ab = brainrot(id).ability;
    if (ab?.k === 'boost' && ab.space === space) add(ab.gain);
  }
  if (bagTotal(take)) {
    gain(p, take);
    if (space !== 'deprogram' && space !== 'backdoor') log(s, p.id, `${who}: ${def.name}, +${bagText(take)}.`, 'act');
    else log(s, p.id, `${who} also gets ${bagText(take)}.`, 'ally');
  } else if (!['deprogram', 'backdoor', 'recruit', 'safehouse', 'hijack', 'pirate'].includes(space)) log(s, p.id, `${who}: ${def.name}.`, 'act');
}

function advance(s: GameState) {
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (s.turn + k) % n;
    if (canAct(s, s.players[i])) {
      s.turn = i;
      s.prompt = { type: 'place', player: i };
      return;
    }
  }
  endRound(s);
}

// ───────────────────────── rounds ─────────────────────────
function startRound(s: GameState, r: number) {
  s.round = r;
  // the lineup ages: the oldest leaves if it's full, everyone slides, newcomers arrive at the front
  if (r > 0) {
    const line = s.market.filter((x): x is string => !!x);
    if (line.length >= MARKET_SIZE) s.discard.push(line.pop()!);
    while (line.length < MARKET_SIZE && s.deck.length) line.unshift(s.deck.shift()!);
    s.market = [...line, ...Array(MARKET_SIZE - line.length).fill(null)];
  }
  for (const d of SPACES) {
    const st = s.spaces[d.id];
    st.taken = [];
    if (d.accumulate) st.pile = addBag(st.pile, d.accumulate);
  }
  // whoever took Morning Run goes first; otherwise the lead passes to the left
  if (s.nextFirst !== null) s.firstPlayer = s.nextFirst;
  else if (r > 0) s.firstPlayer = (s.firstPlayer + 1) % s.players.length;
  s.nextFirst = null;
  const g = patrol(s);
  log(s, null, `Night ${r + 1} of ${ROUNDS}. ${g.name} patrols ${districtName(g.district)} (toll: 1 ${RES_NAMES[g.toll]}).`, 'round');
  for (const p of s.players) {
    p.agents += p.rookies;
    p.rookies = 0;
    p.agentsFree = p.agents;
    p.helpersUsed = [];
    p.placements = [];
    const dawn: Bag = {};
    for (const id of p.allies) {
      const ab = brainrot(id).ability;
      if (ab?.k === 'dawn') Object.assign(dawn, addBag(dawn, ab.gain));
    }
    if (bagTotal(dawn)) {
      gain(p, dawn);
      log(s, p.id, `${possessive(p.name)} allies bring ${bagText(dawn)} at dawn.`, 'ally');
    }
  }
  s.turn = s.firstPlayer;
  const first = s.players[s.firstPlayer];
  if (canAct(s, first)) s.prompt = { type: 'place', player: first.id };
  else {
    s.turn = (s.firstPlayer + s.players.length - 1) % s.players.length;
    advance(s);
  }
}

const districtName = (d: DistrictId) =>
  ({ park: 'the Park', serverfarm: 'the Server Farm', scrapyard: 'the Scrapyard', mall: 'the Mall', clinic: 'the Clinic', underground: 'the Underground', tower: 'the Feed Tower' })[d];

export function feedCapacity(p: Player) {
  return p.allies.reduce((a, id) => {
    const ab = brainrot(id).ability;
    return a + (ab?.k === 'grounding' ? ab.n : 0);
  }, 0);
}

function endRound(s: GameState) {
  const night = s.round + 1;
  if (CHECKINS.includes(night)) {
    log(s, null, `Check-in: every agent needs 1 Grass to stay grounded.`, 'round');
    for (const p of s.players) {
      let need = Math.max(0, p.agents + p.rookies - feedCapacity(p));
      const paid = Math.min(need, p.res.grass);
      p.res.grass -= paid;
      need -= paid;
      if (need > 0) {
        p.hungry += need;
        log(s, p.id, `${p.name} couldn’t ground ${need} agent${need > 1 ? 's' : ''}: −${need * HUNGRY_PENALTY} points (doomscrolling).`, 'warn');
      } else log(s, p.id, `${p.name} grounded the whole cell.`);
    }
  }
  for (const d of SPACES) s.spaces[d.id].taken = [];
  if (night >= ROUNDS) {
    s.phase = 'over';
    s.prompt = null;
    log(s, null, 'The sixth night ends. Count it up.', 'round');
    return;
  }
  startRound(s, s.round + 1);
}

// ───────────────────────── scoring ─────────────────────────
export interface ScoreSheet {
  allies: number;
  feed: number;
  objectives: number;
  recruits: number;
  finale: number;
  leftovers: number;
  hungry: number;
  total: number;
}

export function objectiveValue(p: Player, id: ObjectiveId): number {
  const allies = p.allies.map(brainrot);
  const count = (t: string) => allies.filter((a) => a.type === t).length;
  const agents = p.agents + p.rookies;
  const leftover = bagTotal(p.res);
  switch (id) {
    case 'zookeeper': return 2 * count('critter');
    case 'snackbar': return 2 * count('snack');
    case 'repair': return 2 * count('appliance');
    case 'fanclub': return 2 * count('icon');
    case 'softspot': return 3 * count('squishy');
    case 'fullcell': return agents >= 5 ? 7 : agents === 4 ? 3 : 0;
    case 'onair': return p.feedCount >= 3 ? 8 : p.feedCount === 2 ? 4 : 0;
    case 'greenthumb': return p.res.grass >= 8 ? 8 : p.res.grass >= 5 ? 4 : 0;
    case 'coolantcartel': return p.res.coolant >= 4 ? 6 : 0;
    case 'variety': {
      const types = new Set(allies.map((a) => a.type)).size;
      return types >= 5 ? 9 : types === 4 ? 5 : 0;
    }
    case 'heavy': return 3 * allies.filter((a) => a.strength >= 4).length;
    case 'underdogs': return 2 * allies.filter((a) => a.strength <= 2).length;
    case 'neverhungry': return p.hungry === 0 ? 5 : 0;
    case 'coppercrew': return 2 * allies.filter((a) => a.cost.copper).length;
    case 'glamsquad': return 2 * allies.filter((a) => a.cost.glitter).length;
    case 'nightshift': return 3 * allies.filter((a) => a.ability?.k === 'helper').length;
    case 'packrat': return Math.floor(leftover / 2);
  }
}

export function scorePlayer(p: Player): ScoreSheet {
  const allies = p.allies.map(brainrot);
  const allyPts = allies.reduce((a, b) => a + b.strength, 0);
  const objectives = p.objectives.reduce((a, o) => a + objectiveValue(p, o), 0);
  const agents = p.agents + p.rookies;
  const recruits = Math.max(0, agents - 2) * RECRUIT_POINTS;
  let finale = 0;
  for (const a of allies) {
    const ab = a.ability;
    if (ab?.k !== 'final') continue;
    if (ab.per === 'type') finale += ab.n * allies.filter((x) => x.type === ab.type).length;
    else if (ab.per === 'lowAlly') finale += ab.n * allies.filter((x) => x.strength <= 2).length;
    else finale += ab.n * agents;
  }
  const leftovers = Math.floor(bagTotal(p.res) / 3);
  const hungry = -p.hungry * HUNGRY_PENALTY;
  const total = allyPts + p.feedPoints + objectives + recruits + finale + leftovers + hungry;
  return { allies: allyPts, feed: p.feedPoints, objectives, recruits, finale, leftovers, hungry, total };
}

export function standings(s: GameState) {
  return s.players
    .map((p) => ({ p, sheet: scorePlayer(p) }))
    .sort((a, b) => b.sheet.total - a.sheet.total || bagTotal(b.p.res) - bagTotal(a.p.res));
}

export function typeCounts(p: Player) {
  return Object.fromEntries(TYPES.map((t) => [t, p.allies.filter((id) => brainrot(id).type === t).length])) as Record<(typeof TYPES)[number], number>;
}
