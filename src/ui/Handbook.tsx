// The rulebook: a printable noir booklet. Facts come from the game data so it can't drift from the rules.
import { PANEL_ART } from '../comic/art';
import { DISTRICTS, GENERALS, OBJECTIVES, RES_COLORS, RES_NAMES, SPACES } from '../game/content';
import { CHECKINS, HUNGRY_PENALTY, MAX_AGENTS, RECRUIT_POINTS, ROUNDS } from '../game/engine';
import type { DistrictId, Res } from '../game/types';
import { RES } from '../game/types';
import { useGeneralPortrait } from '../toys/portraits';
import { BrainrotCard } from './BrainrotCard';
import { BagView, Meeple, ResIcon, Star } from './icons';

const RES_BLURB: Record<Res, string> = {
  grass: 'The last real thing. Keeps your agents grounded at Check-ins.',
  coolant: 'Rare. Siphoned off the Server Farm. The pricey brainrots want it.',
  pcb: 'Salvaged circuit boards. Every broadcast needs one.',
  glitter: 'The Mall’s currency. Pays bribes and recruits.',
  copper: 'Stripped from the Scrapyard. Wires every broadcast together.',
};

const DISTRICT_ORDER: DistrictId[] = ['park', 'serverfarm', 'scrapyard', 'mall', 'clinic', 'underground', 'tower'];

function Page({ n, children, className = '' }: { n?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={`hb-page ${className}`}>
      {children}
      {n !== undefined && <div className="hb-folio">{n}</div>}
    </section>
  );
}

function Art({ id, className = '' }: { id: string; className?: string }) {
  const src = PANEL_ART[id];
  return src ? <img className={`hb-art ${className}`} src={src} alt="" /> : null;
}

function Box({ title, children, tone = 'paper' }: { title?: string; children: React.ReactNode; tone?: 'paper' | 'ink' | 'gold' }) {
  return (
    <div className={`hb-box ${tone}`}>
      {title && <div className="hb-box-t">{title}</div>}
      {children}
    </div>
  );
}

function GeneralRow({ id }: { id: string }) {
  const g = GENERALS.find((x) => x.id === id)!;
  const url = useGeneralPortrait(id);
  return (
    <div className="hb-general">
      <div className="hb-general-face">{url && <img src={url} alt="" />}</div>
      <div>
        <b>{g.name}</b>
        <div className="hb-small">
          patrols {DISTRICTS[g.district].name} · toll <ResIcon r={g.toll} size={13} /> 1 {RES_NAMES[g.toll]}
        </div>
        <div className="hb-flavor">{g.flavor}</div>
      </div>
    </div>
  );
}

