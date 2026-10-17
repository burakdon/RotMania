// Core types for RotMania: Soft Power. No DOM, no three.js: the rules run in Node for tests and sims.

export const RES = ['grass', 'bread', 'vinyl', 'yarn', 'paper'] as const;
export type Res = (typeof RES)[number];
export type Face = Res | 'juice';
export type Pool = Res | 'juice';

/** 0 Outside (go touch grass → resources), 1 Workshop (make stuff → crafts), 2 Group Chat (word of mouth → cards) */
export type Row = 0 | 1 | 2;
export const ROWS: Row[] = [0, 1, 2];

export const VIBES = ['snacc', 'beast', 'gadget', 'icon'] as const;
export type Vibe = (typeof VIBES)[number];

export type CostItem = Res | 'any';

export type When = 'woke' | 'each' | 'meanwhile' | 'whenever' | 'finale';
export type Trigger = 'otherJuice' | 'otherOutside' | 'otherWorkshop' | 'otherChat' | 'otherWakes' | 'youJuice';

export type Effect =
  | { k: 'gain'; res: Res | 'any'; n: number }
  | { k: 'gacha'; n: number }
  | { k: 'gachaStash'; res: Res }
  | { k: 'draw'; n: number }
  | { k: 'craftHere'; n: number }
  | { k: 'craftAny'; n: number }
  | { k: 'craftRow' }
  | { k: 'stash'; res: Res; n: number }
  | { k: 'tuckDraw' }
  | { k: 'tuckGain'; res: Res | 'any' }
  | { k: 'tuckTop'; n: number }
  | { k: 'hunt'; max: number }
  | { k: 'fish'; res: Res }
  | { k: 'trade'; pay: Res | 'any' | 'craft' | 'card'; then: Effect }
  | { k: 'allDraw' }
  | { k: 'allGain'; res: Res }
  | { k: 'unsoft' }
  | { k: 'repeat' }
  | { k: 'aura'; n: number }
  | { k: 'juice'; n: number }
  | { k: 'finaleVibe'; vibe: Vibe; n: number; scope: 'row' | 'all' }
  | { k: 'finaleRowFull'; n: number }
  | { k: 'finaleNoSoft'; n: number }
  | { k: 'finaleSoft'; n: number; max: number }
  | { k: 'finaleStash'; n: number };

export interface Power {
  when: When;
  on?: Trigger;
  /** for otherWakes: only when the woken brainrot has this vibe */
  vibe?: Vibe;
  fx: Effect;
}

export type HeadKind = string;

export interface ToyRecipe {
  head: HeadKind;
  body?: 'bean' | 'blob' | 'tall' | 'none' | 'coat' | 'tutu' | 'suit';
  c1: string;
  c2?: string;
  c3?: string;
  eyes?: 'dot' | 'big' | 'sleepy' | 'angry' | 'dizzy' | 'one' | 'shades' | 'none';
  arms?: 'nubs' | 'claws' | 'wings' | 'fins' | 'tentacles' | 'sticks' | 'none';
  legs?: 'nubs' | 'sneakers' | 'long' | 'wheels' | 'none' | 'boots';
  acc?: string[];
  scale?: number;
  /** strawberry seed color */
  seed?: string;
}

export interface Card {
  id: string;
  name: string;
  vibe: Vibe;
  rows: Row[];
  cost: CostItem[];
  /** victory points printed on the card */
  aura: number;
  /** craft capacity */
  cap: number;
  /** Rot %: flavor stat, used by Hunt powers */
  rot: number;
  power?: Power;
  flavor: string;
  toy: ToyRecipe;
}

export interface Slot {
  card: string;
  crafts: number;
  stash: number;
  lore: number;
}

export type ReclaimerId = 'mina' | 'nonna' | 'coach' | 'dj' | 'biblio' | 'bruno' | 'dev' | 'kiki';

