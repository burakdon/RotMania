// Renders toy portraits to PNG data URLs once, off screen, for cards and avatars.
import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CARD } from '../game/cards';
import { RECLAIMERS } from '../game/content';
import type { ReclaimerId, ToyRecipe } from '../game/types';
import { buildStrawbaby, buildToy } from './build';

const SIZE = 320;
const cache = new Map<string, string>();
const listeners = new Set<() => void>();
const queue: { key: string; make: () => THREE.Group; bg?: string }[] = [];
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let scheduled = false;

function setup() {
  if (renderer) return;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight('#fff3e6', 2.2);
  key.position.set(2, 4, 5);
  scene.add(key, new THREE.AmbientLight('#ffffff', 0.4));
  const rim = new THREE.DirectionalLight('#ffd6e0', 1.2);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
}

function renderOne(make: () => THREE.Group): string {
  setup();
  const toy = make();
  toy.rotation.y = -0.35;
  scene!.add(toy);
  const box = new THREE.Box3().setFromObject(toy);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dist = (Math.max(size.y, size.x * 1.05) / 2 / Math.tan((camera!.fov * Math.PI) / 360)) * 1.18;
  camera!.position.set(center.x + dist * 0.12, center.y + dist * 0.18, center.z + dist);
  camera!.lookAt(center.x, center.y - size.y * 0.02, center.z);
  renderer!.render(scene!, camera!);
  const url = renderer!.domElement.toDataURL('image/png');
  scene!.remove(toy);
  return url;
}

function pump() {
  scheduled = false;
  const start = performance.now();
  while (queue.length && performance.now() - start < 24) {
    const job = queue.shift()!;
    if (cache.has(job.key)) continue;
    cache.set(job.key, renderOne(job.make));
  }
  listeners.forEach((l) => l());
  if (queue.length) schedule();
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => setTimeout(pump, 0));
}

function request(key: string, make: () => THREE.Group) {
  if (cache.has(key) || queue.some((q) => q.key === key)) return;
  queue.push({ key, make });
  schedule();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function usePortraitKey(key: string, make: () => THREE.Group): string | undefined {
  const url = useSyncExternalStore(subscribe, () => cache.get(key));
  if (!url) request(key, make);
  return url;
}

export const useCardPortrait = (id: string) => usePortraitKey('card:' + id, () => buildToy(CARD[id].toy));
export const useReclaimerPortrait = (id: ReclaimerId) => usePortraitKey('recl:' + id, () => buildToy(RECLAIMERS[id].toy));
export const useStrawbabyPortrait = () => usePortraitKey('strawbaby', () => buildStrawbaby());
export const useToyPortrait = (key: string, recipe: ToyRecipe) => usePortraitKey('toy:' + key, () => buildToy(recipe));

/** Warm the cache in the background (e.g. during the intro film). */
export function preloadPortraits(ids: string[]) {
  for (const id of ids) request('card:' + id, () => buildToy(CARD[id].toy));
}
