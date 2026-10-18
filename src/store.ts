// App state: which screen, the live game, and the bot driver.
import { create } from 'zustand';
import { botAnswer } from './game/bots';
import { apply, newGame, type SeatConfig } from './game/engine';
import type { Answer, GameState } from './game/types';

export type Screen = 'title' | 'comic' | 'comicbook' | 'lobby' | 'game' | 'results' | 'handbook';

interface Store {
  screen: Screen;
  game: GameState | null;
  seats: SeatConfig[];
  error: string | null;
  /** which human is looking at the screen (hot-seat) */
  viewer: number;
  handoffPending: boolean;
  botSpeed: number;
  go: (s: Screen) => void;
  start: (seats: SeatConfig[]) => void;
  answer: (a: Answer) => void;
  clearError: () => void;
  acceptHandoff: () => void;
  setBotSpeed: (n: number) => void;
}

let botTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<Store>((set, get) => {
  function afterChange() {
    const g = get().game;
    if (!g) return;
    if (botTimer) clearTimeout(botTimer);
    if (g.phase === 'over') {
      botTimer = setTimeout(() => set({ screen: 'results' }), 2200);
      return;
    }
    const pr = g.prompt;
    if (!pr) return;
    const p = g.players[pr.player];
    if (p.bot) {
      const delay = pr.type === 'place' ? 850 : 500;
      botTimer = setTimeout(() => {
        const cur = get().game;
        if (!cur || cur !== g) return;
        try {
          set({ game: apply(cur, botAnswer(cur)) });
        } catch (e) {
          console.error('bot error', e);
          return;
        }
        afterChange();
      }, delay * get().botSpeed);
      return;
    }
    const humans = g.players.filter((x) => !x.bot).length;
    if (p.id !== get().viewer) set({ viewer: p.id, handoffPending: humans > 1 });
  }

  return {
    screen: 'title',
    game: null,
    seats: [],
    error: null,
    viewer: 0,
    handoffPending: false,
    botSpeed: 1,
    go: (screen) => set({ screen }),
    start: (seats) => {
      const game = newGame(seats);
      const firstHuman = game.players.find((p) => !p.bot)?.id ?? 0;
      set({ seats, game, screen: 'game', viewer: firstHuman, handoffPending: false, error: null });
      afterChange();
    },
    answer: (a) => {
      const g = get().game;
      if (!g) return;
      try {
        set({ game: apply(g, a), error: null });
        afterChange();
      } catch (e) {
        set({ error: (e as Error).message });
      }
    },
    clearError: () => set({ error: null }),
    acceptHandoff: () => set({ handoffPending: false }),
    setBotSpeed: (botSpeed) => set({ botSpeed }),
  };
});
