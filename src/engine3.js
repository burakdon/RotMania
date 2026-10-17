/* RotMania: Reclamation — engine v0.4 (pure state, no DOM). Browser: window.Engine. Node: module.exports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  let rand = Math.random;
  function setSeed(seed) { rand = seed == null ? Math.random : mulberry32(seed); }
  function ri(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- Constants ----------
  const RES = ['grass', 'bricks', 'gpu', 'sourdough', 'aura'];
  const RES_NAME = { grass: 'Grass', bricks: 'Real Bricks', gpu: 'Vintage GPUs', sourdough: 'Sourdough', aura: 'Aura' };
  const RINGS = [1, 6, 8, 10, 12];              // ring 0 = center (Last Real Thing), ring 4 = rim (homes)
  const WIN_LUCIDITY = 10, TIDE_MAX = 20, TIDE_CHECK = [5, 10, 15];
  const RECLAIM_COST = { 4: { grass: 1 }, 3: { grass: 1, bricks: 1 }, 2: { grass: 1, bricks: 1, gpu: 1 }, 1: { grass: 2, bricks: 1, gpu: 1, aura: 1 }, 0: { grass: 2, gpu: 2, aura: 2 } };
  const BUILD_COST = { camp: { bricks: 1, sourdough: 1 }, commune: { gpu: 1, aura: 1 }, capital: { bricks: 2, gpu: 1, aura: 1, sourdough: 1 } };
  const DEFENSE = { camp: 1, commune: 2, capital: 3 };
  const LUCIDITY_BUILDING = { camp: 0, commune: 1, capital: 2 };
  const RING_LUCIDITY = { 4: 0, 3: 1, 2: 2, 1: 3, 0: 4 };
  const CARD_COST = { gpu: 1, aura: 1, sourdough: 1 };
  const ACTIONS_PER_TURN = 2;

  // Tile bag per ring: resource tiles, relic sites (R = AI relic, S = safe relic), slop pits (P)
  const BAG = {
    4: 'grass,grass,grass,bricks,bricks,sourdough,sourdough,sourdough,aura,gpu,grass,bricks'.split(','),
    3: 'grass,grass,bricks,bricks,sourdough,aura,aura,gpu,S,P'.split(','),
    2: 'grass,bricks,sourdough,aura,gpu,gpu,S,R'.split(','),
    1: 'aura,gpu,sourdough,R,R,S'.split(','),
    0: ['core'],
  };
  const RELICS = {
    safe: [
      { id: 'seed_vault', name: 'Seed Vault', text: 'Each Trend round: +1 Sourdough.', passive: 'sourdough' },
      { id: 'printing_press', name: 'Printing Press', text: '+1 Lucidity.', lucidity: 1 },
      { id: 'ham_radio', name: 'Ham Radio Net', text: 'Use (free): reveal 3 rotted tiles.', use: 'reveal3' },
      { id: 'analog_library', name: 'Analog Library', text: '+1 Lucidity. Each Trend round: +1 Grass.', lucidity: 1, passive: 'grass' },
      { id: 'water_filter', name: 'Water Filter', text: 'Your Camps count as defense 2.', campDef: 2 },
    ],
    ai: [
      { id: 'oracle', name: 'Oracle Server', text: 'Use: reveal every tile in one ring. Roll the Slop die.', use: 'revealRing' },
      { id: 'drone_depot', name: 'Autonomous Drone Depot', text: 'Use: reclaim one adjacent rotted tile for free. Roll the Slop die.', use: 'freeReclaim' },
      { id: 'recommender', name: 'Still-Running Recommender', text: 'Use: gain 3 of a trending resource. Roll the Slop die.', use: 'trend3' },
      { id: 'auto_factory', name: 'Auto-Factory', text: 'Use: build a Camp for free. Roll the Slop die.', use: 'freeCamp' },
      { id: 'deepfake_studio', name: 'Deepfake Studio', text: 'Use: gain 2 Aura and 1 Lucidity... minus 1 Lucidity at the next Tide. Roll the Slop die.', use: 'deepfake' },
    ],
  };
  const RELIC_BY_ID = Object.fromEntries([...RELICS.safe, ...RELICS.ai].map(r => [r.id, r]));
  const BUILD_CARDS = [
    { id: 'library', name: 'Library of Verified Facts', text: '+1 Lucidity.', n: 3, fx: 'lucidity' },
    { id: 'radio_tower', name: 'Analog Radio Tower', text: 'Reveal 2 rotted tiles.', n: 2, fx: 'reveal2' },
    { id: 'goat_coop', name: 'Goat Fiber Co-op', text: '+2 resources of one kind.', n: 2, fx: 'any2' },
    { id: 'firewall', name: 'Firewall Collective', text: '+1 permanent defense on one of your tiles.', n: 2, fx: 'firewall' },
    { id: 'retreat', name: 'Grass-Touching Retreat', text: 'World Grass +2 at the next Tide.', n: 2, fx: 'tideBonus' },
    { id: 'fact_checkers', name: 'Fact-Checker Militia', text: 'Cleanse: reclaim an adjacent rotted tile for free (no relic draw).', n: 2, fx: 'cleanse' },
    { id: 'modem', name: 'Vintage Modem', text: '+2 Vintage GPUs.', n: 2, fx: 'gpu2' },
  ];
  const BUILD_BY_ID = Object.fromEntries(BUILD_CARDS.map(c => [c.id, c]));
  const TRAITS = [
    { id: 'memetic', name: 'Memetic', text: 'The Slop rots one extra tile each round.' },
    { id: 'hungry', name: 'Hungry', text: 'The Slop breaks through defense 1.' },
    { id: 'persuasive', name: 'Persuasive', text: 'Scouting reports lie half the time.' },
    { id: 'viral', name: 'Viral', text: '"Slop is trending" also pushes the Tide +2.' },
  ];
  const TRAIT_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));
  const FEED = [
    ['The Slop is quiet. Analysts call it "digesting."', 'Local commune reports a tomato. A real one.', 'Survivors agree: the ring was always this size.'],
    ['The Slop posted a 40-minute apology video. It is also an ad.', 'Trending: {res}. Nobody knows why. The Slop knows why.', 'Reclaimed tile found to contain 400 identical cats.'],
    ['The Slop has learned the word "lowkey." Experts are concerned.', 'Breaking: ring {ring} is cooked fr. Sources: the Slop.', 'Your scouts report the tile is "probably sourdough (trust)."'],
    ['SKIBIDI TIDE INCOMING. GRASS LEVELS: CRITICAL.', 'The Slop would like to remind you that it is inevitable and also a girlboss.', 'gyatt the core is RIGHT THERE and bro built a radio tower'],
  ];

  // ---------- Geometry ----------
  function tileSpan(ring, idx) { const n = RINGS[ring]; return [idx * 360 / n, (idx + 1) * 360 / n]; }
  function overlaps(a, b) { return a[0] < b[1] - 1e-6 && b[0] < a[1] - 1e-6; }
  function buildAdjacency() {
    const tiles = []; const id = (r, i) => `${r}-${i}`;
    for (let r = 0; r < RINGS.length; r++) for (let i = 0; i < RINGS[r]; i++) tiles.push({ id: id(r, i), ring: r, idx: i });
    const adj = {};
    tiles.forEach(t => {
      const a = new Set();
      if (t.ring === 0) { for (let i = 0; i < RINGS[1]; i++) a.add(id(1, i)); }
      else {
        const n = RINGS[t.ring]; a.add(id(t.ring, (t.idx + 1) % n)); a.add(id(t.ring, (t.idx + n - 1) % n));
        const span = tileSpan(t.ring, t.idx);
        for (const r2 of [t.ring - 1, t.ring + 1]) { if (r2 < 0 || r2 >= RINGS.length) continue; if (r2 === 0) { a.add('0-0'); continue; } for (let j = 0; j < RINGS[r2]; j++) if (overlaps(span, tileSpan(r2, j))) a.add(id(r2, j)); }
      }
      adj[t.id] = [...a];
    });
    return { tiles, adj };
  }
  const GEO = buildAdjacency();

  // ---------- State ----------
  function newGame(names, seed) {
    setSeed(seed);
    const S = {
      version: 4, seed: seed == null ? null : seed, players: [], tiles: {}, round: 1, actor: 0, startPlayer: 0, actionsLeft: ACTIONS_PER_TURN,
      tide: 0, traits: [], trend: null, trendDeck: [], trendDiscard: [], buildDeck: [], slopDieLog: [], tideBonus: 0,
      log: [], feed: [], gameOver: null, lastSlop: null, privateQueue: [], stats: { reclaims: 0, relicUses: 0, aiRelicUses: 0, rotLost: 0, tides: [] },
    };
    // tiles
    for (let r = 0; r < RINGS.length; r++) { const bag = shuffle(BAG[r]); for (let i = 0; i < RINGS[r]; i++) { const t = bag[i % bag.length]; S.tiles[`${r}-${i}`] = { id: `${r}-${i}`, ring: r, idx: i, type: t, owner: null, rotted: true, revealed: r === 4, building: null, grass: 0, firewall: 0, relic: null, restored: false }; } }
    // relic sites get a relic id
    const safe = shuffle(RELICS.safe.map(r => r.id)), ai = shuffle(RELICS.ai.map(r => r.id));
    Object.values(S.tiles).forEach(t => { if (t.type === 'S') t.relic = safe.pop() || pick(RELICS.safe).id; if (t.type === 'R') t.relic = ai.pop() || pick(RELICS.ai).id; });
    // players on the rim, evenly spaced
    const n = names.length; const spacing = Math.floor(RINGS[4] / n);
    names.forEach((name, idx) => {
      const home = S.tiles[`4-${idx * spacing}`]; home.owner = idx; home.rotted = false; home.revealed = true; home.building = 'camp'; if (home.type === 'P') home.type = 'grass';
      S.players.push({ idx, name, res: { grass: 2, bricks: 1, gpu: 0, sourdough: 1, aura: 0 }, relics: [], cards: [], lucidityBonus: 0, signals: 0, deepfakeDebt: 0, home: home.id, scouting: [] });
    });
    S.trendDeck = shuffle(makeTrendDeck());
    S.buildDeck = shuffle(BUILD_CARDS.flatMap(c => Array(c.n).fill(c.id)));
    startRound(S);
    return S;
  }
  function makeTrendDeck() { const d = []; for (let i = 0; i < RES.length; i++) for (let j = i + 1; j < RES.length; j++) d.push({ res: [RES[i], RES[j]] }); for (let k = 0; k < 3; k++) d.push({ slop: true }); return d; }
  function log(S, msg) { S.log.push({ round: S.round, msg }); }
  function hasTrait(S, id) { return S.traits.includes(id); }
  function tideStage(S) { return TIDE_CHECK.filter(c => S.tide >= c).length; }
  function spreadPower(S) { return hasTrait(S, 'hungry') ? 2 : 1; }

  // ---------- Round flow ----------
  function startRound(S) {
    S.startPlayer = (S.round - 1) % S.players.length; S.actor = S.startPlayer; S.actionsLeft = ACTIONS_PER_TURN;
    if (!S.trendDeck.length) { S.trendDeck = shuffle(S.trendDiscard); S.trendDiscard = []; }
    S.trend = S.trendDeck.pop(); S.trendDiscard.push(S.trend);
    if (S.trend.slop) { log(S, `Round ${S.round}: SLOP IS TRENDING.`); S.tide += hasTrait(S, 'viral') ? 2 : 1; }
    else {
      log(S, `Round ${S.round}: trending — ${S.trend.res.map(r => RES_NAME[r]).join(' & ')}.`);
      Object.values(S.tiles).forEach(t => { if (t.owner != null && !t.rotted && S.trend.res.includes(t.type)) { const p = S.players[t.owner]; p.res[t.type] += 1 + (t.building ? 1 : 0); } });
    }
    S.players.forEach(p => { p.res.grass += 1; const h = S.tiles[p.home]; if (RES.includes(h.type) && !(S.trend.res || []).includes(h.type)) p.res[h.type] += 1; p.relics.forEach(id => { const r = RELIC_BY_ID[id]; if (r.passive) p.res[r.passive] += 1; }); });
  }
  function currentPlayer(S) { return S.players[S.actor]; }
  function endTurn(S) {
    const order = S.players.length; const next = (S.actor + 1) % order;
    if (next === S.startPlayer) { slopPhase(S); if (S.gameOver) return; S.round++; startRound(S); }
    else { S.actor = next; S.actionsLeft = ACTIONS_PER_TURN; }
  }

  // ---------- Helpers ----------
  function canAfford(p, cost) { return Object.keys(cost).every(k => p.res[k] >= cost[k]); }
  function pay(p, cost) { Object.keys(cost).forEach(k => { p.res[k] -= cost[k]; }); }
  function ownedTiles(S, p) { return Object.values(S.tiles).filter(t => t.owner === p.idx && !t.rotted); }
  function frontierFor(S, p) { const set = new Set(); ownedTiles(S, p).forEach(t => GEO.adj[t.id].forEach(a => { if (S.tiles[a].rotted) set.add(a); })); return [...set]; }
  function tileDefense(S, t) {
    let d = t.grass + t.firewall;
    if (t.building) { d += DEFENSE[t.building]; if (t.building === 'camp' && t.owner != null && S.players[t.owner].relics.includes('water_filter')) d += 1; }
    GEO.adj[t.id].forEach(a => { const u = S.tiles[a]; if (u.owner === t.owner && !u.rotted && u.building) d += u.building === 'capital' ? 2 : 1; });
    return d;
  }
  function lucidity(S, p) {
    let l = p.lucidityBonus + p.signals - p.deepfakeDebt;
    ownedTiles(S, p).forEach(t => { l += RING_LUCIDITY[t.ring]; if (t.building) l += LUCIDITY_BUILDING[t.building]; if (t.restored) l += 1; });
    p.relics.forEach(id => { l += RELIC_BY_ID[id].lucidity || 0; });
    return l;
  }
  function tideNeed(S) { return Math.ceil(S.tide * S.players.length * 0.6); }
  function worldGrass(S) { let g = S.tideBonus; Object.values(S.tiles).forEach(t => { if (t.owner != null && !t.rotted) g += tileDefense(S, t); }); return g; }
  function playerGrass(S, p) { let g = 0; ownedTiles(S, p).forEach(t => { g += tileDefense(S, t); }); return g; }

  // ---------- Legal actions ----------
  function legalActions(S) {
    const p = currentPlayer(S); const acts = [];
    if (S.actionsLeft > 0) {
      frontierFor(S, p).forEach(id => { const t = S.tiles[id]; if (canAfford(p, RECLAIM_COST[t.ring])) acts.push({ type: 'reclaim', tile: id }); });
      ownedTiles(S, p).forEach(t => {
        if (!t.building && canAfford(p, BUILD_COST.camp)) acts.push({ type: 'build', tile: t.id, what: 'camp' });
        if (t.building === 'camp' && canAfford(p, BUILD_COST.commune)) acts.push({ type: 'build', tile: t.id, what: 'commune' });
        if (t.building === 'commune' && canAfford(p, BUILD_COST.capital)) acts.push({ type: 'build', tile: t.id, what: 'capital' });
        if (p.res.grass >= 1) acts.push({ type: 'touch_grass', tile: t.id });
      });
      if (canAfford(p, CARD_COST) && S.buildDeck.length) acts.push({ type: 'buy_card' });
      for (const a of RES) for (const b of RES) if (a !== b && p.res[a] >= 3) acts.push({ type: 'trade', give: a, get: b });
    }
    // free: use relics (once per round each) and play cards
    p.relics.forEach(id => { const r = RELIC_BY_ID[id]; if (r.use && !(p.usedRelics || []).includes(id)) acts.push({ type: 'use_relic', relic: id }); });
    p.cards.forEach((id, i) => acts.push({ type: 'play_card', index: i }));
    acts.push({ type: 'end_turn' });
    return acts;
  }

  // ---------- Act ----------
  function act(S, a) {
    if (S.gameOver) return { ok: false, msg: 'Game over.' };
    const p = currentPlayer(S); const priv = []; let msg; let spend = true;
    switch (a.type) {
      case 'reclaim': { const t = S.tiles[a.tile]; if (!t || !t.rotted || !frontierFor(S, p).includes(a.tile)) return { ok: false, msg: 'Not reclaimable.' }; if (!canAfford(p, RECLAIM_COST[t.ring])) return { ok: false, msg: 'Cannot afford.' }; pay(p, RECLAIM_COST[t.ring]); msg = reclaimTile(S, p, t, priv); break; }
      case 'build': { const t = S.tiles[a.tile]; if (!t || t.owner !== p.idx || t.rotted) return { ok: false, msg: 'Not your tile.' }; const need = a.what === 'camp' ? !t.building : a.what === 'commune' ? t.building === 'camp' : t.building === 'commune'; if (!need || !canAfford(p, BUILD_COST[a.what])) return { ok: false, msg: 'Cannot build that here.' }; pay(p, BUILD_COST[a.what]); t.building = a.what; msg = `${p.name} built a ${a.what} on ${tileName(S, t)}.`; break; }
      case 'touch_grass': { const t = S.tiles[a.tile]; if (!t || t.owner !== p.idx || t.rotted || p.res.grass < 1) return { ok: false, msg: 'No.' }; p.res.grass--; t.grass++; msg = `${p.name} touched grass on ${tileName(S, t)} (+1 defense this round).`; break; }
      case 'buy_card': { if (!canAfford(p, CARD_COST) || !S.buildDeck.length) return { ok: false, msg: 'Cannot buy.' }; pay(p, CARD_COST); const id = S.buildDeck.pop(); p.cards.push(id); priv.push({ title: 'Build card drawn', body: BUILD_BY_ID[id].name + ' — ' + BUILD_BY_ID[id].text }); msg = `${p.name} bought a build card.`; break; }
      case 'trade': { if (p.res[a.give] < 3) return { ok: false, msg: 'Need 3.' }; p.res[a.give] -= 3; p.res[a.get] += 1; msg = `${p.name} traded 3 ${RES_NAME[a.give]} for 1 ${RES_NAME[a.get]}.`; break; }
      case 'use_relic': { spend = false; const r = RELIC_BY_ID[a.relic]; if (!p.relics.includes(a.relic) || !r.use || (p.usedRelics || []).includes(a.relic)) return { ok: false, msg: 'Cannot use.' }; p.usedRelics = (p.usedRelics || []).concat(a.relic); msg = useRelic(S, p, r, a, priv); if (msg === null) return { ok: false, msg: 'No valid target.' }; break; }
      case 'play_card': { spend = false; const id = p.cards[a.index]; if (!id) return { ok: false, msg: 'No card.' }; const res = playCard(S, p, BUILD_BY_ID[id], a, priv); if (res === null) return { ok: false, msg: 'No valid target for that card.' }; p.cards.splice(a.index, 1); msg = res; break; }
      case 'end_turn': { spend = false; msg = `${p.name} ends turn.`; log(S, msg); checkWin(S, p); if (S.gameOver) return { ok: true, msg, private: priv }; p.usedRelics = []; endTurn(S); return { ok: true, msg, private: priv }; }
      default: return { ok: false, msg: 'Unknown action.' };
    }
    if (spend) S.actionsLeft--;
    log(S, msg); checkWin(S, p);
    if (!S.gameOver && S.actionsLeft <= 0 && !legalActions(S).some(x => x.type === 'use_relic' || x.type === 'play_card')) { p.usedRelics = []; endTurn(S); }
    return { ok: true, msg, private: priv };
  }
  function tileName(S, t) { return t.ring === 0 ? 'the Last Real Thing' : `ring ${t.ring} tile ${t.idx + 1}${t.revealed ? ' (' + (RES_NAME[t.type] || typeLabel(t.type)) + ')' : ''}`; }
  function typeLabel(ty) { return { S: 'relic site', R: 'AI relic site', P: 'slop pit', core: 'the Last Real Thing' }[ty] || ty; }
  function reclaimTile(S, p, t, priv) {
    t.rotted = false; t.owner = p.idx; t.revealed = true; t.grass = 0; t.fresh = S.round; S.stats.reclaims++;
    let msg = `${p.name} reclaimed ${tileName(S, t)}.`;
    if (t.type === 'P') msg += ' It is a slop pit: it produces nothing, but it holds the line.';
    if ((t.type === 'S' || t.type === 'R') && t.relic && !t.restored) { const r = RELIC_BY_ID[t.relic]; p.relics.push(t.relic); t.restored = true; msg += ` Found ${t.type === 'R' ? 'an AI relic' : 'a relic'}: ${r.name} (${r.text})`; }
    if (t.ring === 0) msg += ' THE LAST REAL THING IS IN THEIR HANDS. Hold it through one Slop phase while the world holds.';
    return msg;
  }
  function slopDie(S, p, ev) {
    const d = ri(1, 6); S.stats.aiRelicUses++; let out;
    if (d <= 2) out = 'nothing happens';
    else if (d <= 4) { S.tide += 1; out = 'Tide +1'; }
    else if (d === 5) { const cand = ownedTiles(S, p).filter(t => tileDefense(S, t) < spreadPower(S) && t.ring !== 4 || (ownedTiles(S, p).length > 1 && t.id !== p.home && tileDefense(S, t) === 0)); const t = cand.length ? pick(cand) : null; if (t) { rotTile(S, t); out = `the Slop takes ${tileName(S, t)}`; } else { S.tide += 1; out = 'Tide +1'; } }
    else { evolve(S); out = 'the Slop evolves'; }
    S.slopDieLog.push({ round: S.round, player: p.idx, die: d, out }); return `Slop die ${d}: ${out}.`;
  }
  function useRelic(S, p, r, a, priv) {
    S.stats.relicUses++; let msg = `${p.name} uses ${r.name}: `;
    switch (r.use) {
      case 'reveal3': msg += reveal(S, p, 3, priv); break;
      case 'revealRing': { const ring = a.ring != null ? a.ring : (ownedTiles(S, p).reduce((m, t) => Math.min(m, t.ring), 4) - 1); const rr = Math.max(0, ring); const lines = []; Object.values(S.tiles).filter(t => t.ring === rr && t.rotted).forEach(t => { const truth = RES_NAME[t.type] || typeLabel(t.type); const lie = hasTrait(S, 'persuasive') && rand() < 0.5; const said = lie ? (RES_NAME[pick(RES)]) : truth; p.scouting.push({ tile: t.id, said, round: S.round }); lines.push(`${t.id}: ${said}`); }); priv.push({ title: `Oracle Server — ring ${rr}`, body: lines.join(' · ') || 'nothing rotted there' }); msg += `scanned ring ${rr}. ` + slopDie(S, p); break; }
      case 'freeReclaim': { const f = frontierFor(S, p); const id = a.tile && f.includes(a.tile) ? a.tile : f.sort((x, y) => S.tiles[x].ring - S.tiles[y].ring)[0]; if (!id) return null; msg += reclaimTile(S, p, S.tiles[id], priv) + ' ' + slopDie(S, p); break; }
      case 'trend3': { const res = S.trend && !S.trend.slop ? (a.res && S.trend.res.includes(a.res) ? a.res : S.trend.res[0]) : 'sourdough'; p.res[res] += 3; msg += `+3 ${RES_NAME[res]}. ` + slopDie(S, p); break; }
      case 'freeCamp': { const t = a.tile ? S.tiles[a.tile] : ownedTiles(S, p).find(t => !t.building); if (!t || t.owner !== p.idx || t.building || t.rotted) return null; t.building = 'camp'; msg += `free camp on ${tileName(S, t)}. ` + slopDie(S, p); break; }
      case 'deepfake': p.res.aura += 2; p.lucidityBonus += 1; p.deepfakeDebt += 1; msg += '+2 Aura, +1 Lucidity now, −1 at the next Tide. ' + slopDie(S, p); break;
    }
    return msg;
  }
  function reveal(S, p, n, priv) {
    const cand = Object.values(S.tiles).filter(t => t.rotted && !t.revealed); const chosen = shuffle(cand).slice(0, n); const lines = [];
    chosen.forEach(t => { const truth = RES_NAME[t.type] || typeLabel(t.type); const lie = hasTrait(S, 'persuasive') && rand() < 0.5; const said = lie ? RES_NAME[pick(RES)] : truth; p.scouting.push({ tile: t.id, said, round: S.round }); lines.push(`ring ${t.ring} tile ${t.idx + 1}: ${said}`); });
    priv.push({ title: 'Scouting report' + (hasTrait(S, 'persuasive') ? ' (the Slop is Persuasive: may lie)' : ''), body: lines.join(' · ') || 'nothing left to reveal' });
    return `scouted ${chosen.length} tiles.`;
  }
  function playCard(S, p, c, a, priv) {
    let msg = `${p.name} plays ${c.name}: `;
    switch (c.fx) {
      case 'lucidity': p.lucidityBonus += 1; msg += '+1 Lucidity.'; break;
      case 'reveal2': msg += reveal(S, p, 2, priv); break;
      case 'any2': { const r = a.res || RES.reduce((b, k) => p.res[k] < p.res[b] ? k : b, 'grass'); p.res[r] += 2; msg += `+2 ${RES_NAME[r]}.`; break; }
      case 'firewall': { const t = a.tile ? S.tiles[a.tile] : ownedTiles(S, p).sort((x, y) => tileDefense(S, x) - tileDefense(S, y))[0]; if (!t || t.owner !== p.idx) return null; t.firewall += 1; msg += `firewall on ${tileName(S, t)}.`; break; }
      case 'tideBonus': S.tideBonus += 2; msg += 'world Grass +2 at the next Tide.'; break;
      case 'cleanse': { const f = frontierFor(S, p); const id = a.tile && f.includes(a.tile) ? a.tile : f.sort((x, y) => S.tiles[x].ring - S.tiles[y].ring)[0]; if (!id) return null; const t = S.tiles[id]; t.rotted = false; t.owner = p.idx; t.revealed = true; t.fresh = S.round; S.stats.reclaims++; msg += `cleansed ${tileName(S, t)}.`; break; }
      case 'gpu2': p.res.gpu += 2; msg += '+2 Vintage GPUs.'; break;
    }
    return msg;
  }

  // ---------- Slop phase ----------
  function rotTile(S, t) { t.rotted = true; t.building = null; t.grass = 0; t.firewall = 0; t.owner = null; S.stats.rotLost++; }
  function evolve(S) { const avail = TRAITS.filter(t => !S.traits.includes(t.id)); if (!avail.length) return null; const t = pick(avail); S.traits.push(t.id); log(S, `The Slop evolves: ${t.name}.`); return t.id; }
  function slopPhase(S) {
    const rep = { round: S.round, tideBefore: S.tide, rotted: [], tide: null, evolved: null, feed: [], coreHeld: null };
    S.lastSlop = rep;
    S.tide += 1;
    // rot spreads: frontier tiles (reclaimed, adjacent to rot) with defense < power; the Slop chooses up to N
    const power = spreadPower(S); const N = 1 + (tideStage(S) >= 2 ? 1 : 0) + (hasTrait(S, 'memetic') ? 1 : 0) + (S.trend && S.trend.slop ? 1 : 0);
    const cand = Object.values(S.tiles).filter(t => t.owner != null && !t.rotted && t.id !== S.players[t.owner].home && t.fresh !== S.round && GEO.adj[t.id].some(a => S.tiles[a].rotted) && tileDefense(S, t) < power);
    shuffle(cand).slice(0, N).forEach(t => { rep.rotted.push({ tile: t.id, owner: t.owner, name: tileName(S, t) }); rotTile(S, t); });
    if (rep.rotted.length) log(S, `The Slop spreads: ${rep.rotted.map(x => S.players[x.owner].name + "'s " + x.name).join(', ')}.`);
    // core hold check: a player who still owns the core after the spread wins if the world holds
    const core = S.tiles['0-0'];
    if (core.owner != null && !core.rotted) { const wg = worldGrass(S); rep.coreHeld = { player: core.owner, worldGrass: wg, tide: S.tide, need: tideNeed(S) }; if (wg >= tideNeed(S)) { S.gameOver = { reason: 'sanity', winner: core.owner }; log(S, `${S.players[core.owner].name} held the Last Real Thing while the world held (Grass ${wg} ≥ Tide ${S.tide}). PRE-ROT SANITY RESTORED.`); } }
    // grass tokens expire
    Object.values(S.tiles).forEach(t => { t.grass = 0; });
    // tide check
    for (const c of TIDE_CHECK) if (S.tide >= c && !S.stats.tides.some(x => x.at === c)) {
      const wg = worldGrass(S); const need = tideNeed(S); const held = wg >= need; const tideRep = { at: c, worldGrass: wg, tide: S.tide, need, held, defender: null, losers: [] };
      const pg = S.players.map(p => playerGrass(S, p)); const best = Math.max(...pg);
      if (held) { S.players.forEach((p, i) => { if (pg[i] === best && best > 0) { p.signals += 1; tideRep.defender = (tideRep.defender ? tideRep.defender + ', ' : '') + p.name; } }); }
      else { const avg = pg.reduce((a, b) => a + b, 0) / pg.length; S.players.forEach((p, i) => { if (pg[i] < avg || avg === 0) { const outer = ownedTiles(S, p).filter(t => t.id !== p.home).sort((x, y) => tileDefense(S, x) - tileDefense(S, y))[0]; if (outer) { rotTile(S, outer); tideRep.losers.push(p.name + ' lost ' + tileName(S, outer)); } } }); }
      S.players.forEach(p => { if (p.deepfakeDebt) { p.lucidityBonus -= 0; } }); // debt already subtracted in lucidity(); keep as flag
      tideRep.evolved = evolve(S); S.tideBonus = 0; S.stats.tides.push(tideRep); rep.tide = tideRep;
      log(S, `TIDE at ${c}: world Grass ${wg} vs Tide strength ${need} — ${held ? 'HELD' : 'BROKE'}.`);
    }
    // feed
    const stage = Math.min(3, tideStage(S)); for (let k = 0; k < 2; k++) rep.feed.push(pick(FEED[stage]).replace('{res}', RES_NAME[pick(RES)]).replace('{ring}', ri(1, 4)));
    S.feed = rep.feed;
    if (S.gameOver) return;
    if (S.tide >= TIDE_MAX) { const best = S.players.map(p => lucidity(S, p)); const w = best.indexOf(Math.max(...best)); S.gameOver = { reason: 'tide', winner: w }; log(S, `The Tide reached ${TIDE_MAX}. The Slop takes the world. ${S.players[w].name} was the last lucid one.`); }
  }
  function checkWin(S, p) { if (lucidity(S, p) >= WIN_LUCIDITY) { S.gameOver = { reason: 'lucidity', winner: p.idx }; log(S, `${p.name} reached Lucidity ${WIN_LUCIDITY}. Pre-rot sanity achieved.`); } }

  return { RES, RES_NAME, RINGS, GEO, WIN_LUCIDITY, TIDE_MAX, TIDE_CHECK, RECLAIM_COST, BUILD_COST, CARD_COST, DEFENSE, RELICS, RELIC_BY_ID, BUILD_CARDS, BUILD_BY_ID, TRAITS, TRAIT_BY_ID, ACTIONS_PER_TURN,
    newGame, setSeed, currentPlayer, legalActions, act, lucidity, worldGrass, tideNeed, playerGrass, tileDefense, frontierFor, ownedTiles, tideStage, spreadPower, typeLabel, tileName, canAfford };
});
