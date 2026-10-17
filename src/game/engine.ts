// Rules engine. Pure state machine: newGame() → state with a prompt; apply(state, answer) → next state.
// Internally a LIFO task queue resolves effects; anything that needs a decision becomes state.prompt.
import { CARD, CARDS } from './cards';
import { DISTRICTS, POOL_NAMES, RECLAIMERS, ROW_NAMES, ROW_VERBS } from './content';
import type {
  Answer, Card, CostItem, DistrictId, Effect, Face, GameState, Player, Pool, Prompt, ReclaimerId, Res, Row, Slot, Task, Trigger, Vibe,
} from './types';
import { RES, ROWS } from './types';

export const ROUNDS = 4;
export const ACTIONS = [8, 7, 6, 5];
export const ROW_GAIN: number[][] = [
  [1, 1, 2, 2, 3, 3],
  [2, 2, 3, 3, 4, 4],
  [1, 1, 2, 2, 3, 3],
];
/** brainrot counts at which the row action offers its bonus trade */
export const BONUS_AT = [1, 3, 5];
export const CRAFT_COST = [0, 1, 1, 2, 2];
export const PAYOUT = [
  [4, 1, 0],
  [5, 2, 1],
  [6, 3, 2],
  [7, 4, 3],
];
export const FACES: Face[] = ['grass', 'bread', 'vinyl', 'yarn', 'paper', 'juice'];
export const GACHA_SIZE = 5;
export const TRAY_SIZE = 3;
export const SETUP_KEEP = 5;
export const PLAYER_COLORS = ['#ff6b6b', '#4dabf7', '#ffd43b', '#b197fc'];

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
function roll(s: GameState): Face {
  return FACES[Math.floor(rand(s) * FACES.length)];
}

// ───────────────────────── setup ─────────────────────────
export interface SeatConfig {
  name: string;
  bot: boolean;
}

export function newGame(seats: SeatConfig[], seed = Date.now()): GameState {
  if (seats.length < 2 || seats.length > 4) throw new Error('RotMania plays 2–4');
  const s: GameState = {
    rng: seed | 0,
    players: [],
    deck: CARDS.map((c) => c.id),
    discard: [],
    tray: [],
    gacha: [],
    round: 0,
    turn: 0,
    firstPlayer: 0,
    districts: [],
    results: [],
    phase: 'setup',
    prompt: null,
    queue: [],
    log: [],
    tick: 0,
  };
  shuffle(s, s.deck);
  const recl = shuffle(s, Object.keys(RECLAIMERS) as ReclaimerId[]);
  s.districts = shuffle(s, Object.keys(DISTRICTS) as DistrictId[]).slice(0, ROUNDS);
  seats.forEach((seat, i) => {
    const p: Player = {
      id: i, name: seat.name, bot: seat.bot, color: PLAYER_COLORS[i],
      reclaimer: null, reclaimerOptions: [recl[i * 2], recl[i * 2 + 1]],
      hand: [], res: { grass: 0, bread: 0, vinyl: 0, yarn: 0, paper: 0, juice: 0 },
      rows: [[], [], []], soft: [0, 0, 0], actionsLeft: 0, juiceTaken: 0, auraBonus: 0,
      perkUsed: false, meanwhileUsed: false, askedThisTurn: false, districtAura: [],
      offer: { cards: s.deck.splice(0, 5), res: [...RES] },
    };
    s.players.push(p);
  });
  rerollGacha(s);
  refillTray(s);
  s.prompt = { type: 'setup', player: 0 };
  log(s, null, 'The Soft World waits. Choose your Reclaimer and what to bring.', 'round');
  return s;
}

// ───────────────────────── helpers ─────────────────────────
export const cardOf = (id: string): Card => CARD[id];
export const rowCount = (p: Player, r: Row) => p.rows[r].length;
export const allSlots = (p: Player): Slot[] => p.rows.flat();
export const totalCrafts = (p: Player) => allSlots(p).reduce((a, x) => a + x.crafts, 0);
export const craftRoom = (p: Player) => allSlots(p).reduce((a, x) => a + Math.max(0, cardOf(x.card).cap - x.crafts), 0);

function log(s: GameState, p: number | null, msg: string, kind: 'act' | 'soft' | 'round' | 'power' | 'info' = 'info') {
  s.log.push({ p, msg, kind });
  if (s.log.length > 300) s.log.splice(0, s.log.length - 300);
}
const nm = (s: GameState, p: number) => s.players[p].name;
/** "Mina's" / "your" (the default human seat is literally named You) */
const poss = (name: string) => (name.toLowerCase() === 'you' ? 'your' : `${name}'s`);

function push(s: GameState, ...tasks: Task[]) {
  for (let i = tasks.length - 1; i >= 0; i--) s.queue.push(tasks[i]);
}

