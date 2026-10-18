// Where districts and action spaces sit on the city board (world units, y up, camera on the +z side).
import type { DistrictId, SpaceId } from '../game/types';

export interface DistrictRect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export const DISTRICT_RECTS: Record<DistrictId, DistrictRect> = {
  scrapyard: { x: -8.2, z: -3.9, w: 7.4, d: 5.6 },
  serverfarm: { x: 0, z: -3.9, w: 8.2, d: 5.6 },
  tower: { x: 8.2, z: -3.9, w: 7.4, d: 5.6 },
  park: { x: -9.4, z: 2.7, w: 5, d: 5.4 },
  underground: { x: -3.6, z: 2.7, w: 6.2, d: 5.4 },
  mall: { x: 1.9, z: 2.7, w: 4.4, d: 5.4 },
  clinic: { x: 8.2, z: 2.7, w: 7.4, d: 5.4 },
};

/** pad centers, relative to the board origin */
export const PAD_POS: Record<SpaceId, [number, number]> = {
  copper: [-10.0, -2.4],
  pcb: [-6.6, -2.4],
  coolant: [-1.9, -2.4],
  redteam: [1.9, -2.4],
  hijack: [6.6, -2.4],
  pirate: [9.9, -2.4],
  grass: [-10.6, 3.9],
  lookout: [-8.2, 3.9],
  recruit: [-5.6, 4.0],
  safehouse: [-3.6, 4.0],
  archive: [-1.6, 4.0],
  oddjobs: [-3.6, 1.6],
  glitter: [0.9, 4.0],
  pawn: [2.9, 4.0],
  deprogram: [6.2, 4.3],
  backdoor: [8.8, 4.3],
};

/** brainrot lineup in the clinic waiting room, slot 0 (newest) on the left */
export const LINEUP_POS: [number, number][] = [5.4, 6.7, 8.0, 9.3, 10.6].map((x) => [x, 1.6]);

export const PAD_R = 0.82;
