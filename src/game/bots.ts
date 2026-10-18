// Heuristic bots: value each open space by what it gets them toward the brainrots they want, points, and agents.
import { BRAINROT } from './cards';
import { SPACES } from './content';
import {
  bagTotal, brainrot, canAfford, canPlace, CHECKINS, feedCapacity, helperIndexes, MAX_AGENTS, objectiveValue, ROUNDS, spaceCost,
} from './engine';
import type { Answer, Bag, Brainrot, GameState, ObjectiveId, Player, Res, SpaceId } from './types';
import { RES } from './types';

const BASE: Record<Res, number> = { grass: 0.9, coolant: 1.4, pcb: 1.3, glitter: 0.9, copper: 1.0 };

function roundsLeft(s: GameState) {
  return ROUNDS - s.round; // including this one
}

function grassNeed(s: GameState, p: Player) {
  const next = CHECKINS.find((c) => c >= s.round + 1);
  if (!next) return 0;
  const agents = p.agents + p.rookies;
  return Math.max(0, agents - feedCapacity(p) - p.res.grass);
}

/** How much the bot wants one more of each resource right now. */
function resValues(s: GameState, p: Player): Record<Res, number> {
  const v = { ...BASE };
  // whatever the best affordable-soon brainrot is missing
  const targets = s.market
    .map((id, slot) => (id ? { b: brainrot(id), slot } : null))
    .filter((x): x is { b: Brainrot; slot: number } => !!x)
    .sort((a, b) => allyValue(s, p, b.b) - allyValue(s, p, a.b));
  for (const t of targets.slice(0, 2)) {
    const cost = spaceCost(s, p, 'deprogram', t.slot);
    for (const r of RES) if ((cost[r] ?? 0) > p.res[r]) v[r] += 0.7;
  }
  const need = grassNeed(s, p);
  if (need > 0) v.grass += 1.8;
  // things piling up in the stash are worth less
  for (const r of RES) if (p.res[r] >= 4) v[r] *= 0.6;
  // late game, leftovers are almost worthless
  if (roundsLeft(s) <= 1) for (const r of RES) v[r] *= 0.5;
  return v;
}

const bagValue = (b: Bag, v: Record<Res, number>) => RES.reduce((a, r) => a + (b[r] ?? 0) * v[r], 0);

export function allyValue(s: GameState, p: Player, b: Brainrot): number {
  const left = roundsLeft(s) - 1;
  let v = b.strength;
  const ab = b.ability;
  if (ab) {
    switch (ab.k) {
      case 'dawn': v += bagTotal(ab.gain) * 1.1 * left; break;
      case 'boost': v += bagTotal(ab.gain) * 0.55 * left; break;
      case 'helper': v += 1.3 * left; break;
      case 'grounding': v += ab.n * 1.0 * CHECKINS.filter((c) => c > s.round).length; break;
      case 'turnDiscount': v += 0.9 * left * 0.7; break;
      case 'recruitDiscount': v += p.agents < MAX_AGENTS && left > 2 ? 0.8 : 0; break;
      case 'feedBonus': v += ab.n * 0.5 * left; break;
      case 'instant': v += (ab.gain ? bagTotal(ab.gain) * 1.1 : 0) + (ab.objective ? 2.5 : 0) + (ab.tempAgent ? 1.6 : 0); break;
      case 'tollProof': v += 0.35 * left; break;
      case 'pawnRate': v += 0.6; break;
      case 'final': {
        if (ab.per === 'type') v += ab.n * (1 + p.allies.filter((id) => brainrot(id).type === ab.type).length);
        else if (ab.per === 'lowAlly') v += ab.n * (1 + p.allies.filter((id) => brainrot(id).strength <= 2).length);
        else v += ab.n * (p.agents + p.rookies + 0.5);
        break;
      }
    }
  }
  // secret objectives this ally helps
  for (const o of p.objectives) {
    const withAlly = { ...p, allies: [...p.allies, b.id] };
    v += (objectiveValue(withAlly, o) - objectiveValue(p, o)) * 0.9;
  }
  return v;
}

