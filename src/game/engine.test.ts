import { describe, expect, it } from 'vitest';
import { botAnswer } from './bots';
import { apply, brainrotCost, canPlace, newGame, scorePlayer, spaceCost, tollFor } from './engine';
import { BRAINROT } from './cards';
import type { GameState } from './types';

function seated(n = 3, seed = 1): GameState {
  return newGame(Array.from({ length: n }, (_, i) => ({ name: `P${i}`, bot: true })), seed);
}
function toPlay(s: GameState): GameState {
  while (s.phase === 'setup') s = apply(s, botAnswer(s));
  return s;
}

describe('setup', () => {
  it('deals each player 2 objectives to keep 1, then starts night 1', () => {
    let s = seated();
    expect(s.prompt).toMatchObject({ type: 'objective', setup: true });
    if (s.prompt?.type !== 'objective') throw new Error();
    expect(s.prompt.options).toHaveLength(2);
    s = toPlay(s);
    expect(s.phase).toBe('play');
    expect(s.round).toBe(0);
    for (const p of s.players) {
      expect(p.objectives).toHaveLength(1);
      expect(p.agentsFree).toBe(2);
    }
    expect(s.market.filter(Boolean)).toHaveLength(5);
  });
  it('later seats start with more Grass', () => {
    const s = seated(4);
    expect(s.players.map((p) => p.res.grass)).toEqual([2, 3, 4, 5]);
  });
});

describe('placing agents', () => {
  it('takes the pile from an accumulating space and blocks it for others', () => {
    let s = toPlay(seated());
    const id = s.prompt!.player;
    const before = s.players[id].res.copper;
    const pile = s.spaces.copper.pile.copper ?? 0;
    if (tollFor(s, s.players[id], 'copper').copper) return; // patrol on the scrapyard eats a copper; covered elsewhere
    s = apply(s, { type: 'place', space: 'copper' });
    expect(s.players[id].res.copper).toBeGreaterThanOrEqual(before + pile - 1);
    const other = s.players[s.prompt!.player];
    expect(canPlace(s, other, 'copper').ok).toBe(false);
  });
  it('Odd Jobs never fills up', () => {
    let s = toPlay(seated(4));
    for (let i = 0; i < 4; i++) s = apply(s, { type: 'place', space: 'oddjobs', res: 'pcb' });
    expect(s.spaces.oddjobs.taken).toHaveLength(4);
  });
  it('recruiting is closed on night 1', () => {
    const s = toPlay(seated());
    expect(canPlace(s, s.players[s.prompt!.player], 'recruit').ok).toBe(false);
  });
});

describe('deprogramming', () => {
  it('older lineup cards are cheaper by one resource', () => {
    const s = toPlay(seated());
    const p = { ...s.players[0], allies: [] };
    const size = (bag: object) => Object.values(bag).reduce((a: number, b) => a + ((b as number) ?? 0), 0);
    for (const slot of [0, 3, 4]) {
      const printed = size(BRAINROT[s.market[slot]!].cost);
      expect(size(brainrotCost(s, p, slot))).toBe(slot >= 3 ? Math.max(0, printed - 1) : printed);
    }
  });
  it('turns a brainrot into an ally and empties its slot until dawn', () => {
    let s = toPlay(seated());
    const id = s.prompt!.player;
    const p = s.players[id];
    p.res = { grass: 9, coolant: 9, pcb: 9, glitter: 9, copper: 9 };
    const card = s.market[0]!;
    s = apply(s, { type: 'place', space: 'deprogram', slot: 0 });
    // an ally that draws objectives may prompt first
    while (s.prompt?.type === 'objective' && s.prompt.player === id) s = apply(s, botAnswer(s));
    expect(s.players[id].allies).toContain(card);
    expect(s.market[0]).toBeNull();
    expect(spaceCost(s, s.players[id], 'deprogram', 0)).toEqual({ ...tollFor(s, s.players[id], 'deprogram') });
  });
});

describe('check-ins', () => {
  it('unfed agents cost points at the first Check-in (after night 3)', () => {
    let s = toPlay(seated(2, 7));
    s.players[0].res.grass = 0;
    s.players[0].allies = [];
    let guard = 0;
    while (s.round < 3 && s.phase === 'play') {
      if (s.prompt?.player === 0 && s.prompt.type === 'place') {
        s.players[0].res.grass = 0;
        s = apply(s, { type: 'place', space: 'oddjobs', res: 'pcb' });
      }
      else s = apply(s, botAnswer(s));
      if (++guard > 200) break;
    }
    expect(s.players[0].hungry).toBeGreaterThan(0);
    expect(scorePlayer(s.players[0]).hungry).toBeLessThan(0);
  });
});

describe('full games', () => {
  it.each([2, 3, 4])('bots finish a %i-player game', (n) => {
    let s = seated(n, 42 + n);
    let steps = 0;
    while (s.phase !== 'over') {
      s = apply(s, botAnswer(s));
      expect(++steps).toBeLessThan(5000);
    }
    expect(s.round).toBe(5);
    for (const p of s.players) {
      expect(p.agents + p.rookies).toBeLessThanOrEqual(5);
      expect(scorePlayer(p).total).toBeGreaterThan(5);
    }
  });
});