export function Handbook({ onClose }: { onClose?: () => void }) {
  const checkins = CHECKINS.join(' and ');
  return (
    <div className="hb">
      <div className="hb-bar">
        <span className="hb-bar-t">ROTMANIA 2048 · Rulebook</span>
        <button onClick={() => window.print()}>Print / save as PDF</button>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
      <div className="hb-pages">
        {/* ───────── cover ───────── */}
        <Page className="hb-cover">
          <Art id="splash" className="hb-cover-art" />
          <div className="hb-cover-text">
            <div className="hb-title">ROTMANIA</div>
            <div className="hb-sub">2048</div>
            <div className="hb-cover-k">RULEBOOK</div>
            <div className="hb-cover-meta">2–4 players · 30–45 minutes · ages 12+</div>
          </div>
        </Page>

        {/* ───────── story + goal ───────── */}
        <Page n={2}>
          <h2>The story so far</h2>
          <Art id="screens" className="hb-wide" />
          <p className="hb-cap">
            A strawberry squishy got thrown out of a car window, buried, and drank everything that leaked out of the data center built on top of it. It climbed out as <b>Darth Berry</b>. By 2048 it runs the city through every screen, and humans serve brainrots.
          </p>
          <p className="hb-cap">You lead a small resistance cell. You have {ROUNDS} nights.</p>
          <Box title="How you win" tone="gold">
            Over {ROUNDS} nights, send your agents into the city to gather supplies, turn brainrots to your side, grow your cell and hijack Darth Berry’s broadcasts. <b>After night {ROUNDS}, the cell with the most points <Star size={14} /> wins.</b>
          </Box>
          <Box title="The game in one breath">
            Take turns placing one agent at a time on a space in the city. Each space does one thing, and most fit only one agent a night, so <b>whoever gets there first gets it</b>. That’s the whole game: pick the right space before someone else does.
          </Box>
        </Page>

        {/* ───────── components ───────── */}
        <Page n={3}>
          <h2>What’s in the box</h2>
          <ul className="hb-list">
            <li><b>The city board.</b> 7 districts with {SPACES.length} spaces to place agents on.</li>
            <li>
              <b>Agents</b> <Meeple color="#e03131" /> <Meeple color="#1c7ed6" /> <Meeple color="#f59f00" /> <Meeple color="#7048e8" />: {MAX_AGENTS} per player. You start with 2.
            </li>
            <li><b>42 brainrot cards.</b> Brainrots you can turn into allies.</li>
            <li><b>6 generals.</b> Darth Berry’s officers. One patrols the city each night.</li>
            <li><b>17 secret objectives.</b> Private ways to score.</li>
            <li><b>First-player marker.</b></li>
          </ul>
          <h3>Resources</h3>
          <div className="hb-res">
            {RES.map((r) => (
              <div key={r} className="hb-res-row" style={{ borderColor: RES_COLORS[r] }}>
                <ResIcon r={r} size={28} />
                <div>
                  <b>{RES_NAMES[r]}</b>
                  <div className="hb-small">{RES_BLURB[r]}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="hb-small">Resources are unlimited. If you run out of tokens, use anything.</p>
        </Page>

        {/* ───────── card anatomy ───────── */}
        <Page n={4}>
          <h2>Reading a brainrot</h2>
          <div className="hb-anatomy">
            <BrainrotCard id="squalino" size="lg" />
            <ol className="hb-callouts">
              <li><b>Strength</b> <Star size={13} />: points it’s worth at the end if it’s your ally.</li>
              <li><b>Type</b>: Critter, Snack, Appliance, Icon or Squishy. Some objectives and powers count types.</li>
              <li><b>Cost</b>: what you pay to deprogram it at the Clinic.</li>
              <li><b>Ability</b>: what it does for you once it joins. The black label says <i>when</i>.</li>
            </ol>
          </div>
          <h3>Ability labels</h3>
          <table className="hb-table">
            <tbody>
              <tr><td className="lbl">EVERY DAWN</td><td>Gain the resources shown at the start of every night.</td></tr>
              <tr><td className="lbl">ON THE JOB</td><td>Extra resources when you use the named space.</td></tr>
              <tr><td className="lbl">NIGHT SHIFT</td><td>Once a night, it takes a space in its district, like a free extra agent.</td></tr>
              <tr><td className="lbl">CHECK-IN</td><td>Grounds that many agents for free at Check-ins.</td></tr>
              <tr><td className="lbl">WHEN TURNED</td><td>A one-time bonus the moment it joins.</td></tr>
              <tr><td className="lbl">ON AIR</td><td>Bonus points every time you broadcast.</td></tr>
              <tr><td className="lbl">ALWAYS</td><td>A rule it bends for you, all game.</td></tr>
              <tr><td className="lbl">AT THE END</td><td>Extra points during final scoring.</td></tr>
            </tbody>
          </table>
        </Page>

        {/* ───────── setup ───────── */}
        <Page n={5}>
          <h2>Setup</h2>
          <ol className="hb-steps">
            <li>Put the <b>city board</b> in the middle.</li>
            <li>
              Each player takes <b>2 agents</b> in their color (keep the other 3 nearby) and <b>1 <ResIcon r="copper" size={14} /> Copper, 1 <ResIcon r="glitter" size={14} /> Glitter and 2 <ResIcon r="grass" size={14} /> Grass</b>.
            </li>
            <li>Pick a first player. Going clockwise, the 2nd player takes 1 extra Grass, the 3rd takes 2 extra, and the 4th takes 3 extra.</li>
            <li>Shuffle the <b>secret objectives</b>. Deal each player 2; each keeps 1 face down and returns the other.</li>
            <li>Shuffle the <b>brainrots</b> and lay 5 face up in a row: the <b>Clinic lineup</b>. The leftmost is the newest.</li>
            <li>Shuffle the <b>generals</b> into a face-down stack. Flip the first onto its district: tonight’s patrol. Flip the next one beside the stack so everyone can see tomorrow’s.</li>
            <li>Put 2 Grass on Touch Grass, 1 Coolant on Siphon Coolant, 2 Copper on Strip Copper, 1 PCB on Salvage Boards and 2 Glitter on Glitter Run.</li>
          </ol>
          <Art id="basement" className="hb-wide" />
          <p className="hb-cap">“Grass. Copper. Coolant. Circuit boards. Glitter. They take what they can carry.”</p>
        </Page>

        {/* ───────── a night ───────── */}
        <Page n={6}>
          <h2>A night, start to finish</h2>
          <div className="hb-flow">
            <Box title="1 · Dawn" tone="ink">
              The lineup ages, piles grow, recruits arrive, dawn powers pay out.
            </Box>
            <div className="hb-arrow">→</div>
            <Box title="2 · Placement" tone="ink">
              Take turns placing one agent at a time until everyone is out.
            </Box>
            <div className="hb-arrow">→</div>
            <Box title="3 · Lights out" tone="ink">
              Check-in (nights {checkins} only), then take your agents back.
            </Box>
          </div>
          <h3>1 · Dawn</h3>
          <ul className="hb-list">
            <li><b>The lineup ages</b> (from night 2). If it’s full, the rightmost brainrot leaves. Slide the rest right and fill the gaps from the left with new ones.</li>
            <li><b>Piles grow</b> (from night 2). Add resources to the spaces that pile up, even if they still have some on them.</li>
            <li><b>Recruits arrive.</b> Agents you recruited last night are now ready.</li>
            <li><b>Dawn powers.</b> Allies with EVERY DAWN pay out.</li>
            <li><b>New patrol.</b> The next general takes over (see Patrols).</li>
            <li><b>First player.</b> Whoever took Morning Run last night goes first. Otherwise the marker passes left.</li>
          </ul>
        </Page>

        <Page n={7}>
          <h2>2 · Placement</h2>
          <ul className="hb-list">
            <li>Starting with the first player and going clockwise, place <b>one agent</b> on <b>one space</b>, then do what the space says right away.</li>
            <li>A space with an agent on it is <b>taken for the night</b>. A few spaces hold more (marked ×2, ×3), and <b>Odd Jobs</b> always has room.</li>
            <li>You can’t place on a space if you can’t pay what it costs.</li>
            <li>If you’re out of agents, skip your turn. The night continues until <b>everyone</b> has placed all their agents, so players with more agents keep going at the end.</li>
          </ul>
          <Box title="Example">
            It’s night 2. Rossa goes first and grabs <b>Strip Copper</b>, which has piled up to 4 Copper. Blu wanted it, so she takes <b>Salvage Boards</b> instead. Rossa’s second agent heads to the Clinic to deprogram a brainrot with that copper before anyone else can.
          </Box>
          <h3>3 · Lights out</h3>
          <ul className="hb-list">
            <li>After nights {checkins}: <b>Check-in</b> (below).</li>
            <li>Everyone takes their agents back.</li>
          </ul>
          <Art id="palanquin" className="hb-wide" />
        </Page>

        {/* ───────── the city ───────── */}
        <Page n={8} className="hb-dense">
          <h2>The city</h2>
          {DISTRICT_ORDER.map((d) => (
            <div key={d} className="hb-district">
              <div className="hb-district-h">
                {DISTRICTS[d].name}
                {d === 'underground' && <span className="hb-tag">never patrolled</span>}
              </div>
              {SPACES.filter((sp) => sp.district === d).map((sp) => {
                return (
                  <div key={sp.id} className="hb-space">
                    <b>{sp.name}</b>
                    {sp.cost && (
                      <span className="hb-cost">
                        pay <BagView bag={sp.cost} />
                      </span>
                    )}
                    {sp.fromRound && <span className="hb-tag">from night {sp.fromRound}</span>}
                    <div className="hb-small">{sp.text}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </Page>

        {/* ───────── allies ───────── */}
        <Page n={9}>
          <h2>Turning brainrots</h2>
          <p>
            At the <b>Clinic</b>, pick any brainrot in the lineup, pay its cost, and take it into your cell as an <b>ally</b>. Its ability works for you from now on, and its strength scores at the end. Its slot stays empty until dawn.
          </p>
          <ul className="hb-list">
            <li><b>Deprogram</b> holds one fewer agent than there are players (1 with 2 players, 3 with 4). <b>Back Door</b> holds 1 agent and costs an extra Glitter on top of the brainrot.</li>
            <li><b>Old brainrots are cheaper.</b> The two rightmost lineup slots cost 1 resource less: skip one resource of your choice from the cost. (The app skips the rarest one for you.)</li>
            <li><b>Waiting is a bet.</b> A brainrot nobody wants gets cheaper and then leaves at dawn.</li>
          </ul>
          <Box title="Night shift">
            Some allies can <b>work a night shift</b>: once a night, put the ally on a free space in its district instead of an agent. It counts as your worker there. It doesn’t use up one of your agents.
          </Box>
          <Box title="Growing your cell">
            <b>Recruit</b> (from night 2) costs 1 Grass and 1 Glitter. <b>Safehouse</b> (from night 4) costs 1 Grass. Take a new agent. It can’t be placed until the <b>next</b> night. Max {MAX_AGENTS} agents. Each agent beyond your first two is worth <b>{RECRUIT_POINTS} points</b> at the end.
          </Box>
          <Art id="generals" className="hb-tall" />
        </Page>

        {/* ───────── patrols, check-ins, broadcasts ───────── */}
        <Page n={10}>
          <h2>Patrols</h2>
          <p>
            Each night one general patrols one district. <b>Every space you use in that district costs 1 extra resource</b>: the general’s toll. Allies that say “Generals never charge you a toll” let you walk past.
          </p>
          <h2>Check-ins</h2>
          <p>
            After nights <b>{checkins}</b>, every agent you own (including ones recruited that night) needs <b>1 <ResIcon r="grass" size={14} /> Grass</b> to stay grounded. Allies with CHECK-IN ground some for free. Every agent you can’t ground costs <b>{HUNGRY_PENALTY} points</b> at the end.
          </p>
          <h2>Broadcasts</h2>
          <p>
            At the <b>Feed Tower</b> you score points right away:
          </p>
          <ul className="hb-list">
            <li>
              <b>Hijack the Feed</b>: pay <BagView bag={{ pcb: 1, copper: 1, coolant: 1 }} /> and score <b>2 + the night number</b> (3 on night 1, up to 8 on night 6).
            </li>
            <li>
              <b>Pirate Broadcast</b>: pay <BagView bag={{ glitter: 2, copper: 1 }} /> and score <b>3</b>.
            </li>
            <li>ON AIR allies add their bonus to every broadcast.</li>
          </ul>
          <Art id="skyline" className="hb-wide" />
        </Page>

        {/* ───────── scoring ───────── */}
        <Page n={11}>
          <h2>End of the game</h2>
          <p>The game ends after night {ROUNDS}’s Check-in. Add up:</p>
          <table className="hb-table score">
            <tbody>
              <tr><td>Allies</td><td>their strength <Star size={12} /></td><td className="ex">14</td></tr>
              <tr><td>Broadcasts</td><td>points scored at the Feed Tower</td><td className="ex">9</td></tr>
              <tr><td>Secret objectives</td><td>as written on each card</td><td className="ex">6</td></tr>
              <tr><td>Recruits</td><td>{RECRUIT_POINTS} per agent beyond your first 2</td><td className="ex">4</td></tr>
              <tr><td>End powers</td><td>allies marked AT THE END</td><td className="ex">2</td></tr>
              <tr><td>Leftovers</td><td>1 per 3 resources you still have</td><td className="ex">1</td></tr>
              <tr><td>Ungrounded</td><td>−{HUNGRY_PENALTY} per agent you couldn’t ground</td><td className="ex">−2</td></tr>
              <tr className="tot"><td>Total</td><td>Most points wins. Tie: most resources left.</td><td className="ex">34</td></tr>
            </tbody>
          </table>
          <p className="hb-small">(The right column is an example cell.)</p>
          <h2>Tips for your first game</h2>
          <ul className="hb-list">
            <li><b>Recruit early.</b> An agent on night 2 gets used every night after that.</li>
            <li><b>Watch the piles.</b> A space nobody has taken for two nights is a jackpot.</li>
            <li><b>Plan for Check-ins.</b> Count your Grass before night {CHECKINS[0]} ends.</li>
            <li><b>Look one night ahead.</b> Tomorrow’s patrol is always visible, so dodge its district or bring the toll.</li>
            <li><b>Your objective tells you what to collect.</b> Read it again on night 3.</li>
          </ul>
        </Page>

        {/* ───────── appendix ───────── */}
        <Page n={12} className="hb-dense">
          <h2>Appendix: the generals</h2>
          {GENERALS.map((g) => (
            <GeneralRow key={g.id} id={g.id} />
          ))}
        </Page>

        <Page n={13} className="hb-dense">
          <h2>Appendix: secret objectives</h2>
          <div className="hb-objs">
            {Object.values(OBJECTIVES).map((o) => (
              <div key={o.id} className="hb-obj">
                <b>{o.name}</b>
                <div className="hb-small">{o.text}</div>
              </div>
            ))}
          </div>
          <Box title="Quick reference" tone="ink">
            <ul className="hb-list tight">
              <li>{ROUNDS} nights. One agent per turn, clockwise. Most spaces fit one agent.</li>
              <li>Dawn: lineup ages · piles grow · recruits arrive · dawn powers · new patrol.</li>
              <li>Patrolled district: +1 resource toll per space.</li>
              <li>Check-in after nights {checkins}: 1 Grass per agent, or −{HUNGRY_PENALTY} each.</li>
              <li>Score: allies + broadcasts + objectives + recruits + end powers + leftovers/3 − ungrounded.</li>
            </ul>
          </Box>
        </Page>
      </div>
    </div>
  );
}
