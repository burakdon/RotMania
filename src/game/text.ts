// Human-readable power text, generated from the effect data so cards and rules never disagree.
import { POOL_NAMES, VIBE_NAMES } from './content';
import type { Effect, Power } from './types';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const res = (r: string) => (r === 'any' ? 'any resource' : POOL_NAMES[r as keyof typeof POOL_NAMES]);

export function fxText(fx: Effect): string {
  switch (fx.k) {
    case 'gain': return `Gain ${fx.n === 1 ? '' : fx.n + ' '}${res(fx.res)} from the supply.`;
    case 'gacha': return `Take ${plural(fx.n, 'capsule')} from the gacha.`;
    case 'gachaStash': return `If the gacha shows ${res(fx.res)}, take it and stash it here.`;
    case 'draw': return `Draw ${plural(fx.n, 'card')}.`;
    case 'craftHere': return `Make ${plural(fx.n, 'craft')} on this brainrot.`;
    case 'craftAny': return `Make ${plural(fx.n, 'craft')} on any of your brainrots.`;
    case 'craftRow': return 'Make 1 craft on every brainrot in this row.';
    case 'stash': return `Stash ${fx.n} ${res(fx.res)} from the supply here.`;
    case 'tuckDraw': return 'You may tuck a card from your hand under this. If you do, draw 1.';
    case 'tuckGain': return `You may tuck a card from your hand under this. If you do, gain ${res(fx.res)}.`;
    case 'tuckTop': return `Tuck ${fx.n === 1 ? 'the top card' : `the top ${fx.n} cards`} of the deck under this.`;
    case 'hunt': return `Reveal the top card. If its Rot is under ${fx.max}%, tuck it here; otherwise discard it.`;
    case 'fish': return `Shake the machine: roll the empty capsule slots. If any shows ${res(fx.res)}, stash 1 here.`;
    case 'trade': {
      const pay = fx.pay === 'card' ? 'discard a card' : fx.pay === 'craft' ? 'spend a craft' : `pay ${fx.pay === 'any' ? 'any resource' : res(fx.pay)}`;
      const then = fxText(fx.then);
      return `You may ${pay} to: ${then.charAt(0).toLowerCase()}${then.slice(1)}`;
    }
    case 'allDraw': return 'Everyone draws 1 card. You draw 1 more.';
    case 'allGain': return `Everyone gains ${res(fx.res)}. You gain 1 more.`;
    case 'unsoft': return 'Remove a Soft token from one of your rows.';
    case 'repeat': return 'Repeat another brainrot power in this row.';
    case 'aura': return `Gain ${fx.n} Aura.`;
    case 'juice': return `Gain ${plural(fx.n, 'Juice')} 🍓 (and the Soft token${fx.n > 1 ? 's' : ''} that come${fx.n > 1 ? '' : 's'} with it).`;
    case 'finaleVibe': return `+${fx.n} Aura per ${VIBE_NAMES[fx.vibe]} ${fx.scope === 'row' ? 'in this row' : 'you woke'}.`;
    case 'finaleRowFull': return `+${fx.n} Aura if this row is full.`;
    case 'finaleNoSoft': return `+${fx.n} Aura if you end with no Soft tokens.`;
    case 'finaleSoft': return `+${fx.n} Aura per Soft token you still have (max ${fx.max}).`;
    case 'finaleStash': return `+${fx.n} Aura per resource stashed here.`;
  }
}

export const WHEN_LABEL: Record<Power['when'], string> = {
  woke: 'WHEN WOKEN',
  each: 'EACH TIME',
  meanwhile: 'MEANWHILE',
  whenever: 'WHENEVER',
  finale: 'FINALE',
};

const TRIGGER_TEXT = {
  otherJuice: 'another player takes Juice',
  otherOutside: 'another player Goes Outside',
  otherWorkshop: 'another player Makes Stuff',
  otherChat: 'another player Group Chats',
  otherWakes: 'another player wakes a brainrot',
  youJuice: 'you take Juice',
} as const;

export function powerText(p: Power): string {
  if (p.when === 'meanwhile' || p.when === 'whenever') {
    let trig: string = TRIGGER_TEXT[p.on!];
    if (p.on === 'otherWakes' && p.vibe) trig = `another player wakes a ${VIBE_NAMES[p.vibe]}`;
    return `When ${trig}: ${fxText(p.fx).charAt(0).toLowerCase()}${fxText(p.fx).slice(1)}${p.when === 'meanwhile' ? ' (once between your turns)' : ''}`;
  }
  return fxText(p.fx);
}

export const WHEN_HELP: Record<Power['when'], string> = {
  woke: 'Happens once, right when you wake this brainrot.',
  each: 'Happens every time you take the action of the row this brainrot lives in.',
  meanwhile: "Reacts on other players' turns.",
  whenever: 'Reacts to something you do.',
  finale: 'Scores at the end of the game.',
};
