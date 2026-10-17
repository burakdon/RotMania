// Reclaimers (who you play), districts (what the table fights over each round), and display names.
import type { DistrictId, Pool, ReclaimerId, Row, ToyRecipe, Vibe } from './types';

export interface Reclaimer {
  id: ReclaimerId;
  name: string;
  tagline: string;
  perk: string;
  challenge: string;
  challengeName: string;
  toy: ToyRecipe;
}

export const RECLAIMERS: Record<ReclaimerId, Reclaimer> = {
  mina: {
    id: 'mina', name: 'Mina', tagline: 'She squeezed too hard. She is 19 now.',
    perk: 'Make Stuff gives you 1 extra Craft.',
    challengeName: 'Hold It Yourself',
    challenge: 'End-game Aura by Juice you took all game: none → 8 · 1–2 → 5 · 3–4 → 2.',
    toy: { head: 'kid', body: 'bean', c1: '#f1c27d', c2: '#3b2f2f', c3: '#ffd166', arms: 'nubs', legs: 'sneakers', eyes: 'dot', acc: ['hoodie'] },
  },
  nonna: {
    id: 'nonna', name: 'Nonna Lievito', tagline: 'Has kept the same sourdough starter alive since 1987. His name is Gerald.',
    perk: 'Start the game with 2 extra Bread.',
    challengeName: 'Feed Everyone',
    challenge: '1 Aura per Snacc you woke. 5 or more Snaccs: +3 more.',
    toy: { head: 'kid', body: 'bean', c1: '#e0ac69', c2: '#dee2e6', c3: '#7048e8', arms: 'nubs', legs: 'nubs', eyes: 'sleepy', acc: ['bun', 'glasses'] },
  },
  coach: {
    id: 'coach', name: 'Coach Pratoverde', tagline: 'Will make you touch grass. Will touch it with you.',
    perk: 'Once per round, a Soft token does not switch off your powers.',
    challengeName: 'Out of the House',
    challenge: 'Outside row with 4 brainrots → 4 Aura · full (5) → 8 Aura.',
    toy: { head: 'kid', body: 'bean', c1: '#8d5524', c2: '#212529', c3: '#2f9e44', arms: 'nubs', legs: 'sneakers', eyes: 'dot', acc: ['whistle', 'cap'] },
  },
  dj: {
    id: 'dj', name: 'DJ Vinilia', tagline: 'Only plays records. Only plays them for people in the room.',
    perk: 'Whenever you wake a brainrot that costs Vinyl, draw 1 card.',
    challengeName: 'Crowd Work',
    challenge: '2 Aura per Icon in your Group Chat row.',
    toy: { head: 'kid', body: 'bean', c1: '#c68642', c2: '#e64980', c3: '#212529', arms: 'nubs', legs: 'boots', eyes: 'shades', acc: ['headphones'] },
  },
  biblio: {
    id: 'biblio', name: 'Signora Pagina', tagline: 'Librarian. Has a card catalogue in her head and a pencil behind her ear.',
    perk: 'Your first Group Chat each round draws 1 extra card.',
    challengeName: 'Footnotes',
    challenge: '1 extra Aura per card tucked under your brainrots.',
    toy: { head: 'kid', body: 'bean', c1: '#ffdbac', c2: '#adb5bd', c3: '#1864ab', arms: 'nubs', legs: 'nubs', eyes: 'dot', acc: ['glasses', 'bun'] },
  },
  bruno: {
    id: 'bruno', name: 'Bruno', tagline: 'Fixes things. Refuses to say "it just needs an update."',
    perk: 'Waking a brainrot costs 1 less Craft.',
    challengeName: 'Right to Repair',
    challenge: '2 Aura per Gadget in your Workshop row.',
    toy: { head: 'kid', body: 'bean', c1: '#a0522d', c2: '#212529', c3: '#1971c2', arms: 'nubs', legs: 'boots', eyes: 'dot', acc: ['cap', 'mustache'] },
  },
  dev: {
    id: 'dev', name: 'Dev Nullo', tagline: 'Wrote SQUEEZE v1 over a weekend. Has been apologizing since.',
    perk: 'Your Soft tokens may go on empty rows.',
    challengeName: 'Know the Tool',
    challenge: 'End with no Soft tokens: 2 Aura per Juice you took (max 10).',
    toy: { head: 'kid', body: 'bean', c1: '#f1c27d', c2: '#495057', c3: '#343a40', arms: 'nubs', legs: 'sneakers', eyes: 'sleepy', acc: ['hoodie', 'glasses'] },
  },
  kiki: {
    id: 'kiki', name: 'Kiki', tagline: 'Had 2.1 million followers. Deleted the app. Has 6 friends now. Real ones.',
    perk: 'Draw 1 extra card after setup.',
    challengeName: 'Main Character',
    challenge: '3 Aura for each district you reclaim (1st place, ties count).',
    toy: { head: 'kid', body: 'bean', c1: '#ffdbac', c2: '#f783ac', c3: '#f8f9fa', arms: 'nubs', legs: 'boots', eyes: 'big', acc: ['buns2'] },
  },
};

