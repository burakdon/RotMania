// Core types for RotMania (2048). Worker placement: resistance cells send agents across DarkBerry's city.
// No DOM, no three.js: the rules run in Node for tests and simulations.

export const RES = ['grass', 'coolant', 'pcb', 'glitter', 'copper'] as const;
export type Res = (typeof RES)[number];
export type Bag = Partial<Record<Res, number>>;

export const TYPES = ['critter', 'snack', 'appliance', 'icon', 'squishy'] as const;
export type BrainrotType = (typeof TYPES)[number];

export type DistrictId = 'park' | 'serverfarm' | 'scrapyard' | 'mall' | 'clinic' | 'underground' | 'tower';

export type SpaceId =
  | 'grass' | 'lookout'
  | 'coolant' | 'redteam'
  | 'copper' | 'pcb'
  | 'glitter' | 'pawn'
  | 'deprogram' | 'backdoor'
  | 'recruit' | 'safehouse' | 'archive' | 'oddjobs'
  | 'hijack' | 'pirate';

export type Ability =
  | { k: 'dawn'; gain: Bag }
  | { k: 'boost'; space: SpaceId; gain: Bag }
  | { k: 'turnDiscount' }
  | { k: 'recruitDiscount' }
  | { k: 'feedBonus'; n: number }
  | { k: 'instant'; gain?: Bag; objective?: boolean; tempAgent?: boolean }
  | { k: 'helper'; district: DistrictId }
  | { k: 'grounding'; n: number }
  | { k: 'tollProof' }
  | { k: 'pawnRate' }
  | { k: 'final'; per: 'type'; type: BrainrotType; n: number }
  | { k: 'final'; per: 'lowAlly'; n: number }
  | { k: 'final'; per: 'agent'; n: number };

export interface ToyRecipe {
  head: string;
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

export interface Brainrot {
  id: string;
  name: string;
  type: BrainrotType;
  cost: Bag;
  /** points it's worth at the end */
  strength: number;
  ability?: Ability;
  flavor: string;
  toy: ToyRecipe;
}

export interface General {
  id: string;
  name: string;
  district: DistrictId;
  toll: Res;
  flavor: string;
  toy: ToyRecipe;
}

export type ObjectiveId =
  | 'zookeeper' | 'snackbar' | 'repair' | 'fanclub' | 'softspot' | 'fullcell' | 'onair' | 'greenthumb'
  | 'coolantcartel' | 'variety' | 'heavy' | 'underdogs' | 'neverhungry' | 'coppercrew' | 'glamsquad' | 'nightshift' | 'packrat';

export interface Objective {
  id: ObjectiveId;
  name: string;
  text: string;
}

export interface Placement {
  space: SpaceId;
  /** index into player.allies when a brainrot helper was placed instead of an agent */
  helper?: number;
}

export interface Player {
  id: number;
  name: string;
  bot: boolean;
  color: string;
  res: Record<Res, number>;
  /** agents still to place this round */
  agentsFree: number;
  /** agents owned (recruits count from the round after they join) */
  agents: number;
  /** recruited this round: placeable from next round */
  rookies: number;
  allies: string[];
  /** helper allies already used this round (indices into allies) */
  helpersUsed: number[];
  objectives: ObjectiveId[];
  feedPoints: number;
  feedCount: number;
  hungry: number;
  /** what this player did this round, for the board */
  placements: Placement[];
}

export interface SpaceState {
  id: SpaceId;
  /** players who occupy it this round (in order) */
  taken: number[];
  /** accumulated resources sitting on it */
  pile: Bag;
}

export type Prompt =
  | { type: 'objective'; player: number; options: ObjectiveId[]; setup: boolean }
  | { type: 'place'; player: number }
  | { type: 'pawn'; player: number; left: number };

export type Answer =
  | { type: 'objective'; keep: ObjectiveId }
  | { type: 'place'; space: SpaceId; helper?: number; slot?: number; res?: Res }
  | { type: 'pawn'; give?: Res[]; get?: Res; done?: boolean };

export interface LogEntry {
  p: number | null;
  msg: string;
  kind?: 'act' | 'round' | 'ally' | 'info' | 'warn';
}

export interface GameState {
  rng: number;
  players: Player[];
  deck: string[];
  discard: string[];
  /** face-up brainrots; index 0 is newest, the last ones are older and cheaper */
  market: (string | null)[];
  spaces: Record<SpaceId, SpaceState>;
  /** generals in patrol order, one per round */
  generals: string[];
  objectiveDeck: ObjectiveId[];
  round: number;
  firstPlayer: number;
  nextFirst: number | null;
  turn: number;
  phase: 'setup' | 'play' | 'over';
  prompt: Prompt | null;
  /** pending setup objective choices, in seat order */
  setupQueue: number[];
  log: LogEntry[];
  tick: number;
  last?: { p: number; space: SpaceId; card?: string };
}
