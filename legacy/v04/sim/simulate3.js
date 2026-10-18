// Balance simulation for Reclamation (engine v0.4): node sim/simulate3.js [games] [players]
const E = require('../src/engine3.js');
const games = +process.argv[2] || 300, np = +process.argv[3] || 4;
const by = (acts, t) => acts.filter(a => a.type === t);
function reclaimInward(S, acts) { const r = by(acts, 'reclaim'); if (!r.length) return null; return r.sort((a, b) => S.tiles[a.tile].ring - S.tiles[b.tile].ring)[0]; }
function tradeFor(S, p, acts, want) { return by(acts, 'trade').find(a => a.get === want && p.res[want] === 0) || null; }
const BOTS = {
  random: (S, p, acts) => acts[Math.floor(Math.random() * acts.length)],
  rusher: (S, p, acts) => by(acts, 'use_relic')[0] || by(acts, 'play_card')[0] || reclaimInward(S, acts) || tradeFor(S, p, acts, 'grass') || tradeFor(S, p, acts, 'bricks') || tradeFor(S, p, acts, 'gpu') || acts.find(a => a.type === 'end_turn'),
  builder: (S, p, acts) => by(acts, 'play_card')[0] || by(acts, 'build').sort((a, b) => ['capital', 'commune', 'camp'].indexOf(a.what) - ['capital', 'commune', 'camp'].indexOf(b.what))[0] || reclaimInward(S, acts) || by(acts, 'buy_card')[0] || tradeFor(S, p, acts, 'bricks') || acts.find(a => a.type === 'end_turn'),
  balanced: (S, p, acts) => {
    const owned = E.ownedTiles(S, p); const exposed = owned.filter(t => t.id !== p.home && E.GEO.adj[t.id].some(a => S.tiles[a].rotted) && E.tileDefense(S, t) < E.spreadPower(S));
    const relic = by(acts, 'use_relic').find(a => !E.RELIC_BY_ID[a.relic].text.includes('Slop die') || S.tide < 12); if (relic) return relic;
    const card = by(acts, 'play_card')[0]; if (card) return card;
    if (exposed.length) { const b = by(acts, 'build').find(a => a.what === 'camp' && exposed.some(t => t.id === a.tile)); if (b) return b; const g = by(acts, 'touch_grass').find(a => exposed.some(t => t.id === a.tile)); if (g && p.res.grass > 1) return g; }
    const r = reclaimInward(S, acts); if (r && (owned.length < 3 || Math.random() < 0.6)) return r;
    const up = by(acts, 'build').find(a => a.what !== 'camp'); if (up) return up;
    if (r) return r;
    return by(acts, 'buy_card')[0] || tradeFor(S, p, acts, 'grass') || tradeFor(S, p, acts, 'bricks') || acts.find(a => a.type === 'end_turn');
  },
};
const names = Object.keys(BOTS);
const st = { ends: {}, wins: {}, rounds: [], tide: [], luc: {}, relicUses: 0, aiUses: 0, rotLost: 0, reclaims: 0, tides: 0, held: 0 };
names.forEach(n => { st.wins[n] = 0; st.luc[n] = []; });
for (let g = 0; g < games; g++) {
  const bots = names.slice(0, np).sort(() => Math.random() - 0.5);
  const S = E.newGame(bots, g); let guard = 0;
  while (!S.gameOver && guard++ < 20000) { const p = E.currentPlayer(S); const acts = E.legalActions(S); let a = BOTS[p.name](S, p, acts) || acts[acts.length - 1]; let r = E.act(S, a); if (!r.ok) { r = E.act(S, acts.find(x => x.type === 'end_turn')); if (!r.ok) throw new Error(r.msg); } S.privateQueue.length = 0; }
  if (guard >= 20000) throw new Error('stuck');
  st.ends[S.gameOver.reason] = (st.ends[S.gameOver.reason] || 0) + 1; st.wins[S.players[S.gameOver.winner].name]++;
  st.rounds.push(S.round); st.tide.push(S.tide); S.players.forEach(p => st.luc[p.name].push(E.lucidity(S, p)));
  st.relicUses += S.stats.relicUses; st.aiUses += S.stats.aiRelicUses; st.rotLost += S.stats.rotLost; st.reclaims += S.stats.reclaims; st.tides += S.stats.tides.length; st.held += S.stats.tides.filter(t => t.held).length;
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`games=${games} players=${np} | endings:`, st.ends);
console.log(`avg rounds=${avg(st.rounds)} avg final tide=${avg(st.tide)} | per game: reclaims ${(st.reclaims / games).toFixed(1)}, tiles lost to rot ${(st.rotLost / games).toFixed(1)}, relic uses ${(st.relicUses / games).toFixed(1)} (AI ${(st.aiUses / games).toFixed(1)}), tides held ${st.held}/${st.tides}`);
names.slice(0, np).forEach(n => console.log(`${n.padEnd(9)} wins=${st.wins[n]} avgLucidity=${avg(st.luc[n])}`));
