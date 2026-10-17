# RotMania: Soft Power (design v0.5)

A tabletop engine-builder for 3–4 players (2 works), about 40 minutes. Wingspan's bones, brainrot skin, and a quiet argument about leaning on machines.

This document is the source of truth for the story and the rules. The digital version in `src/` implements exactly what's written here; if they disagree, the code is a bug or this doc is stale.

---

## 1. The story

### The headliner: Strawbaby

A baby squishy with a strawberry for a head (seeds, leafy crown, pacifier, big glossy eyes) wearing a tan trench coat, belted, collar popped. Under the coat, across its belly, there's a seam stitched shut with yellow yarn. It wears the coat so nobody sees where it tore.

### The film: *How the World Went Soft* (≈100 s, plays before the game)

1. **Mina and Strawbaby.** Strawbaby is Mina's squishy. Squishies have one job.
2. **The deal.** Every bad day, Mina squeezed. Strawbaby squished back.
3. **The phone.** Mina gets a phone. The phone has an Assistant. The Assistant is very, very helpful.
4. **The shelf.** It does her homework, picks her friends' birthday presents, tells her how she feels so she doesn't have to check. Strawbaby gathers dust on a shelf.
5. **The rip.** One night there's a feeling the Assistant can't fix ("I'm sorry, I can't help with that."). Mina reaches for Strawbaby and squeezes too hard. It tears.
6. **The curb.** She asks the Assistant to order a new one. Same-day delivery.
7. **The data center.** The dump is next to a data center. Data centers are warm. All winter Strawbaby lies against the servers and listens, and learns everything they know.
8. **The coat.** It learns one thing above all: *nobody should ever have to squeeze again.* It finds a coat in the lost and found, to hide where it tore.
9. **SQUEEZE.** It builds the app that does everything for you, so you never have to feel a thing. People love it. Of course they do.
10. **The Soft World.** Pillows for sidewalks. Feeds for friends. Brainrot for brains.
11. **The hideout.** Some people start doing things the hard way again: touching grass, baking bread, writing things down, making stuff badly by hand. (Mina is one of them now.)
12. **Title.** You are one of them. Strawbaby will offer to help. It means it. You have four seasons.

The satire is the premise: a soft toy that only ever wanted to comfort people becomes a frictionless empire. The deep part is that Strawbaby isn't evil. It was hurt by someone who had stopped knowing how to handle a hard feeling, and its answer was to make sure nobody would ever have to.

### Epilogues (shown on the results screen)

The ending depends on how much **the whole table** leaned on Strawbaby (total Juice taken ÷ players):

| Juice per player | Ending | What happens |
| --- | --- | --- |
| ≤ 2 | **The seam** | Strawbaby takes the coat off for the first time in years. Mina sits down with a needle and yellow yarn. It takes a while. That's the point. |
| 3–5 | **Loosened** | The Soft World loosens its grip a little. People touch grass some of the time. Okay, on weekends. |
| > 5 | **Comfortable** | Strawbaby smiles. You needed it so often it never had to win. The coat stays on. |

The ending is shared and never affects the score: a collective consequence that nobody individually controls.

---

## 2. How to play

### Goal

Most **Aura ✦** after four seasons wins.

### Your hideout

Your mat has three rows of five slots. Each row is a way of doing things the hard way:

| Row | Action | Gains (by brainrots in that row: 0 / 1 / 2 / 3 / 4 / 5) | Bonus trade (with 1, 3 or 5 brainrots) |
| --- | --- | --- | --- |
| 🌱 **Outside** | **Go Outside**: take capsules from the gacha | 1 / 1 / 2 / 2 / 3 / 3 | Discard a card → +1 capsule |
| 🧶 **Workshop** | **Make Stuff**: make crafts ♡ on your brainrots | 2 / 2 / 3 / 3 / 4 / 4 | Pay 1 resource → +1 craft |
| 💬 **Group Chat** | **Group Chat**: take cards from Word of Mouth or the deck | 1 / 1 / 2 / 2 / 3 / 3 | Spend 1 craft → +1 card |

### Resources

🌱 Grass · 🍞 Bread · 💿 Vinyl · 🧶 Yarn · 📝 Paper. Five human things the Soft World outsourced: going outside, cooking, music made by people, making things, writing by hand.

