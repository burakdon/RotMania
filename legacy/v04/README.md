# RotMania: Reclamation (prototype v0.4)

A physical board game, 2–4 players, ~45–60 minutes. 2041: the internet drowned in AI slop and the Slop grew a face. You lead a campfire on the rim of a spiral world and reclaim it inward, toward the **Last Real Thing** at the center, while the Slop rots it back from the middle.

This repo is the **digital playtest stand-in**: the screen mirrors the physical table (spiral board, tiles, tokens, cards) plus the companion phone that holds hidden information in the hybrid design. Open `rotmania.html` on a laptop. Older designs are in `legacy/`.

## The pitch in one paragraph

An expansion game with an enemy at the edges instead of a tax on your own moves. Land you reclaim does not stay reclaimed: every round the Slop takes undefended frontier tiles back. Buildings hold clusters. Buried in the inner rings are relics: safe pre-collapse tech, and AI relics that are far stronger but roll the Slop die every use (Tide rises, a tile of yours rots, or the Slop evolves). The Tide is the clock. Win at Lucidity 10, or hold the center through a Slop phase while the world's defenses hold.

## Rules (short)

**Board.** Five concentric rings: center (1 tile, the Last Real Thing), 6, 8, 10, 12 wedges. Each ring's tiles are drawn randomly from that ring's bag at setup (resources, relic sites ◆/⚡, slop pits). Everything starts rotted; the rim is face-up, inner rings face-down. Each survivor starts on a rim tile with a Camp.

**Resources.** Grass, Real Bricks, Vintage GPUs, Sourdough, Aura.

**Round.**
1. **Trend.** Flip a Trend card: two resources are trending; every reclaimed tile of those types produces 1 (+1 with a building). Everyone also gets 1 Grass, and your home tile always produces. Three cards say *Slop is trending*: nothing produces, Tide +1, the Slop spreads one extra tile.
2. **Actions.** Two per survivor, in turn order (start player rotates):
   - **Reclaim** a rotted tile touching your land. Cost by ring: rim 1 Grass; ring 3 +1 Bricks; ring 2 +1 GPU; ring 1 2 Grass, Bricks, GPU, Aura; center 2 Grass, 2 GPU, 2 Aura. Flip it; relic sites give you the relic.
   - **Build** Camp (1 Bricks, 1 Sourdough) → Commune (+1 GPU, 1 Aura) → Capital (+2 Bricks, GPU, Aura, Sourdough). Defense 1/2/3 on the tile and +1/+1/+2 to neighbors you own.
   - **Touch grass** (1 Grass): +1 defense on a tile this round.
   - **Buy a build card** (1 GPU, 1 Aura, 1 Sourdough). Play cards any time on your turn, free.
   - **Trade** 3:1 with the bank (player trades are physical-only for now).
   - **Use a relic** (free, once per round). AI relics roll the Slop die: 1–2 nothing · 3–4 Tide +1 · 5 the Slop takes a tile of yours · 6 the Slop evolves.
3. **Slop phase.** Tide +1. The Slop takes N undefended frontier tiles (N = 1, +1 past Tide 10, +1 if Memetic, +1 if Slop trending); freshly reclaimed tiles are safe this round. At Tide 5/10/15 the **Tide** hits: world Grass (all defenses) must reach 0.6 × Tide × players. Held → the strongest defender earns a Clean Signal (+1 Lucidity). Broke → below-average survivors lose their weakest tile. Either way the Slop evolves: Memetic, Hungry (breaks defense 1), Persuasive (scouting lies), Viral.

**Lucidity.** Ring 3 tiles 1, ring 2 tiles 2, ring 1 tiles 3, center 4; Commune +1, Capital +2; restored relic site +1; Clean Signals; Library cards; Printing Press / Analog Library. **First to 10 wins.** Holding the center through a Slop phase while world Grass ≥ Tide strength wins immediately. If the Tide reaches 20, the Slop takes the world and the most lucid survivor wins by default.

## Physical components the screen mirrors

| Component | Physical | On screen |
| --- | --- | --- |
| Board | A dartboard-style spiral: 5 rings of wedge slots, Tide track along the rim, trait slots, trend slot | SVG board |
| Tiles | 37 wedge tiles in 5 ring shapes, face-down with a Rot token on top; flip to reclaim | Wedges; `?` = unexplored |
| Tokens | Resources (5 kinds), grass tokens, firewall tokens, player buildings ▲ ⌂ ★, Slop pawn | Same icons |
| Trend deck | 10 pairs + 3 Slop cards | Trend card |
| Build deck | 15 cards | Phone shows your hand |
| Relic cards | 5 safe, 5 AI | Mat shows relics |
| Companion phone | Scouting reports (may lie), cards drawn, relic text | Right panel |

Physical envelope trick from v0.2 is gone; the hidden information is now scouting, which the phone handles (the Slop lies through it when Persuasive).

## Balance (bot simulation, 200 games)

| Table | Lucidity win | Center win | Slop wins |
| --- | --- | --- | --- |
| 4 players | 87% | 2% | 12% |
| 3 players | 87% | 1% | 12% |

Games last ~10 rounds. The building-first bot wins most; the relic-rushing bot wins 20% at 4 players. Run `node sim/simulate3.js`.

## Files

```
rotmania.html        # v0.4 table version (built, self-contained)
src/engine3.js       # rules; no DOM; runs in browser and Node
src/table3.html      # table UI
build.js             # node build.js → rotmania.html + legacy/
sim/simulate3.js     # node sim/simulate3.js [games] [players]
sim/table3-smoke.js  # node sim/table3-smoke.js (needs: npm i jsdom)
legacy/              # v0.1 phone, v0.2 table, v0.3 Wingspan-style — earlier designs, kept for the write-up
```

## Design notes

- **Why the map rots back:** territory as a front line, not a pile. It gives the race-against-the-clock feel spatially and makes defense a real choice.
- **Why relics are optional:** the AI temptation survives from earlier designs, but as an accelerant you can refuse, not an engine you must run.
- **The Slop is run by the app:** it chooses which undefended tiles to take, evolves, rigs nothing yet (trend rigging is a planned trait), and writes the feed in its own voice.
- **Responsible AI reading:** recovery after epistemic collapse; AI tools as double-edged accelerants; defense as a public good (your Grass protects everyone's Tide check). Logs record every relic use and Slop die result.

## Known limitations

- No player-to-player trading in the digital version.
- Tile art and the Slop's look are placeholders.
- Bot-balanced only; human playtests needed.
- Some relic/card targets are auto-chosen (Oracle picks the nearest unexplored ring, Drone Depot the innermost frontier tile).
