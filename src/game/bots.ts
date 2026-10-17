// Heuristic bots. Not geniuses: they build an engine, chase the district, and sometimes lean on Strawbaby.
import { CARD } from './cards';
import {
  ACTIONS, BONUS_AT, ROUNDS, ROW_GAIN, canAsk, cardOf, craftRoom, payPlan, pickableGacha, rowCount, totalCrafts, wakeOptions,
} from './engine';
import type { Answer, Card, Effect, GameState, Player, Pool, Res, Row } from './types';
import { RES, ROWS } from './types';

export interface BotTraits {
  /** 0 = never asks Strawbaby, 1 = asks whenever it helps */
  reliance: number;
}

const DEFAULT_TRAITS: BotTraits[] = [{ reliance: 0.3 }, { reliance: 0.7 }, { reliance: 0.1 }, { reliance: 0.5 }];

/** Actions this player still gets, this round and later. */
function actionsAhead(s: GameState, p: Player) {
  let n = p.actionsLeft;
  for (let r = s.round + 1; r < ROUNDS; r++) n += ACTIONS[r];
  return n;
}

function fxValue(fx: Effect): number {
  switch (fx.k) {
    case 'gain': return 1 * fx.n;
    case 'gacha': return 0.9 * fx.n;
    case 'gachaStash': return 0.5;
    case 'draw': return 0.75 * fx.n;
    case 'craftHere': return 0.8 * fx.n;
    case 'craftAny': return 0.85 * fx.n;
    case 'craftRow': return 1.4;
    case 'stash': return 1 * fx.n;
    case 'tuckDraw': return 0.9;
    case 'tuckGain': return 0.9;
    case 'tuckTop': return 1 * fx.n;
    case 'hunt': return 0.5;
    case 'fish': return 0.45;
    case 'trade': return 0.5 + fxValue(fx.then) * 0.4;
    case 'allDraw': return 1.2;
    case 'allGain': return 1.2;
    case 'unsoft': return 0.4;
    case 'repeat': return 1.1;
    case 'aura': return fx.n;
    case 'juice': return 0.4 * fx.n;
    case 'finaleVibe': return fx.n * 2.5;
    case 'finaleRowFull': return fx.n * 0.6;
    case 'finaleNoSoft': return fx.n * 0.7;
    case 'finaleSoft': return 2;
    case 'finaleStash': return 2;
  }
}

export function cardValue(s: GameState, p: Player, c: Card, row?: Row): number {
  let v = c.aura;
  const ahead = actionsAhead(s, p);
  const pw = c.power;
  if (pw) {
    const base = fxValue(pw.fx);
    if (pw.when === 'each') {
      // a row gets used roughly a third of the time
      const r = row ?? c.rows[0];
      v += base * Math.min(6, ahead / 3.2) * (rowCount(p, r) < 5 ? 1 : 0.5);
    } else if (pw.when === 'woke') v += base;
    else if (pw.when === 'meanwhile' || pw.when === 'whenever') v += base * Math.min(5, ahead / 5);
    else v += base;
  }
  v += Math.min(c.cap, ahead / 4) * 0.35;
  // districts still to come
  for (let r = s.round; r < ROUNDS; r++) {
    const d = s.districts[r];
    const w = r === s.round ? 1.2 : 0.4;
    if ((d === 'park' && row === 0) || (d === 'garage' && row === 1) || (d === 'cafeteria' && row === 2)) v += w;
    if ((d === 'foodcourt' && c.vibe === 'snacc') || (d === 'zoo' && c.vibe === 'beast') || (d === 'repair' && c.vibe === 'gadget') || (d === 'stage' && c.vibe === 'icon')) v += w;
    if (d === 'arcade' && c.aura <= 3) v += w;
  }
  return v;
}

function needs(p: Player): Record<Res, number> {
  const n: Record<Res, number> = { grass: 0, bread: 0, vinyl: 0, yarn: 0, paper: 0 };
  for (const id of p.hand) {
    for (const ci of CARD[id].cost) if (ci !== 'any') n[ci] += 1 / Math.max(1, p.res[ci] + 1);
  }
  return n;
}

