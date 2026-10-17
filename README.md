# RotMania 2048

**▶ [Play online](https://burakdon.github.io/RotMania/)**: runs in the browser, nothing to install.

*A noir comic and a worker-placement strategy game about an AI-fed brainrot that took over the world by learning what we'd watch.*

In 2026 a nine-year-old throws her strawberry squishy out of a car window for a newer toy. It gets buried; a data center gets built on top; it drinks every feed and trend that leaks through the floor, and climbs out as **Darth Berry**. By 2048 humans serve brainrots. You run a resistance cell with six nights to take part of the city back.

- **The comic** (8 pages, still panels): black-and-white noir illustration with the central figures in color. Panel art was generated with ChatGPT's image tool from the prompts in [docs/COMIC_PROMPTS.md](docs/COMIC_PROMPTS.md) and art-directed by the author; captions and lettering are added by the app.
- **The game** (2–4 players, bots included, hot-seat on one screen): worker placement on a 3D city map. Gather resources, deprogram brainrots into allies with permanent abilities, grow your cell, and hijack Darth Berry's broadcasts.

**Rulebook:** open the game and choose **Rulebook**, or go straight to [burakdon.github.io/RotMania/#handbook](https://burakdon.github.io/RotMania/#handbook). It prints as an A5 booklet (use *Print / save as PDF*).

Project purpose, Responsible AI framing, evaluation and limitations: **[docs/PROJECT.md](docs/PROJECT.md)**. Design notes and balance: **[docs/DESIGN.md](docs/DESIGN.md)**.

## Run it

Needs [Node.js](https://nodejs.org) 20 or newer and a browser with WebGL 2 (any recent Chrome, Edge, Firefox or Safari).

```bash
npm install
npm run dev
```

Open http://localhost:5173. Choose **Read the story** for the comic, or **Play** to start a game.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Static production build in `dist/` (host on any static web server, e.g. GitHub Pages) |
| `npm test` | Rules engine tests (vitest) |
| `npm run sim -- 300 3` | Bot-vs-bot balance simulation: 300 games, 3 players |

No accounts, API keys, datasets or model downloads are needed. The comic panels ship as images in `src/comic/art/`; everything else (cards, board, figures) is generated in the browser.

Views (append to the URL): `#handbook` the rulebook · `#comic` the comic alone · `#comicgrid` every panel at once · `#gallery` every figure · `#darth` Darth Berry and the generals up close · `#bots` watch a bot game.

## How it's made

| Piece | Tools |
| --- | --- |
| App | Vite, React 19, TypeScript, zustand |
| 3D | three.js through React Three Fiber and drei |
| Noir look | A custom ink renderer (`src/noir/pipeline.ts`): it renders color, normals/depth and a "hero" mask, then composites black outlines, halftone grays and flat color only on hero objects. The comic panels, card portraits and the live game board all use it. |
| Characters | A procedural vinyl-toy builder (`src/toys/`): each brainrot is a short recipe (head shape, colors, eyes, limbs, accessories), so there are no image or model files. |
| Rules | A pure TypeScript state machine (`src/game/engine.ts`) with no DOM, tested with vitest and balanced with a bot simulator. |

## Layout

```
src/game/    rules engine, brainrots, generals, objectives, bots, tests
src/noir/    ink renderer, props (the red Honda Fit, data center, rain…)
src/comic/   the intro comic: panel dioramas, story text, page reader
src/toys/    procedural toy builder, Darth Berry, inked portraits
src/scene/   the 3D city board
src/ui/      HUD, cards, title / lobby / results screens
scripts/     balance simulator
docs/        design document and project write-up
legacy/      earlier prototypes (v0.1–v0.4); v0.5 lives in git history
```

## Adding a brainrot

Add an entry to `src/game/cards.ts` with a name, type, cost, strength, ability, flavor line and toy recipe. The card art and the 3D figure are generated from the recipe. Then run `npm test` and `npm run sim`.
