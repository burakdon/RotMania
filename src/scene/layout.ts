// Where things sit on the table. The viewing human always sits at the front.
import type { Row } from '../game/types';

export const SLOT_DX = 1.3;
export const ROW_DZ = 1.45;
export const MAT_W = 9.2;
export const MAT_D = 4.9;

/** local position of a slot on a mat (owner sits on the +z side) */
export function slotPos(row: Row, col: number): [number, number, number] {
  return [-2.2 + col * SLOT_DX, 0.12, -ROW_DZ + row * ROW_DZ];
}
export function rowLabelPos(row: Row): [number, number, number] {
  return [-4.0, 0.12, -ROW_DZ + row * ROW_DZ];
}

export interface Seat {
  pos: [number, number, number];
  rotY: number;
  scale: number;
}

/** seat index 0 is the viewer (front); others go around the table clockwise */
export function seatFor(rel: number, n: number): Seat {
  const front: Seat = { pos: [0, 0, 6.4], rotY: 0, scale: 1 };
  const back: Seat = { pos: [0, 0, -6.6], rotY: Math.PI, scale: 0.92 };
  const left: Seat = { pos: [-10.4, 0, -0.2], rotY: -Math.PI / 2, scale: 0.92 };
  const right: Seat = { pos: [10.4, 0, -0.2], rotY: Math.PI / 2, scale: 0.92 };
  if (n === 2) return [front, back][rel];
  if (n === 3) return [front, left, right][rel];
  return [front, left, back, right][rel];
}

export const GACHA_POS: [number, number, number] = [-4.6, 0, 0.6];
export const TRAY_POS: [number, number, number] = [4.6, 0, 0.6];
export const BOARD_R = 2.9;