function rowActionValue(s: GameState, p: Player, r: Row): number {
  const n = rowCount(p, r);
  const gain = ROW_GAIN[r][n];
  const stock = RES.reduce((a, k) => a + p.res[k], 0) + p.res.juice;
  let v = 0;
  if (r === 0) {
    const blocked = p.hand.filter((id) => CARD[id].rows.some((row) => rowCount(p, row) < 5) && !payPlan(p, CARD[id].cost, 0)).length;
    v = gain * (blocked > 0 ? 1.3 : 0.4) * (stock >= 8 ? 0.25 : stock >= 5 ? 0.6 : 1);
  } else if (r === 1) {
    v = Math.min(gain, craftRoom(p)) * (0.6 + 0.13 * s.round);
  } else {
    v = gain * (p.hand.length < 2 ? 1.3 : p.hand.length < 4 ? 0.8 : p.hand.length < 6 ? 0.35 : 0.1);
  }
  if (p.soft[r] === 0) for (const sl of p.rows[r]) {
    const pw = cardOf(sl.card).power;
    if (pw?.when === 'each') v += fxValue(pw.fx) * 0.6;
  }
  if (BONUS_AT.includes(n)) v += 0.2;
  return v;
}

function chooseTurn(s: GameState, p: Player, traits: BotTraits): Answer {
  const opts = wakeOptions(p);
  let best: { v: number; a: Answer } = { v: -Infinity, a: { type: 'act', row: 0 } };
  const ahead = actionsAhead(s, p);
  for (const o of opts) {
    const c = cardOf(o.card);
    const spent = Object.values(o.plan.pay).reduce((a, b) => a + b, 0) + o.plan.crafts;
    const v = cardValue(s, p, c, o.row) - spent * 0.45 + (ahead > 6 ? 1.2 : 0.3);
    if (v > best.v) best = { v, a: { type: 'wake', card: o.card, row: o.row } };
  }
  for (const r of ROWS) {
    const v = rowActionValue(s, p, r);
    if (v > best.v) best = { v, a: { type: 'act', row: r } };
  }
  // Ask Strawbaby when it unlocks something good and we're the leaning type
  if (best.a.type !== 'wake' && canAsk(s, p) && Math.random() < traits.reliance) {
    const probe = { ...p, res: { ...p.res, juice: p.res.juice + 1 } };
    const unlocked = wakeOptions(probe).filter((o) => !opts.some((x) => x.card === o.card && x.row === o.row));
    if (unlocked.some((o) => cardValue(s, p, cardOf(o.card), o.row) > 4)) return { type: 'ask' };
  }
  return best.a;
}

function setupAnswer(s: GameState, p: Player): Answer {
  const offer = p.offer!;
  const ranked = [...offer.cards].sort((a, b) => cardValue(s, p, CARD[b]) / CARD[b].cost.length - cardValue(s, p, CARD[a]) / CARD[a].cost.length);
  const keepCards = ranked.slice(0, 3);
  const need: Record<Res, number> = { grass: 0, bread: 0, vinyl: 0, yarn: 0, paper: 0 };
  for (const id of keepCards) for (const ci of CARD[id].cost) if (ci !== 'any') need[ci]++;
  const keepRes = [...RES].sort((a, b) => need[b] - need[a]).slice(0, 2);
  const reclaimer = p.reclaimerOptions[Math.floor(Math.random() * 2)];
  return { type: 'setup', reclaimer, keepCards, keepRes };
}