function rerollGacha(s: GameState) {
  s.gacha = Array.from({ length: GACHA_SIZE }, () => roll(s));
}
function refillTray(s: GameState) {
  while (s.tray.length < TRAY_SIZE) s.tray.push(null);
  for (let i = 0; i < TRAY_SIZE; i++) if (!s.tray[i]) s.tray[i] = drawId(s);
}
function drawId(s: GameState): string | null {
  if (!s.deck.length) {
    if (!s.discard.length) return null;
    s.deck = shuffle(s, s.discard);
    s.discard = [];
    log(s, null, 'The deck ran dry; the discard pile is shuffled back in.');
  }
  return s.deck.shift() ?? null;
}
function drawCards(s: GameState, p: Player, n: number) {
  let got = 0;
  for (let i = 0; i < n; i++) {
    const id = drawId(s);
    if (id) {
      p.hand.push(id);
      got++;
    }
  }
  return got;
}

/** rows a Soft token may go on */
export function softRows(p: Player): Row[] {
  if (p.reclaimer === 'dev') return [...ROWS];
  return ROWS.filter((r) => p.rows[r].length > 0);
}
export function canTakeJuice(p: Player) {
  return softRows(p).length > 0;
}
export function canAsk(s: GameState, p: Player) {
  return s.phase === 'play' && !p.askedThisTurn && canTakeJuice(p);
}

// ───────────────────────── paying ─────────────────────────
export interface PayPlan {
  pay: Record<Pool, number>;
  crafts: number;
}

/** Greedy payment: exact matches, then Juice, then 2-for-1 trades; "any" takes your most plentiful resource. */
export function payPlan(p: Player, cost: CostItem[], col: number): PayPlan | null {
  const have = { ...p.res };
  const pay: Record<Pool, number> = { grass: 0, bread: 0, vinyl: 0, yarn: 0, paper: 0, juice: 0 };
  const spend = (k: Pool, n = 1) => {
    have[k] -= n;
    pay[k] += n;
  };
  const specific = cost.filter((c) => c !== 'any') as Res[];
  const anyN = cost.length - specific.length;
  const missing: Res[] = [];
  for (const r of specific) {
    if (have[r] > 0) spend(r);
    else missing.push(r);
  }
  // keep resources needed for nothing else as trade fodder
  for (const _ of missing) {
    if (have.juice > 0) {
      spend('juice');
      continue;
    }
    const fodder = RES.filter((r) => have[r] > 0).sort((a, b) => have[b] - have[a]);
    const total = fodder.reduce((a, r) => a + have[r], 0);
    if (total < 2) return null;
    // take two from the largest piles
    let need = 2;
    for (const r of fodder) {
      while (need > 0 && have[r] > 0) {
        spend(r);
        need--;
      }
    }
  }
  for (let i = 0; i < anyN; i++) {
    const best = RES.filter((r) => have[r] > 0).sort((a, b) => have[b] - have[a])[0];
    if (best) spend(best);
    else if (have.juice > 0) spend('juice');
    else return null;
  }
  const crafts = Math.max(0, CRAFT_COST[col] - (p.reclaimer === 'bruno' ? 1 : 0));
  if (totalCrafts(p) < crafts) return null;
  return { pay, crafts };
}

export interface WakeOption {
  card: string;
  row: Row;
  col: number;
  plan: PayPlan;
}
export function wakeOptions(p: Player): WakeOption[] {
  const out: WakeOption[] = [];
  for (const id of p.hand) {
    const c = cardOf(id);
    for (const r of c.rows) {
      const col = p.rows[r].length;
      if (col >= 5) continue;
      const plan = payPlan(p, c.cost, col);
      if (plan) out.push({ card: id, row: r, col, plan });
    }
  }
  return out;
}

function removeCrafts(p: Player, n: number) {
  const slots = allSlots(p).filter((x) => x.crafts > 0).sort((a, b) => b.crafts - a.crafts);
  for (const sl of slots) {
    while (n > 0 && sl.crafts > 0) {
      sl.crafts--;
      n--;
    }
  }
}

// ───────────────────────── main entry ─────────────────────────
export function apply(prev: GameState, ans: Answer): GameState {
  const s: GameState = structuredClone(prev);
  const pr = s.prompt;
  if (!pr) throw new Error('No decision pending');
  if (pr.type !== ans.type && !(pr.type === 'turn' && (ans.type === 'wake' || ans.type === 'act' || ans.type === 'ask')))
    throw new Error(`Expected ${pr.type}, got ${ans.type}`);
  s.prompt = null;
  s.tick++;
  handle(s, pr, ans);
  run(s);
  return s;
}

function run(s: GameState) {
  let guard = 0;
  while (!s.prompt && s.queue.length) {
    if (++guard > 10000) throw new Error('engine loop');
    exec(s, s.queue.pop()!);
  }
}