export interface District {
  id: DistrictId;
  name: string;
  goal: string;
  color: string;
}

export const DISTRICTS: Record<DistrictId, District> = {
  park: { id: 'park', name: 'The Park', goal: 'Brainrots in your Outside row', color: '#51cf66' },
  garage: { id: 'garage', name: 'The Garage', goal: 'Brainrots in your Workshop row', color: '#fd7e14' },
  cafeteria: { id: 'cafeteria', name: 'The Cafeteria', goal: 'Brainrots in your Group Chat row', color: '#4dabf7' },
  fair: { id: 'fair', name: 'The Craft Fair', goal: 'Crafts on your brainrots', color: '#f06595' },
  school: { id: 'school', name: 'The School', goal: 'Brainrots holding at least 1 Craft', color: '#fab005' },
  foodcourt: { id: 'foodcourt', name: 'The Food Court', goal: 'Snaccs you woke', color: '#ff922b' },
  zoo: { id: 'zoo', name: 'The Zoo', goal: 'Beasts you woke', color: '#82c91e' },
  repair: { id: 'repair', name: 'The Repair Café', goal: 'Gadgets you woke', color: '#748ffc' },
  stage: { id: 'stage', name: 'The Open Mic', goal: 'Icons you woke', color: '#cc5de8' },
  pantry: { id: 'pantry', name: 'The Pantry', goal: 'Resources stashed on brainrots', color: '#e8590c' },
  library: { id: 'library', name: 'The Library', goal: 'Cards tucked under brainrots', color: '#9c6644' },
  arcade: { id: 'arcade', name: 'The Arcade', goal: 'Brainrots worth 3 Aura or less', color: '#20c997' },
};

export const ROW_NAMES: Record<Row, string> = { 0: 'Outside', 1: 'Workshop', 2: 'Group Chat' };
export const ROW_VERBS: Record<Row, string> = { 0: 'Go Outside', 1: 'Make Stuff', 2: 'Group Chat' };
export const ROW_GAINS: Record<Row, string> = { 0: 'resources', 1: 'crafts', 2: 'cards' };
export const ROW_COLORS: Record<Row, string> = { 0: '#51cf66', 1: '#ff922b', 2: '#4dabf7' };

export const POOL_NAMES: Record<Pool, string> = {
  grass: 'Grass', bread: 'Bread', vinyl: 'Vinyl', yarn: 'Yarn', paper: 'Paper', juice: 'Juice',
};
export const POOL_ICONS: Record<Pool | 'any', string> = {
  grass: '🌱', bread: '🍞', vinyl: '💿', yarn: '🧶', paper: '📝', juice: '🍓', any: '✳️',
};
export const POOL_COLORS: Record<Pool, string> = {
  grass: '#51cf66', bread: '#e8a33e', vinyl: '#7950f2', yarn: '#f06595', paper: '#e9ecef', juice: '#ff2d55',
};

export const VIBE_NAMES: Record<Vibe, string> = { snacc: 'Snacc', beast: 'Beast', gadget: 'Gadget', icon: 'Icon' };
export const VIBE_ICONS: Record<Vibe, string> = { snacc: '🍝', beast: '🦈', gadget: '📟', icon: '🎤' };
export const VIBE_COLORS: Record<Vibe, string> = { snacc: '#ff922b', beast: '#40c057', gadget: '#4c6ef5', icon: '#d6336c' };
