import { create } from 'zustand';
import type { SpaceId } from '../game/types';

interface UI {
  hoverSpace: SpaceId | null;
  hoverCard: string | null;
  /** a space waiting for a follow-up choice (who to deprogram, which resource, agent or helper) */
  pending: SpaceId | null;
  showLog: boolean;
  showRules: boolean;
  setHoverSpace: (s: SpaceId | null) => void;
  setHoverCard: (id: string | null) => void;
  setPending: (s: SpaceId | null) => void;
  toggleLog: () => void;
  setRules: (v: boolean) => void;
}

export const useUI = create<UI>((set) => ({
  hoverSpace: null,
  hoverCard: null,
  pending: null,
  showLog: false,
  showRules: false,
  setHoverSpace: (hoverSpace) => set({ hoverSpace }),
  setHoverCard: (hoverCard) => set({ hoverCard }),
  setPending: (pending) => set({ pending }),
  toggleLog: () => set((s) => ({ showLog: !s.showLog })),
  setRules: (showRules) => set({ showRules }),
}));
