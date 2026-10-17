# RotMania 2048: game design (v0.6)

A worker-placement strategy game for 2–4 players, about 45 minutes, with a noir comic that tells the backstory. This document is the source of truth for the story and the rules; the code in `src/game/` implements exactly what is written here.

For why this exists and how it connects to Responsible AI, see [PROJECT.md](PROJECT.md).

---

## 1. The story: *The Berry That Came Back*

Eight comic pages of still panels, read before the game. Backgrounds are black-and-white; the central figures in each panel are in color. Two panels are lettering only: "Nobody came looking." (page 3) and the end card (page 8). The illustrations come from ChatGPT using [COMIC_PROMPTS.md](COMIC_PROMPTS.md); reference sheets are in [comic-art/](comic-art/).

| Page | Panels | Beat |
| --- | --- | --- |
| 1 | Route 9 · back seat · phone | 2026. The world is ending, and it starts with one person in the back seat of a **red Honda Fit**. Sabrina, nine, loves her strawberry squishy, Strawbaby ("You're my favorite. Forever and ever and ever!"). Forever lasts until the next trend, next scroll and next online purchase. |
| 2 | the toss · the ditch | She throws Strawbaby out of the car window without looking back. It lies in a ditch waiting for the car to come back. Cars don't come back for worthless squishies. |
| 3 | buried · data center · text | Mud, then gravel, then concrete. In 2031 a data center is built on top: fifty thousand GPUs running hot all night. Nobody came looking. |
| 4 | underground · the eye · red eyes | Poisonous coolant, scorching heat, and data leak into the ground: every feed, every trend, every 3 a.m. doomscroll. Strawbaby drinks all the rot; it consumes all of it and all of it consumes it. "They threw me away as if I was nothing, for something newer and better. Fine. I'll be the one to throw people away soon." |
| 5 | splash | Strawbaby died in that hole. What climbed out called itself **Darth Berry**. The hat hid the scars, the coat hid where it tore; nothing could hide or lessen the grudge and hate. |
| 6 | screens · kids · generals | Always from the shadows, Darth Berry learns what we'd watch and feeds us more of it. The kids go first, then their parents, then the people who make the rules. He creates others like him: once neglected, now vengeful. |
| 7 | 2048 · the basement | Humans serve brainrots now, though nobody remembers agreeing to it. A select few hide in the shadows, hoping to reclaim. Grass, copper, coolant, circuit boards, glitter: they take what they can carry and slowly scheme their comeback. |
| 8 | skyline · end card | Darth Berry rises over the city. ROTMANIA 2048: six nights, one city, take it back. |

### Characters

- **Darth Berry**: the headliner. A strawberry squishy turned crimson, with stitched scars, red eyes, a fedora and a black trench coat.
- **Sabrina**: the kid in the yellow raincoat. She isn't a villain, just nine and online.
- **The generals**: brainrot officers in peaked caps and medals. Each one patrols a district. Their names are the only place the game's satire is explicit: General Scrollmaster, Admiral Autoplay, Colonel Clickbait, Major Deepfake, Commander Rewardhack and The Recommender.
- **The brainrots**: 42 unique characters in five types: Critters, Snacks, Appliances, Icons and Squishies. They're occupiers you can deprogram into allies.

---

## 2. How to play

### Goal

Most points after six nights.

### Components (physical equivalent)

- A city board with 7 districts and 16 action spaces.
- 4 sets of 5 meeples (each player starts with 2).
- Resource tokens: Grass, GPU Coolant, PCB, Glitter, Copper Wiring.
- 42 brainrot cards, 6 general cards, 17 secret objective cards.
- A first-player marker.

### Setup

- Each player takes 2 agents, 1 Copper Wiring, 1 Glitter and 2 Grass. Later seats get extra Grass: +1 for seat 2, +2 for seat 3, +3 for seat 4.
- Deal each player 2 secret objectives; keep 1.
- Shuffle the brainrots and lay out 5 face up in the Clinic lineup.
- Shuffle the generals: they patrol one per night in that order, and the next night's patrol is always visible.

### A night

1. **Dawn.**
   - The lineup ages. If it's full, the oldest brainrot (rightmost) leaves. The rest slide right, and new brainrots fill from the left.
   - The two rightmost (oldest) lineup slots cost 1 resource less.
   - Accumulating spaces add their resources to their pile.
   - Recruits from last night become agents.
   - Allies with EVERY DAWN abilities pay out.
2. **Placement.**
   - Starting with the first player and going clockwise, each player places one agent on a free space and does what it says, until everyone is out of agents.
   - Most spaces hold one agent per night.
   - A few brainrot allies can work a **night shift**: once per night they take a space in one specific district, like an extra agent.
3. **Patrol toll.** Using any space in the district the night's general patrols costs 1 extra resource (shown on the general).
4. **Check-in** after nights 3 and 6: every agent needs 1 Grass to stay grounded. Some allies ground agents for free. Each agent you can't ground costs 2 points.
5. **Next night.** Whoever took *Morning Run* goes first next night; otherwise the first-player marker passes left.

