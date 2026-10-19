// Phone or desktop layout. Players pick on the title screen; 'auto' follows the screen size.
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';

export type ViewMode = 'auto' | 'phone' | 'desktop';

const KEY = 'rotmania.view';
/** narrow portrait screens and short landscape ones both get the phone layout */
const SMALL = '(max-width: 640px), (max-height: 500px)';

function load(): ViewMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'auto' || v === 'phone' || v === 'desktop') return v;
  } catch {
    // storage blocked: fall back to auto
  }
  return 'auto';
}

export const useView = create<{ mode: ViewMode; setMode: (m: ViewMode) => void }>((set) => ({
  mode: load(),
  setMode: (mode) => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      // not remembered, still applied
    }
    set({ mode });
  },
}));

function subscribe(cb: () => void) {
  const m = window.matchMedia(SMALL);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}

export function useSmallScreen() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(SMALL).matches);
}

/** true when the game should use the phone layout */
export function usePhone() {
  const mode = useView((v) => v.mode);
  const small = useSmallScreen();
  return mode === 'phone' || (mode === 'auto' && small);
}