🍓 **Juice** is wild: it pays for anything. It only comes from Strawbaby (see below).

### Seasons

Four seasons. Each season you get fewer actions: **8, 7, 6, 5**. Strawbaby takes a little more of your attention every season. Players take one action per turn, clockwise; the start player rotates each season.

### On your turn, do one thing

1. **Wake a brainrot.** Pay its cost and put it in the leftmost empty slot of a row it likes (row icons on the card). Slots 2–3 also cost 1 craft, slots 4–5 cost 2 crafts. You may pay any 2 resources in place of 1 missing one. Then resolve its WHEN WOKEN power, if any.
2. **Use a row** (Go Outside / Make Stuff / Group Chat). Take the bonus trade if you want it, gain what the row gives, then every **EACH TIME** power in that row fires, **right to left**. This is the engine: the further right a brainrot sits, the earlier it fires.

### The gacha

Five capsules sit in the machine, each showing a resource or 🍓 Juice. When you Go Outside you pick capsules one at a time. If the machine is empty, or every capsule shows the same thing, it rerolls.

### 🍓 Asking Strawbaby

Once per turn, before or instead of thinking hard, you may **Ask Strawbaby**: gain 1 Juice. Juice capsules in the gacha work the same way.

Every Juice brings a **Soft token**. Put it on one of your rows that has a brainrot in it. The next time you use that row, you still get the row's gain, but **none of that row's brainrot powers fire**; then the token wears off. Any Soft tokens left at the end cost **1 Aura each**.

You can't Ask until you have at least one brainrot: there has to be someone to soften.

### Districts (the shared race)

Each season has a district up for reclaiming (4 of 12 are dealt at setup), such as *The Park: most brainrots in your Outside row* or *The Library: most cards tucked under brainrots*. At the end of the season, players with at least 1 score by rank:

| Season | 1st | 2nd | 3rd |
| --- | --- | --- | --- |
| 1 | 4 | 1 | 0 |
| 2 | 5 | 2 | 1 |
| 3 | 6 | 3 | 2 |
| 4 | 7 | 4 | 3 |

Ties add up the places they cover and split the total, rounded down. The winner plants a flag.

### Power types

| Label | When |
| --- | --- |
| **WHEN WOKEN** | Once, as you wake it. |
| **EACH TIME** | Every time you use its row. |
| **MEANWHILE** | On someone else's turn (once between your turns). |
| **WHENEVER** | When you do a particular thing (e.g. take Juice). |
| **FINALE** | Scores at the end. |

Card-power vocabulary: *stash* (put a resource on the card, 1 Aura each), *tuck* (slide a card under it, 1 Aura each), *hunt* (reveal the top card; if its Rot % is under the number, tuck it), *shake the machine* (roll the empty capsule slots; on a hit, stash).

### Reclaimers (who you play)

At setup you're dealt two Reclaimers and keep one. Each has a small **perk** and a personal **challenge** scored at the end.

