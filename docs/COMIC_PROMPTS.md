# Comic art prompts (ChatGPT image generation)

Prompts for illustrating the intro comic, *The Berry That Came Back*. There are 17 panels across 7 pages. The game's cards and board keep their current art; this pack is only for the comic.

## How the images get into the game

1. Save each finished panel as `src/comic/art/<panel id>.png` (`.jpg` and `.webp` also work). Example: `src/comic/art/route9.png`.
2. Run the game (`npm run dev`) and choose **Read the story**. Any panel that has an image file uses it; panels without one fall back to the 3D render. You can swap panels in one at a time.
3. The app adds the captions, speech balloons and sound effects on top, so **the images should have no text or speech bubbles**. Every prompt below says so.

Each panel is cropped to fit its frame on the page (CSS `cover`). Keep the important things near the middle. The **Size** column says which ChatGPT shape to ask for.

## Workflow for consistent characters

Image models drift between prompts. Lock the look first, then reuse it:

1. **Style tile.** Run prompt A below. Regenerate until you like it, then save it as `style.png`.
2. **Character sheets.** Run prompts B1 to B5 with `style.png` attached. Save each sheet you like.
3. **Panels.** For each panel, start a new message and attach `style.png` plus the character sheets for whoever appears in it. Then paste the panel prompt.

If a result drifts, say so directly: "Same image, but DarkBerry's coat must be black, not brown." Fixing one thing at a time works better than rewriting the whole prompt.

---

## A. Style tile

> Create a style reference sheet for a noir graphic novel. Show four small sample vignettes on one page: a rainy city street at night under a single streetlamp, a cluttered kid's car back seat, a humming data center at night, and an underground hollow lit from one side.
>
> Style: hand-inked noir comic illustration. Bold black brush lines and heavy spotted blacks. High-contrast chiaroscuro lighting from streetlamps, phone screens and rim light. Rain drawn as white streaks. All environments are rendered only in black, white and grays, with halftone dot shading and a slight newsprint grain, like a vintage crime comic. One key object in each vignette is in color: flat, saturated, simple cel-shaded color that pops against the monochrome (a red car, a pink glow, a crimson strawberry). Expressive, slightly exaggerated cartoon proportions for characters. Not photorealistic, not 3D, not anime.
>
> No text, no lettering, no captions, no speech bubbles, no logos, no watermarks.

---

## B. Character sheets

Attach `style.png` to each of these.

**B1 · Strawbaby (before)**

> Character turnaround sheet in the attached style: front, three-quarter and side views plus three expressions (happy, squeezed flat, lonely). Strawbaby is a small, soft baby squishy toy, about the size of a grapefruit. It has an oversized glossy strawberry for a head (bright red, buttery yellow seeds, a fresh green leaf crown), a round pale-pink squishy body, stubby arms and legs, huge sparkly black eyes, rosy cheeks and a tiny pink pacifier. Strawbaby is the colored subject; the background is plain monochrome halftone. No text.

**B2 · Sabrina**

> Character turnaround sheet in the attached style: front, three-quarter and back views plus three expressions (delighted, glued to a phone, bored). Sabrina is a nine-year-old girl. She has a round face and big expressive eyes, and dark brown hair in two low pigtails with red hair ties. She wears a bright yellow raincoat with the hood down, jeans and black rain boots. Sabrina is drawn in color; the background is monochrome. Cartoon proportions, not realistic. No text.

**B3 · DarkBerry**

