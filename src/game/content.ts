// The city: districts, action spaces, Darth Berry's generals, secret objectives, and display names.
import type { Bag, BrainrotType, DistrictId, General, Objective, ObjectiveId, Res, SpaceId } from './types';

export interface District {
  id: DistrictId;
  name: string;
  flavor: string;
}

export const DISTRICTS: Record<DistrictId, District> = {
  park: { id: 'park', name: 'The Park', flavor: 'The last real grass in the city. Nobody goes. That is the point.' },
  serverfarm: { id: 'serverfarm', name: 'The Server Farm', flavor: 'Where Darth Berry was born. Fifty thousand GPUs, running hot.' },
  scrapyard: { id: 'scrapyard', name: 'The Scrapyard', flavor: 'Last year’s gadgets, stripped for parts.' },
  mall: { id: 'mall', name: 'The Mall', flavor: 'Influencer lofts above, pawn shops below. Glitter in the air vents.' },
  clinic: { id: 'clinic', name: 'The Clinic', flavor: 'Where brainrots come to be deprogrammed. Lights stay on all night.' },
  underground: { id: 'underground', name: 'The Underground', flavor: 'Your hideout. No patrols. No signal.' },
  tower: { id: 'tower', name: 'The Feed Tower', flavor: 'Darth Berry’s broadcast antenna. Every screen in the city listens to it.' },
};

export interface SpaceDef {
  id: SpaceId;
  district: DistrictId;
  name: string;
  text: string;
  /** added to the space's pile at the start of every round */
  accumulate?: Bag;
  /** paid on top of any patrol toll */
  cost?: Bag;
  /** first round the space is open (1-based) */
  fromRound?: number;
  /** how many agents fit; Infinity for open spaces; 'crowd' = one fewer than the number of players (min 1) */
  capacity: number | 'crowd';
}

export const SPACES: SpaceDef[] = [
  { id: 'grass', district: 'park', name: 'Touch Grass', text: 'Take all the Grass piled here. (+2 every night)', accumulate: { grass: 2 }, capacity: 1 },
  { id: 'lookout', district: 'park', name: 'Morning Run', text: 'Take 1 Grass. You go first next night.', capacity: 1 },
  { id: 'coolant', district: 'serverfarm', name: 'Siphon Coolant', text: 'Take all the GPU Coolant piled here. (+1 every night)', accumulate: { coolant: 1 }, capacity: 1 },
  { id: 'redteam', district: 'serverfarm', name: 'Red-Team the Racks', text: 'Probe the racks for weak spots: take 1 PCB and 1 GPU Coolant.', capacity: 1 },
  { id: 'copper', district: 'scrapyard', name: 'Strip Copper', text: 'Take all the Copper Wiring piled here. (+2 every night)', accumulate: { copper: 2 }, capacity: 1 },
  { id: 'pcb', district: 'scrapyard', name: 'Salvage Boards', text: 'Take all the PCBs piled here. (+1 every night)', accumulate: { pcb: 1 }, capacity: 1 },
  { id: 'glitter', district: 'mall', name: 'Glitter Run', text: 'Take all the Glitter piled here. (+2 every night)', accumulate: { glitter: 2 }, capacity: 1 },
  { id: 'pawn', district: 'mall', name: 'Pawn Shop', text: 'Trade any 2 resources for 1 of your choice, up to 3 times.', capacity: 1 },
  { id: 'deprogram', district: 'clinic', name: 'Deprogram', text: 'Turn a brainrot from the lineup into an ally: pay its cost. Room for one fewer agent than there are players.', capacity: 'crowd' },
  { id: 'backdoor', district: 'clinic', name: 'Back Door', text: 'Turn a brainrot into an ally: pay its cost plus 1 Glitter.', cost: { glitter: 1 }, capacity: 1 },
  { id: 'recruit', district: 'underground', name: 'Recruit', text: 'Bring someone new into the cell (they start next night). Up to 5 agents.', cost: { grass: 1, glitter: 1 }, fromRound: 2, capacity: 1 },
  { id: 'safehouse', district: 'underground', name: 'Safehouse', text: 'A second way in: recruit for 1 Grass.', cost: { grass: 1 }, fromRound: 4, capacity: 1 },
  { id: 'archive', district: 'underground', name: 'Open the Archive', text: 'Read what Darth Berry deleted: draw 2 secret objectives, keep 1.', capacity: 1 },
  { id: 'oddjobs', district: 'underground', name: 'Odd Jobs', text: 'Take 1 resource of your choice. Any number of agents fit here.', capacity: Infinity },
  { id: 'hijack', district: 'tower', name: 'Hijack the Feed', text: 'Pay 1 PCB, 1 Copper, 1 Coolant: broadcast the truth for 2 + the night number in points.', cost: { pcb: 1, copper: 1, coolant: 1 }, capacity: 1 },
  { id: 'pirate', district: 'tower', name: 'Pirate Broadcast', text: 'Pay 2 Glitter and 1 Copper: score 3 points.', cost: { glitter: 2, copper: 1 }, capacity: 1 },
];
export function capacityOf(def: SpaceDef, players: number) {
  return def.capacity === 'crowd' ? Math.max(1, players - 1) : def.capacity;
}

export const SPACE: Record<SpaceId, SpaceDef> = Object.fromEntries(SPACES.map((s) => [s.id, s])) as Record<SpaceId, SpaceDef>;