function handle(s: GameState, pr: Prompt, ans: Answer) {
  const p = s.players[pr.player];
  switch (ans.type) {
    case 'setup': {
      if (!p.offer || !p.reclaimerOptions.includes(ans.reclaimer)) throw new Error('bad reclaimer');
      if (ans.keepCards.length + ans.keepRes.length !== SETUP_KEEP) throw new Error(`keep exactly ${SETUP_KEEP}`);
      if (!ans.keepCards.every((c) => p.offer!.cards.includes(c))) throw new Error('bad card');
      if (new Set(ans.keepRes).size !== ans.keepRes.length) throw new Error('dup res');
      p.reclaimer = ans.reclaimer;
      p.hand = [...ans.keepCards];
      s.discard.push(...p.offer.cards.filter((c) => !ans.keepCards.includes(c)));
      for (const r of ans.keepRes) p.res[r]++;
      if (p.reclaimer === 'nonna') p.res.bread += 2;
      if (p.reclaimer === 'kiki') drawCards(s, p, 1);
      delete p.offer;
      log(s, p.id, `${p.name} is playing ${RECLAIMERS[p.reclaimer].name}.`);
      const next = s.players.find((q) => !q.reclaimer);
      if (next) s.prompt = { type: 'setup', player: next.id };
      else startRound(s, 0);
      return;
    }
    case 'ask': {
      if (!canAsk(s, p)) throw new Error('cannot ask');
      p.askedThisTurn = true;
      s.last = { p: p.id, kind: 'ask' };
      log(s, p.id, `${p.name} asked Strawbaby for help. 🍓`, 'soft');
      push(s, { t: 'prompt', prompt: { type: 'turn', player: p.id } });
      takeJuice(s, p);
      return;
    }
    case 'wake': {
      const c = cardOf(ans.card);
      if (!p.hand.includes(ans.card) || !c.rows.includes(ans.row)) throw new Error('cannot wake there');
      const col = p.rows[ans.row].length;
      if (col >= 5) throw new Error('row full');
      const plan = payPlan(p, c.cost, col);
      if (!plan) throw new Error('cannot afford');
      for (const k of Object.keys(plan.pay) as Pool[]) p.res[k] -= plan.pay[k];
      removeCrafts(p, plan.crafts);
      p.hand.splice(p.hand.indexOf(ans.card), 1);
      p.rows[ans.row].push({ card: ans.card, crafts: 0, stash: 0, lore: 0 });
      p.actionsLeft--;
      s.last = { p: p.id, kind: 'wake', row: ans.row, col, card: ans.card };
      log(s, p.id, `${p.name} woke ${c.name} in ${ROW_NAMES[ans.row]}.`, 'act');
      if (p.reclaimer === 'dj' && c.cost.includes('vinyl')) {
        drawCards(s, p, 1);
        log(s, p.id, `DJ Vinilia's crowd brings a new card.`, 'power');
      }
      const tasks: Task[] = [];
      if (c.power?.when === 'woke') tasks.push({ t: 'fx', player: p.id, fx: c.power.fx, at: [ans.row, col] });
      tasks.push({ t: 'meanwhile', actor: p.id, trigger: 'otherWakes', vibe: c.vibe }, { t: 'endTurn' });
      push(s, ...tasks);
      return;
    }
    case 'act': {
      const r = ans.row;
      const n = rowCount(p, r);
      p.actionsLeft--;
      s.last = { p: p.id, kind: 'act', row: r, col: Math.min(n, 5) };
      log(s, p.id, `${p.name}: ${ROW_VERBS[r]}.`, 'act');
      let base = ROW_GAIN[r][n];
      if (r === 1 && p.reclaimer === 'mina') base++;
      if (r === 2 && p.reclaimer === 'biblio' && !p.perkUsed) {
        p.perkUsed = true;
        base++;
      }
      const tasks: Task[] = [];
      if (BONUS_AT.includes(n) && bonusPossible(p, r)) tasks.push({ t: 'prompt', prompt: { type: 'bonus', player: p.id, row: r } });
      const trig: Trigger = r === 0 ? 'otherOutside' : r === 1 ? 'otherWorkshop' : 'otherChat';
      tasks.push({ t: 'rowGain', player: p.id, row: r, n: base }, { t: 'powers', player: p.id, row: r }, { t: 'meanwhile', actor: p.id, trigger: trig }, { t: 'endTurn' });
      push(s, ...tasks);
      return;
    }
    case 'bonus': {
      if (!ans.use) return;
      const row = (pr as Extract<Prompt, { type: 'bonus' }>).row;
      if (row === 0) {
        if (!ans.card || !p.hand.includes(ans.card)) throw new Error('pick a card to discard');
        p.hand.splice(p.hand.indexOf(ans.card), 1);
        s.discard.push(ans.card);
      } else if (row === 1) {
        if (!ans.res || p.res[ans.res] < 1) throw new Error('pick a resource to pay');
        p.res[ans.res]--;
      } else {
        const from = ans.from ?? firstCraftSlot(p);
        const sl = from && p.rows[from[0]][from[1]];
        if (!sl || sl.crafts < 1) throw new Error('no craft to discard');
        sl.crafts--;
      }
      const t = s.queue[s.queue.length - 1];
      if (t && t.t === 'rowGain') t.n++;
      log(s, p.id, `${p.name} took the bonus trade.`);
      return;
    }
    case 'gacha': {
      const pg = pr as Extract<Prompt, { type: 'gacha' }>;
      const face = s.gacha[ans.index];
      if (face === undefined) throw new Error('no capsule');
      if (face === 'juice' && !canTakeJuice(p)) throw new Error('need a brainrot to soften first');
      s.gacha.splice(ans.index, 1);
      if (pg.left > 1) push(s, { t: 'prompt', prompt: { ...pg, left: pg.left - 1 } });
      if (face === 'juice') {
        log(s, p.id, `${p.name} took a Juice capsule. 🍓`, 'soft');
        takeJuice(s, p);
      } else {
        p.res[face]++;
        log(s, p.id, `${p.name} took ${POOL_NAMES[face]}.`);
      }
      return;
    }
    case 'draw': {
      const pd = pr as Extract<Prompt, { type: 'draw' }>;
      if (ans.tray === 'deck') {
        if (!drawCards(s, p, 1)) log(s, p.id, 'The deck is empty.');
      } else {
        const id = s.tray[ans.tray];
        if (!id) throw new Error('empty tray slot');
        s.tray[ans.tray] = null;
        p.hand.push(id);
        log(s, p.id, `${p.name} picked ${cardOf(id).name} from Word of Mouth.`);
      }
      if (pd.left > 1) push(s, { t: 'prompt', prompt: { ...pd, left: pd.left - 1 } });
      return;
    }
    case 'crafts': {
      const pc = pr as Extract<Prompt, { type: 'crafts' }>;
      if (ans.targets.length > pc.n) throw new Error('too many crafts');
      const before = structuredClone(p.rows);
      for (const [r, col] of ans.targets) {
        const sl = p.rows[r][col];
        if (!sl || sl.crafts >= cardOf(sl.card).cap) {
          p.rows = before;
          throw new Error('no room there');
        }
        sl.crafts++;
      }
      if (ans.targets.length < pc.n && craftRoom(p) > 0) {
        p.rows = before;
        throw new Error('place all your crafts');
      }
      if (ans.targets.length) log(s, p.id, `${p.name} made ${ans.targets.length} craft${ans.targets.length > 1 ? 's' : ''}.`);
      return;
    }
    case 'soft': {
      const ps = pr as Extract<Prompt, { type: 'soft' }>;
      if (!ps.rows.includes(ans.row)) throw new Error('not there');
      p.soft[ans.row]++;
      log(s, p.id, `A Soft token settles on ${poss(p.name)} ${ROW_NAMES[ans.row]} row.`, 'soft');
      return;
    }
    case 'tuck': {
      const pt = pr as Extract<Prompt, { type: 'tuck' }>;
      if (!ans.card) return;
      if (!p.hand.includes(ans.card)) throw new Error('not in hand');
      p.hand.splice(p.hand.indexOf(ans.card), 1);
      const sl = p.rows[pt.at[0]][pt.at[1]];
      sl.lore++;
      log(s, p.id, `${p.name} tucked a card under ${cardOf(sl.card).name}.`);
      if (pt.then === 'draw') drawCards(s, p, 1);
      else if (pt.then === 'any') push(s, { t: 'prompt', prompt: { type: 'pickRes', player: p.id, n: 1, why: 'Gain a resource' } });
      else p.res[pt.then]++;
      return;
    }
    case 'trade': {
      const pt = pr as Extract<Prompt, { type: 'trade' }>;
      if (!ans.use) return;
      if (pt.pay === 'card') {
        if (!ans.card || !p.hand.includes(ans.card)) throw new Error('pick a card');
        p.hand.splice(p.hand.indexOf(ans.card), 1);
        s.discard.push(ans.card);
      } else if (pt.pay === 'craft') {
        const from = ans.from ?? firstCraftSlot(p);
        const sl = from && p.rows[from[0]][from[1]];
        if (!sl || sl.crafts < 1) throw new Error('no craft');
        sl.crafts--;
      } else {
        const r = ans.res ?? (pt.pay === 'any' ? undefined : pt.pay);
        if (!r || p.res[r] < 1) throw new Error('cannot pay');
        if (pt.pay !== 'any' && r !== pt.pay && r !== 'juice') throw new Error('wrong resource');
        p.res[r]--;
      }
      push(s, { t: 'fx', player: p.id, fx: pt.then, at: pt.at });
      return;
    }
    case 'pickRes': {
      const pp = pr as Extract<Prompt, { type: 'pickRes' }>;
      p.res[ans.res]++;
      log(s, p.id, `${p.name} gained ${POOL_NAMES[ans.res]}.`);
      if (pp.n > 1) push(s, { t: 'prompt', prompt: { ...pp, n: pp.n - 1 } });
      return;
    }
    case 'unsoft': {
      if (p.soft[ans.row] < 1) throw new Error('no soft there');
      p.soft[ans.row]--;
      log(s, p.id, `${p.name} shook off a Soft token.`, 'soft');
      return;
    }
    case 'repeat': {
      const pr2 = pr as Extract<Prompt, { type: 'repeat' }>;
      if (!pr2.options.includes(ans.col)) throw new Error('cannot repeat that');
      push(s, { t: 'activate', player: p.id, row: pr2.row, col: ans.col });
      return;
    }
  }
}

