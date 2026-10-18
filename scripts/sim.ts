// Bot-vs-bot balance run: npm run sim -- [games] [players]
import { botAnswer } from '../src/game/bots';
import { BRAINROT } from '../src/game/cards';
import { apply, newGame, standings } from '../src/game/engine';
import type { GameState } from '../src/game/types';

const games = Number(process.argv[2] ?? 200);
const players = Number(process.argv[3] ?? 3);

export function playOut(seed: number, n: number): GameState {
  let s = newGame(Array.from({ length: n }, (_, i) => ({ name: `Bot${i}`, bot: true })), seed);
  let steps = 0;
  while (s.phase !== 'over') {
    if (++steps > 5000) throw new Error('stuck');
    s = apply(s, botAnswer(s));
  }
  return s;
}

const tot: Record<string, number> = {};
const seatWins = Array(players).fill(0);
const allyCount: Record<string, number> = {};
const allyWin: Record<string, number> = {};
const spaceUse: Record<string, number> = {};
let errors = 0;
let margin = 0;
let agents = 0;
let alliesPer = 0;
for (let g = 0; g < games; g++) {
  let s: GameState;
  try {
    s = playOut(1000 + g, players);
  } catch (e) {
    errors++;
    if (errors < 4) console.error(e);
    continue;
  }
  const st = standings(s);
  margin += st[0].sheet.total - st[1].sheet.total;
  seatWins[st[0].p.id]++;
  for (const { p, sheet } of st) {
    for (const [k, v] of Object.entries(sheet)) tot[k] = (tot[k] ?? 0) + v;
    agents += p.agents + p.rookies;
    alliesPer += p.allies.length;
    for (const id of p.allies) {
      allyCount[id] = (allyCount[id] ?? 0) + 1;
      if (p === st[0].p) allyWin[id] = (allyWin[id] ?? 0) + 1;
    }
  }
  for (const l of s.log) {
    const m = l.msg.match(/: ([A-Z][\w-]+(?: [\w-]+)*), \+/);
    if (m) spaceUse[m[1]] = (spaceUse[m[1]] ?? 0) + 1;
  }
}
const ok = games - errors;
const per = (x: number) => (x / (ok * players)).toFixed(1);
console.log(`${ok}/${games} games OK, ${players} players. Avg winning margin ${(margin / ok).toFixed(1)}`);
console.log('Avg score breakdown per player:', Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, per(v)])));
console.log(`Avg agents at end ${per(agents)}, allies ${per(alliesPer)}`);
console.log('Wins by seat:', seatWins.map((w) => `${((100 * w) / ok).toFixed(0)}%`).join(' '));
const rate = Object.entries(allyCount).map(([id, n]) => ({ id, n, w: (allyWin[id] ?? 0) / n })).sort((a, b) => b.w - a.w);
console.log('Ally win-rate (top):', rate.slice(0, 5).map((r) => `${BRAINROT[r.id].name} ${(r.w * 100).toFixed(0)}%/${r.n}`).join(', '));
console.log('Ally win-rate (bottom):', rate.slice(-5).map((r) => `${BRAINROT[r.id].name} ${(r.w * 100).toFixed(0)}%/${r.n}`).join(', '));
console.log('Least taken:', Object.entries(allyCount).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([id, n]) => `${BRAINROT[id].name} ${n}`).join(', '));
