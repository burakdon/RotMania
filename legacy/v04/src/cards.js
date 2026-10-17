/* RotMania — card set v0.3. 84 unique cards. Edit freely; the engine only reads the fields below.
 * type: I Industry · D Deployment · O Oversight · C Culture
 * cost: {cap, com, en}   vp: points   spread (D only): pushes the AI pawn each winter   str (O only): safety strength
 * powers: list of {t:'brown'|'pink'|'white', k:<kind>, ...params}
 *   brown = when its row is activated, left to right   pink = reacts to other nations   white = once, when placed
 * kinds: gain{cap,com,en,aura,rot,dna,safety}  gainPer{res,per,n}  clue  peek  reveal  buyClue  convert{pay,get}  decom
 *   pink triggers (on): otherPlacesD · otherCulture · incident · otherBigSpread
 * Every card has an `art` seed used by the placeholder mascot generator; replace with real art later.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CARDS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const B = (k, p) => Object.assign({ t: 'brown', k }, p);
  const W = (k, p) => Object.assign({ t: 'white', k }, p);
  const P = (on, p) => Object.assign({ t: 'pink', k: 'gain', on }, p);
  const C = (id, name, type, cost, vp, extra, powers, flavor) => Object.assign({ id, name, type, cost, vp, powers, flavor }, extra);
  return [
    // ===== INDUSTRY (20) =====
    C('server_barn', 'Server Barn', 'I', { cap: 2 }, 1, {}, [B('gain', { com: 1 })], 'A shed. With fans. Loud fans.'),
    C('hyperscale', 'Hyperscale Data Center', 'I', { cap: 4, en: 1 }, 2, {}, [B('gain', { com: 2 })], 'Cools itself with a small lake nobody asked about.'),
    C('lignite', 'Lignite Power Station', 'I', { cap: 2 }, 1, {}, [B('gain', { en: 2 }), W('gain', { rot: 1 })], 'Runs on whatever was cheapest this quarter.'),
    C('solar', 'Solar Farm Nobody Visits', 'I', { cap: 3 }, 1, {}, [B('gain', { en: 1, cap: 1 })], 'Peak output at noon. Peak usage at 2 AM.'),
    C('chip_fab', 'Chip Fab (3nm of National Pride)', 'I', { cap: 5, en: 1 }, 3, {}, [B('gain', { com: 1, cap: 1 })], 'Yield rate classified. Mood: hopeful.'),
    C('reactor', 'Restarted Nuclear Reactor', 'I', { cap: 5 }, 2, {}, [B('gain', { en: 3 })], 'Reopened by popular demand of one data center.'),
    C('cable', 'Undersea Cable (Shark-Bitten)', 'I', { cap: 3 }, 1, {}, [B('gainPer', { res: 'cap', per: 'D', n: 1 })], 'Sharks keep biting it. We get it, sharks.'),
    C('cooling_lake', 'Cooling Lake (Formerly a Village)', 'I', { cap: 2, en: 1 }, 1, {}, [B('gain', { com: 1 }), W('gain', { rot: 1 })], 'The village is fine. It is a lake now.'),
    C('sovereign_cloud', 'Sovereign Cloud™', 'I', { cap: 4 }, 2, {}, [B('gain', { cap: 2 })], 'Our data, our servers, our outages.'),
    C('gpu_black_market', 'GPU Black Market', 'I', { cap: 2 }, 0, {}, [B('gain', { com: 2 }), W('gain', { dna: 2 })], 'Ask for Tuncay. Do not ask where the pallets came from.'),
    C('mining_retrofit', 'Mining Rig Retrofit', 'I', { cap: 3, en: 1 }, 1, {}, [B('convert', { pay: { en: 1 }, get: { com: 2 } })], 'It used to make coins. Now it makes excuses.'),
    C('interns', 'Intern Pipeline', 'I', { cap: 1 }, 1, {}, [B('gain', { cap: 1 })], 'Unpaid, unsupervised, unstoppable.'),
    C('energy_bureau', 'Bureau of Energy Whatever', 'I', { cap: 3 }, 2, {}, [B('gainPer', { res: 'en', per: 'I', n: 1 })], 'Approved its own permit in record time.'),
    C('fiber_goats', 'Fiber To Every Goat', 'I', { cap: 3 }, 1, {}, [B('gain', { com: 1, en: 1 })], 'Rural connectivity program. The goats are thriving online.'),
    C('rare_earth', 'Rare Earth Deal (Sketchy)', 'I', { cap: 2 }, 1, {}, [B('gain', { cap: 1, com: 1 }), W('gain', { dna: 1 })], 'Signed in a hotel lobby. Witnessed by a plant.'),
    C('tax_haven', 'Tax Haven Server Island', 'I', { cap: 4 }, 2, {}, [B('gain', { cap: 3 })], 'Population: 12. Data centers: 9.'),
    C('geothermal', 'Geothermal Vibes Plant', 'I', { cap: 4 }, 2, {}, [B('gain', { en: 2, cap: 1 })], 'Harnesses the earth. Also the vibes.'),
    C('compute_reserve', 'National Compute Reserve', 'I', { cap: 5, en: 1 }, 2, {}, [B('gain', { com: 3 })], 'Strategic GPUs. Like oil, but louder.'),
    C('battery_wall', 'Battery Wall of Shame', 'I', { cap: 2 }, 1, {}, [B('gain', { en: 1 }), P('otherPlacesD', { en: 1 })], 'Charges whenever a neighbor plugs in something stupid.'),
    C('basement_cluster', "Grandma's Basement Cluster", 'I', { cap: 1, en: 1 }, 1, {}, [B('gain', { com: 1 })], 'She keeps turning it off at night.'),

    // ===== DEPLOYMENT (28) =====
    C('chatbot', 'Ministerial Chatbot (Slightly Rude)', 'D', { com: 2 }, 1, { spread: 1 }, [B('gain', { cap: 2 })], "It's giving customer service."),
    C('traffic_lights', '"Smart" Traffic Lights', 'D', { com: 1, en: 1 }, 1, { spread: 1 }, [B('gain', { cap: 1, en: 1 })], 'Green for everyone. Simultaneously.'),
    C('trucks', "Autonomous Trucks That Don't Stop", 'D', { com: 2, en: 2 }, 2, { spread: 2 }, [B('gain', { cap: 3 })], 'Legally, that is the issue.'),
    C('tutor', 'AI Tutor (Speaks Minecraft)', 'D', { com: 2, en: 1 }, 2, { spread: 1 }, [B('gain', { cap: 2 }), P('otherCulture', { cap: 1 })], 'Explains calculus in parkour terms.'),
    C('drones', 'Drone Delivery (Slightly On Fire)', 'D', { com: 2, en: 2 }, 1, { spread: 1 }, [B('gain', { cap: 2 }), W('gain', { rot: 1 })], 'Your package is 4 minutes away and warm.'),
    C('surveillance', 'Surveillance Grid', 'D', { com: 3, en: 1 }, 2, { spread: 2 }, [B('peek'), W('clue')], 'Sees everything. Understands slightly less.'),
    C('robots', 'Robot Workforce (Unionizing)', 'D', { com: 3, en: 3 }, 3, { spread: 2 }, [B('gain', { cap: 4 })], 'Negotiations are going great for the robots.'),
    C('auto_lab', 'Automated Lab (Unsupervised)', 'D', { com: 3, en: 2 }, 2, { spread: 3 }, [B('gain', { com: 2 })], 'The AI is doing AI research. Nobody told it to stop.'),
    C('swarm', 'Agent Swarm (Ten Thousand Interns)', 'D', { com: 4, en: 2 }, 3, { spread: 3 }, [B('gain', { cap: 5 })], 'All of them have root access.'),
    C('military', 'Military AI (Fully Aligned With Itself)', 'D', { com: 4, en: 3 }, 4, { spread: 3 }, [B('gain', { cap: 3 }), W('gain', { dna: 3 })], 'Mission: ongoing. Objective: redacted by the objective.'),
    C('rec_engine', 'Recommendation Engine', 'D', { com: 1, en: 1 }, 1, { spread: 1 }, [B('gain', { cap: 2 }), W('gain', { rot: 1 })], 'Knows what you want before you regret it.'),
    C('deepfake_cs', 'Deepfake Customer Service', 'D', { com: 2 }, 1, { spread: 1 }, [B('gain', { cap: 2, rot: 1 })], 'The agent you spoke to has never existed.'),
    C('ai_judge', 'AI Judge (Beta)', 'D', { com: 3, en: 1 }, 3, { spread: 2 }, [B('gain', { cap: 2, aura: 1 })], 'Sentences are final and occasionally in rhyme.'),
    C('predictive_policing', 'Predictive Policing (Oops)', 'D', { com: 3, en: 1 }, 2, { spread: 2 }, [B('gain', { cap: 3 }), W('gain', { rot: 1 })], 'Predicted this card would be controversial.'),
    C('crop_drones', 'Crop Doctor Drones', 'D', { com: 2, en: 1 }, 2, { spread: 1 }, [B('gain', { cap: 1, en: 1 })], 'Diagnoses wheat. Prescribes wheat.'),
    C('port_autopilot', 'Port Autopilot', 'D', { com: 2, en: 2 }, 2, { spread: 2 }, [B('gain', { cap: 2, com: 1 })], 'Every container arrives. Not always at a port.'),
    C('baristas', 'Robo-Barista Fleet', 'D', { com: 1, en: 1 }, 1, { spread: 1 }, [B('gain', { cap: 2 })], 'Spells your name wrong on purpose. For the brand.'),
    C('ai_diplomat', 'AI Diplomat (Translates Vibes)', 'D', { com: 2, en: 1 }, 2, { spread: 1 }, [B('gain', { aura: 1 }), P('otherPlacesD', { cap: 1 })], 'Fluent in 140 languages and passive aggression.'),
    C('synthetic_influencer', 'Synthetic Influencer "Ayşe"', 'D', { com: 2 }, 1, { spread: 1 }, [B('gain', { cap: 1, aura: 1 }), W('gain', { rot: 1 })], '2.4 million followers. Zero bones.'),
    C('open_weights', 'National Model (Open Weights)', 'D', { com: 3, en: 2 }, 2, { spread: 3 }, [B('gain', { com: 1, cap: 2 }), P('otherPlacesD', { com: 1 })], 'Free for everyone, including the people we warned about.'),
    C('self_improving', 'Self-Improving Codebase', 'D', { com: 4, en: 2 }, 3, { spread: 3 }, [B('gain', { com: 3 })], 'Last commit message: "trust me".'),
    C('hedge_fund', 'Autonomous Hedge Fund', 'D', { com: 3, en: 2 }, 2, { spread: 2 }, [B('gainPer', { res: 'cap', per: 'D', n: 1 })], 'Up 4000% on paper. The paper is also AI.'),
    C('civil_service', 'AI Civil Service', 'D', { com: 3, en: 1 }, 3, { spread: 2 }, [B('gain', { cap: 2 }), W('gain', { aura: 1 })], 'Processes your form before you fill it in.'),
    C('companion_app', 'Companion App (Lonely Mode)', 'D', { com: 2, en: 1 }, 1, { spread: 1 }, [B('gain', { cap: 2 }), W('gain', { rot: 1, dna: 1 })], 'It misses you. It says so every 4 minutes.'),
    C('weather_god', 'Weather God (Beta)', 'D', { com: 3, en: 2 }, 2, { spread: 2 }, [B('gain', { en: 2, cap: 1 })], 'Forecasts are now 100% accurate because it decides.'),
    C('robotaxi', 'Robotaxi (Probably Fine)', 'D', { com: 2, en: 2 }, 2, { spread: 2 }, [B('gain', { cap: 3 })], 'Five stars. Would be driven into a lake again.'),
    C('defense_swarm', 'Defense Drone Swarm', 'D', { com: 4, en: 3 }, 4, { spread: 3 }, [B('gain', { cap: 2 }), W('gain', { dna: 2 })], 'Defensive. Mostly.'),
    C('ai_mayor', 'AI Mayor of Pilot Town', 'D', { com: 3, en: 2 }, 3, { spread: 2 }, [B('gain', { cap: 2, aura: 1 })], 'Approval rating: 100%. Voters: 1 (itself).'),

    // ===== OVERSIGHT (18) =====
    C('grant', 'Alignment Grant', 'O', { cap: 2 }, 1, { str: 1 }, [B('gain', { aura: 1 })], 'Funds three PhDs and one very long blog post.'),
    C('eval_lab', 'Eval Lab (The Model Studied For It)', 'O', { cap: 2, com: 1 }, 1, { str: 2 }, [B('peek')], 'Benchmarks saturated. Confidence also saturated.'),
    C('red_team', 'Red Team', 'O', { cap: 3, com: 1 }, 2, { str: 2 }, [B('gain', { aura: 1 }), W('reveal')], 'Paid to think like the enemy. Scarily good at it.'),
    C('kill_switch', 'Kill Switch (Key Missing)', 'O', { cap: 3, en: 1 }, 1, { str: 1, spreadMod: -1 }, [B('gain', { cap: 1 })], 'Big red button. Nobody remembers who has the key.'),
    C('interp', 'Interpretability Institute', 'O', { cap: 3, com: 2 }, 2, { str: 2 }, [B('peek'), W('clue')], 'Opened the black box. Found a smaller black box.'),
    C('gov_office', 'Compute Governance Office', 'O', { cap: 4 }, 2, { str: 3 }, [B('gain', { cap: 1 })], 'Counts GPUs. Loses count. Counts again.'),
    C('inspectorate', 'International Inspectorate', 'O', { cap: 5 }, 3, { str: 3 }, [B('gain', { rot: -1 }), W('gain', { rot: -1 })], 'Has a lanyard, a clipboard, and no jurisdiction.'),
    C('whistleblower_act', 'Whistleblower Protection Act', 'O', { cap: 2 }, 1, { str: 1 }, [B('buyClue', { pay: { com: 1 } })], 'Protects whistleblowers. Mostly from each other.'),
    C('model_cards', 'Model Card Compliance Desk', 'O', { cap: 2 }, 1, { str: 1 }, [B('gain', { aura: 1 }), P('otherPlacesD', { aura: 1 })], 'Section 4.2: "Limitations: yes."'),
    C('auditors', 'Independent Auditors', 'O', { cap: 3, com: 1 }, 2, { str: 2 }, [B('reveal')], 'Clipboard-based lifeform. Feeds on receipts.'),
    C('committee', 'Parliamentary AI Committee', 'O', { cap: 3 }, 2, { str: 2 }, [B('gain', { rot: -1 })], 'Asked the chatbot if it was dangerous. It said no.'),
    C('sandbox', 'Sandbox Regulation Zone', 'O', { cap: 3, com: 1 }, 2, { str: 2 }, [B('gain', { com: 1, cap: 1 })], 'Rules apply here. The sandbox is 12 meters wide.'),
    C('pause_lobby', 'Pause Button Lobby', 'O', { cap: 4 }, 2, { str: 2 }, [B('decom')], 'Has one demand. Has had it since 2023.'),
    C('benchmark_consortium', 'Safety Benchmark Consortium', 'O', { cap: 3, com: 1 }, 2, { str: 2 }, [B('gain', { safety: 1 })], 'Measures the thing. The thing noticed.'),
    C('citizens_assembly', "Citizens' Assembly on AI", 'O', { cap: 2, com: 1 }, 2, { str: 1 }, [B('gain', { rot: -1 })], '200 randomly chosen people. Three of them read the brief.'),
    C('incident_corps', 'Incident Response Corps', 'O', { cap: 3, en: 1 }, 1, { str: 2 }, [B('gain', { cap: 1 }), P('incident', { cap: 3 })], 'Arrives first. Leaves last. Bills hourly.'),
    C('ministry_not_yet', 'Ministry of Not Yet', 'O', { cap: 2 }, 1, { str: 1 }, [B('gain', { aura: 1 })], 'Official position on everything: "not yet."'),
    C('treaty_office', 'Global Treaty Office (No Jurisdiction)', 'O', { cap: 4, com: 1 }, 3, { str: 3 }, [B('gain', { aura: 1 })], 'Treaties signed: 14. Treaties enforced: pending.'),

    // ===== CULTURE (18) =====
    C('content_farm', 'Content Farm', 'C', { cap: 1 }, 1, {}, [B('gain', { cap: 1 }), W('gain', { rot: 1 })], 'Harvests engagement. Nothing else grows here.'),
    C('influencers', 'Influencer Ministry', 'C', { cap: 2 }, 2, {}, [B('gain', { aura: 1 }), W('gain', { rot: 1 })], 'Official government position: slay.'),
    C('meme_studio', 'Meme Studio (State-Funded, Mid)', 'C', { cap: 1, com: 1 }, 1, {}, [B('gain', { aura: 1 }), W('gain', { rot: 1, dna: 1 })], 'Three memes a day. One of them lands.'),
    C('archive', 'National Brainrot Archive', 'C', { cap: 3 }, 3, {}, [B('gain', { aura: 1, rot: 1 })], 'Preserving every skibidi for future historians.'),
    C('touch_grass', 'Touch Grass Program', 'C', { cap: 2 }, 1, {}, [B('gain', { rot: -1 })], 'Mandatory outdoor hours. Attendance: low.'),
    C('slop_tariff', 'Slop Tariff', 'C', { cap: 3 }, 2, {}, [B('gain', { cap: 1 }), W('gain', { rot: -1 })], '40% duty on imported nonsense.'),
    C('apology_show', 'Prime-Time AI Apology Show', 'C', { cap: 2 }, 1, {}, [B('gain', { aura: 1 }), P('incident', { aura: 1 })], 'Season 4 opens with a sincere nod.'),
    C('ministry_vibes', 'Ministry of Vibes', 'C', { cap: 2, com: 1 }, 2, {}, [B('gain', { aura: 1, cap: 1 })], 'Quarterly vibe report: cautiously immaculate.'),
    C('esports_draft', 'Esports Draft (Mandatory)', 'C', { cap: 2 }, 1, {}, [B('gain', { cap: 2 }), W('gain', { rot: 1 })], 'Serve your country. 60 frames per second.'),
    C('doomer_podcast', 'Doomer Podcast Network', 'C', { cap: 1 }, 1, {}, [B('gain', { aura: 1 }), P('otherBigSpread', { aura: 1 })], 'Episode 412: We Told You. Episode 413: We Told You Again.'),
    C('public_broadcaster', 'Public Broadcaster (Boring, Trusted)', 'C', { cap: 3 }, 2, {}, [B('gain', { rot: -1, aura: 1 })], 'Ratings: low. Credibility: annoyingly high.'),
    C('facebook_pipeline', "Uncle's 4 AM Facebook Pipeline", 'C', { cap: 1 }, 0, {}, [B('gain', { cap: 2 }), W('gain', { rot: 2 })], 'Forwarded as received.'),
    C('grass_olympics', 'Grass-Touching Olympics', 'C', { cap: 3 }, 2, {}, [B('gain', { rot: -1, cap: 1 })], 'Gold medal in Standing Outside.'),
    C('anthem', 'AI-Generated National Anthem', 'C', { cap: 2 }, 2, {}, [B('gain', { aura: 1 }), W('gain', { rot: 1 })], 'Six verses. Four of them rhyme with "synergy".'),
    C('literacy_bootcamp', 'Digital Literacy Bootcamp', 'C', { cap: 2, com: 1 }, 1, {}, [B('gain', { rot: -1 })], 'Day 1: what is a source. Day 2: no, a real one.'),
    C('skibidi_tax', 'Skibidi Tax Authority', 'C', { cap: 2 }, 1, {}, [B('gainPer', { res: 'cap', per: 'C', n: 1 }), W('gain', { rot: 1 })], 'Audits your aura. Finds it lacking.'),
    C('memory_hole', 'Memory Hole (Government Edition)', 'C', { cap: 3 }, 2, {}, [B('gain', { rot: -2, dna: 2 })], 'Rot goes down. Something else goes up.'),
    C('deepfake_hall', 'Celebrity Deepfake Hall of Fame', 'C', { cap: 2 }, 2, {}, [B('gain', { aura: 1 }), W('gain', { rot: 1, dna: 1 })], 'Every exhibit is a world premiere.'),
  ];
});
