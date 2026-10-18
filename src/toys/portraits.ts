// Inks toy portraits once, off screen: the figure in color, a halftone backdrop, black outlines.
import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BRAINROT } from '../game/cards';
import { GENERAL } from '../game/content';
import type { ToyRecipe } from '../game/types';
import { markHero, NoirPipeline } from '../noir/pipeline';
import { buildDarthBerry, buildToy } from './build';

const SIZE = 360;
const cache = new Map<string, string>();
const listeners = new Set<() => void>();
const queue: { key: string; make: () => THREE.Group }[] = [];
let renderer: THREE.WebGLRenderer | null = null;
let pipeline: NoirPipeline | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let scheduled = false;

function setup() {
  if (renderer) return;
  const canvas = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  pipeline = new NoirPipeline({ lineWidth: 1.3, dotSize: 3.5, grain: 0.03, contrast: 1.15 });
  pipeline.setSize(SIZE, SIZE);
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#8f8c86');
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(2, 4, 5);
  const rim = new THREE.DirectionalLight('#ffffff', 1.0);
  rim.position.set(-3, 2, -3);
  scene.add(key, rim, new THREE.AmbientLight('#ffffff', 0.45));
  // a back wall with a spotlight pool, for some halftone behind the figure
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: '#a9a59e', roughness: 1 }));
  wall.position.set(0, 2, -1.6);
  scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: '#77746f', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const spot = new THREE.SpotLight('#ffffff', 30, 0, 0.5, 0.8, 1.5);
  spot.position.set(0.4, 4, 2);
  spot.target.position.set(0, 0.6, -1.5);
  scene.add(spot, spot.target);
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
}

function renderOne(make: () => THREE.Group): string {
  setup();
  const toy = markHero(make());
  toy.rotation.y = -0.35;
  scene!.add(toy);
  const box = new THREE.Box3().setFromObject(toy);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dist = (Math.max(size.y, size.x * 1.05) / 2 / Math.tan((camera!.fov * Math.PI) / 360)) * 1.22;
  camera!.position.set(center.x + dist * 0.12, center.y + dist * 0.16, center.z + dist);
  camera!.lookAt(center.x, center.y - size.y * 0.03, center.z);
  pipeline!.render(renderer!, scene!, camera!, null);
  const url = renderer!.domElement.toDataURL('image/jpeg', 0.88);
  scene!.remove(toy);
  return url;
}

function pump() {
  scheduled = false;
  const start = performance.now();
  while (queue.length && performance.now() - start < 30) {
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

function request(key: string, make: () => THREE.Group, urgent = false) {
  if (cache.has(key)) return;
  const i = queue.findIndex((q) => q.key === key);
  if (i >= 0) {
    if (urgent && i > 0) queue.unshift(...queue.splice(i, 1));
    return;
  }
  if (urgent) queue.unshift({ key, make });
  else queue.push({ key, make });
  schedule();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function usePortraitKey(key: string, make: () => THREE.Group): string | undefined {
  const url = useSyncExternalStore(subscribe, () => cache.get(key));
  if (!url) request(key, make, true);
  return url;
}

export const useBrainrotPortrait = (id: string) => usePortraitKey('b:' + id, () => buildToy(BRAINROT[id].toy));
export const useGeneralPortrait = (id: string) => usePortraitKey('g:' + id, () => buildToy(GENERAL[id].toy));
export const useDarthBerryPortrait = () => usePortraitKey('darthberry', () => buildDarthBerry());
export const useToyPortrait = (key: string, recipe: ToyRecipe) => usePortraitKey('t:' + key, () => buildToy(recipe));

/** Warm the cache in the background (e.g. while the comic is being read). */
export function preloadPortraits(ids: string[]) {
  for (const id of ids) request('b:' + id, () => buildToy(BRAINROT[id].toy));
}
