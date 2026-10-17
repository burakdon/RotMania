import { botAnswer } from '../src/game/bots';
import { apply, newGame } from '../src/game/engine';
const acts: Record<string, number> = {};
let woken = 0, games = 40, n = 3, hand = 0, res = 0;
for (let g = 0; g < games; g++) {
  let s = newGame(Array.from({ length: n }, (_, i) => ({ name: `B${i}`, bot: true })), 77 + g);
  while (s.phase !== 'over') {
    const a = botAnswer(s);
    if (s.prompt!.type === 'turn') { const k = a.type === 'act' ? 'row' + (a as any).row : a.type; acts[k] = (acts[k] ?? 0) + 1; }
    s = apply(s, a);
  }
  for (const p of s.players) { woken += p.rows.flat().length; hand += p.hand.length; res += Object.values(p.res).reduce((x, y) => x + y, 0); }
}
console.log('per player: woken', (woken / games / n).toFixed(1), 'hand left', (hand / games / n).toFixed(1), 'res left', (res / games / n).toFixed(1));
console.log('turn choices per player:', Object.fromEntries(Object.entries(acts).map(([k, v]) => [k, (v / games / n).toFixed(1)])));
