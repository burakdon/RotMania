import { describe, expect, it } from 'vitest';
import { botAnswer } from './bots';
import { apply, canAsk, newGame, payPlan, scoreDistrict, scorePlayer } from './engine';
import type { GameState, Player } from './types';

function seated(n = 3, seed = 1): GameState {
  return newGame(Array.from({ length: n }, (_, i) => ({ name: `P${i}`, bot: true })), seed);
}
function toPlay(s: GameState): GameState {
  while (s.prompt?.type === 'setup') s = apply(s, botAnswer(s));
  return s;
}
function blank(p: Player) {
  p.res = { grass: 0, bread: 0, vinyl: 0, yarn: 0, paper: 0, juice: 0 };
  p.rows = [[], [], []];
  p.soft = [0, 0, 0];
  p.hand = [];
}

describe('setup', () => {
  it('asks every player to choose, then starts season 1', () => {
    const s = toPlay(seated());
    expect(s.phase).toBe('play');
    expect(s.prompt?.type).toBe('turn');
    for (const p of s.players) {
      expect(p.reclaimer).not.toBeNull();
      expect(p.actionsLeft).toBe(8);
    }
  });
  it('rejects keeping more than 5 things', () => {
    const s = seated();
    const p = s.players[0];
    expect(() => apply(s, { type: 'setup', reclaimer: p.reclaimerOptions[0], keepCards: p.offer!.cards, keepRes: ['grass'] })).toThrow();
  });
});

describe('paying', () => {
  it('uses exact resources, then Juice, then 2-for-1', () => {
    const s = toPlay(seated());
    const p = s.players[0];
    blank(p);
    p.res.grass = 1;
    p.res.bread = 2;
    expect(payPlan(p, ['grass', 'vinyl'], 0)?.pay).toMatchObject({ grass: 1, bread: 2 });
    p.res.juice = 1;
    expect(payPlan(p, ['grass', 'vinyl'], 0)?.pay).toMatchObject({ grass: 1, juice: 1, bread: 0 });
    expect(payPlan(p, ['vinyl', 'vinyl', 'vinyl'], 0)).toBeNull();
  });
  it('charges crafts by column', () => {
    const s = toPlay(seated());
    const p = s.players[0];
    blank(p);
    p.res.grass = 5;
    p.rows[0] = [{ card: 'carotina', crafts: 0, stash: 0, lore: 0 }, { card: 'onigiri', crafts: 0, stash: 0, lore: 0 }];
    expect(payPlan(p, ['grass'], 2)).toBeNull();
    p.rows[0][0].crafts = 1;
    expect(payPlan(p, ['grass'], 2)?.crafts).toBe(1);
  });
});

describe('Strawbaby', () => {
  it('cannot be asked before you have a brainrot to soften', () => {
    const s = toPlay(seated());
    const p = s.players[s.prompt!.player];
    blank(p);
    p.reclaimer = 'mina';
    expect(canAsk(s, p)).toBe(false);
    p.rows[0].push({ card: 'carotina', crafts: 0, stash: 0, lore: 0 });
    expect(canAsk(s, p)).toBe(true);
  });
  it('asking gives Juice and a Soft token; the Soft token switches off that row once', () => {
    let s = toPlay(seated());
    const id = s.prompt!.player;
    const p = s.players[id];
    blank(p);
    p.reclaimer = 'mina';
    p.rows[2].push({ card: 'pomodorino', crafts: 0, stash: 0, lore: 0 }); // each: draw 1
    s = apply(s, { type: 'ask' });
    expect(s.players[id].res.juice).toBe(1);
    expect(s.players[id].soft[2]).toBe(1);
    expect(s.prompt?.type).toBe('turn');
    const before = s.players[id].hand.length;
    s = apply(s, { type: 'act', row: 2 });
    // base draw of 1 still happens
    while (s.prompt?.player === id && s.prompt.type === 'draw') s = apply(s, { type: 'draw', tray: 'deck' });
    expect(s.players[id].hand.length).toBe(before + 1);
    expect(s.players[id].soft[2]).toBe(0);
  });
});

describe('districts', () => {
  it('splits tied places, rounding down', () => {
    const s = toPlay(seated(3));
    s.districts[0] = 'park';
    s.players.forEach(blank);
    s.players[0].rows[0] = [{ card: 'carotina', crafts: 0, stash: 0, lore: 0 }];
    s.players[1].rows[0] = [{ card: 'onigiri', crafts: 0, stash: 0, lore: 0 }];
    const r = scoreDistrict(s, 0);
    expect(r.scores[0]).toMatchObject({ place: 1, aura: 2 });
    expect(r.scores[1]).toMatchObject({ place: 1, aura: 2 });
    expect(r.scores[2]).toMatchObject({ place: 0, aura: 0 });
  });
});

describe('full games', () => {
  it.each([2, 3, 4])('bots finish a %i-player game with sane scores', (n) => {
    let s = seated(n, 42 + n);
    let steps = 0;
    while (s.phase !== 'over') {
      s = apply(s, botAnswer(s));
      expect(++steps).toBeLessThan(20000);
    }
    for (const p of s.players) {
      const sheet = scorePlayer(s, p);
      expect(sheet.total).toBeGreaterThan(10);
      expect(p.actionsLeft).toBe(0);
    }
    expect(s.results).toHaveLength(4);
  });
});
