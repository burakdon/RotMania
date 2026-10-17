// Bot-vs-bot balance run: npx vite-node scripts/sim.ts [games] [players]
import { botAnswer } from '../src/game/bots';
import { apply, newGame, scorePlayer, softness, standings } from '../src/game/engine';
import { CARD } from '../src/game/cards';
import type { GameState } from '../src/game/types';

const games = Number(process.argv[2] ?? 200);
const players = Number(process.argv[3] ?? 3);

export function playOut(seed: number, n: number): GameState {
  let s = newGame(Array.from({ length: n }, (_, i) => ({ name: `Bot${i}`, bot: true })), seed);
  let steps = 0;
  while (s.phase !== 'over') {
    if (++steps > 20000) throw new Error('stuck');
    s = apply(s, botAnswer(s));
  }
  return s;
}

const tot: Record<string, number> = {};
const reclWins: Record<string, [number, number]> = {};
const cardPlays: Record<string, number> = {};
const endings: Record<string, number> = {};
let errors = 0;
let totalScore = 0;
let margin = 0;
let juice = 0;
const winnerJuice: number[] = [];
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
  endings[softness(s).ending] = (endings[softness(s).ending] ?? 0) + 1;
  for (const { p, sheet } of st) {
    for (const [k, v] of Object.entries(sheet)) tot[k] = (tot[k] ?? 0) + v;
    totalScore += sheet.total;
    juice += p.juiceTaken;
    const r = (reclWins[p.reclaimer!] ??= [0, 0]);
    r[1]++;
    if (p === st[0].p) r[0]++;
    for (const sl of p.rows.flat()) cardPlays[sl.card] = (cardPlays[sl.card] ?? 0) + 1;
  }
  winnerJuice.push(st[0].p.juiceTaken);
  void scorePlayer;
}
const ok = games - errors;
const per = (x: number) => (x / (ok * players)).toFixed(1);
console.log(`${ok}/${games} games OK, ${players} players. Avg score ${per(totalScore)}, avg winning margin ${(margin / ok).toFixed(1)}`);
console.log('Avg breakdown:', Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, per(v)])));
console.log(`Avg juice per player ${per(juice)}; winners avg juice ${(winnerJuice.reduce((a, b) => a + b, 0) / ok).toFixed(1)}`);
console.log('Endings:', endings);
console.log('Reclaimer win rates (fair share ' + (100 / players).toFixed(0) + '%):');
for (const [k, [w, n]] of Object.entries(reclWins).sort((a, b) => b[1][0] / b[1][1] - a[1][0] / a[1][1]))
  console.log(`  ${k.padEnd(7)} ${((100 * w) / n).toFixed(0)}% of ${n}`);
const plays = Object.entries(cardPlays).sort((a, b) => b[1] - a[1]);
console.log('Most played:', plays.slice(0, 6).map(([k, v]) => `${CARD[k].name} ${v}`).join(', '));
console.log('Least played:', plays.slice(-6).map(([k, v]) => `${CARD[k].name} ${v}`).join(', '));
