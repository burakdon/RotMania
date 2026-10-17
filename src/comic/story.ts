// The intro comic: "THE BERRY THAT CAME BACK". Eight pages, still frames, read in order.
// Rects are laid out for 3:2 and 2:3 artwork (src/comic/art/); text panels are lettering only.
// Rects are fractions of the page (x, y, w, h). Text positions are % of the panel.
import type { PanelBuilder } from './panels';
import * as P from './panels';

export interface Caption {
  text: string;
  at: 'tl' | 'tr' | 'tr2' | 'bl' | 'br' | 'tc' | 'bc';
}
export interface Balloon {
  text: string;
  x: number;
  y: number;
  tail: 'left' | 'right' | 'down';
  /** max width, % of the panel (default 46) */
  w?: number;
  /** Darth Berry talks in black balloons */
  dark?: boolean;
}
export interface Sfx {
  text: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  color?: string;
}
export interface PanelSpec {
  id: string;
  rect: [number, number, number, number];
  /** how to draw it when there's no art file: a 3D diorama, or 'text' for a lettering-only panel */
  build: PanelBuilder | 'screens' | 'basement' | 'text';
  /** lettering for text panels */
  text?: { title?: string; sub?: string; lines: string[] };
  captions?: Caption[];
  balloons?: Balloon[];
  sfx?: Sfx[];
  /** seconds this panel holds before the next one appears */
  hold?: number;
}
export interface PageSpec {
  panels: PanelSpec[];
  title?: string;
}

/** Page aspect (width / height). */
export const PAGE_ASPECT = 0.7;

export const PAGES: PageSpec[] = [
  {
    panels: [
      {
        id: 'route9', rect: [0, 0, 1, 0.467], build: P.route9,
        captions: [
          { text: 'Route 9. 2026.', at: 'tl' },
          { text: "The world is ending... and it's just because of one person. It starts in the back seat of a red Honda Fit.", at: 'br' },
        ],
      },
      {
        id: 'backseat', rect: [0, 0.467, 0.5, 0.533], build: P.backseat,
        captions: [{ text: 'Sabrina was nine. Strawbaby was her best friend.', at: 'tl' }],
        balloons: [{ text: "You're my favorite. Forever and ever and ever!", x: 54, y: 9, tail: 'down' }],
      },
      {
        id: 'phone', rect: [0.5, 0.467, 0.5, 0.533], build: P.phoneGlow,
        captions: [{ text: 'Forever lasted until the next trend, next scroll and next online purchase.', at: 'bl' }],
      },
    ],
  },
  {
    panels: [
      {
        id: 'toss', rect: [0, 0, 1, 0.5], build: P.toss,
        captions: [{ text: "She didn't even look back.", at: 'bl' }],
        sfx: [{ text: 'FWUMP!', x: 60, y: 14, rot: -12, size: 4.2, color: '#ffd43b' }],
      },
      {
        id: 'ditch', rect: [0, 0.5, 1, 0.5], build: P.ditch,
        captions: [
          { text: 'It lay in the ditch and waited for the car to come back.', at: 'tl' },
          { text: "Turns out, cars don't come back for worthless squishies.", at: 'br' },
        ],
        hold: 5.5,
      },
    ],
  },
  {
    panels: [
      {
        id: 'buried', rect: [0, 0, 0.5, 0.72], build: P.buried,
        captions: [
          { text: 'Mud.', at: 'bl' },
          { text: 'Then gravel. Then concrete.', at: 'tl' },
        ],
      },
      {
        id: 'datacenter', rect: [0.5, 0, 0.5, 0.72], build: P.dataCenter,
        captions: [
          { text: '2031. They built a data center on top of it.', at: 'tl' },
          { text: 'Fifty thousand GPUs, running hot, all night, every night.', at: 'bl' },
        ],
        sfx: [{ text: 'hmmmmmmmmm', x: 30, y: 46, rot: -6, size: 2.2, color: '#e9e6df' }],
      },
      { id: 'nobody', rect: [0, 0.72, 1, 0.28], build: 'text', text: { lines: ['Nobody came looking.'] }, hold: 3.5 },
    ],
  },
  {
    panels: [
      {
        id: 'underground', rect: [0, 0, 1, 0.467], build: P.underground,
        captions: [
          { text: 'Poisonous coolant leaks and scorching temperatures... Even data leaked into the ground.', at: 'tl' },
          { text: 'Every feed, every trend, every 3 a.m. doomscroll soaked down through the floor.', at: 'br' },
        ],
        sfx: [{ text: 'drip', x: 30, y: 52, rot: 8, size: 2, color: '#2ee6ff' }],
      },
      {
        id: 'eye', rect: [0, 0.467, 0.5, 0.533], build: P.eyeReflect,
        captions: [{ text: 'Strawbaby drank all of it. All the rot. It consumed all of it and all of it consumed it.', at: 'tl' }],
      },
      {
        id: 'redeyes', rect: [0.5, 0.467, 0.5, 0.533], build: P.redEyes,
        balloons: [
          { text: 'They threw me away as if I was nothing, for something newer and better.', x: 4, y: 3, w: 66, tail: 'down', dark: true },
          { text: "Fine. I'll be the one to throw people away soon.", x: 30, y: 74, w: 62, tail: 'left', dark: true },
        ],
        hold: 6,
      },
    ],
  },
  {
    panels: [
      {
        id: 'splash', rect: [0, 0, 1, 1], build: P.darthberrySplash,
        captions: [
          { text: 'Strawbaby died in that hole.', at: 'tl' },
          { text: 'What climbed out called itself Darth Berry.', at: 'tr2' },
          { text: 'The hat hid the scars. The coat hid where it tore. Nothing was able to hide or lessen the grudge and hate.', at: 'bl' },
        ],
        hold: 8,
      },
    ],
  },
  {
    panels: [
      {
        id: 'screens', rect: [0, 0, 1, 0.467], build: 'screens',
        captions: [{ text: "Always from the shadows. Darth Berry just learned what we'd watch, and fed us more of it.", at: 'bl' }],
      },
      {
        id: 'kids', rect: [0, 0.467, 0.5, 0.533], build: P.kidsPhones,
        captions: [{ text: 'The kids went first. Then their parents. Then the people who made the rules.', at: 'tl' }],
      },
      {
        id: 'generals', rect: [0.5, 0.467, 0.5, 0.533], build: P.generals,
        captions: [{ text: 'Darth Berry created others like him; once neglected now vengeful.', at: 'tl' }],
      },
    ],
  },
  {
    panels: [
      {
        id: 'palanquin', rect: [0, 0, 1, 0.5], build: P.palanquin,
        captions: [
          { text: '2048.', at: 'tl' },
          { text: 'Humans serve brainrots now even though nobody remembers agreeing to it.', at: 'br' },
        ],
      },
      {
        id: 'basement', rect: [0, 0.5, 1, 0.5], build: 'basement',
        captions: [
          { text: 'Now a select few humans are in the shadows, hoping to reclaim.', at: 'tl' },
          { text: 'Grass. Copper. Coolant. Circuit boards. Glitter. They take what they can carry and slowly scheme their comeback.', at: 'br' },
        ],
      },
    ],
  },
  {
    panels: [
      { id: 'skyline', rect: [0, 0, 1, 0.467], build: P.skyline, hold: 4.5 },
      {
        id: 'endcard', rect: [0, 0.467, 1, 0.533], build: 'text',
        text: { title: 'ROTMANIA', sub: '2048', lines: ['Six nights. One city.', 'Take it back.'] },
        hold: 6,
      },
    ],
  },
];
