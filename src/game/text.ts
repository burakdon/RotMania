// Human-readable ability text, generated from the data so cards and rules never disagree.
import { DISTRICTS, RES_NAMES, SPACE, TYPE_NAMES } from './content';
import type { Ability, Bag } from './types';
import { RES } from './types';

const bag = (b: Bag) => RES.filter((r) => b[r]).map((r) => `${b[r]} ${RES_NAMES[r]}`).join(' and ');

export const ABILITY_LABEL: Record<Ability['k'], string> = {
  dawn: 'EVERY DAWN',
  boost: 'ON THE JOB',
  turnDiscount: 'ALWAYS',
  recruitDiscount: 'ALWAYS',
  feedBonus: 'ON AIR',
  instant: 'WHEN TURNED',
  helper: 'NIGHT SHIFT',
  grounding: 'CHECK-IN',
  tollProof: 'ALWAYS',
  pawnRate: 'ALWAYS',
  final: 'AT THE END',
};

export function abilityText(a: Ability): string {
  switch (a.k) {
    case 'dawn': return `Gain ${bag(a.gain)}.`;
    case 'boost': return `When you use ${SPACE[a.space].name}, also gain ${bag(a.gain)}.`;
    case 'turnDiscount': return 'Deprogramming costs you 1 less resource.';
    case 'recruitDiscount': return 'Recruiting costs you 1 less resource.';
    case 'feedBonus': return `+${a.n} point${a.n > 1 ? 's' : ''} every time you Hijack the Feed or run a Pirate Broadcast.`;
    case 'instant': {
      const parts: string[] = [];
      if (a.gain) parts.push(`gain ${bag(a.gain)}`);
      if (a.objective) parts.push('draw 2 secret objectives and keep 1');
      if (a.tempAgent) parts.push('place 1 extra agent tonight');
      const t = parts.join('; ');
      return t.charAt(0).toUpperCase() + t.slice(1) + '.';
    }
    case 'helper': return `Once a night, this ally can take a space in ${DISTRICTS[a.district].name} like an agent.`;
    case 'grounding': return `Grounds ${a.n} agent${a.n > 1 ? 's' : ''} at every Check-in (no Grass needed).`;
    case 'tollProof': return 'Generals never charge you a toll.';
    case 'pawnRate': return 'Pawn Shop trades are 1 for 1.';
    case 'final':
      if (a.per === 'type') return `+${a.n} point${a.n > 1 ? 's' : ''} per ${TYPE_NAMES[a.type]} ally (counting this one).`;
      if (a.per === 'lowAlly') return `+${a.n} point per ally with strength 2 or less.`;
      return `+${a.n} point per agent in your cell.`;
  }
}
