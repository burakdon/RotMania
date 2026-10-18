// Headless balance simulation: node sim/simulate.js [games] [players]
const E = require('../src/engine.js');
const games = +process.argv[2] || 300, np = +process.argv[3] || 4;

// bot strategies
const BOTS = {
  random: (S, acts) => acts[Math.floor(Math.random() * acts.length)],
  racer: (S, acts) => acts.find(a => a.type === 'build' && E.CARD_BY_ID[S.market[a.slot]].type === 'D')
    || acts.find(a => a.type === 'build' && E.CARD_BY_ID[S.market[a.slot]].type === 'I') || acts.find(a => a.type === 'produce'),
  safe: (S, acts) => acts.find(a => a.type === 'build' && E.CARD_BY_ID[S.market[a.slot]].type === 'S')
    || acts.find(a => a.type === 'build' && E.CARD_BY_ID[S.market[a.slot]].type === 'I') || acts.find(a => a.type === 'fund') || acts.find(a => a.type === 'produce'),
  balanced: (S, acts) => {
    const shown = E.shownTrack(S);
    const prefer = shown >= 24 ? ['S', 'I', 'C'] : S.track >= 14 ? ['I', 'S', 'D', 'C'] : ['D', 'I', 'C', 'S'];
    for (const t of prefer) { const a = acts.find(a => a.type === 'build' && E.CARD_BY_ID[S.market[a.slot]].type === t); if (a) return a; }
    if (shown >= 26) { const d = acts.find(a => a.type === 'decommission'); if (d) return d; }
    return acts.find(a => a.type === 'produce');
  },
};
const names = Object.keys(BOTS);
const stats = { sunk: 0, ai: 0, survived: 0, wins: {}, sunkBy: {}, scores: {}, finalTrack: [], rot: [], traits: 0, incidentsContained: 0, incidents: 0 };
names.forEach(n => { stats.wins[n] = 0; stats.sunkBy[n] = 0; stats.scores[n] = []; });
for (let g = 0; g < games; g++) {
  const bots = names.slice(0, np).sort(() => Math.random() - 0.5);
  const S = E.newGame(bots, g);
  let guard = 0;
  while (!S.gameOver && guard++ < 10000) {
    const p = E.currentPlayer(S); const acts = E.legalActions(S);
    const a = BOTS[p.name](S, acts) || acts[acts.length - 1];
    const r = E.act(S, a); if (!r.ok) throw new Error(r.msg);
    S.privateQueue.length = 0;
  }
  if (guard >= 10000) throw new Error('stuck');
  stats[S.gameOver.reason]++;
  if (S.gameOver.sunkBy != null) stats.sunkBy[S.players[S.gameOver.sunkBy].name]++;
  if (S.winner != null) stats.wins[S.players[S.winner].name]++;
  S.players.forEach((p, i) => stats.scores[p.name].push(S.scores[i].total));
  stats.finalTrack.push(S.track); stats.rot.push(S.rot); stats.traits += S.traits.length;
  S.stats.incidents.forEach(i => { stats.incidents++; if (i.contained) stats.incidentsContained++; });
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`games=${games} players=${np}`);
console.log(`endings: sunk=${stats.sunk} ai=${stats.ai} survived=${stats.survived}`);
console.log(`avg final track=${avg(stats.finalTrack)} avg rot=${avg(stats.rot)} avg traits=${(stats.traits / games).toFixed(1)} incidents contained ${stats.incidentsContained}/${stats.incidents}`);
names.slice(0, np).forEach(n => console.log(`${n.padEnd(9)} wins=${stats.wins[n]} sunk=${stats.sunkBy[n]} avgScore=${avg(stats.scores[n])}`));