export function botAnswer(s: GameState, traits?: BotTraits): Answer {
  const pr = s.prompt!;
  const p = s.players[pr.player];
  const t = traits ?? DEFAULT_TRAITS[p.id % DEFAULT_TRAITS.length];
  switch (pr.type) {
    case 'setup':
      return setupAnswer(s, p);
    case 'turn':
      return chooseTurn(s, p, t);
    case 'gacha': {
      const need = needs(p);
      const idx = pickableGacha(s, p);
      let bi = idx[0];
      let bv = -Infinity;
      for (const i of idx) {
        const f = s.gacha[i];
        const v = f === 'juice' ? (Math.random() < t.reliance ? 0.9 : -1) : need[f] + Math.random() * 0.1;
        if (v > bv) {
          bv = v;
          bi = i;
        }
      }
      return { type: 'gacha', index: bi };
    }
    case 'draw': {
      let bi: number | 'deck' = 'deck';
      let bv = 3.2;
      s.tray.forEach((id, i) => {
        if (!id) return;
        const v = cardValue(s, p, CARD[id]);
        if (v > bv) {
          bv = v;
          bi = i;
        }
      });
      if (bi === 'deck' && !s.deck.length && !s.discard.length) {
        const i = s.tray.findIndex((x) => x);
        if (i >= 0) bi = i;
      }
      return { type: 'draw', tray: bi };
    }
    case 'crafts': {
      const targets: [Row, number][] = [];
      const room = ROWS.flatMap((r) => p.rows[r].map((sl, col) => ({ r, col, room: cardOf(sl.card).cap - sl.crafts })));
      room.sort((a, b) => b.room - a.room);
      let left = pr.n;
      while (left > 0) {
        const slot = room.find((x) => x.room > 0);
        if (!slot) break;
        targets.push([slot.r, slot.col]);
        slot.room--;
        left--;
        room.sort((a, b) => b.room - a.room);
      }
      return { type: 'crafts', targets };
    }
    case 'soft': {
      const cost = (r: Row) => p.rows[r].reduce((a, sl) => a + (cardOf(sl.card).power?.when === 'each' ? 1 : 0), 0) + p.soft[r] * 0.5;
      const row = [...pr.rows].sort((a, b) => cost(a) - cost(b))[0];
      return { type: 'soft', row };
    }
    case 'bonus': {
      if (pr.row === 0 && p.hand.length > 3) return { type: 'bonus', use: true, card: worstCard(s, p) };
      if (pr.row === 1) {
        const r = (Object.keys(p.res) as Pool[]).filter((k) => k !== 'juice' && p.res[k] > 1).sort((a, b) => p.res[b] - p.res[a])[0];
        if (r && s.round >= 1) return { type: 'bonus', use: true, res: r };
      }
      if (pr.row === 2 && p.hand.length === 0 && totalCrafts(p) > 0) return { type: 'bonus', use: true };
      return { type: 'bonus', use: false };
    }
    case 'tuck': {
      if (pr.then === 'draw' || p.hand.length >= 3) return { type: 'tuck', card: worstCard(s, p) };
      return { type: 'tuck', card: null };
    }
    case 'trade': {
      if (pr.pay === 'card') return p.hand.length >= 3 ? { type: 'trade', use: true, card: worstCard(s, p) } : { type: 'trade', use: false };
      if (pr.pay === 'craft') return { type: 'trade', use: s.round >= 3 ? false : true };
      const pool = (Object.keys(p.res) as Pool[]).filter((k) => p.res[k] > 0 && (pr.pay === 'any' || k === pr.pay || k === 'juice'));
      const surplus = pool.sort((a, b) => p.res[b] - p.res[a])[0];
      if (surplus && (p.res[surplus] >= 2 || s.round >= 2)) return { type: 'trade', use: true, res: surplus };
      return { type: 'trade', use: false };
    }
    case 'pickRes': {
      const need = needs(p);
      const r = [...RES].sort((a, b) => need[b] - need[a])[0];
      return { type: 'pickRes', res: r };
    }
    case 'unsoft': {
      const r = ROWS.filter((x) => p.soft[x] > 0).sort((a, b) => p.soft[b] - p.soft[a])[0];
      return { type: 'unsoft', row: r };
    }
    case 'repeat': {
      const best = [...pr.options].sort((a, b) => fxValue(cardOf(p.rows[pr.row][b].card).power!.fx) - fxValue(cardOf(p.rows[pr.row][a].card).power!.fx))[0];
      return { type: 'repeat', col: best };
    }
  }
}

function worstCard(s: GameState, p: Player): string {
  return [...p.hand].sort((a, b) => cardValue(s, p, CARD[a]) - cardValue(s, p, CARD[b]))[0];
}