> Character turnaround sheet in the attached style: front, three-quarter and side views plus three expressions (cold stare, quiet rage, almost sad). DarkBerry is what Strawbaby became: still small and baby-proportioned, but menacing.
>
> - Head: the strawberry is a bruised, deep crimson (#8c0d26) with dull gold seeds and a wilted, browning leaf crown.
> - Scar: a jagged seam, stitched shut with pale yellow yarn, runs from the forehead across one eye and down the cheek.
> - Eyes: glossy black, with tiny glowing red pupils.
> - Clothes: a long black trench coat, belted and slightly too big (collar up, sleeves past the hands), and a black fedora with a dark red band, tilted low.
>
> His posture is still, hands in pockets. DarkBerry is in color; the background is monochrome. No text.

**B4 · The generals**

> Character lineup sheet in the attached style: four brainrot military officers standing side by side, each in a dark dress uniform with a peaked officer's cap and rows of medals. From left to right:
>
> 1. A blue land shark walking upright in chunky sneakers.
> 2. A green crocodile whose belly is a white refrigerator door.
> 3. An officer whose whole head is a mirrored disco ball.
> 4. An officer whose head is an old CRT television with rabbit-ear antennas, showing a pair of angry eyes on screen.
>
> The generals are in color; the background is monochrome. No text.

**B5 · People of 2048**

> Sheet of six background humans in the attached style, all entirely monochrome: adults and teenagers in plain gray work clothes, tired posture, heads down, a few holding phones whose screens glow pink (the pink glow is the only color). Cartoon proportions matching Sabrina. No text.

---

## C. Panels

Attach `style.png` and the listed character sheets to each prompt. Begin every prompt with this line:

> Comic panel in the attached noir style. Background and environment in black, white and gray halftone; only the subjects I mark as COLOR are in color. No text, no lettering, no captions, no speech bubbles, no logos.

### Page 1

| File | Size | Attach |
| --- | --- | --- |
| `route9` | Landscape (3:2) | style |

> Establishing shot, 2026, dusk, heavy rain. A small **red Honda Fit** (COLOR, a tall one-box compact hatchback with a steep windshield and a short hood) drives along a wet four-lane highway toward the viewer at a three-quarter angle. Its headlights cut through the rain. Streetlamps line the road, and dark apartment blocks with a few lit windows sit behind. The wet asphalt reflects the lights. Low camera angle, cinematic.

| File | Size | Attach |
| --- | --- | --- |
| `backseat` | Portrait (2:3) | style, Strawbaby, Sabrina |

> Inside the back seat of the car, at night. **Sabrina** (COLOR) hugs **Strawbaby** (COLOR) tight against her cheek, eyes closed, beaming. Rain streaks down the window behind them, and a passing streetlight casts a warm stripe across the seat. Cozy and tender, the last happy moment.

| File | Size | Attach |
| --- | --- | --- |
| `phone` | Portrait (2:3) | style, Strawbaby, Sabrina |

> Same back seat, a few minutes later. Sabrina (monochrome now) stares down at a **phone** (COLOR). Its screen shows a sparkly pink-and-purple glitter bunny toy advertisement with confetti, and it casts a pink glow on her face. Beside her on the seat, forgotten, **Strawbaby** (COLOR) sits tipped over on its side, looking up at her. Her face is blank and hypnotized.

### Page 2

| File | Size | Attach |
| --- | --- | --- |
| `toss` | Landscape (3:2) | style, Strawbaby |

> Outside, on the rainy highway, from a low side angle. The **red Honda Fit** (COLOR) speeds away. A small arm reaches out of the rear window, and **Strawbaby** (COLOR) tumbles through the air toward the roadside, mid-spin, with motion lines. Rain everywhere.

| File | Size | Attach |
| --- | --- | --- |
| `ditch` | Landscape (3:2) | style, Strawbaby |

> Ground-level shot of a muddy roadside ditch at night in the rain. **Strawbaby** (COLOR, dirty and wet) lies face down in a puddle in the foreground. Far away down the empty road, two tiny **red taillights** (COLOR) disappear. Lonely and bleak, with lots of negative space.

### Page 3

| File | Size | Attach |
| --- | --- | --- |
| `buried` | Portrait (2:3); keep the subject centered, the sides get cropped | style, Strawbaby |

> Vertical cross-section of the ground, like a geology diagram drawn in ink. At the bottom, curled in dark old dirt among stones and roots, lies **Strawbaby** (COLOR, small, faded). Above it are layers of fill dirt and gravel, then a thick concrete slab with rebar. At the very top, the base of a big building presses down. Time passing; heavy and claustrophobic.

| File | Size | Attach |
| --- | --- | --- |
| `datacenter` | Portrait (2:3); centered | style |

> Low angle looking up at a massive data center at night, 2031. A windowless slab building ringed with rooftop cooling fans. Two huge cooling towers pour steam into the night sky, floodlights glare, and a chain-link fence runs in the foreground. One small **red status light** (COLOR) on the facade. The building feels like it's humming.

### Page 4

| File | Size | Attach |
| --- | --- | --- |
| `underground` | Landscape (3:2) | style, Strawbaby |

> A small hollow under the data center's foundation. Pipes and thick cables reach down from the concrete ceiling, and **cyan coolant drips** (COLOR) fall from them. Thin **glowing pink data threads** (COLOR) stream down from the cables into **Strawbaby** (COLOR) at the center. It sits upright, soaked in the glow, eyes reflecting tiny screens. Eerie and almost holy.

| File | Size | Attach |
| --- | --- | --- |
| `eye` | Portrait (2:3) | style, Strawbaby |

> Extreme close-up of **Strawbaby's face** (COLOR). In its huge black eyes, tiny reflections of glowing screens: video thumbnails, notifications, scrolling feeds. A single tear runs down its cheek. Darkness around it.

| File | Size | Attach |
| --- | --- | --- |
| `redeyes` | Portrait (2:3) | style, DarkBerry |

> Extreme close-up of the same face, changed: the strawberry has gone **bruised crimson** (COLOR), the stitched scar has appeared, and the pupils glow **red**. Lit from below by red light, with pitch black around. It's mid-transformation, so no hat or coat yet. Leave dark empty space at the top-left and bottom for speech balloons.

### Page 5 (full-page splash)

| File | Size | Attach |
| --- | --- | --- |
| `splash` | Portrait (2:3) | style, DarkBerry |

> Full-page reveal. **DarkBerry** (COLOR) stands alone under a single streetlamp on a rain-soaked city street at night, in his black trench coat and fedora, hands in pockets. His red eyes glow under the brim, and his reflection shows in a puddle at his feet. Dark buildings loom behind him, and rain falls in the cone of lamplight. Iconic, like a movie poster. Leave some empty dark space at the top corners for captions.

### Page 6

| File | Size | Attach |
| --- | --- | --- |
| `screens` | Landscape (3:2) | style, DarkBerry |

> Night skyline of a city where every building facade carries giant billboards and screens. All of them show **DarkBerry's face** (COLOR) staring out, so the whole city glows crimson. Rooftops, water towers and antennas are in monochrome.

| File | Size | Attach |
| --- | --- | --- |
| `kids` | Portrait (2:3) | style, People of 2048 |

> Three rows of kids on bleachers, all hunched over their phones, faces lit from below. The phones' **pink glowing screens** (COLOR) are the only color. Nobody talks or looks up. Shot slightly from above.

| File | Size | Attach |
| --- | --- | --- |
| `generals` | Portrait (2:3) | style, DarkBerry, generals |

> Low angle. **The four generals** (COLOR) stand at attention in front, in uniforms, caps and medals. Behind them, huge and in shadow (monochrome), **DarkBerry** towers like a statue with only his red eyes visible. Spotlight from above, propaganda-poster energy.

### Page 7

| File | Size | Attach |
| --- | --- | --- |
| `palanquin` | Landscape (3:2) | style, People of 2048 |

> 2048, a city street in daylight under gray skies. Four tired gray-uniformed humans carry a wooden palanquin on their shoulders. On it sits a smug **brainrot with a mirrored disco-ball head in a purple suit** (COLOR). A crowd of monochrome people bows along the sidewalk.

| File | Size | Attach |
| --- | --- | --- |
| `basement` | Landscape (3:2); keep the table in the middle band | style, People of 2048 |

> A hidden resistance basement. Four people lean over a table under one bare hanging bulb. On the table is a hand-drawn city map with red marker circles. Small piles of salvaged supplies sit on the table in color: **green grass tufts, cyan coolant vials, purple circuit boards, pink glitter, coils of copper wire** (COLOR). Faces half in shadow; a determined, conspiratorial mood.

| File | Size | Attach |
| --- | --- | --- |
| `skyline` | Landscape (3:2); keep the action in the middle band | style, DarkBerry |

> The city skyline at night with the data center in the middle distance. Behind it, enormous, rising like a moon over the rooftops, is the silhouette of **DarkBerry** (COLOR), his red eyes and the crimson strawberry catching a searchlight. Two searchlight beams cross the sky. Final shot, ominous and epic.

---

## Before you submit

- **Credit the art.** If the comic uses AI-generated images, add a line to the README and the poster saying so. Disclosing synthetic media is a Responsible AI practice, and the course will notice. `docs/PROJECT.md` §5 currently says no image generation was used. Update it when the images land, and say which parts are generated (comic panels) and which are procedural (cards, board).
- **Check for brands and real people.** Ask ChatGPT for no logos, and redo any panel where a real logo or a recognizable person shows up.