function firstCraftSlot(p: Player): [Row, number] | null {
  for (const r of ROWS) for (let i = 0; i < p.rows[r].length; i++) if (p.rows[r][i].crafts > 0) return [r, i];
  return null;
}

function bonusPossible(p: Player, r: Row) {
  if (r === 0) return p.hand.length > 0;
  if (r === 1) return Object.values(p.res).some((v) => v > 0);
  return totalCrafts(p) > 0;
}

// ───────────────────────── task execution ─────────────────────────
function exec(s: GameState, t: Task) {
  switch (t.t) {
    case 'prompt':
      showPrompt(s, t.prompt);
      return;
    case 'fx':
      doEffect(s, s.players[t.player], t.fx, t.at);
      return;
    case 'activate': {
      const p = s.players[t.player];
      const sl = p.rows[t.row][t.col];
      const c = sl && cardOf(sl.card);
      if (!c?.power || c.power.when !== 'each') return;
      push(s, { t: 'fx', player: p.id, fx: c.power.fx, at: [t.row, t.col] });
      return;
    }
    case 'rowGain': {
      const p = s.players[t.player];
      if (t.row === 0) push(s, { t: 'prompt', prompt: { type: 'gacha', player: p.id, left: t.n } });
      else if (t.row === 1) push(s, { t: 'prompt', prompt: { type: 'crafts', player: p.id, n: t.n } });
      else push(s, { t: 'prompt', prompt: { type: 'draw', player: p.id, left: t.n } });
      return;
    }
    case 'powers': {
      const p = s.players[t.player];
      const row = p.rows[t.row];
      if (p.soft[t.row] > 0) {
        if (p.reclaimer === 'coach' && !p.perkUsed && row.length) {
          p.perkUsed = true;
          p.soft[t.row]--;
          log(s, p.id, `Coach Pratoverde blows the whistle: the Soft token is shaken off.`, 'soft');
        } else {
          p.soft[t.row]--;
          if (row.some((x) => cardOf(x.card).power?.when === 'each'))
            log(s, p.id, `${poss(p.name).replace(/^y/, 'Y')} ${ROW_NAMES[t.row]} crew forgot how. Powers skipped; the Soft token wears off.`, 'soft');
          return;
        }
      }
      const tasks: Task[] = [];
      for (let col = row.length - 1; col >= 0; col--) tasks.push({ t: 'activate', player: p.id, row: t.row, col });
      push(s, ...tasks);
      return;
    }
    case 'meanwhile': {
      const n = s.players.length;
      const tasks: Task[] = [];
      for (let k = 1; k < n; k++) {
        const q = s.players[(t.actor + k) % n];
        if (q.meanwhileUsed) continue;
        for (const r of ROWS) {
          const col = q.rows[r].findIndex((sl) => {
            const pw = cardOf(sl.card).power;
            return pw?.when === 'meanwhile' && pw.on === t.trigger && (!pw.vibe || pw.vibe === t.vibe);
          });
          if (col >= 0) {
            q.meanwhileUsed = true;
            const c = cardOf(q.rows[r][col].card);
            log(s, q.id, `Meanwhile, ${poss(q.name)} ${c.name} reacts.`, 'power');
            tasks.push({ t: 'fx', player: q.id, fx: c.power!.fx, at: [r, col] });
            break;
          }
        }
      }
      push(s, ...tasks);
      return;
    }
    case 'endTurn':
      endTurn(s);
      return;
  }
}

