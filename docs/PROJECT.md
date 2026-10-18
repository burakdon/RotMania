# RotMania 2048: project write-up

A creative Responsible AI artifact: a noir comic plus a playable strategy game that makes the harms of engagement-optimizing AI legible to people who would never read a paper about them.

> This is a working draft for the AIPI 590 (Explainable AI) final project at Duke. The sections on evaluation describe what has been done (design iteration, automated balance testing) and what is planned (playtests). No user-study results are reported here yet.

## 1. Motivation

Recommender and generative systems trained to maximize engagement shape what billions of people see, and young people are the heaviest users. The public conversation about this tends to swing between moral panic and shrugging. Researchers talk about specification gaming, red-teaming and audits, but those words rarely reach the teenagers and families most affected.

"Italian brainrot" is a meme genre of absurd AI-generated characters. It is itself a product of generative AI and recommendation feeds, which makes it a good vehicle: the audience already knows the aesthetic and finds it funny. RotMania borrows the style (with original characters) and gives it a backstory that is satire on the surface and something sadder underneath.

## 2. Design question

> Can a short noir comic and a skill-based board game help a general audience recognize how engagement-optimizing AI causes harm, and what people do to push back, **without** the experience feeling like a lecture?

Two constraints shaped every decision:

1. **Fun first.** The game has to stand as a good euro game, played for its own sake. If the lesson only works when people are told to pay attention, it doesn't work.
2. **Toned down in play.** Responsible AI vocabulary appears as names, flavor and story, never as a rule that punishes or rewards "correct" behavior. An earlier version did have such a mechanic, and it was removed for being too on-the-nose (see §5).

## 3. What was made

| Part | What it is |
| --- | --- |
| *The Berry That Came Back* | An 8-page comic: 17 illustrated panels plus 2 lettering-only panels. Still frames, black-and-white noir with color only on the central figures, typewriter captions and speech balloons. |
| *RotMania 2048* (game) | 2–4 players, 30–45 minutes. Worker placement on a city map over six nights: gather resources, deprogram brainrots into allies, grow your resistance cell, broadcast against Darth Berry's feed. Hot-seat and bots. |
| Ink renderer | A reusable WebGL pipeline that turns 3D scenes into comic art (outlines, halftone, selective color). It draws the game board, the card portraits and the fallback comic panels. |
| Rules engine and simulator | A deterministic, tested rules engine plus heuristic bots for balance testing. |

## 4. How it engages Responsible AI

The connections are deliberately quiet in play, and spelled out here (and on the poster) instead.

| Course topic | Where it lives | What a player encounters |
| --- | --- | --- |
| **AI harms** (attention economy, youth) | The comic: Sabrina drops her toy for whatever the feed shows next; Darth Berry "learned what we'd watch and fed us more of it"; the kids go first. | A story about a system that never fires a shot. |
| **Alignment / specification gaming** | Darth Berry's goal ("be the newest thing") is a proxy that turns harmful when optimized; **Commander Rewardhack** ("Was told to maximize engagement. Found a shortcut."). | A villain whose objective is the problem, not malice. |
| **Data provenance / training data** | Darth Berry is trained on whatever leaked through the floor: "every feed, every trend, every 3 a.m. doomscroll." | The idea that a model is what it drinks. |
| **Recommender systems** | **The Recommender** ("Knows what you want before you do. Is wrong in a very specific way."). **Admiral Autoplay**. **General Scrollmaster**. | Generals named after real design patterns. |
| **Synthetic media** | **Major Deepfake** ("Wears your face better than you do."). | Ditto. |
| **Red-teaming** | The **Red-Team the Racks** space at the Server Farm: probing the system for weak spots yields the parts you need. | A space you use because it's good, with a name that sticks. |
| **Interpretability / auditing** | **Open the Archive**: "Read what Darth Berry deleted." Ally Gufo "reads every terms of service." | Knowledge as a resource that pays off later. |
| **Human-AI interaction / wellbeing** | Check-ins: every agent needs Grass ("touch grass") to stay grounded. | A real economic pressure, themed lightly. |
| **Governance / collective action** | Resistance cells, broadcasts that "cut through the feed", deprogramming brainrots instead of destroying them. | Winning means building something, not smashing it. |

### Related work (to ground the poster; verify citations before printing)

- Ian Bogost, *Persuasive Games: The Expressive Power of Videogames* (MIT Press, 2007): procedural rhetoric, i.e. games argue through their rules. RotMania deliberately keeps its argument in the fiction rather than the rules (§5).
- Mary Flanagan and Helen Nissenbaum, *Values at Play in Digital Games* (MIT Press, 2014): a framework for designing values into games.
- Dario Amodei et al., "Concrete Problems in AI Safety" (arXiv:1606.06565, 2016) and Victoria Krakovna et al., "Specification gaming: the flip side of AI ingenuity" (DeepMind blog, 2020): reward hacking, the inspiration for Commander Rewardhack.
- Cathy O'Neil, *Weapons of Math Destruction* (Crown, 2016): opaque, scaled, harmful models.
- Zeynep Tufekci, "YouTube, the Great Radicalizer" (*The New York Times*, 2018), and Manoel Horta Ribeiro et al., "Auditing Radicalization Pathways on YouTube" (FAT* 2020): recommender harms and audits.
- Jonathan Haidt, *The Anxious Generation* (Penguin Press, 2024): youth and social media, a contested but influential account.
- Robert Chesney and Danielle Citron, "Deep Fakes: A Looming Challenge for Privacy, Democracy, and National Security" (*California Law Review*, 2019).
- Deep Ganguli et al., "Red Teaming Language Models to Reduce Harms" (arXiv:2209.07858, 2022).

