// Small inked SVG icons for resources, agents and points.
import { RES_COLORS, RES_NAMES } from '../game/content';
import type { Bag, Res } from '../game/types';
import { RES } from '../game/types';

const INK = '#0b0b0d';

export function ResIcon({ r, size = 18 }: { r: Res; size?: number }) {
  const c = RES_COLORS[r];
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-label': RES_NAMES[r] } as const;
  switch (r) {
    case 'grass':
      return (
        <svg {...common}>
          <path d="M5 21 C6 14 4 9 3 6 C7 9 8 14 9 21 Z M10 21 C10 13 11 7 12 3 C14 8 14 14 14 21 Z M15 21 C16 15 18 11 21 8 C20 13 19 17 19 21 Z" fill={c} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'coolant':
      return (
        <svg {...common}>
          <path d="M12 2 C15 8 19 11 19 15 A7 7 0 0 1 5 15 C5 11 9 8 12 2 Z" fill={c} stroke={INK} strokeWidth="1.5" />
          <path d="M9 15 A3 3 0 0 0 12 18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'pcb':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" fill={c} stroke={INK} strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" fill={INK} />
          <path d="M5 8 H9 M5 16 H9 M15 8 H19 M15 16 H19 M12 4 V9 M12 15 V20" stroke="#fcc419" strokeWidth="1.3" />
        </svg>
      );
    case 'glitter':
      return (
        <svg {...common}>
          <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={c} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M19 3 L19.8 5.2 L22 6 L19.8 6.8 L19 9 L18.2 6.8 L16 6 L18.2 5.2 Z" fill="#fff" stroke={INK} strokeWidth="0.8" />
        </svg>
      );
    case 'copper':
      return (
        <svg {...common}>
          <path d="M3 17 C6 17 6 7 9 7 C12 7 12 17 15 17 C18 17 18 7 21 7" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M3 17 C6 17 6 7 9 7 C12 7 12 17 15 17 C18 17 18 7 21 7" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}

export function BagView({ bag, empty = 'free' }: { bag: Bag; empty?: string }) {
  const items = RES.flatMap((r) => Array.from({ length: bag[r] ?? 0 }, (_, i) => <ResIcon key={r + i} r={r} size={17} />));
  return <span className="bag">{items.length ? items : <em>{empty}</em>}</span>;
}

export function Meeple({ color, size = 16, ghost }: { color: string; size?: number; ghost?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: ghost ? 0.35 : 1 }}>
      <path d="M12 2 a3.2 3.2 0 0 1 3.2 3.2 c0 1-.4 1.7-1 2.3 l6 1.6 c1.3.4 1.3 2.2 0 2.6 l-4.2.8 4.5 9.5 H14.6 L12 16.5 9.4 22 H3.5 L8 12.5 3.8 11.7 c-1.3-.4-1.3-2.2 0-2.6 l6-1.6 c-.6-.6-1-1.3-1-2.3 A3.2 3.2 0 0 1 12 2 Z" fill={ghost ? 'none' : color} stroke={ghost ? color : INK} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Star({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2 L15 9 L22 9.5 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9.5 L9 9 Z" fill="#ffd43b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