/** Shows a prompt unless it can be resolved without a real choice. */
function showPrompt(s: GameState, pr: Prompt) {
  const p = s.players[pr.player];
  switch (pr.type) {
    case 'gacha': {
      normalizeGacha(s, p);
      if (!s.gacha.length) return;
      break;
    }
    case 'crafts': {
      const room = craftRoom(p);
      if (room === 0) {
        log(s, p.id, `${p.name} has nowhere to put crafts.`);
        return;
      }
      if (room <= pr.n) {
        // everything fills up: no decision to make
        let placed = 0;
        for (const sl of allSlots(p)) {
          const add = cardOf(sl.card).cap - sl.crafts;
          sl.crafts += add;
          placed += add;
        }
        log(s, p.id, `${p.name} made ${placed} craft${placed > 1 ? 's' : ''}.`);
        return;
      }
      break;
    }
    case 'draw':
      if (!s.deck.length && !s.discard.length && s.tray.every((x) => !x)) return;
      break;
    case 'soft':
      if (pr.rows.length === 1) {
        p.soft[pr.rows[0]]++;
        log(s, p.id, `A Soft token settles on ${poss(p.name)} ${ROW_NAMES[pr.rows[0]]} row.`, 'soft');
        return;
      }
      break;
    case 'unsoft': {
      const rows = ROWS.filter((r) => p.soft[r] > 0);
      if (!rows.length) return;
      if (rows.length === 1) {
        p.soft[rows[0]]--;
        log(s, p.id, `${p.name} shook off a Soft token.`, 'soft');
        return;
      }
      pr = { ...pr, rows };
      break;
    }
    case 'repeat':
      if (!pr.options.length) return;
      if (pr.options.length === 1) {
        push(s, { t: 'activate', player: p.id, row: pr.row, col: pr.options[0] });
        return;
      }
      break;
    case 'tuck':
      if (!p.hand.length) return;
      break;
    case 'trade':
      if (!canPayTrade(p, pr.pay)) return;
      break;
    case 'turn':
      if (p.actionsLeft <= 0) return;
      break;
  }
  s.prompt = pr;
}

function canPayTrade(p: Player, pay: Res | 'any' | 'craft' | 'card') {
  if (pay === 'card') return p.hand.length > 0;
  if (pay === 'craft') return totalCrafts(p) > 0;
  if (pay === 'any') return Object.values(p.res).some((v) => v > 0);
  return p.res[pay] > 0 || p.res.juice > 0;
}