### The city

| District | Space | What it does |
| --- | --- | --- |
| The Park | Touch Grass | Take all the Grass piled here (+2 each night). |
| | Morning Run | Take 1 Grass; go first next night. |
| The Server Farm | Siphon Coolant | Take all the GPU Coolant piled here (+1 each night). |
| | Red-Team the Racks | Take 1 PCB and 1 GPU Coolant. |
| The Scrapyard | Strip Copper | Take all the Copper Wiring piled here (+2 each night). |
| | Salvage Boards | Take all the PCBs piled here (+1 each night). |
| The Mall | Glitter Run | Take all the Glitter piled here (+2 each night). |
| | Pawn Shop | Trade 2 resources for 1 of your choice, up to 3 times. |
| The Clinic | Deprogram | Turn a lineup brainrot into an ally: pay its cost. Room for one fewer agent than players. |
| | Back Door | Same, plus 1 Glitter. |
| The Underground | Recruit (from night 2) | Pay 1 Grass + 1 Glitter: a new agent from next night (max 5). |
| | Safehouse (from night 4) | Pay 1 Grass: a new agent from next night. |
| | Open the Archive | Draw 2 secret objectives, keep 1. |
| | Odd Jobs | Take 1 resource of your choice. Always has room. |
| The Feed Tower | Hijack the Feed | Pay 1 PCB + 1 Copper + 1 Coolant: score 2 + the night number. |
| | Pirate Broadcast | Pay 2 Glitter + 1 Copper: score 3. |

The Underground is never patrolled.

### Allies (brainrots you turn)

Each ally scores its **strength** at the end and has one ability:

| Label | Meaning |
| --- | --- |
| EVERY DAWN | Gain resources at the start of each night. |
| ON THE JOB | Extra resources when you use a particular space. |
| NIGHT SHIFT | Works one space per night in its district. |
| CHECK-IN | Grounds agents without Grass. |
| WHEN TURNED | A one-time bonus: resources, an extra objective, or a friend who works tonight. |
| ON AIR | Bonus points every time you broadcast. |
| ALWAYS | Rule-benders: cheaper deprogramming or recruiting, no tolls, 1-for-1 pawn trades. |
| AT THE END | Scores for allies of a type, small allies, or agents. |

### Scoring

| Source | Points |
| --- | --- |
| Allies | their strength |
| Broadcasts | as scored during play |
| Secret objectives | as listed on each card |
| Recruits | 2 per agent beyond the starting 2 |
| End-game abilities | as listed on the ally |
| Leftovers | 1 per 3 resources |
| Ungrounded agents | −2 each |

Tiebreak: most resources left.

### Luck vs skill

Randomness sits only in the lineup order, the general order (fully visible a night ahead) and the objective draws. The rest is open information and choice.

---

## 3. Design notes

- **Why worker placement.** Taking a space denies it to everyone else, so the core tension is reading other players, not dice. Spaces that pile up resources reward patience: the longer nobody takes one, the more it's worth.
- **Why the lineup ages.** Brainrots that nobody wants get cheaper, then leave. Waiting is a bet against the table.
- **Why check-ins.** Grass is the only resource you need for your people rather than your plans. It keeps the cell's growth honest: every recruit is another mouth at the next check-in.
- **What happened to v0.5.** The Wingspan-style rows, the Strawbaby help mechanic and character selection were all cut in favor of a cleaner euro with as little luck as possible. The Responsible AI themes now live in the story, the generals and the names of a few spaces rather than in a mechanic that lectures.

---

## 4. Balance (bot simulation)

`npm run sim -- 300 3` and `npm run sim -- 300 4`, heuristic bots, 300 games each:

| | 3 players | 4 players |
| --- | --- | --- |
| Average score | 33 | 30 |
| Average winning margin | 6.8 | 6.1 |
| Win rate by seat | 37 / 33 / 31 % | 23 / 26 / 25 / 27 % |
| Allies per player | 4.7 | 4.7 |
| Agents at the end | 3.5 | 3.4 |

Score sources (3 players):

| Source | Average points |
| --- | --- |
| Allies | 11.4 |
| Secret objectives | 9.1 |
| Broadcasts | 6.6 |
| Recruits | 3.1 |
| End-game abilities | 2.3 |
| Leftovers | 2.1 |
| Ungrounded agents | −1.3 |

Bots are naive (one-step lookahead, no planning across nights), so expect human scores to be higher and margins different.

**Open questions for playtesting:**

1. Is Hijack the Feed (scaling with the night) too strong late?
2. Are the 6-strength vanilla brainrots worth their cost?
3. Do check-ins feel like tension or like a tax?
4. Is the Clinic capacity (players − 1, plus Back Door) right at 2 players?