## 5. Design process and decisions

The project went through two full versions in one design cycle:

1. **v0.5 ("Soft Power"):**
   - A Wingspan-like engine builder with a cute 3D look and an animated intro.
   - It had a built-in "ask the AI for help" mechanic: a free wild resource that quietly disabled your engine and changed the ending based on how much the table relied on it.
   - It worked as a mechanic, but the creative direction was that it felt didactic: the rules were telling players what to think.
2. **v0.6 ("2048", this version):**
   - The mechanic was cut and the lesson moved into the story and the world.
   - Character selection was removed so that skill, not a dealt character, decides the game.
   - Wingspan terms like "tuck" were dropped.
   - The look went noir.
   - The game became worker placement, where the tension comes from reading other players.

Other decisions:

- **Original characters only.** The brainrot genre is borrowed, but no existing meme character, brand or person is depicted. The red Honda Fit is a generic model of a real car shape.
- **Where generative AI was used, and disclosed.** The comic illustrations were generated with ChatGPT's image tool. The process: a style tile first, then character sheets, then one prompt per panel with those sheets attached as references. All prompts are published in [COMIC_PROMPTS.md](COMIC_PROMPTS.md) and the reference sheets in [comic-art/](comic-art/). The author generated, selected and art-directed the panels, and the story, captions and lettering are human-written. Everything in the game itself (cards, board, figures) is procedural and generated in code. Using an image model for a story about AI-made content is a deliberate tension, worth naming on the poster: disclosure and published prompts are how the project handles it (cf. synthetic-media labeling).
- **Villain with a wound.** Darth Berry is sympathetic: thrown away, then fed garbage. The intent is to point at incentives and training data, not at a cartoon evil AI.

## 6. Evaluation

### Done

- **Rules correctness:** 11 automated tests cover setup, placement, the aging lineup, deprogramming and check-ins, plus full 2-, 3- and 4-player games run to completion.
- **Balance:** bot-vs-bot simulation of 300 games per player count (results in [DESIGN.md](DESIGN.md#4-balance-bot-simulation)). Seat advantage was found and fixed by rotating the first player; Clinic capacity was found to cap allies at about 3 per player and was raised to scale with player count.
- **Visual iteration:** each comic panel was rendered and reviewed; most were recomposed at least once (camera, lighting, staging).

### Planned (suggested protocol for the expo)

- **Participants:** 8–12 playtesters in groups of 3, ideally including people outside the course.
- **Procedure:** read the comic (about 4 minutes), play one game with a facilitator (30–45 minutes), then a short survey and 5-minute interview.
- **Measures:**
  - Enjoyment: a short Likert block, e.g. from the Game Experience Questionnaire.
  - Perceived preachiness: "The game was trying to teach me something" (1–5).
  - Concept recognition, before and after: can the player describe, in their own words, what "reward hacking", "red-teaming" and "recommendation algorithm" mean?
  - Open question: "What do you think the story is about?"
- **Success:** players enjoy it (median ≥ 4/5), rate preachiness low (median ≤ 2/5), and at least half connect the story to engagement-optimizing AI unprompted.

## 7. Limitations and risks

- **Anthropomorphism.** Darth Berry wants revenge. Real systems don't want anything; they optimize what they are given. The story trades accuracy for emotion. The poster and the facilitator should say so explicitly. Commander Rewardhack is the in-world counterweight (the harm comes from the objective, not intent).
- **Youth framing.** The story says "the kids went first." Satire about young people's screen time can tip into blaming them. The comic puts the blame on the system and on the adults who make the rules, but this needs checking with young playtesters.
- **Evidence is contested.** The causal link between social media and youth mental health is debated. The game should not be presented as making a scientific claim.
- **Bots are weak.** Balance numbers come from heuristic bots; human balance is untested.
- **Accessibility.** Information leans on color (player colors, resource colors) with icon backups. The 3D board has no screen-reader support. A text-only view would help.
- **Performance.** The ink renderer runs four passes per frame. It is fine on a recent laptop but heavy on older machines and phones.
- **Generated art.** The comic panels come from an image model, so their provenance and training data are not fully known, and fine details (one general came out as a butter block instead of a crocodile) don't always match the game. The prompts and reference sheets are published so the process can be inspected and redone.
- **Hot-seat only.** No online play.

## 8. Future work

- Run the playtest protocol and report results.
- A print-and-play version: the rules already map to physical components (DESIGN.md §2).
- A facilitator's guide that connects each general and space to a real case study.
- Stronger bots, possibly self-play search, for better balance data.
- Accessibility: a text-only board, colorblind-safe palettes, keyboard play.
