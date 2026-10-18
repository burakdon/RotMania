// Balance simulation for engine v2: node sim/simulate2.js [games] [players]
const E = require('../src/engine2.js');
const games = +process.argv[2] || 300, np = +process.argv[3] || 4;
const C = id => E.CARD_BY_ID[id];
function placeOf(S, acts, types) { for (const t of types) { const a = acts.find(a => a.type === 'place' && C(S.market[a.slot]).type === t); if (a) return a; } return null; }
function bestRow(S, p, prefer) { for (const t of prefer) if (p.rows[t].length >= 1) return { type: 'row', row: t }; return { type: 'row', row: 'I' }; }
const BOTS = {
  random: (S, p, acts) => acts[Math.floor(Math.random() * acts.length)],
  racer: (S, p, acts) => placeOf(S, acts, ['D', 'I']) || bestRow(S, p, ['D', 'I']),
  safe: (S, p, acts) => placeOf(S, acts, ['O', 'I', 'C']) || bestRow(S, p, ['O', 'I', 'C']),
  balanced: (S, p, acts) => {
    const shown = E.shownTrack(S);
    const prefer = shown >= 24 ? ['O', 'I', 'C'] : S.track >= 14 ? ['I', 'O', 'D', 'C'] : ['D', 'I', 'C', 'O'];
    if (shown >= 26 && p.rows.D.length >= 2) { const d = acts.find(a => a.type === 'decommission'); if (d) return d; }
    const n = E.allCards(p).length;
    // alternate: place when affordable and few cards, else activate best row
    if (n < 8 || Math.random() < 0.4) { const pl = placeOf(S, acts, prefer); if (pl) return pl; }
    const rows = ['I', 'D', 'O', 'C'].sort((a, b) => p.rows[b].length - p.rows[a].length);
    if (shown >= 26 && p.rows.O.length) return { type: 'row', row: 'O' };
    return bestRow(S, p, rows);
  },
};
const names = Object.keys(BOTS);
const st = { sunk: 0, ai: 0, survived: 0, wins: {}, sunkBy: {}, scores: {}, track: [], rot: [], traits: 0, contained: 0, incidents: 0, rowActions: { I: 0, D: 0, O: 0, C: 0 }, builds: { I: 0, D: 0, O: 0, C: 0 }, cardsEnd: [] };
names.forEach(n => { st.wins[n] = 0; st.sunkBy[n] = 0; st.scores[n] = []; });
for (let g = 0; g < games; g++) {
  const bots = names.slice(0, np).sort(() => Math.random() - 0.5);
  const S = E.newGame(bots, g); let guard = 0;
  while (!S.gameOver && guard++ < 10000) { const p = E.currentPlayer(S); const acts = E.legalActions(S); const a = BOTS[p.name](S, p, acts) || acts[0]; const r = E.act(S, a); if (!r.ok) throw new Error(r.msg + JSON.stringify(a)); S.privateQueue.length = 0; }
  if (guard >= 10000) throw new Error('stuck');
  st[S.gameOver.reason]++;
  if (S.gameOver.sunkBy != null) st.sunkBy[S.players[S.gameOver.sunkBy].name]++;
  if (S.winner != null) st.wins[S.players[S.winner].name]++;
  S.players.forEach((p, i) => { st.scores[p.name].push(S.scores[i].total); st.cardsEnd.push(E.allCards(p).length); });
  st.track.push(S.track); st.rot.push(S.rot); st.traits += S.traits.length;
  S.stats.incidents.forEach(i => { st.incidents++; if (i.contained) st.contained++; });
  for (const t in st.rowActions) { st.rowActions[t] += S.stats.rowActions[t]; st.builds[t] += S.stats.builds[t]; }
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`games=${games} players=${np} | endings: sunk=${st.sunk} ai=${st.ai} survived=${st.survived}`);
console.log(`avg final pawn=${avg(st.track)} rot=${avg(st.rot)} traits=${(st.traits / games).toFixed(1)} incidents contained ${st.contained}/${st.incidents} | avg cards per nation at end=${avg(st.cardsEnd)}`);
console.log(`row actions per game: I ${(st.rowActions.I / games).toFixed(1)} D ${(st.rowActions.D / games).toFixed(1)} O ${(st.rowActions.O / games).toFixed(1)} C ${(st.rowActions.C / games).toFixed(1)} | builds: I ${(st.builds.I / games).toFixed(1)} D ${(st.builds.D / games).toFixed(1)} O ${(st.builds.O / games).toFixed(1)} C ${(st.builds.C / games).toFixed(1)}`);
names.slice(0, np).forEach(n => console.log(`${n.padEnd(9)} wins=${st.wins[n]} sunk=${st.sunkBy[n]} avgScore=${avg(st.scores[n])}`));
