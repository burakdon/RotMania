import { create } from 'zustand';

interface UI {
  selected: string | null;
  hover: { card: string; x: number; y: number } | null;
  showLog: boolean;
  showRules: boolean;
  select: (id: string | null) => void;
  setHover: (h: UI['hover']) => void;
  toggleLog: () => void;
  setRules: (v: boolean) => void;
}

export const useUI = create<UI>((set) => ({
  selected: null,
  hover: null,
  showLog: false,
  showRules: false,
  select: (selected) => set({ selected }),
  setHover: (hover) => set({ hover }),
  toggleLog: () => set((s) => ({ showLog: !s.showLog })),
  setRules: (showRules) => set({ showRules }),
}));