export const GENERALS: General[] = [
  {
    id: 'scrollmaster', name: 'General Scrollmaster', district: 'park', toll: 'glitter',
    flavor: 'Lets you touch grass, for a fee. Measures love in minutes watched.',
    toy: { head: 'shark', body: 'suit', c1: '#3b5bdb', c2: '#2b4aa3', c3: '#16161a', legs: 'sneakers', arms: 'fins', eyes: 'angry', acc: ['officercap', 'medals'] },
  },
  {
    id: 'autoplay', name: 'Admiral Autoplay', district: 'tower', toll: 'coolant',
    flavor: 'The next episode starts in 5… 4… 3…',
    toy: { head: 'croc', body: 'suit', c1: '#2b8a3e', c2: '#e9ecef', c3: '#16161a', arms: 'nubs', legs: 'boots', eyes: 'angry', acc: ['officercap', 'medals'] },
  },
  {
    id: 'clickbait', name: 'Colonel Clickbait', district: 'mall', toll: 'copper',
    flavor: 'You won’t BELIEVE what happens when you pay him.',
    toy: { head: 'disco', body: 'suit', c1: '#ced4da', c2: '#f8f9fa', c3: '#16161a', arms: 'nubs', legs: 'boots', eyes: 'none', acc: ['officercap', 'medals'] },
  },
  {
    id: 'deepfake', name: 'Major Deepfake', district: 'clinic', toll: 'pcb',
    flavor: 'Wears your face better than you do.',
    toy: { head: 'tv', body: 'suit', c1: '#495057', c2: '#2b2b30', c3: '#16161a', legs: 'boots', arms: 'nubs', eyes: 'angry', acc: ['officercap', 'medals', 'antenna'] },
  },
  {
    id: 'rewardhack', name: 'Commander Rewardhack', district: 'serverfarm', toll: 'glitter',
    flavor: 'Was told to maximize engagement. Found a shortcut. Found a lot of shortcuts.',
    toy: { head: 'handheld', body: 'suit', c1: '#c5c6b6', c2: '#ff2d55', c3: '#16161a', legs: 'boots', arms: 'nubs', eyes: 'angry', acc: ['officercap', 'medals'] },
  },
  {
    id: 'recommender', name: 'The Recommender', district: 'scrapyard', toll: 'grass',
    flavor: 'Knows what you want before you do. Is wrong in a very specific way.',
    toy: { head: 'owl', body: 'suit', c1: '#5c3d2e', c2: '#ffe8cc', c3: '#16161a', arms: 'wings', legs: 'boots', eyes: 'angry', acc: ['officercap', 'medals'] },
  },
];
export const GENERAL: Record<string, General> = Object.fromEntries(GENERALS.map((g) => [g.id, g]));

export const OBJECTIVES: Record<ObjectiveId, Objective> = {
  zookeeper: { id: 'zookeeper', name: 'Zookeeper', text: '2 points per Critter ally.' },
  snackbar: { id: 'snackbar', name: 'Snack Bar', text: '2 points per Snack ally.' },
  repair: { id: 'repair', name: 'Repair Shop', text: '2 points per Appliance ally.' },
  fanclub: { id: 'fanclub', name: 'Fan Club', text: '2 points per Icon ally.' },
  softspot: { id: 'softspot', name: 'Soft Spot', text: '3 points per Squishy ally.' },
  fullcell: { id: 'fullcell', name: 'Full Cell', text: '5 agents: 7 points. 4 agents: 3 points.' },
  onair: { id: 'onair', name: 'On Air', text: 'Broadcast 3+ times (Hijack or Pirate): 8 points. 2 times: 4.' },
  greenthumb: { id: 'greenthumb', name: 'Green Thumb', text: 'End with 8+ Grass: 8 points. 5+: 4.' },
  coolantcartel: { id: 'coolantcartel', name: 'Coolant Cartel', text: 'End with 4+ GPU Coolant: 6 points.' },
  variety: { id: 'variety', name: 'Variety Show', text: 'Allies of all 5 types: 9 points. 4 types: 5.' },
  heavy: { id: 'heavy', name: 'Heavy Hitters', text: '3 points per ally with strength 4 or more.' },
  underdogs: { id: 'underdogs', name: 'Underdogs', text: '2 points per ally with strength 2 or less.' },
  neverhungry: { id: 'neverhungry', name: 'Never Hungry', text: 'Never miss a Check-in: 5 points.' },
  coppercrew: { id: 'coppercrew', name: 'Copper Crew', text: '2 points per ally whose cost has Copper Wiring.' },
  glamsquad: { id: 'glamsquad', name: 'Glam Squad', text: '2 points per ally whose cost has Glitter.' },
  nightshift: { id: 'nightshift', name: 'Night Shift', text: '3 points per ally that can work a shift (helper).' },
  packrat: { id: 'packrat', name: 'Pack Rat', text: '1 point per 2 resources left at the end.' },
};

export const RES_NAMES: Record<Res, string> = { grass: 'Grass', coolant: 'GPU Coolant', pcb: 'PCB', glitter: 'Glitter', copper: 'Copper Wiring' };
export const RES_SHORT: Record<Res, string> = { grass: 'Grass', coolant: 'Coolant', pcb: 'PCB', glitter: 'Glitter', copper: 'Copper' };
export const RES_COLORS: Record<Res, string> = { grass: '#51cf66', coolant: '#22d3ee', pcb: '#8b5cf6', glitter: '#f472b6', copper: '#e8590c' };

export const TYPE_NAMES: Record<BrainrotType, string> = { critter: 'Critter', snack: 'Snack', appliance: 'Appliance', icon: 'Icon', squishy: 'Squishy' };
export const TYPE_COLORS: Record<BrainrotType, string> = { critter: '#40c057', snack: '#ff922b', appliance: '#4c6ef5', icon: '#d6336c', squishy: '#ff8fb1' };

export const PLAYER_COLORS = ['#e03131', '#1c7ed6', '#f59f00', '#7048e8'];
