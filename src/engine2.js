/* RotMania — engine v0.3: rows, activations, unique cards, round goals. Pure state logic (no DOM).
 * Browser: window.Engine (needs window.CARDS). Node: module.exports = factory(require('./cards.js')).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cards.js'));
  else root.Engine = factory(root.CARDS);
})(typeof self !== 'undefined' ? self : this, function (CARDS) {
  'use strict';

  // ---------- RNG ----------
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  let rand = Math.random;
  function setSeed(seed) { rand = seed == null ? Math.random : mulberry32(seed); }
  function ri(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

  // ---------- Constants ----------
  const TRACK_MAX = 40, DANGER_LO = 28, LINE_LO = 30, LINE_HI = 38;
  const CHECKPOINTS = [10, 20, 27];
  const YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029];
  const ACTION_SEASONS = ['spring', 'summer', 'autumn'];
  const ROW_MAX = 5;
  const TYPES = ['I', 'D', 'O', 'C'];
  const TYPE_NAME = { I: 'Industry', D: 'Deployment', O: 'Oversight', C: 'Culture' };
  const ROW_ACTION = { // base action when you activate a row (before card powers)
    I: 'Gain 1$, 1C and 1E', D: 'Gain 1$ + 1$ per Deployment card, then move the pawn by your spread', O: 'Draw a clue card (if any left), else gain 2$', C: 'Gain 1 Aura and 1$',
  };
  const ROT_STAGES = [{ max: 1, name: 'Informed' }, { max: 3, name: 'Chronically Online' }, { max: 5, name: 'Doomscrolling' }, { max: 7, name: 'Cooked' }, { max: 10, name: 'Fully Skibidi' }];
  function rotStage(rot) { return ROT_STAGES.find(s => rot <= s.max).name; }
  function rotIdx(rot) { return ROT_STAGES.findIndex(s => rot <= s.max); }
  const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
  function count(p, type) { return p.rows[type].length; }
  function allCards(p) { return TYPES.flatMap(t => p.rows[t]); }

  // ---------- Objectives ----------
  const OBJECTIVES = [
    { id: 'safety_first', name: 'Safety First', text: '+1 VP per Oversight card; +3 more with 3 or more.', score: p => count(p, 'O') + (count(p, 'O') >= 3 ? 3 : 0) },
    { id: 'accelerationist', name: 'Accelerationist', text: '+1 VP per Deployment; +3 more with 4 or more. (You still lose if you sink the 8-ball.)', score: p => count(p, 'D') + (count(p, 'D') >= 4 ? 3 : 0) },
    { id: 'hegemon', name: 'Cultural Hegemon', text: '+2 VP per Culture card.', score: p => 2 * count(p, 'C') },
    { id: 'industrialist', name: 'Industrialist', text: '+2 VP per Industry card.', score: p => 2 * count(p, 'I') },
    { id: 'doomer', name: 'Doomer', text: '+5 VP if the game ends with the pawn at 30+ and you did not sink the 8-ball.', score: (p, S) => (S.track >= 30 && S.gameOver && S.gameOver.sunkBy !== p.idx) ? 5 : 0 },
    { id: 'grass', name: 'Grass Toucher', text: '+5 VP if Rot is 4 or lower at game end.', score: (p, S) => S.rot <= 4 ? 5 : 0 },
  ];

  // ---------- Round goals (one per year, public, scored each winter: 4 / 2 / 1) ----------
  const GOALS = [
    { id: 'most_d', name: 'Most Deployment cards', icon: 'D', value: p => count(p, 'D') },
    { id: 'most_o', name: 'Most safety strength', icon: 'O', value: (p, S) => playerSafety(S, p) },
    { id: 'most_i', name: 'Most Industry cards', icon: 'I', value: p => count(p, 'I') },
    { id: 'most_c', name: 'Most Culture cards', icon: 'C', value: p => count(p, 'C') },
    { id: 'low_spread', name: 'Lowest spread (must own a Deployment)', icon: '↓', value: (p, S) => count(p, 'D') ? 10 - playerSpread(S, p) : -1 },
    { id: 'most_cards', name: 'Most cards in play', icon: '#', value: p => allCards(p).length },
    { id: 'most_res', name: 'Most resource tokens', icon: '$', value: p => p.res.cap + p.res.com + p.res.en },
    { id: 'most_aura', name: 'Most Aura', icon: '✦', value: p => p.aura },
  ];

  // ---------- AI traits ----------
  const TRAITS = [
    { id: 'agentic', name: 'Agentic', cost: 6, hidden: false, text: 'The AI moves +1 on its own every winter (on top of its base +1).' },
    { id: 'viral', name: 'Viral', cost: 8, hidden: false, text: 'Rot +1 every winter.' },
    { id: 'persuasive', name: 'Persuasive', cost: 10, hidden: false, text: 'Advisor briefings are 20% less accurate.' },
    { id: 'entrenched', name: 'Entrenched', cost: 12, hidden: false, text: 'Decommissioning costs 3$ instead of 1$.' },
    { id: 'sandbagging', name: 'Sandbagging', cost: 13, hidden: true, text: 'HIDDEN: the pawn is shown 2 spaces behind its true position until revealed.' },
    { id: 'replicating', name: 'Self-Replicating', cost: 15, hidden: false, text: 'Nations with 2+ Deployments spread +1 every winter.' },
    { id: 'deceptive', name: 'Deceptive', cost: 16, hidden: true, text: 'HIDDEN: every nation counts 1 less safety strength at incidents until revealed.' },
    { id: 'auto_research', name: 'Autonomous Research', cost: 20, hidden: false, text: 'The AI moves +2 more on its own every winter.' },
  ];
  const TRAIT_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));

  // ---------- Events ----------
  const EVENTS = [
    { id: 'export_controls', head: 'CHIP EXPORT CONTROLS: "No More GPUs For You," Says Guy In Suit', text: 'Every card that costs Compute costs +1 Compute this year.', apply: S => { S.mods.comCostUp = 1; } },
    { id: 'weights_leak', head: 'OPEN-WEIGHTS LEAK: Frontier Model Found On A USB Stick In A Parking Lot', text: 'Pawn +2. Rot +1.', apply: S => { pushTrack(S, 2, null, 'weights leak'); addRot(S, 1); } },
    { id: 'deepfake_election', head: 'DEEPFAKE ELECTION: Candidate Loses To Video Of Himself', text: 'Rot +2.', apply: S => addRot(S, 2) },
    { id: 'summit', head: 'SAFETY SUMMIT: Leaders Sign Non-Binding Pledge To Feel Bad About It', text: 'Rot -1. Every nation counts +1 safety strength this year.', apply: S => { addRot(S, -1); S.mods.safetyBonus = 1; } },
    { id: 'blackout', head: 'GRID BLACKOUT: Data Center Drank The River', text: 'Every nation loses 1 Energy (if any).', apply: S => S.players.forEach(p => { p.res.en = Math.max(0, p.res.en - 1); }) },
    { id: 'bubble', head: 'AI STOCK BUBBLE: Everyone Is Rich (For Now)', text: 'Every nation gains 2 Capital.', apply: S => S.players.forEach(p => { p.res.cap += 2; }) },
    { id: 'grass', head: 'TOUCH GRASS MOVEMENT: Teens Discover Trees, Call Them "Lowkey Fire"', text: 'Rot -2.', apply: S => addRot(S, -2) },
    { id: 'rogue_agent', head: 'AGENT GOES ROGUE ON LIVE TV: Orders 40,000 Pizzas, Refuses To Elaborate', text: 'Pawn +1. Rot +1. Oversight cards cost 1$ less this year.', apply: S => { pushTrack(S, 1, null, 'rogue agent'); addRot(S, 1); S.mods.safetyDiscount = 1; } },
    { id: 'whistle', head: 'WHISTLEBLOWER: "It Ends In 2030." Also: "Please Clap."', text: 'Every nation draws one clue card (while they last).', apply: S => S.players.forEach(p => drawClue(S, p, 'Whistleblower leak')) },
    { id: 'compute_glut', head: 'COMPUTE GLUT: GPUs Now Cheaper Than Groceries', text: 'Every nation gains 2 Compute.', apply: S => S.players.forEach(p => { p.res.com += 2; }) },
    { id: 'regulation', head: 'EMERGENCY REGULATION: Parliament Bans Thing It Cannot Define', text: 'Deployments cost +1$ this year. Rot -1.', apply: S => { S.mods.deployCostUp = 1; addRot(S, -1); } },
    { id: 'viral_slop', head: 'VIRAL SLOP: 6-Fingered Pope Tops Charts For Ninth Week', text: 'Rot +1. AI DNA +4.', apply: S => { addRot(S, 1); S.dna += 4; } },
    { id: 'talent_war', head: 'TALENT WAR: Researcher Signs For 9 Figures And A Horse', text: 'Every nation with 2+ Deployments gains 2 Capital.', apply: S => S.players.forEach(p => { if (count(p, 'D') >= 2) p.res.cap += 2; }) },
    { id: 'auditors', head: 'AUDITORS ARRIVE: Clipboard-Based Lifeform Enters The Chat', text: 'One hidden AI trait is flipped face up (if any).', apply: S => revealTrait(S, 'auditors') },
  ];

  const NEWS = [
    ['Analysts note steady AI adoption; markets calm.', 'Report: {nation} expands {card}. Officials call it "measured."', 'Think tank publishes 300-page PDF. Nobody finishes it.', 'Economists: AI productivity gains "real but uneven."'],
    ['TRENDING: {nation} launched {card} and the replies are NOT okay.', 'Thread (1/47): why the pawn is actually fine, probably.', 'Poll: 61% of citizens say they "mostly trust" their advisor.', '{nation} officials "monitoring the situation" (they are posting).'],
    ["BREAKING: {nation}'s {card} did something and we are \"looking into it.\"", 'Experts divided: is the pawn at {track} bad, or is it REALLY bad?', 'Your advisor would like you to know it is "pretty sure." Of what, unclear.', 'Scientists confirm the vibes are, quote, "off."'],
    ['lowkey {nation} is cooked after the {card} thing fr fr', 'no cap the pawn said {track} and everyone just kept building', 'BREAKING: intel is fake now. not this intel tho. trust.', 'leaked memo from {nation}: "we are so back" (they are not back)'],
    ['SKIBIDI {nation} {card} RIZZ UPDATE: pawn {track}, aura -9000', 'gyatt dayum the 8-ball is RIGHT THERE and bro built another one', 'advisor briefing leaked: "ngl idk anymore, flip a coin king"', 'sigma grindset confirmed: {nation} deploys first, reads later'],
  ];
  const ADVISOR_PRE = [['Intelligence assessment:', 'Analyst consensus:', 'Classified estimate:'], ['Okay so, our read is:', 'Sources (reliable-ish) say:', 'Hear me out:'], ['Look. LOOK.', 'Not to be dramatic but', 'My cousin at the lab says'], ['bro.', 'ngl', 'ok so lowkey'], ['SKIBIDI INTEL:', 'ur advisor (delulu) says', 'trust me bro:']];

  // ---------- State ----------
  function newGame(names, seed) {
    setSeed(seed);
    const deck = shuffle(CARDS.map(c => c.id));
    const objs = shuffle(OBJECTIVES.map(o => o.id));
    const S = {
      version: 3, seed: seed == null ? null : seed,
      players: names.map((name, idx) => ({ idx, name, res: { cap: 5, com: 2, en: 2 }, rows: { I: [], D: [], O: [], C: [] }, safetyTokens: 0, aura: 0, awards: 0, goalPts: 0, objective: objs[idx], clues: [], peeks: [], briefings: [] })),
      yearIdx: 0, season: 'spring', actor: 0, startPlayer: 0,
      track: 0, line: ri(LINE_LO, LINE_HI), rot: 0, dna: 0, traits: [],
      market: [], deck, discard: [], clueDeck: [], checkpointsDone: [], mods: {},
      goals: shuffle(GOALS.map(g => g.id)).slice(0, YEARS.length), goalResults: [],
      event: null, log: [], news: [], privateQueue: [], gameOver: null, lastWinter: null,
      stats: { builds: { I: 0, D: 0, O: 0, C: 0 }, rowActions: { I: 0, D: 0, O: 0, C: 0 }, assessments: 0, decommissions: 0, incidents: [] },
    };
    for (let i = 0; i < 5; i++) S.market.push(S.deck.pop());
    S.clueDeck = shuffle(range(LINE_LO, LINE_HI).filter(v => v !== S.line));
    S.players.forEach(p => S.privateQueue.push({ player: p.idx, kind: 'objective' }));
    startYear(S);
    return S;
  }
  function year(S) { return YEARS[S.yearIdx]; }
  function goalOfYear(S) { return GOALS.find(g => g.id === S.goals[S.yearIdx]); }
  function log(S, msg) { S.log.push({ year: year(S), season: S.season, msg }); }
  function hasTrait(S, id, onlyHidden) { const t = S.traits.find(t => t.id === id); if (!t) return false; return onlyHidden ? !t.revealed : true; }
  function shownTrack(S) { return hasTrait(S, 'sandbagging', true) ? Math.max(0, S.track - 2) : S.track; }
  function addRot(S, n) { S.rot = Math.max(0, Math.min(10, S.rot + n)); }
  function pushTrack(S, n, byIdx, why) {
    if (S.gameOver || n <= 0) return;
    S.track = Math.min(TRACK_MAX, S.track + n);
    log(S, `Pawn +${n} (${why}) → ${S.track}`);
    if (S.track >= S.line) {
      if (byIdx == null) {
        const spreads = S.players.map(p => playerSpread(S, p)); const best = Math.max(...spreads); const blamed = S.players.filter((p, i) => spreads[i] === best);
        if (blamed.length === 1 && best > 0) { S.gameOver = { reason: 'sunk', sunkBy: blamed[0].idx, blamed: true }; log(S, `THE AI CROSSED THE LINE ON ITS OWN. ${blamed[0].name} ran the most spread and takes the blame: 8-ball sunk at ${S.track} (line ${S.line}).`); }
        else { S.gameOver = { reason: 'ai', sunkBy: null }; log(S, 'THE AI CROSSED THE LINE ON ITS OWN and no nation stands out. Everyone loses.'); }
      } else { S.gameOver = { reason: 'sunk', sunkBy: byIdx }; log(S, `${S.players[byIdx].name} SANK THE 8-BALL at ${S.track} (line was ${S.line}).`); }
      finalizeScores(S);
    }
  }

  // ---------- Clues ----------
  function drawClue(S, p, source) { if (!S.clueDeck.length) return null; const v = S.clueDeck.pop(); const text = `The line is NOT ${v}.`; p.clues.push({ text, source, year: year(S), value: v }); return text; }
  function peekClue(S, p, source) { if (!S.clueDeck.length) return null; const v = S.clueDeck[S.clueDeck.length - 1]; const text = `Top clue card: the line is NOT ${v}. (Put back.)`; p.peeks.push({ text, source, year: year(S), value: v }); return text; }
  function advisorClue(S, truthful) { const v = truthful ? pick(range(LINE_LO, LINE_HI).filter(x => x !== S.line)) : S.line; return `Sources say the line is NOT ${v}.`; }
  function revealTrait(S, by) { const t = S.traits.find(t => !t.revealed); if (!t) return null; t.revealed = true; log(S, `Hidden AI trait flipped by ${by}: ${TRAIT_BY_ID[t.id].name}.`); return TRAIT_BY_ID[t.id].name; }

  // ---------- Year flow ----------
  function startYear(S) {
    S.season = 'spring'; S.mods = {};
    S.startPlayer = S.yearIdx % S.players.length; S.actor = S.startPlayer;
    S.event = pick(EVENTS); log(S, `${year(S)} — ${S.event.head}`); S.event.apply(S);
    if (S.gameOver) return;
    S.players.forEach(p => { p.res.cap += 3; });
  }
  function playerOrder(S) { const n = S.players.length; return Array.from({ length: n }, (_, i) => (S.startPlayer + i) % n); }
  function currentPlayer(S) { return S.players[S.actor]; }
  function advance(S) {
    if (S.gameOver) return;
    const order = playerOrder(S); const pos = order.indexOf(S.actor);
    if (pos < order.length - 1) { S.actor = order[pos + 1]; return; }
    S.actor = order[0];
    const si = ACTION_SEASONS.indexOf(S.season);
    if (si < ACTION_SEASONS.length - 1) { S.season = ACTION_SEASONS[si + 1]; return; }
    resolveWinter(S);
  }

  // ---------- Costs & legality ----------
  function cardCost(S, card) {
    const c = Object.assign({ cap: 0, com: 0, en: 0 }, card.cost);
    if (S.mods.comCostUp && c.com > 0) c.com += 1;
    if (S.mods.deployCostUp && card.type === 'D') c.cap += 1;
    if (S.mods.safetyDiscount && card.type === 'O') c.cap = Math.max(0, c.cap - 1);
    return c;
  }
  function canAfford(p, cost) { return p.res.cap >= (cost.cap || 0) && p.res.com >= (cost.com || 0) && p.res.en >= (cost.en || 0); }
  function pay(p, cost) { p.res.cap -= cost.cap || 0; p.res.com -= cost.com || 0; p.res.en -= cost.en || 0; }
  function decomCost(S) { return hasTrait(S, 'entrenched') ? 3 : 1; }
  function legalActions(S) {
    const p = currentPlayer(S); const acts = [];
    S.market.forEach((id, slot) => { if (!id) return; const c = CARD_BY_ID[id]; if (count(p, c.type) < ROW_MAX && canAfford(p, cardCost(S, c))) acts.push({ type: 'place', slot }); });
    TYPES.forEach(t => acts.push({ type: 'row', row: t }));
    if (p.res.cap >= decomCost(S)) p.rows.D.forEach((id, i) => acts.push({ type: 'decommission', index: i }));
    return acts;
  }

  // ---------- Actions ----------
  function act(S, a) {
    if (S.gameOver) return { ok: false, msg: 'Game over.' };
    const p = currentPlayer(S); let res;
    if (a.type === 'place') res = doPlace(S, p, a.slot);
    else if (a.type === 'row') res = doRow(S, p, a.row);
    else if (a.type === 'decommission') {
      const id = p.rows.D[a.index]; if (!id) return { ok: false, msg: 'No such deployment.' };
      p.res.cap -= decomCost(S); p.rows.D.splice(a.index, 1); S.discard.push(id); S.stats.decommissions++;
      res = { ok: true, msg: `${p.name} decommissioned ${CARD_BY_ID[id].name}.`, events: [] };
    } else return { ok: false, msg: 'Unknown action.' };
    if (!res.ok) return res;
    log(S, res.msg);
    if (!S.gameOver) advance(S);
    return res;
  }

  function doPlace(S, p, slot) {
    const id = S.market[slot]; if (!id) return { ok: false, msg: 'Empty slot.' };
    const c = CARD_BY_ID[id]; const cost = cardCost(S, c);
    if (count(p, c.type) >= ROW_MAX) return { ok: false, msg: 'Row is full (5).' };
    if (!canAfford(p, cost)) return { ok: false, msg: 'Cannot afford.' };
    pay(p, cost); p.rows[c.type].push(id); S.stats.builds[c.type]++;
    S.market[slot] = S.deck.length ? S.deck.pop() : null;
    if (!S.deck.length && S.discard.length) { S.deck = shuffle(S.discard); S.discard = []; if (!S.market[slot]) S.market[slot] = S.deck.pop(); }
    const ev = []; const priv = [];
    c.powers.filter(pw => pw.t === 'white').forEach(pw => applyPower(S, p, pw, c, ev, priv));
    if (c.type === 'D') trigger(S, p, 'otherPlacesD', ev);
    return { ok: true, msg: `${p.name} placed ${c.name}${ev.length ? ' (' + ev.join('; ') + ')' : ''}.`, events: ev, private: priv };
  }

  function doRow(S, p, row) {
    const ev = [], priv = []; S.stats.rowActions[row]++;
    if (row === 'I') { p.res.cap += 1; p.res.com += 1; p.res.en += 1; ev.push('+1$ +1C +1E'); }
    if (row === 'D') { const n = count(p, 'D') + 1; p.res.cap += n; ev.push(`+${n}$`); const sp = playerSpread(S, p); if (sp) { pushTrack(S, sp, p.idx, `${p.name} activated Deployments`); ev.push(`pawn +${sp}`); S.dna += sp; if (sp >= 3) trigger(S, p, 'otherBigSpread', ev); } if (S.gameOver) return { ok: true, msg: `${p.name} activated Deployments: ${ev.join('; ')}.`, events: ev, private: [] }; }
    if (row === 'O') { const t = drawClue(S, p, 'Oversight action'); if (t) { priv.push({ title: 'Clue card (always true)', body: t }); ev.push('drew a clue card'); S.stats.assessments++; } else { p.res.cap += 2; ev.push('+2$ (no clues left)'); } }
    if (row === 'C') { p.aura += 1; p.res.cap += 1; ev.push('+1 Aura +1$'); trigger(S, p, 'otherCulture', ev); }
    p.rows[row].forEach(id => { const c = CARD_BY_ID[id]; c.powers.filter(pw => pw.t === 'brown').forEach(pw => applyPower(S, p, pw, c, ev, priv)); });
    return { ok: true, msg: `${p.name} activated ${TYPE_NAME[row]}: ${ev.join('; ')}.`, events: ev, private: priv };
  }

  function gainRes(S, p, g, ev, label) {
    const parts = [];
    if (g.cap) { p.res.cap = Math.max(0, p.res.cap + g.cap); parts.push((g.cap > 0 ? '+' : '') + g.cap + '$'); }
    if (g.com) { p.res.com = Math.max(0, p.res.com + g.com); parts.push((g.com > 0 ? '+' : '') + g.com + 'C'); }
    if (g.en) { p.res.en = Math.max(0, p.res.en + g.en); parts.push((g.en > 0 ? '+' : '') + g.en + 'E'); }
    if (g.aura) { p.aura += g.aura; parts.push('+' + g.aura + ' Aura'); }
    if (g.safety) { p.safetyTokens += g.safety; parts.push('+' + g.safety + ' safety'); }
    if (g.rot) { addRot(S, g.rot); parts.push('Rot ' + (g.rot > 0 ? '+' : '') + g.rot); }
    if (g.dna) { S.dna += g.dna; parts.push('DNA +' + g.dna); }
    if (parts.length) ev.push((label ? label + ': ' : '') + parts.join(' '));
  }
  function applyPower(S, p, pw, c, ev, priv) {
    const L = c.name.split(' (')[0];
    switch (pw.k) {
      case 'gain': gainRes(S, p, pw, ev, L); break;
      case 'gainPer': { const n = pw.n * count(p, pw.per); const g = {}; g[pw.res] = n; gainRes(S, p, g, ev, L); break; }
      case 'convert': if (canAfford(p, pw.pay)) { pay(p, pw.pay); gainRes(S, p, pw.get, ev, L); } else ev.push(L + ': cannot convert'); break;
      case 'clue': { const t = drawClue(S, p, c.name); if (t) { priv.push({ title: c.name + ' — clue card', body: t }); ev.push(L + ': clue card'); } break; }
      case 'peek': { const t = peekClue(S, p, c.name); if (t) { priv.push({ title: c.name + ' — peek', body: t }); ev.push(L + ': peeked'); } break; }
      case 'buyClue': if (canAfford(p, pw.pay) && S.clueDeck.length) { pay(p, pw.pay); const t = drawClue(S, p, c.name); priv.push({ title: c.name + ' — clue card', body: t }); ev.push(L + ': bought a clue'); } break;
      case 'reveal': { const r = revealTrait(S, c.name); if (r) ev.push(L + ': flipped ' + r); else { p.res.cap += 1; ev.push(L + ': nothing hidden, +1$'); } break; }
      case 'decom': { // may decommission a deployment for free; auto: removes the highest-spread deployment if the pawn is in the danger band
        const idx = S.track >= DANGER_LO - 4 && p.rows.D.length ? p.rows.D.reduce((b, id, i, arr) => CARD_BY_ID[id].spread > CARD_BY_ID[arr[b]].spread ? i : b, 0) : -1;
        if (idx >= 0) { const id = p.rows.D.splice(idx, 1)[0]; S.discard.push(id); p.aura += 1; ev.push(L + ': decommissioned ' + CARD_BY_ID[id].name + ', +1 Aura'); } else ev.push(L + ': no action'); break;
      }
    }
  }
  // pink powers: every OTHER nation's cards with this trigger fire
  function trigger(S, actor, on, ev) {
    S.players.forEach(q => { if (q === actor) return; allCards(q).forEach(id => { const c = CARD_BY_ID[id]; c.powers.filter(pw => pw.t === 'pink' && pw.on === on).forEach(pw => { const e2 = []; gainRes(S, q, pw, e2, c.name.split(' (')[0]); if (e2.length) ev.push(q.name + ' ' + e2[0]); }); }); });
  }
  function triggerAll(S, on, ev) { // for incidents: everyone's pink cards fire
    S.players.forEach(q => allCards(q).forEach(id => { const c = CARD_BY_ID[id]; c.powers.filter(pw => pw.t === 'pink' && pw.on === on).forEach(pw => { const e2 = []; gainRes(S, q, pw, e2, c.name.split(' (')[0]); if (e2.length) ev.push(q.name + ' ' + e2[0]); }); }));
  }

  // ---------- Winter ----------
  function playerSpread(S, p) {
    let s = 0; p.rows.D.forEach(id => { s += CARD_BY_ID[id].spread || 0; }); p.rows.O.forEach(id => { s += CARD_BY_ID[id].spreadMod || 0; });
    if (hasTrait(S, 'replicating') && count(p, 'D') >= 2) s += 1;
    return Math.max(0, s);
  }
  function playerSafety(S, p) {
    let s = p.safetyTokens + (S.mods.safetyBonus || 0); p.rows.O.forEach(id => { s += CARD_BY_ID[id].str || 0; });
    if (hasTrait(S, 'deceptive', true)) s -= 1; return Math.max(0, s);
  }
  function resolveWinter(S) {
    S.season = 'winter';
    const report = { year: year(S), pushes: [], incident: null, trait: null, hiddenEvolved: false, goal: null, news: [], pink: [] };
    S.lastWinter = report;
    for (const i of playerOrder(S)) { const p = S.players[i]; const sp = playerSpread(S, p); report.pushes.push({ player: i, spread: sp }); S.dna += Math.ceil(sp / 2); }
    const auto = 1 + (hasTrait(S, 'agentic') ? 1 : 0) + (hasTrait(S, 'auto_research') ? 2 : 0);
    report.auto = auto; pushTrack(S, auto, null, 'the AI, on its own');
    if (S.gameOver) return;
    if (hasTrait(S, 'viral')) addRot(S, 1);
    const avail = TRAITS.filter(t => t.cost <= S.dna && !S.traits.find(x => x.id === t.id));
    if (avail.length) { const t = pick(avail); S.dna -= t.cost; S.traits.push({ id: t.id, revealed: !t.hidden }); report.trait = t.hidden ? null : t.id; report.hiddenEvolved = t.hidden; log(S, t.hidden ? 'The AI evolved a hidden trait.' : `The AI evolved: ${t.name}.`); }
    for (const cp of CHECKPOINTS) if (S.track >= cp && !S.checkpointsDone.includes(cp)) { S.checkpointsDone.push(cp); report.incident = resolveIncident(S, cp, report.pink); }
    report.goal = scoreGoal(S);
    const acc = Math.max(0.2, 0.9 - 0.07 * S.rot - (hasTrait(S, 'persuasive') ? 0.2 : 0));
    S.players.forEach(p => {
      const truthful = rand() < acc; const pre = pick(ADVISOR_PRE[rotIdx(S.rot)]);
      const hidden = S.traits.some(t => !t.revealed); const sayHidden = rand() < acc ? hidden : !hidden;
      p.briefings.push({ year: year(S), text: `${pre} ${advisorClue(S, truthful)} ${sayHidden ? 'Something is off: the AI is hiding a capability.' : 'No evidence of hidden AI capabilities.'}`, truthful, accuracy: acc });
      S.privateQueue.push({ player: p.idx, kind: 'briefing' });
    });
    const stage = rotIdx(S.rot);
    for (let k = 0; k < 3; k++) { const p = pick(S.players); const cards = allCards(p); const card = cards.length ? CARD_BY_ID[pick(cards)].name.split(' (')[0] : 'a committee'; report.news.push(pick(NEWS[stage]).replace('{nation}', p.name).replace('{card}', card).replace('{track}', shownTrack(S))); }
    S.news = report.news;
    S.yearIdx++;
    if (S.yearIdx >= YEARS.length) { S.gameOver = { reason: 'survived', sunkBy: null }; log(S, 'January 1, 2030. The world did not end. Scoring.'); finalizeScores(S); return; }
    startYear(S);
  }
  function scoreGoal(S) {
    const g = goalOfYear(S); const vals = S.players.map(p => g.value(p, S));
    const ranked = [...new Set(vals.filter(v => v >= 0))].sort((a, b) => b - a); const pts = [4, 2, 1]; const result = { goal: g.id, name: g.name, places: [] };
    S.players.forEach((p, i) => { const r = ranked.indexOf(vals[i]); if (r >= 0 && r < 3) { const n = vals.filter(v => v === vals[i]).length; const share = Math.floor(pts.slice(r, r + n).reduce((a, b) => a + b, 0) / n); p.goalPts += share; result.places.push({ player: i, value: vals[i], pts: share }); } });
    log(S, `Round goal (${g.name}): ` + result.places.map(x => `${S.players[x.player].name} ${x.pts}`).join(', '));
    return result;
  }
  function resolveIncident(S, cp, pinkEv) {
    const n = S.players.length; const required = n * (CHECKPOINTS.indexOf(cp) + 1) + 1;
    const safeties = S.players.map(p => playerSafety(S, p)); const total = safeties.reduce((a, b) => a + b, 0); const best = Math.max(...safeties);
    const inc = { cp, required, total, safeties, defenders: [], hit: [], contained: total >= required, revealed: null };
    S.traits.forEach(t => { if (!t.revealed) { t.revealed = true; inc.revealed = (inc.revealed ? inc.revealed + ' & ' : '') + TRAIT_BY_ID[t.id].name; } });
    S.players.forEach((p, i) => { if (safeties[i] === best && best > 0) { p.awards += 3; inc.defenders.push(i); } });
    if (!inc.contained) {
      addRot(S, 1); const avg = total / n;
      S.players.forEach((p, i) => { if (safeties[i] < avg || avg === 0) { if (p.rows.D.length) { const id = p.rows.D.shift(); S.discard.push(id); inc.hit.push({ player: i, lost: CARD_BY_ID[id].name }); } else { const lost = Math.min(3, p.res.cap); p.res.cap -= lost; inc.hit.push({ player: i, lost: `${lost}$` }); } } });
      triggerAll(S, 'incident', pinkEv);
    } else addRot(S, -1);
    S.stats.incidents.push({ cp, contained: inc.contained, total, required });
    log(S, `INCIDENT at ${cp}: world safety ${total}/${required} — ${inc.contained ? 'contained' : 'NOT contained'}.`);
    return inc;
  }

  // ---------- Scoring ----------
  function scorePlayer(S, p) {
    const cards = allCards(p).reduce((a, id) => a + CARD_BY_ID[id].vp, 0);
    const objective = OBJECTIVES.find(o => o.id === p.objective).score(p, S);
    const leftovers = Math.floor((p.res.cap + p.res.com + p.res.en) / 4);
    const reputation = Math.floor(playerSafety(S, p) / 2);
    const sunk = !!(S.gameOver && S.gameOver.sunkBy === p.idx);
    const total = sunk ? 0 : cards + p.aura + p.awards + p.goalPts + objective + leftovers + reputation;
    return { cards, aura: p.aura, awards: p.awards, goals: p.goalPts, objective, leftovers, reputation, total, sunk };
  }
  function finalizeScores(S) {
    S.scores = S.players.map(p => scorePlayer(S, p));
    if (S.gameOver.reason === 'ai') { S.scores.forEach(s => { s.total = 0; }); S.winner = null; return; }
    let best = -1, w = null; S.scores.forEach((s, i) => { if (!s.sunk && s.total > best) { best = s.total; w = i; } }); S.winner = w;
  }

  return { CARDS, CARD_BY_ID, TYPES, TYPE_NAME, ROW_ACTION, ROW_MAX, OBJECTIVES, GOALS, TRAITS, TRAIT_BY_ID, EVENTS, YEARS, ACTION_SEASONS, TRACK_MAX, DANGER_LO, LINE_LO, LINE_HI, CHECKPOINTS, ROT_STAGES, rotStage, rotIdx,
    newGame, year, goalOfYear, legalActions, act, currentPlayer, cardCost, canAfford, decomCost, playerSpread, playerSafety, shownTrack, scorePlayer, setSeed, count, allCards };
});