function spaceValue(s: GameState, p: Player, space: SpaceId, v: Record<Res, number>): { score: number; slot?: number; res?: Res } {
  const left = roundsLeft(s);
  const boosts: Bag = {};
  for (const id of p.allies) {
    const ab = brainrot(id).ability;
    if (ab?.k === 'boost' && ab.space === space) for (const r of RES) boosts[r] = (boosts[r] ?? 0) + (ab.gain[r] ?? 0);
  }
  const extra = bagValue(boosts, v);
  const costV = (slot?: number) => bagValue(spaceCost(s, p, space, slot), v);
  switch (space) {
    case 'grass': case 'coolant': case 'copper': case 'pcb': case 'glitter':
      return { score: bagValue(s.spaces[space].pile, v) + extra - costV() };
    case 'lookout':
      return { score: v.grass + 0.7 + extra - costV() };
    case 'redteam':
      return { score: v.pcb + v.coolant + extra - costV() };
    case 'oddjobs': {
      const best = [...RES].sort((a, b) => v[b] - v[a])[0];
      return { score: v[best] + extra - 0.1, res: best };
    }
    case 'pawn': {
      const surplus = RES.reduce((a, r) => a + Math.max(0, p.res[r] - 2), 0);
      return { score: surplus >= 3 ? 1.6 : surplus >= 2 ? 0.8 : 0.1 };
    }
    case 'deprogram': case 'backdoor': {
      let best = { score: -Infinity, slot: undefined as number | undefined };
      s.market.forEach((id, slot) => {
        if (!id) return;
        const cost = spaceCost(s, p, space, slot);
        if (!canAfford(p, cost)) return;
        const sc = allyValue(s, p, BRAINROT[id]) - bagValue(cost, v) * 0.75 + 0.8;
        if (sc > best.score) best = { score: sc, slot };
      });
      return best;
    }
    case 'recruit': case 'safehouse': {
      if (p.agents + p.rookies >= MAX_AGENTS) return { score: -Infinity };
      return { score: (left - 1) * 1.7 + 2 - costV() };
    }
    case 'archive':
      return { score: 1 + (left / ROUNDS) * 3 };
    case 'hijack': case 'pirate': {
      const bonus = p.allies.reduce((a, id) => a + (brainrot(id).ability?.k === 'feedBonus' ? (brainrot(id).ability as { n: number }).n : 0), 0);
      const pts = (space === 'hijack' ? 2 + (s.round + 1) : 3) + bonus;
      return { score: pts - costV() * 0.8 + extra };
    }
  }
}

function chooseObjective(s: GameState, p: Player, options: ObjectiveId[]): ObjectiveId {
  // pick the one we're closest to, with a nudge toward bigger payoffs
  const potential = (o: ObjectiveId) => {
    const now = objectiveValue(p, o);
    const easy: Record<string, number> = { neverhungry: 4, packrat: 3, underdogs: 4, glamsquad: 4, coppercrew: 4, fullcell: 3, onair: 3, variety: 2 };
    return now + (easy[o] ?? 3) + Math.random();
  };
  return [...options].sort((a, b) => potential(b) - potential(a))[0];
}

export function botAnswer(s: GameState): Answer {
  const pr = s.prompt!;
  const p = s.players[pr.player];
  switch (pr.type) {
    case 'objective':
      return { type: 'objective', keep: chooseObjective(s, p, pr.options) };
    case 'pawn': {
      const v = resValues(s, p);
      const need = p.allies.some((id) => brainrot(id).ability?.k === 'pawnRate') ? 1 : 2;
      const give: Res[] = [];
      const pool = { ...p.res };
      for (let i = 0; i < need; i++) {
        const r = [...RES].filter((x) => pool[x] > 0).sort((a, b) => pool[b] * 0.4 - v[b] - (pool[a] * 0.4 - v[a]))[0];
        if (!r) break;
        give.push(r);
        pool[r]--;
      }
      const get = [...RES].sort((a, b) => v[b] - v[a])[0];
      const lose = give.reduce((a, r) => a + v[r], 0);
      if (give.length < need || v[get] <= lose * 0.85 || give.includes(get)) return { type: 'pawn', done: true };
      return { type: 'pawn', give, get };
    }
    case 'place': {
      const v = resValues(s, p);
      let best: { score: number; ans: Answer } = { score: -Infinity, ans: { type: 'place', space: 'oddjobs', res: 'grass' } };
      for (const def of SPACES) {
        const helpers = helperIndexes(p, def.district);
        const helper = helpers.find((h) => canPlace(s, p, def.id, { helper: h }).ok);
        if (helper === undefined && !canPlace(s, p, def.id).ok) continue;
        const sv = spaceValue(s, p, def.id, v);
        if (sv.score === -Infinity) continue;
        if ((def.id === 'deprogram' || def.id === 'backdoor') && sv.slot === undefined) continue;
        // a helper shift doesn't use up an agent
        const score = sv.score + (helper !== undefined ? 0.6 : 0) + Math.random() * 0.25;
        if (score > best.score) best = { score, ans: { type: 'place', space: def.id, helper, slot: sv.slot, res: sv.res } };
      }
      if (best.ans.type === 'place' && best.ans.space === 'oddjobs' && !best.ans.res) best.ans.res = 'grass';
      return best.ans;
    }
  }
}
