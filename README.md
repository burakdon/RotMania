# RotMania: Soft Power

A strawberry squishy in a trench coat took over the world by being helpful. Take it back, one weird little guy at a time.

A 3D digital version of a tabletop engine-builder for 3–4 players (2 works), with bots, hot-seat play and an intro film. Built like Wingspan: three rows on your mat, each powering an action, getting stronger as you fill them with brainrots. Strawbaby will always offer to help. Every time you let it, your crew forgets how to do something themselves.

Rules, story and design notes: **[docs/DESIGN.md](docs/DESIGN.md)**.

## Run it

Needs Node 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` (static files, host anywhere) |
| `npm test` | Rules engine tests |
| `npm run sim -- 300 3` | Bot-vs-bot balance run: 300 games, 3 players |

Dev shortcuts (add to the URL): `#gallery` all toys · `#closeup` Strawbaby up close · `#film@40` film from 40 s · `#bots` watch a bot game.

## Layout

```
src/game/      rules engine, cards, reclaimers, districts, bots (no DOM, runs in Node)
src/toys/      procedural vinyl-toy builder, Strawbaby, card portrait renderer
src/scene/     the 3D table: hideout mats, gacha machine, Soft World board, camera
src/ui/        HUD, hand, decision panels, title / lobby / results screens
src/film/      the intro film: scenes, captions, synthesized audio
scripts/       balance simulator
docs/          design document
legacy/        earlier prototypes (v0.1–v0.4)
```

## Adding a brainrot

Add one line to `src/game/cards.ts`: name, vibe, rows, cost, Aura, craft capacity, Rot %, power, flavor and a toy recipe (head shape, colors, eyes, arms, legs, accessories). The card art and the 3D figure are generated from the recipe. Run `npm test` and `npm run sim` after balance changes.
