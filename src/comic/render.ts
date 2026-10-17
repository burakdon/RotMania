// Renders comic panels to images, one at a time, off screen.
import * as THREE from 'three';
import { NoirPipeline } from '../noir/pipeline';
import { buildDarkBerry } from '../toys/build';
import { PANEL_ART } from './art';
import { cityMapTexture } from './citymap';
import { envFor, screensWall, basement, type PanelBuilder } from './panels';
import { PAGE_ASPECT, PAGES, type PanelSpec } from './story';

/** Pixel height of a full page when rendering. Panels get their share of it. */
const PAGE_H = 1700;

const cache = new Map<string, string>();
let renderer: THREE.WebGLRenderer | null = null;
let pipeline: NoirPipeline | null = null;
let dbPortrait: THREE.Texture | null = null;

function setup() {
  if (renderer) return;
  const canvas = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;
  pipeline = new NoirPipeline({ lineWidth: 1.6, dotSize: 5, grain: 0.045 });
}

function panelSize(p: PanelSpec) {
  const pageW = PAGE_H * PAGE_ASPECT;
  return { w: Math.round(p.rect[2] * pageW), h: Math.round(p.rect[3] * PAGE_H) };
}

/** A color portrait of DarkBerry for the billboards (rendered plainly, not inked). */
function darkberryPortrait(): THREE.Texture {
  if (dbPortrait) return dbPortrait;
  const r = renderer!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a0612');
  scene.environment = envFor(r);
  const key = new THREE.DirectionalLight('#ffffff', 2.5);
  key.position.set(1, 3, 4);
  scene.add(key, new THREE.AmbientLight('#ffffff', 0.3));
  const db = buildDarkBerry();
  scene.add(db);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  cam.position.set(0, db.userData.headY + 0.25, 3.2);
  cam.lookAt(0, db.userData.headY - 0.05, 0);
  r.setSize(512, 512, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.render(scene, cam);
  r.toneMapping = THREE.NoToneMapping;
  // copy synchronously so the texture is ready for the very next render
  const copy = document.createElement('canvas');
  copy.width = 512;
  copy.height = 512;
  copy.getContext('2d')!.drawImage(r.domElement, 0, 0);
  dbPortrait = new THREE.CanvasTexture(copy);
  dbPortrait.colorSpace = THREE.SRGBColorSpace;
  return dbPortrait;
}

function builderFor(p: PanelSpec): PanelBuilder {
  if (p.build === 'screens') return screensWall(darkberryPortrait());
  if (p.build === 'basement') return basement(cityMapTexture());
  return p.build;
}

export function renderPanel(p: PanelSpec): string {
  if (PANEL_ART[p.id]) return PANEL_ART[p.id];
  const hit = cache.get(p.id);
  if (hit) return hit;
  setup();
  const { w, h } = panelSize(p);
  const build = builderFor(p);
  const { scene, camera, noir } = build(w / h, envFor(renderer!));
  renderer!.setSize(w, h, false);
  pipeline!.setSize(w, h);
  pipeline!.set({ lineWidth: 1.6, dotSize: 5, grain: 0.045, contrast: 1.25, ...noir });
  pipeline!.render(renderer!, scene, camera, null);
  const url = renderer!.domElement.toDataURL('image/jpeg', 0.9);
  cache.set(p.id, url);
  return url;
}

/** Render every panel in reading order, yielding between panels so the page stays responsive. */
export async function renderAll(onPanel: (id: string, url: string) => void) {
  await document.fonts.load('64px Bangers').catch(() => undefined);
  for (const page of PAGES)
    for (const p of page.panels) {
      if (PANEL_ART[p.id]) {
        onPanel(p.id, PANEL_ART[p.id]);
        continue;
      }
      await new Promise((r) => setTimeout(r, 0));
      try {
        onPanel(p.id, renderPanel(p));
      } catch (e) {
        console.error('panel failed', p.id, e);
      }
    }
}

export function cachedPanel(id: string) {
  return cache.get(id);
}

/** Render a one-off panel (results screen) at a given size. */
export function renderCustom(key: string, build: PanelBuilder, w: number, h: number): string {
  const hit = cache.get(key);
  if (hit) return hit;
  setup();
  const { scene, camera, noir } = build(w / h, envFor(renderer!));
  renderer!.setSize(w, h, false);
  pipeline!.setSize(w, h);
  pipeline!.set({ lineWidth: 1.6, dotSize: 5, grain: 0.045, contrast: 1.25, ...noir });
  pipeline!.render(renderer!, scene, camera, null);
  const url = renderer!.domElement.toDataURL('image/jpeg', 0.9);
  cache.set(key, url);
  return url;
}