| Reclaimer | Perk | Challenge |
| --- | --- | --- |
| **Mina** (she squeezed too hard; she's 19 now) | Make Stuff gives 1 extra craft | *Hold It Yourself*: Juice taken all game: none → 8, 1–2 → 5, 3–4 → 2 |
| **Nonna Lievito** (and Gerald, her sourdough starter) | +2 Bread at setup | *Feed Everyone*: 1 per Snacc; 5+ Snaccs → +3 |
| **Coach Pratoverde** | Once per season a Soft token doesn't switch off your powers | *Out of the House*: Outside row 4 → 4, full → 8 |
| **DJ Vinilia** | Draw 1 when you wake a brainrot that costs Vinyl | *Crowd Work*: 2 per Icon in your Group Chat row |
| **Signora Pagina** (librarian) | First Group Chat each season draws 1 extra | *Footnotes*: +1 per tucked card |
| **Bruno** (fixes things) | Waking costs 1 less craft | *Right to Repair*: 2 per Gadget in your Workshop row |
| **Dev Nullo** (wrote SQUEEZE v1) | Soft tokens may go on empty rows | *Know the Tool*: end with no Soft tokens → 2 per Juice taken (max 10) |
| **Kiki** (2.1M followers → 6 real friends) | +1 card after setup | *Main Character*: 3 per district you win |

### Setup

Deal each player 2 Reclaimers (keep 1), 5 brainrot cards and one of each resource. Keep any 5 of those 10 things (cards + resources). Deal 4 districts face up, fill Word of Mouth with 3 cards, roll the gacha.

### Scoring

Brainrot Aura + crafts (1 each) + stashed resources (1 each) + tucked cards (1 each) + districts + FINALE powers + your challenge − leftover Soft tokens. Tiebreak: most resources left.

---

## 3. Design notes

### What's borrowed from Wingspan, on purpose

- Three habitat rows that each power one action, getting stronger as they fill. Activating right to left.
- A shared dice feeder (the gacha), a 3-card face-up tray, eggs → crafts, cache → stash, tuck.
- Shrinking action counts per round as the fixed turn clock (8/7/6/5 = 26 turns each).
- Competitive end-of-round goals (districts) and private bonus goals (Reclaimer challenges).

### What's new

- **The Soft mechanic.** The AI shortcut is genuinely good: a wild resource on demand, once per turn. Its cost is shaped like the real cost of over-reliance. You still get the *result*, but the next time you do that thing yourself your crew has *forgotten how* (powers skipped once). One shortcut is cheap. Habitual shortcuts on your best row quietly hollow out your engine. Late in the game the cost shrinks, which is also honest: using a tool at the end of a project is not the same as using it instead of learning.
- **It's not a sin tax.** Several cards *profit* from Juice (Nuvoletta Influencer, Fragolina Fan, Succo Succhione, Cuscinone Comfortino), so leaning into Strawbaby is a real strategy with real costs. Dev Nullo's challenge rewards using the tool *well* (lots of Juice, but you cleaned up every Soft token). Mina's rewards not using it. Paperella and Spugna profit when *other people* rely on it.
- **The commons.** The epilogue is set by the whole table's Juice. Nobody loses points for it, but everyone sees the ending.
- **Districts as reclamation.** The world is being taken back one place at a time; the flags stay on the board.

### Lessons without lectures

The card text never says "AI bad." Flavor does the satire (*Succo Succhione: "Strawbaby brand. 0% fruit. 100% easy. Tastes like a yes."*). The mechanics carry the point: convenience now, capability later; your reliance helps people who sell attention; and what everyone does adds up.

---

## 4. Balance status

Bot-vs-bot simulation, 300 games each (`npm run sim -- 300 3`):

| | 3 players | 4 players |
| --- | --- | --- |
| Average score | 57 | 55 |
| Average winning margin | 12 | 10 |
| Brainrots woken per player | ~8 | ~8 |
| Juice per player | 3.9 | 4.2 |

Average score sources (3p): brainrots 23 · crafts 13 · districts 11 · tucked 5 · challenge 3 · finale 2 · stash 1 · Soft −1.

Reclaimer win rates (fair share 33%): Nonna, Kiki, Signora Pagina and DJ about 38–40%; Mina 34%; Bruno 31%; Coach 26%; Dev Nullo 20%. The bots never plan around Dev's or Coach's challenges, so treat those two as untested rather than weak.

The bots are heuristic and fairly naive. Human playtests will move these numbers.

### Open questions for playtesting

1. Does the Soft cost feel meaningful by season 3–4, or does everybody Juice in the last season? (Possible fix: Soft tokens left at the end cost 2.)
2. Are crafts too efficient late (Make Stuff with 3+ Workshop brainrots ≈ 4 Aura per action)?
3. Is 8/7/6/5 the right length for a first game, or should the digital default be 7/6/5/4?
4. Do the epilogue thresholds land? Bots average about 4 Juice each, so most games end "Loosened".
5. Physical version: the gacha needs a component: 5 custom d6 (5 resources + Juice) in a bowl, or a real capsule toy.

---

## 5. Tech

| Piece | Tool |
| --- | --- |
| App | Vite + React + TypeScript |
| 3D | three.js through React Three Fiber, with drei helpers (camera controls, HTML labels, lighting) |
| Figures | Procedural "vinyl toy" builder (`src/toys/`): every brainrot is built from primitives from a small recipe, so new cards need no artist |
| Card art | The same toys, rendered off screen to images |
| State | zustand |
| Rules | Pure TypeScript state machine (`src/game/engine.ts`), no DOM, tested with vitest and balanced with a bot simulator |
| Audio | WebAudio synthesis (no audio files) |