export interface Player {
  id: number;
  name: string;
  bot: boolean;
  color: string;
  reclaimer: ReclaimerId | null;
  reclaimerOptions: ReclaimerId[];
  hand: string[];
  res: Record<Pool, number>;
  rows: Slot[][];
  soft: [number, number, number];
  actionsLeft: number;
  juiceTaken: number;
  auraBonus: number;
  perkUsed: boolean;
  meanwhileUsed: boolean;
  askedThisTurn: boolean;
  districtAura: number[];
  /** setup offer: dealt cards/res to choose from */
  offer?: { cards: string[]; res: Res[] };
}

export type DistrictId =
  | 'park' | 'garage' | 'cafeteria' | 'fair' | 'school' | 'foodcourt'
  | 'zoo' | 'repair' | 'stage' | 'pantry' | 'library' | 'arcade';

export interface DistrictResult {
  round: number;
  district: DistrictId;
  scores: { player: number; value: number; place: number; aura: number }[];
}

export type Prompt =
  | { type: 'setup'; player: number }
  | { type: 'turn'; player: number }
  | { type: 'gacha'; player: number; left: number; stashOn?: [Row, number] }
  | { type: 'draw'; player: number; left: number }
  | { type: 'crafts'; player: number; n: number }
  | { type: 'soft'; player: number; rows: Row[] }
  | { type: 'bonus'; player: number; row: Row }
  | { type: 'tuck'; player: number; at: [Row, number]; then: 'draw' | Res | 'any' }
  | { type: 'trade'; player: number; at: [Row, number]; pay: Res | 'any' | 'craft' | 'card'; then: Effect }
  | { type: 'pickRes'; player: number; n: number; why: string }
  | { type: 'unsoft'; player: number; rows: Row[] }
  | { type: 'repeat'; player: number; row: Row; options: number[] };

export type Answer =
  | { type: 'setup'; reclaimer: ReclaimerId; keepCards: string[]; keepRes: Res[] }
  | { type: 'wake'; card: string; row: Row }
  | { type: 'act'; row: Row }
  | { type: 'ask' }
  | { type: 'gacha'; index: number }
  | { type: 'draw'; tray: number | 'deck' }
  | { type: 'crafts'; targets: [Row, number][] }
  | { type: 'soft'; row: Row }
  | { type: 'bonus'; use: false }
  | { type: 'bonus'; use: true; card?: string; res?: Pool; from?: [Row, number] }
  | { type: 'tuck'; card: string | null }
  | { type: 'trade'; use: false }
  | { type: 'trade'; use: true; res?: Pool; card?: string; from?: [Row, number] }
  | { type: 'pickRes'; res: Res }
  | { type: 'unsoft'; row: Row }
  | { type: 'repeat'; col: number };

/** Work the engine still has to do. Executed LIFO from state.queue. */
export type Task =
  | { t: 'fx'; player: number; fx: Effect; at?: [Row, number] }
  | { t: 'activate'; player: number; row: Row; col: number }
  | { t: 'rowGain'; player: number; row: Row; n: number }
  | { t: 'powers'; player: number; row: Row }
  | { t: 'meanwhile'; actor: number; trigger: Trigger; vibe?: Vibe }
  | { t: 'endTurn' }
  | { t: 'prompt'; prompt: Prompt };

export interface LogEntry {
  p: number | null;
  msg: string;
  kind?: 'act' | 'soft' | 'round' | 'power' | 'info';
}

export interface GameState {
  rng: number;
  players: Player[];
  deck: string[];
  discard: string[];
  tray: (string | null)[];
  gacha: Face[];
  round: number;
  turn: number;
  firstPlayer: number;
  districts: DistrictId[];
  results: DistrictResult[];
  phase: 'setup' | 'play' | 'over';
  prompt: Prompt | null;
  queue: Task[];
  log: LogEntry[];
  /** monotonically increasing; UI uses it to animate */
  tick: number;
  /** last thing that happened, for camera/animation hints */
  last?: { p: number; kind: 'wake' | 'act' | 'ask'; row?: Row; col?: number; card?: string };
}