export function pickableGacha(s: GameState, p: Player): number[] {
  return s.gacha.map((f, i) => (f !== 'juice' || canTakeJuice(p) ? i : -1)).filter((i) => i >= 0);
}

function normalizeGacha(s: GameState, p: Player) {
  for (let tries = 0; tries < 20; tries++) {
    const allSame = s.gacha.length > 0 && s.gacha.every((f) => f === s.gacha[0]);
    if (s.gacha.length && !allSame && pickableGacha(s, p).length) return;
    rerollGacha(s);
    log(s, null, 'The gacha machine rattles and refills.');
    if (pickableGacha(s, p).length && !s.gacha.every((f) => f === s.gacha[0])) return;
  }
}

function takeJuice(s: GameState, p: Player): boolean {
  const rows = softRows(p);
  if (!rows.length) return false;
  p.res.juice++;
  p.juiceTaken++;
  const tasks: Task[] = [{ t: 'prompt', prompt: { type: 'soft', player: p.id, rows } }];
  for (const r of ROWS)
    p.rows[r].forEach((sl, col) => {
      const pw = cardOf(sl.card).power;
      if (pw?.when === 'whenever' && pw.on === 'youJuice') tasks.push({ t: 'fx', player: p.id, fx: pw.fx, at: [r, col] });
    });
  tasks.push({ t: 'meanwhile', actor: p.id, trigger: 'otherJuice' });
  push(s, ...tasks);
  return true;
}

function doEffect(s: GameState, p: Player, fx: Effect, at?: [Row, number]) {
  const slot = at ? p.rows[at[0]][at[1]] : undefined;
  const here = slot ? cardOf(slot.card) : undefined;
  switch (fx.k) {
    case 'gain':
      if (fx.res === 'any') push(s, { t: 'prompt', prompt: { type: 'pickRes', player: p.id, n: fx.n, why: here ? here.name : 'Gain' } });
      else {
        p.res[fx.res] += fx.n;
        log(s, p.id, `${here?.name ?? p.name}: +${fx.n} ${POOL_NAMES[fx.res]}.`, 'power');
      }
      return;
    case 'gacha':
      push(s, { t: 'prompt', prompt: { type: 'gacha', player: p.id, left: fx.n } });
      return;
    case 'gachaStash': {
      const i = s.gacha.indexOf(fx.res);
      if (i >= 0 && slot) {
        s.gacha.splice(i, 1);
        slot.stash++;
        log(s, p.id, `${here!.name} snagged ${POOL_NAMES[fx.res]} from the gacha and stashed it.`, 'power');
      } else log(s, p.id, `${here?.name}: no ${POOL_NAMES[fx.res]} in the gacha.`, 'power');
      return;
    }
    case 'draw': {
      const got = drawCards(s, p, fx.n);
      if (got) log(s, p.id, `${here?.name ?? p.name}: draw ${got}.`, 'power');
      return;
    }
    case 'craftHere': {
      if (!slot) return;
      const add = Math.min(fx.n, here!.cap - slot.crafts);
      slot.crafts += add;
      if (add) log(s, p.id, `${here!.name} made ${add} craft${add > 1 ? 's' : ''}.`, 'power');
      return;
    }
    case 'craftAny':
      push(s, { t: 'prompt', prompt: { type: 'crafts', player: p.id, n: fx.n } });
      return;
    case 'craftRow': {
      if (!at) return;
      let n = 0;
      for (const sl of p.rows[at[0]])
        if (sl.crafts < cardOf(sl.card).cap) {
          sl.crafts++;
          n++;
        }
      if (n) log(s, p.id, `${here!.name} helps the whole row: ${n} crafts.`, 'power');
      return;
    }
    case 'stash':
      if (slot) {
        slot.stash += fx.n;
        log(s, p.id, `${here!.name} stashed ${POOL_NAMES[fx.res]}.`, 'power');
      }
      return;
    case 'tuckDraw':
      if (at) push(s, { t: 'prompt', prompt: { type: 'tuck', player: p.id, at, then: 'draw' } });
      return;
    case 'tuckGain':
      if (at) push(s, { t: 'prompt', prompt: { type: 'tuck', player: p.id, at, then: fx.res } });
      return;
    case 'tuckTop': {
      if (!slot) return;
      let n = 0;
      for (let i = 0; i < fx.n; i++) {
        const id = drawId(s);
        if (id) {
          slot.lore++;
          n++;
        }
      }
      if (n) log(s, p.id, `${here!.name} tucked ${n} card${n > 1 ? 's' : ''} from the deck.`, 'power');
      return;
    }
    case 'hunt': {
      if (!slot) return;
      const id = drawId(s);
      if (!id) return;
      const c = cardOf(id);
      if (c.rot < fx.max) {
        slot.lore++;
        log(s, p.id, `${here!.name} hunted ${c.name} (Rot ${c.rot}%) and tucked it!`, 'power');
      } else {
        s.discard.push(id);
        log(s, p.id, `${here!.name} went after ${c.name} (Rot ${c.rot}%) and missed.`, 'power');
      }
      return;
    }
    case 'fish': {
      if (!slot) return;
      const k = GACHA_SIZE - s.gacha.length;
      const rolled = Array.from({ length: k }, () => roll(s));
      if (rolled.includes(fx.res)) {
        slot.stash++;
        log(s, p.id, `${here!.name} shook the machine: ${POOL_NAMES[fx.res]}! Stashed.`, 'power');
      } else log(s, p.id, `${here!.name} shook the machine: nothing.`, 'power');
      return;
    }
    case 'trade':
      if (at) push(s, { t: 'prompt', prompt: { type: 'trade', player: p.id, at, pay: fx.pay, then: fx.then } });
      return;
    case 'allDraw': {
      for (const q of s.players) drawCards(s, q, 1);
      drawCards(s, p, 1);
      log(s, p.id, `${here?.name ?? p.name}: everyone draws 1, ${p.name} draws 2.`, 'power');
      return;
    }
    case 'allGain': {
      for (const q of s.players) q.res[fx.res]++;
      p.res[fx.res]++;
      log(s, p.id, `${here?.name ?? p.name}: everyone gains ${POOL_NAMES[fx.res]}, ${p.name} gains 2.`, 'power');
      return;
    }
    case 'unsoft':
      push(s, { t: 'prompt', prompt: { type: 'unsoft', player: p.id, rows: [] } });
      return;
    case 'repeat': {
      if (!at) return;
      const options = p.rows[at[0]]
        .map((sl, col) => ({ col, pw: cardOf(sl.card).power }))
        .filter((x) => x.col !== at[1] && x.pw?.when === 'each' && x.pw.fx.k !== 'repeat')
        .map((x) => x.col);
      push(s, { t: 'prompt', prompt: { type: 'repeat', player: p.id, row: at[0], options } });
      return;
    }
    case 'aura':
      p.auraBonus += fx.n;
      return;
    case 'juice':
      if (fx.n > 1) {
        push(s, ...Array.from({ length: fx.n }, (): Task => ({ t: 'fx', player: p.id, fx: { k: 'juice', n: 1 } })));
        return;
      }
      if (takeJuice(s, p)) log(s, p.id, `${here?.name ?? p.name} pours ${p.name} a Juice. 🍓`, 'soft');
      return;
    default:
      return; // finale effects score at the end
  }
}

