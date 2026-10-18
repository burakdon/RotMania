/* RotMania — game engine (pure state logic, no DOM)
 * Works in the browser (global `Engine`) and in Node (module.exports) for simulation.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- RNG (seedable so playtests are reproducible) ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rand = Math.random;
  function setSeed(seed) { rand = seed == null ? Math.random : mulberry32(seed); }
  function ri(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
  function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- Constants ----------
  const TRACK_MAX = 40;
  const DANGER_LO = 28;           // danger band start (public)
  const LINE_LO = 30, LINE_HI = 38; // secret 8-ball line is somewhere here
  const CHECKPOINTS = [10, 20, 27];
  const YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029];
  const ROT_STAGES = [
    { max: 1, name: 'Informed' },
    { max: 3, name: 'Chronically Online' },
    { max: 5, name: 'Doomscrolling' },
    { max: 7, name: 'Cooked' },
    { max: 10, name: 'Fully Skibidi' },
  ];
  function rotStage(rot) { return ROT_STAGES.find(s => rot <= s.max).name; }
  function rotIdx(rot) { return ROT_STAGES.findIndex(s => rot <= s.max); }

  // ---------- Cards ----------
  // type: I=infrastructure, D=deployment, S=safety, C=culture
  // cost: {cap,com,en}; yield: spring income (I) or winter income (D,C)
  const CARDS = [
    // Infrastructure — produce resources every spring
    { id: 'server_barn', name: 'Server Barn', type: 'I', cost: { cap: 2, en: 1 }, yield: { com: 1 }, vp: 1, n: 3, flavor: 'A shed. With fans. Loud fans.' },
    { id: 'data_center', name: 'Data Center', type: 'I', cost: { cap: 3, en: 1 }, yield: { com: 2 }, vp: 1, n: 4, flavor: 'Cools itself with a small lake nobody asked about.' },
    { id: 'power_plant', name: 'Power Plant', type: 'I', cost: { cap: 2 }, yield: { en: 2 }, vp: 1, n: 4, flavor: 'Runs on whatever was cheapest this quarter.' },
    { id: 'chip_fab', name: 'Chip Fab', type: 'I', cost: { cap: 4, en: 1 }, yield: { com: 1, cap: 1 }, vp: 2, n: 3, flavor: 'Three nanometers of pure national pride.' },
    { id: 'reactor', name: 'Nuclear Reactor', type: 'I', cost: { cap: 5 }, yield: { en: 3 }, vp: 2, n: 2, flavor: 'Restarted by popular demand of one data center.' },
    { id: 'cable', name: 'Undersea Cable', type: 'I', cost: { cap: 3 }, yield: { cap: 1, com: 1 }, vp: 1, n: 2, flavor: 'Sharks keep biting it. We get it, sharks.' },
    // Deployments — the engine; produce capital every winter; push the shared AI track by `spread`
    { id: 'chatbot', name: 'National Chatbot', type: 'D', cost: { com: 2 }, yield: { cap: 2 }, spread: 1, vp: 1, n: 4, flavor: "It's giving customer service." },
    { id: 'rec_engine', name: 'Recommendation Engine', type: 'D', cost: { com: 1, en: 1 }, yield: { cap: 2 }, spread: 1, vp: 1, rot: 1, n: 3, flavor: 'Knows what you want before you regret it.' },
    { id: 'tutor', name: 'AI Tutor', type: 'D', cost: { com: 2, en: 1 }, yield: { cap: 2 }, spread: 1, vp: 2, n: 3, flavor: 'Explains calculus in Minecraft parkour terms.' },
    { id: 'drones', name: 'Drone Delivery', type: 'D', cost: { com: 2, en: 2 }, yield: { cap: 3 }, spread: 1, vp: 1, n: 3, flavor: 'Your package is 4 minutes away and slightly on fire.' },
    { id: 'trucks', name: 'Autonomous Trucks', type: 'D', cost: { com: 2, en: 2 }, yield: { cap: 3 }, spread: 2, vp: 2, n: 3, flavor: 'They do not stop for anything. Legally, that is the issue.' },
    { id: 'surveillance', name: 'Surveillance Grid', type: 'D', cost: { com: 3, en: 1 }, yield: { cap: 2 }, spread: 2, vp: 2, onPlay: 'clue', n: 2, flavor: 'Sees everything. Understands slightly less.' },
    { id: 'robots', name: 'Robot Workforce', type: 'D', cost: { com: 3, en: 3 }, yield: { cap: 4 }, spread: 2, vp: 3, n: 3, flavor: 'Union negotiations are going great for the robots.' },
    { id: 'auto_lab', name: 'Automated Lab', type: 'D', cost: { com: 3, en: 2 }, yield: { com: 2 }, spread: 3, vp: 2, n: 2, flavor: 'The AI is doing AI research. Nobody told it to stop.' },
    { id: 'swarm', name: 'Agent Swarm', type: 'D', cost: { com: 4, en: 2 }, yield: { cap: 5 }, spread: 3, vp: 3, n: 2, flavor: 'Ten thousand interns with root access.' },
    { id: 'military', name: 'Military AI', type: 'D', cost: { com: 4, en: 3 }, yield: { cap: 3 }, spread: 3, vp: 4, n: 2, flavor: 'Fully aligned with the interests of itself.' },
    // Safety — strength counts at incident checkpoints
    { id: 'grant', name: 'Alignment Grant', type: 'S', cost: { cap: 2 }, strength: 1, vp: 1, n: 3, flavor: 'Funds three PhDs and one very long blog post.' },
    { id: 'eval_lab', name: 'Eval Lab', type: 'S', cost: { cap: 2, com: 1 }, strength: 2, vp: 1, n: 3, flavor: 'Benchmarks the model. The model studied for it.' },
    { id: 'red_team', name: 'Red Team', type: 'S', cost: { cap: 3, com: 1 }, strength: 2, vp: 2, onPlay: 'reveal', n: 2, flavor: 'Paid to think like the enemy. Scarily good at it.' },
    { id: 'kill_switch', name: 'Kill Switch', type: 'S', cost: { cap: 3, en: 1 }, strength: 1, vp: 1, spreadMod: -1, n: 2, flavor: 'Big red button. Nobody remembers who has the key.' },
    { id: 'interp', name: 'Interpretability Institute', type: 'S', cost: { cap: 3, com: 2 }, strength: 2, vp: 2, onPlay: 'clue', n: 2, flavor: 'Opened the black box. Found a smaller black box.' },
    { id: 'gov_office', name: 'Compute Governance Office', type: 'S', cost: { cap: 4 }, strength: 3, vp: 2, n: 2, flavor: 'Counts GPUs. Loses count. Counts again.' },
    { id: 'inspectorate', name: 'International Inspectorate', type: 'S', cost: { cap: 5 }, strength: 3, vp: 3, rot: -1, n: 2, flavor: 'Has a lanyard, a clipboard, and no jurisdiction.' },
    // Culture — cheap points, raises Rot
    { id: 'content_farm', name: 'Content Farm', type: 'C', cost: { cap: 1 }, yield: { cap: 1 }, vp: 1, rot: 1, n: 3, flavor: 'Harvests engagement. Nothing else grows here.' },
    { id: 'influencers', name: 'Influencer Ministry', type: 'C', cost: { cap: 2 }, vp: 2, rot: 1, n: 3, flavor: 'Official government position: slay.' },
    { id: 'meme_studio', name: 'Meme Studio', type: 'C', cost: { cap: 1, com: 1 }, vp: 1, rot: 1, dna: 2, n: 2, flavor: 'State-funded. Somehow still mid.' },
    { id: 'archive', name: 'National Brainrot Archive', type: 'C', cost: { cap: 3 }, vp: 3, rot: 2, n: 2, flavor: 'Preserving every skibidi for future historians.' },
    { id: 'touch_grass', name: 'Touch Grass Program', type: 'C', cost: { cap: 2 }, vp: 1, rot: -1, n: 2, flavor: 'Mandatory outdoor hours. Attendance: low.' },
    { id: 'slop_tariff', name: 'Slop Tariff', type: 'C', cost: { cap: 3 }, vp: 2, rot: -1, n: 2, flavor: '40% duty on imported nonsense.' },
  ];
  const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
  const TYPE_NAME = { I: 'Infrastructure', D: 'Deployment', S: 'Safety', C: 'Culture' };

  // ---------- Secret objectives ----------
  const OBJECTIVES = [
    { id: 'safety_first', name: 'Safety First', text: '+1 VP per Safety card; +3 more if you have 3 or more.', score: p => { const n = count(p, 'S'); return n + (n >= 3 ? 3 : 0); } },
    { id: 'accelerationist', name: 'Accelerationist', text: '+1 VP per Deployment; +3 more if you have 4 or more. (You still lose if you sink the 8-ball.)', score: p => { const n = count(p, 'D'); return n + (n >= 4 ? 3 : 0); } },
    { id: 'hegemon', name: 'Cultural Hegemon', text: '+2 VP per Culture card.', score: p => 2 * count(p, 'C') },
    { id: 'industrialist', name: 'Industrialist', text: '+2 VP per Infrastructure card.', score: p => 2 * count(p, 'I') },
    { id: 'doomer', name: 'Doomer', text: '+5 VP if the game ends with the AI track at 30 or higher and you did not sink the 8-ball.', score: (p, S) => (S.track >= 30 && S.gameOver && S.gameOver.sunkBy !== p.idx) ? 5 : 0 },
    { id: 'grass', name: 'Grass Toucher', text: '+5 VP if Rot is 4 or lower at game end.', score: (p, S) => S.rot <= 4 ? 5 : 0 },
  ];
  function count(p, type) { return p.tableau.filter(id => CARD_BY_ID[id].type === type).length; }

  // ---------- AI traits (the app-run antagonist, Plague-style) ----------
  const TRAITS = [
    { id: 'agentic', name: 'Agentic', cost: 6, hidden: false, text: 'The AI pushes the track +1 on its own every winter.' },
    { id: 'viral', name: 'Viral', cost: 8, hidden: false, text: 'Rot +1 every winter.' },
    { id: 'persuasive', name: 'Persuasive', cost: 10, hidden: false, text: 'Advisor briefings are 20% less accurate.' },
    { id: 'entrenched', name: 'Entrenched', cost: 12, hidden: false, text: 'Decommissioning a deployment costs 3 Capital instead of 1.' },
    { id: 'sandbagging', name: 'Sandbagging', cost: 13, hidden: true, text: 'HIDDEN: the public track shows 2 less than the real value until revealed.' },
    { id: 'replicating', name: 'Self-Replicating', cost: 15, hidden: false, text: 'Each nation with 2+ deployments spreads +1 every winter.' },
    { id: 'deceptive', name: 'Deceptive', cost: 16, hidden: true, text: 'HIDDEN: every nation counts 1 less safety strength at incidents until revealed.' },
    { id: 'auto_research', name: 'Autonomous Research', cost: 20, hidden: false, text: 'The AI pushes the track +2 on its own every winter.' },
  ];
  const TRAIT_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));

  // ---------- World events (spring) ----------
  const EVENTS = [
    { id: 'export_controls', head: 'CHIP EXPORT CONTROLS: "No More GPUs For You," Says Guy In Suit', text: 'Compute is scarce this year: every Build costs +1 Compute if it needs Compute.', apply: S => { S.mods.comCostUp = 1; } },
    { id: 'weights_leak', head: 'OPEN-WEIGHTS LEAK: Frontier Model Found On A USB Stick In A Parking Lot', text: 'AI track +2. Rot +1.', apply: S => { pushTrack(S, 2, null, 'weights leak'); addRot(S, 1); } },
    { id: 'deepfake_election', head: 'DEEPFAKE ELECTION: Candidate Loses To Video Of Himself', text: 'Rot +2.', apply: S => addRot(S, 2) },
    { id: 'summit', head: 'SAFETY SUMMIT: Leaders Sign Non-Binding Pledge To Feel Bad About It', text: 'Rot -1. Every nation gains +1 safety strength this year.', apply: S => { addRot(S, -1); S.mods.safetyBonus = 1; } },
    { id: 'blackout', head: 'GRID BLACKOUT: Data Center Drank The River', text: 'Every nation loses 1 Energy (if any).', apply: S => S.players.forEach(p => { p.res.en = Math.max(0, p.res.en - 1); }) },
    { id: 'bubble', head: 'AI STOCK BUBBLE: Everyone Is Rich (For Now)', text: 'Every nation gains 2 Capital.', apply: S => S.players.forEach(p => { p.res.cap += 2; }) },
    { id: 'grass', head: 'TOUCH GRASS MOVEMENT: Teens Discover Trees, Call Them "Lowkey Fire"', text: 'Rot -2.', apply: S => addRot(S, -2) },
    { id: 'rogue_agent', head: 'AGENT GOES ROGUE ON LIVE TV: Orders 40,000 Pizzas, Refuses To Elaborate', text: 'AI track +1. Rot +1. Safety cards are cheaper this year (-1 Capital).', apply: S => { pushTrack(S, 1, null, 'rogue agent'); addRot(S, 1); S.mods.safetyDiscount = 1; } },
    { id: 'whistle', head: 'WHISTLEBLOWER: "It Ends In 2030." Also: "Please Clap."', text: 'Every nation draws one clue card (if any remain).', apply: S => S.players.forEach(p => drawClue(S, p, 'Whistleblower leak')) },
    { id: 'compute_glut', head: 'COMPUTE GLUT: GPUs Now Cheaper Than Groceries', text: 'Every nation gains 2 Compute.', apply: S => S.players.forEach(p => { p.res.com += 2; }) },
    { id: 'regulation', head: 'EMERGENCY REGULATION: Parliament Bans Thing It Cannot Define', text: 'Deployments cost +1 Capital this year. Rot -1.', apply: S => { S.mods.deployCostUp = 1; addRot(S, -1); } },
    { id: 'viral_slop', head: 'VIRAL SLOP: 6-Fingered Pope Tops Charts For Ninth Week', text: 'Rot +1. AI DNA +4.', apply: S => { addRot(S, 1); S.dna += 4; } },
    { id: 'talent_war', head: 'TALENT WAR: Researcher Signs For 9 Figures And A Horse', text: 'Every nation with 2+ Deployments gains 2 Capital.', apply: S => S.players.forEach(p => { if (count(p, 'D') >= 2) p.res.cap += 2; }) },
    { id: 'auditors', head: 'AUDITORS ARRIVE: Clipboard-Based Lifeform Enters The Chat', text: 'One hidden AI trait is revealed (if any).', apply: S => revealTrait(S, 'auditors') },
  ];

  // ---------- News & advisor voice by Rot stage ----------
  const NEWS = [
    [ // Informed
      'Analysts note steady AI adoption; markets calm.',
      'Report: {nation} expands {card}. Officials call it "measured."',
      'Think tank publishes 300-page PDF. Nobody finishes it.',
      'Economists: AI productivity gains "real but uneven."',
    ],
    [ // Chronically Online
      'TRENDING: {nation} launched {card} and the replies are NOT okay.',
      'Thread (1/47): why the AI track is actually fine, probably.',
      'Poll: 61% of citizens say they "mostly trust" their advisor.',
      '{nation} officials "monitoring the situation" (they are posting).',
    ],
    [ // Doomscrolling
      'BREAKING: {nation}\'s {card} did something and we are "looking into it."',
      'Experts divided: is the track at {track} bad, or is it REALLY bad?',
      'Your advisor would like you to know it is "pretty sure." Of what, unclear.',
      'Scientists confirm the vibes are, quote, "off."',
    ],
    [ // Cooked
      'lowkey {nation} is cooked after the {card} thing fr fr',
      'no cap the track said {track} and everyone just kept building',
      'BREAKING: intel is fake now. not this intel tho. trust.',
      'leaked memo from {nation}: "we are so back" (they are not back)',
    ],
    [ // Fully Skibidi
      'SKIBIDI {nation} {card} RIZZ UPDATE: track {track}, aura -9000',
      'gyatt dayum the 8-ball is RIGHT THERE and bro built another one',
      'advisor briefing leaked: "ngl idk anymore, flip a coin king"',
      'sigma grindset confirmed: {nation} deploys first, reads later',
    ],
  ];
  const ADVISOR_PRE = [
    ['Intelligence assessment:', 'Analyst consensus:', 'Classified estimate:'],
    ['Okay so, our read is:', 'Sources (reliable-ish) say:', 'Hear me out:'],
    ['Look. LOOK.', 'Not to be dramatic but', 'My cousin at the lab says'],
    ['bro.', 'ngl', 'ok so lowkey'],
    ['SKIBIDI INTEL:', 'ur advisor (delulu) says', 'trust me bro:'],
  ];

  // ---------- State creation ----------
  function newGame(names, seed) {
    setSeed(seed);
    const deck = shuffle(CARDS.flatMap(c => Array(c.n).fill(c.id)));
    const objs = shuffle(OBJECTIVES.map(o => o.id));
    const S = {
      seed: seed == null ? null : seed,
      players: names.map((name, idx) => ({
        idx, name, res: { cap: 4, com: 2, en: 2 }, tableau: [], safetyTokens: 0,
        objective: objs[idx], clues: [], briefings: [], awards: 0, decommissioned: 0,
      })),
      yearIdx: 0, season: 'spring', actor: 0, startPlayer: 0,
      track: 0, line: ri(LINE_LO, LINE_HI), rot: 0, dna: 0, traits: [],
      market: [], deck, discard: [], checkpointsDone: [], mods: {}, clueDeck: [],
      event: null, log: [], news: [], privateQueue: [], gameOver: null,
      stats: { builds: { I: 0, D: 0, S: 0, C: 0 }, assessments: 0, decommissions: 0, incidents: [] },
    };
    for (let i = 0; i < 5; i++) S.market.push(S.deck.pop());
    S.clueDeck = shuffle(range(LINE_LO, LINE_HI).filter(v => v !== S.line));
    // opening private screens: everyone sees their secret objective
    S.players.forEach(p => S.privateQueue.push({ player: p.idx, kind: 'objective' }));
    startSpring(S);
    return S;
  }
  function year(S) { return YEARS[S.yearIdx]; }
  function log(S, msg) { S.log.push({ year: year(S), season: S.season, msg }); }
  function shownTrack(S) { return hasTrait(S, 'sandbagging', true) ? Math.max(0, S.track - 2) : S.track; }
  function hasTrait(S, id, onlyHidden) {
    const t = S.traits.find(t => t.id === id); if (!t) return false; return onlyHidden ? !t.revealed : true;
  }
  function addRot(S, n) { S.rot = Math.max(0, Math.min(10, S.rot + n)); }
  function pushTrack(S, n, byIdx, why) {
    if (S.gameOver || n <= 0) return;
    S.track = Math.min(TRACK_MAX, S.track + n);
    log(S, `AI track +${n} (${why}) → ${S.track}`);
    if (S.track >= S.line) {
      if (byIdx == null) {
        // the AI crossed on its own: blame the nation with the most spread; a tie means everyone loses
        const spreads = S.players.map(p => playerSpread(S, p)); const best = Math.max(...spreads);
        const blamed = S.players.filter((p, i) => spreads[i] === best);
        if (blamed.length === 1 && best > 0) { S.gameOver = { reason: 'sunk', sunkBy: blamed[0].idx, blamed: true }; log(S, `THE AI CROSSED THE LINE ON ITS OWN. ${blamed[0].name} ran the most deployments and takes the blame: they sank the 8-ball at ${S.track} (line was ${S.line}).`); }
        else { S.gameOver = { reason: 'ai', sunkBy: null }; log(S, 'THE AI CROSSED THE LINE ON ITS OWN and no single nation stands out. Everyone loses.'); }
      }
      else { S.gameOver = { reason: 'sunk', sunkBy: byIdx }; log(S, `${S.players[byIdx].name} SANK THE 8-BALL at ${S.track} (line was ${S.line}).`); }
      finalizeScores(S);
    }
  }

  // ---------- Clues (physical: Line deck 30-38, one sealed; the other 8 form the Clue deck) ----------
  function drawClue(S, p, source) {
    if (!S.clueDeck.length) return null;
    const v = S.clueDeck.pop();
    const text = `The line is NOT ${v}.`;
    p.clues.push({ text, source, year: year(S), value: v, truthful: true });
    return text;
  }
  // advisor statement: truthful => names a value that is not the line; lying => names the real line
  function advisorClue(S, truthful) {
    const v = truthful ? pick(range(LINE_LO, LINE_HI).filter(x => x !== S.line)) : S.line;
    return `Sources say the line is NOT ${v}.`;
  }
  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
  function giveClue(S, p, truthful, source) { return drawClue(S, p, source); }

  // ---------- Season flow ----------
  function startSpring(S) {
    S.season = 'spring'; S.mods = {};
    S.startPlayer = S.yearIdx % S.players.length;
    S.actor = S.startPlayer;
    S.event = pick(EVENTS);
    log(S, `${year(S)} — ${S.event.head}`);
    S.event.apply(S);
    if (S.gameOver) return;
    // spring income from infrastructure + base
    S.players.forEach(p => {
      const inc = springIncome(S, p);
      p.res.cap += inc.cap; p.res.com += inc.com; p.res.en += inc.en;
    });
    S.season = 'summer';
  }
  function springIncome(S, p) {
    const inc = { cap: 2, com: 0, en: 0 };
    p.tableau.forEach(id => { const c = CARD_BY_ID[id]; if (c.type === 'I') for (const k in c.yield) inc[k] += c.yield[k]; });
    return inc;
  }
  function playerOrder(S) { const n = S.players.length; return Array.from({ length: n }, (_, i) => (S.startPlayer + i) % n); }
  function currentPlayer(S) { return S.players[S.actor]; }

  // called after an action; advances actor / season
  function advance(S) {
    if (S.gameOver) return;
    const order = playerOrder(S);
    const pos = order.indexOf(S.actor);
    if (pos < order.length - 1) { S.actor = order[pos + 1]; return; }
    S.actor = order[0];
    if (S.season === 'summer') { S.season = 'autumn'; return; }
    if (S.season === 'autumn') { S.season = 'winter'; resolveWinter(S); }
  }

  // ---------- Actions ----------
  function cardCost(S, card) {
    const c = Object.assign({ cap: 0, com: 0, en: 0 }, card.cost);
    if (S.mods.comCostUp && c.com > 0) c.com += 1;
    if (S.mods.deployCostUp && card.type === 'D') c.cap += 1;
    if (S.mods.safetyDiscount && card.type === 'S') c.cap = Math.max(0, c.cap - 1);
    return c;
  }
  function canAfford(p, cost) { return p.res.cap >= cost.cap && p.res.com >= cost.com && p.res.en >= cost.en; }
  function decomCost(S) { return hasTrait(S, 'entrenched') ? 3 : 1; }

  function legalActions(S) {
    const p = currentPlayer(S); const acts = [];
    S.market.forEach((id, slot) => { if (canAfford(p, cardCost(S, CARD_BY_ID[id]))) acts.push({ type: 'build', slot }); });
    acts.push({ type: 'produce' });
    if (p.res.com >= 1 && S.clueDeck.length) acts.push({ type: 'assess' });
    if (p.res.cap >= 2 && p.res.com >= 1) acts.push({ type: 'fund' });
    if (p.res.cap >= decomCost(S)) p.tableau.forEach((id, i) => { if (CARD_BY_ID[id].type === 'D') acts.push({ type: 'decommission', index: i }); });
    acts.push({ type: 'pass' });
    return acts;
  }

  // returns {ok, msg, private?}
  function act(S, a) {
    if (S.gameOver) return { ok: false, msg: 'Game over.' };
    const p = currentPlayer(S); let res;
    switch (a.type) {
      case 'build': res = doBuild(S, p, a.slot); break;
      case 'produce': {
        const inc = springIncome(S, p); inc.cap += 1;
        p.res.cap += inc.cap; p.res.com += inc.com; p.res.en += inc.en;
        res = { ok: true, msg: `${p.name} produced +${inc.cap}$ +${inc.com}C +${inc.en}E.` }; break;
      }
      case 'assess': {
        p.res.com -= 1; S.stats.assessments++;
        const text = drawClue(S, p, 'Threat Assessment');
        res = { ok: true, msg: `${p.name} ran a Threat Assessment (drew a clue card).`, private: { title: 'CLUE CARD (always true)', body: text } }; break;
      }
      case 'fund': {
        p.res.cap -= 2; p.res.com -= 1; p.safetyTokens += 1;
        res = { ok: true, msg: `${p.name} funded safety research (+1 strength).` }; break;
      }
      case 'decommission': {
        const id = p.tableau[a.index]; if (!id || CARD_BY_ID[id].type !== 'D') return { ok: false, msg: 'Not a deployment.' };
        p.res.cap -= decomCost(S); p.tableau.splice(a.index, 1); S.discard.push(id); p.decommissioned++; S.stats.decommissions++;
        res = { ok: true, msg: `${p.name} decommissioned ${CARD_BY_ID[id].name}.` }; break;
      }
      case 'pass': res = { ok: true, msg: `${p.name} passed.` }; break;
      default: return { ok: false, msg: 'Unknown action.' };
    }
    if (!res.ok) return res;
    log(S, res.msg);
    advance(S);
    return res;
  }

  function doBuild(S, p, slot) {
    const id = S.market[slot]; if (!id) return { ok: false, msg: 'Empty slot.' };
    const card = CARD_BY_ID[id]; const cost = cardCost(S, card);
    if (!canAfford(p, cost)) return { ok: false, msg: 'Cannot afford.' };
    p.res.cap -= cost.cap; p.res.com -= cost.com; p.res.en -= cost.en;
    p.tableau.push(id); S.stats.builds[card.type]++;
    S.market[slot] = S.deck.length ? S.deck.pop() : null;
    if (!S.deck.length && S.discard.length) { S.deck = shuffle(S.discard); S.discard = []; if (!S.market[slot]) S.market[slot] = S.deck.pop(); }
    let msg = `${p.name} built ${card.name}.`; let priv = null;
    if (card.rot) addRot(S, card.rot);
    if (card.dna) S.dna += card.dna;
    if (card.onPlay === 'clue') { const t = drawClue(S, p, card.name); priv = t ? { title: `${card.name} — clue card`, body: t } : null; }
    if (card.onPlay === 'reveal') { const r = revealTrait(S, card.name); msg += r ? ` Revealed hidden trait: ${r}.` : ' (No hidden traits to reveal.)'; }
    return { ok: true, msg, private: priv };
  }

  function revealTrait(S, by) {
    const t = S.traits.find(t => !t.revealed); if (!t) return null;
    t.revealed = true; log(S, `Hidden AI trait revealed by ${by}: ${TRAIT_BY_ID[t.id].name}.`); return TRAIT_BY_ID[t.id].name;
  }

  // ---------- Winter ----------
  function playerSpread(S, p) {
    let s = 0; p.tableau.forEach(id => { const c = CARD_BY_ID[id]; if (c.spread) s += c.spread; if (c.spreadMod) s += c.spreadMod; });
    if (hasTrait(S, 'replicating') && count(p, 'D') >= 2) s += 1;
    return Math.max(0, s);
  }
  function playerSafety(S, p) {
    let s = p.safetyTokens + (S.mods.safetyBonus || 0);
    p.tableau.forEach(id => { s += CARD_BY_ID[id].strength || 0; });
    if (hasTrait(S, 'deceptive', true)) s -= 1;
    return Math.max(0, s);
  }
  function winterIncome(S, p) {
    const inc = { cap: 0, com: 0, en: 0 };
    p.tableau.forEach(id => { const c = CARD_BY_ID[id]; if (c.type !== 'I' && c.yield) for (const k in c.yield) inc[k] += c.yield[k]; });
    return inc;
  }

  function resolveWinter(S) {
    S.season = 'winter';
    const report = { year: year(S), pushes: [], incident: null, trait: null, news: [] };
    S.lastWinter = report;
    // 1. production + spread, in turn order (whoever's tick crosses the line sinks the 8-ball)
    for (const i of playerOrder(S)) {
      const p = S.players[i]; const inc = winterIncome(S, p); const sp = playerSpread(S, p);
      p.res.cap += inc.cap; p.res.com += inc.com; p.res.en += inc.en;
      report.pushes.push({ player: i, inc, spread: sp });
      if (sp) pushTrack(S, sp, i, `${p.name}'s deployments`);
      if (S.gameOver) return;
      S.dna += sp;
    }
    // 2. the AI acts on its own
    let auto = 1 + (hasTrait(S, 'agentic') ? 1 : 0) + (hasTrait(S, 'auto_research') ? 2 : 0); // base +1: AI is inevitable
    if (auto) pushTrack(S, auto, null, 'the AI, autonomously');
    if (S.gameOver) return;
    if (hasTrait(S, 'viral')) addRot(S, 1);
    // 3. AI evolves: buy at most one affordable trait it doesn't own
    const avail = TRAITS.filter(t => t.cost <= S.dna && !S.traits.find(x => x.id === t.id));
    if (avail.length) {
      const t = pick(avail); S.dna -= t.cost; S.traits.push({ id: t.id, revealed: !t.hidden });
      report.trait = t.hidden ? null : t.id; log(S, t.hidden ? 'The AI evolved a hidden trait.' : `The AI evolved: ${t.name}.`);
      if (t.hidden) report.hiddenEvolved = true;
    }
    // 4. incident checkpoints
    for (const cp of CHECKPOINTS) {
      if (S.track >= cp && !S.checkpointsDone.includes(cp)) {
        S.checkpointsDone.push(cp); report.incident = resolveIncident(S, cp);
      }
    }
    // 5. advisor briefings (private, unreliable)
    const acc = Math.max(0.2, 0.9 - 0.07 * S.rot - (hasTrait(S, 'persuasive') ? 0.2 : 0));
    S.players.forEach(p => {
      const truthful = rand() < acc;
      const pre = pick(ADVISOR_PRE[rotIdx(S.rot)]);
      const lineClue = advisorClue(S, truthful);
      let hiddenLine;
      const hidden = S.traits.some(t => !t.revealed);
      const sayHidden = rand() < acc ? hidden : !hidden;
      hiddenLine = sayHidden ? 'Something is off: the AI is hiding a capability.' : 'No evidence of hidden AI capabilities.';
      p.briefings.push({ year: year(S), text: `${pre} ${lineClue} ${hiddenLine}`, truthful, accuracy: acc });
      S.privateQueue.push({ player: p.idx, kind: 'briefing' });
    });
    // 6. news feed
    const stage = rotIdx(S.rot);
    for (let k = 0; k < 3; k++) {
      const p = pick(S.players); const card = p.tableau.length ? CARD_BY_ID[pick(p.tableau)].name : 'a committee';
      report.news.push(pick(NEWS[stage]).replace('{nation}', p.name).replace('{card}', card).replace('{track}', shownTrack(S)));
    }
    S.news = report.news;
    // 7. next year or end
    S.yearIdx++;
    if (S.yearIdx >= YEARS.length) { S.gameOver = { reason: 'survived', sunkBy: null }; log(S, 'January 1, 2030. The world did not end. Scoring.'); finalizeScores(S); return; }
    startSpring(S);
  }

  function resolveIncident(S, cp) {
    const n = S.players.length; const required = n * (CHECKPOINTS.indexOf(cp) + 2); // 2, 3, 4 per nation
    const safeties = S.players.map(p => playerSafety(S, p));
    const total = safeties.reduce((a, b) => a + b, 0);
    const best = Math.max(...safeties);
    const inc = { cp, required, total, safeties, defenders: [], hit: [], contained: total >= required };
    if (hasTrait(S, 'deceptive', true)) { S.traits.find(t => t.id === 'deceptive').revealed = true; inc.revealed = 'Deceptive'; }
    if (hasTrait(S, 'sandbagging', true)) { S.traits.find(t => t.id === 'sandbagging').revealed = true; inc.revealed = (inc.revealed ? inc.revealed + ' & ' : '') + 'Sandbagging'; }
    S.players.forEach((p, i) => { if (safeties[i] === best && best > 0) { p.awards += 3; inc.defenders.push(i); } });
    if (!inc.contained) {
      addRot(S, 1);
      const avg = total / n;
      S.players.forEach((p, i) => {
        if (safeties[i] < avg || (avg === 0)) {
          const di = p.tableau.findIndex(id => CARD_BY_ID[id].type === 'D');
          if (di >= 0) { const id = p.tableau.splice(di, 1)[0]; S.discard.push(id); inc.hit.push({ player: i, lost: CARD_BY_ID[id].name }); }
          else { const lost = Math.min(3, p.res.cap); p.res.cap -= lost; inc.hit.push({ player: i, lost: `${lost} Capital` }); }
        }
      });
    } else addRot(S, -1);
    S.stats.incidents.push({ cp, contained: inc.contained, total, required });
    log(S, `INCIDENT at ${cp}: world safety ${total}/${required} — ${inc.contained ? 'contained' : 'NOT contained'}.`);
    return inc;
  }

  // ---------- Scoring ----------
  function scorePlayer(S, p) {
    const cards = p.tableau.reduce((a, id) => a + CARD_BY_ID[id].vp, 0);
    const obj = OBJECTIVES.find(o => o.id === p.objective);
    const objective = obj.score(p, S);
    const leftovers = Math.floor((p.res.cap + p.res.com + p.res.en) / 4);
    const reputation = Math.floor(playerSafety(S, p) / 2);
    const sunk = S.gameOver && S.gameOver.sunkBy === p.idx;
    const total = sunk ? 0 : cards + p.awards + objective + leftovers + reputation;
    return { cards, awards: p.awards, objective, leftovers, reputation, total, sunk };
  }
  function finalizeScores(S) {
    S.scores = S.players.map(p => scorePlayer(S, p));
    if (S.gameOver.reason === 'ai') { S.scores.forEach(s => { s.total = 0; }); S.winner = null; return; }
    let best = -1, w = null;
    S.scores.forEach((s, i) => { if (!s.sunk && s.total > best) { best = s.total; w = i; } });
    S.winner = w;
  }

  return {
    CARDS, CARD_BY_ID, TYPE_NAME, OBJECTIVES, TRAITS, TRAIT_BY_ID, EVENTS, YEARS,
    TRACK_MAX, DANGER_LO, LINE_LO, LINE_HI, CHECKPOINTS, ROT_STAGES, rotStage, rotIdx,
    newGame, year, legalActions, act, currentPlayer, cardCost, canAfford, decomCost,
    springIncome, winterIncome, playerSpread, playerSafety, shownTrack, scorePlayer, setSeed, count,
  };
});