// ───────────────────────── turns & rounds ─────────────────────────
function startRound(s: GameState, round: number) {
  s.phase = 'play';
  s.round = round;
  for (const p of s.players) {
    p.actionsLeft = ACTIONS[round];
    p.perkUsed = false;
  }
  if (round > 0) s.firstPlayer = (s.firstPlayer + 1) % s.players.length;
  s.turn = s.firstPlayer;
  const d = DISTRICTS[s.districts[round]];
  log(s, null, `Season ${round + 1} of ${ROUNDS}. ${ACTIONS[round]} actions each. Up for reclaiming: ${d.name} (${d.goal}).`, 'round');
  beginTurn(s);
}

function beginTurn(s: GameState) {
  const p = s.players[s.turn];
  p.meanwhileUsed = false;
  p.askedThisTurn = false;
  push(s, { t: 'prompt', prompt: { type: 'turn', player: p.id } });
}

function endTurn(s: GameState) {
  refillTray(s);
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (s.turn + k) % n;
    if (s.players[i].actionsLeft > 0) {
      s.turn = i;
      beginTurn(s);
      return;
    }
  }
  endRound(s);
}

export function districtValue(p: Player, d: DistrictId): number {
  const slots = allSlots(p);
  const vibeCount = (v: Vibe) => slots.filter((x) => cardOf(x.card).vibe === v).length;
  switch (d) {
    case 'park': return p.rows[0].length;
    case 'garage': return p.rows[1].length;
    case 'cafeteria': return p.rows[2].length;
    case 'fair': return totalCrafts(p);
    case 'school': return slots.filter((x) => x.crafts > 0).length;
    case 'foodcourt': return vibeCount('snacc');
    case 'zoo': return vibeCount('beast');
    case 'repair': return vibeCount('gadget');
    case 'stage': return vibeCount('icon');
    case 'pantry': return slots.reduce((a, x) => a + x.stash, 0);
    case 'library': return slots.reduce((a, x) => a + x.lore, 0);
    case 'arcade': return slots.filter((x) => cardOf(x.card).aura <= 3).length;
  }
}

export function scoreDistrict(s: GameState, round: number) {
  const d = s.districts[round];
  const vals = s.players.map((p) => ({ player: p.id, value: districtValue(p, d) }));
  const sorted = [...vals].filter((v) => v.value > 0).sort((a, b) => b.value - a.value);
  const scores = vals.map((v) => ({ ...v, place: 0, aura: 0 }));
  let place = 0;
  let i = 0;
  while (i < sorted.length && place < 3) {
    const tied = sorted.filter((x) => x.value === sorted[i].value);
    const pot = PAYOUT[round].slice(place, place + tied.length).reduce((a, b) => a + b, 0);
    const each = Math.floor(pot / tied.length);
    for (const t of tied) {
      const sc = scores.find((x) => x.player === t.player)!;
      sc.place = place + 1;
      sc.aura = each;
    }
    place += tied.length;
    i += tied.length;
  }
  return { round, district: d, scores };
}

function endRound(s: GameState) {
  const res = scoreDistrict(s, s.round);
  s.results.push(res);
  const d = DISTRICTS[res.district];
  for (const sc of res.scores) s.players[sc.player].districtAura[s.round] = sc.aura;
  const winners = res.scores.filter((x) => x.place === 1).map((x) => nm(s, x.player));
  log(s, null, winners.length ? `${d.name} reclaimed by ${winners.join(' & ')}!` : `Nobody reclaimed ${d.name}. The Soft keeps it.`, 'round');
  s.discard.push(...(s.tray.filter(Boolean) as string[]));
  s.tray = [];
  refillTray(s);
  if (s.round + 1 >= ROUNDS) {
    s.phase = 'over';
    s.prompt = null;
    s.queue = [];
    log(s, null, 'The fourth season ends. Count your Aura.', 'round');
    return;
  }
  startRound(s, s.round + 1);
}

// ───────────────────────── scoring ─────────────────────────
export interface ScoreSheet {
  cards: number;
  crafts: number;
  stash: number;
  lore: number;
  districts: number;
  bonus: number;
  finale: number;
  challenge: number;
  soft: number;
  total: number;
}

export function finaleValue(p: Player, r: Row, col: number): number {
  const pw = cardOf(p.rows[r][col].card).power;
  if (pw?.when !== 'finale') return 0;
  const fx = pw.fx;
  switch (fx.k) {
    case 'finaleVibe': {
      const pool = fx.scope === 'row' ? p.rows[r] : allSlots(p);
      return fx.n * pool.filter((x) => cardOf(x.card).vibe === fx.vibe).length;
    }
    case 'finaleRowFull':
      return p.rows[r].length >= 5 ? fx.n : 0;
    case 'finaleNoSoft':
      return p.soft.every((x) => x === 0) ? fx.n : 0;
    case 'finaleSoft':
      return Math.min(fx.max, fx.n * p.soft.reduce((a, b) => a + b, 0));
    case 'finaleStash':
      return fx.n * p.rows[r][col].stash;
    default:
      return 0;
  }
}

export function challengeValue(s: GameState, p: Player): number {
  const slots = allSlots(p);
  const vib = (v: Vibe, list = slots) => list.filter((x) => cardOf(x.card).vibe === v).length;
  switch (p.reclaimer) {
    case 'mina':
      return p.juiceTaken === 0 ? 8 : p.juiceTaken <= 2 ? 5 : p.juiceTaken <= 4 ? 2 : 0;
    case 'nonna': {
      const n = vib('snacc');
      return n + (n >= 5 ? 3 : 0);
    }
    case 'coach':
      return p.rows[0].length >= 5 ? 8 : p.rows[0].length === 4 ? 4 : 0;
    case 'dj':
      return 2 * vib('icon', p.rows[2]);
    case 'biblio':
      return slots.reduce((a, x) => a + x.lore, 0);
    case 'bruno':
      return 2 * vib('gadget', p.rows[1]);
    case 'dev':
      return p.soft.every((x) => x === 0) ? Math.min(10, 2 * p.juiceTaken) : 0;
    case 'kiki':
      return 3 * s.results.filter((r) => r.scores.some((x) => x.player === p.id && x.place === 1)).length;
    default:
      return 0;
  }
}

export function scorePlayer(s: GameState, p: Player): ScoreSheet {
  const slots = allSlots(p);
  const cards = slots.reduce((a, x) => a + cardOf(x.card).aura, 0);
  const crafts = totalCrafts(p);
  const stash = slots.reduce((a, x) => a + x.stash, 0);
  const lore = slots.reduce((a, x) => a + x.lore, 0);
  const districts = p.districtAura.reduce((a, b) => a + (b ?? 0), 0);
  let finale = 0;
  for (const r of ROWS) for (let i = 0; i < p.rows[r].length; i++) finale += finaleValue(p, r, i);
  const challenge = challengeValue(s, p);
  const soft = -p.soft.reduce((a, b) => a + b, 0);
  const bonus = p.auraBonus;
  return { cards, crafts, stash, lore, districts, bonus, finale, challenge, soft, total: cards + crafts + stash + lore + districts + bonus + finale + challenge + soft };
}

export function standings(s: GameState) {
  return s.players
    .map((p) => ({ p, sheet: scorePlayer(s, p) }))
    .sort((a, b) => b.sheet.total - a.sheet.total || totalRes(b.p) - totalRes(a.p));
}
const totalRes = (p: Player) => Object.values(p.res).reduce((a, b) => a + b, 0);

/** Story outcome: how much the whole table leaned on Strawbaby. */
export function softness(s: GameState) {
  const juice = s.players.reduce((a, p) => a + p.juiceTaken, 0);
  const perPlayer = juice / s.players.length;
  const ending: 'sewn' | 'stalemate' | 'soft' = perPlayer <= 2 ? 'sewn' : perPlayer <= 5 ? 'stalemate' : 'soft';
  return { juice, perPlayer, ending };
}

export function activePlayer(s: GameState): Player | null {
  return s.prompt ? s.players[s.prompt.player] : null;
}
