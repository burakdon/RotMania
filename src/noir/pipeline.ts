// Noir ink renderer: black-and-white halftone world, flat comic color on "hero" objects, ink outlines.
// Passes: color → normals+depth → hero mask → composite shader. Used live (game table) and offline (comic panels).
import * as THREE from 'three';

/** Objects (and their children) marked with this layer render in color; everything else goes black and white. */
export const HERO_LAYER = 1;

export function markHero(obj: THREE.Object3D) {
  obj.traverse((o) => o.layers.enable(HERO_LAYER));
  return obj;
}

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tMask;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
uniform float lineWidth;
uniform float dotSize;
uniform float grain;
uniform float time;
uniform float contrast;
uniform vec3 paper;
uniform vec3 ink;

float linearDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x;
  float ndc = z * 2.0 - 1.0;
  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - ndc * (cameraFar - cameraNear));
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float edge(vec2 uv) {
  vec2 px = lineWidth / resolution;
  float d0 = linearDepth(uv);
  vec3 n0 = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
  float de = 0.0;
  float ne = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 o = i == 0 ? vec2(px.x, 0.0) : i == 1 ? vec2(-px.x, 0.0) : i == 2 ? vec2(0.0, px.y) : vec2(0.0, -px.y);
    float d = linearDepth(uv + o);
    de = max(de, abs(d - d0) / max(d0, 0.001));
    vec3 n = texture2D(tNormal, uv + o).xyz * 2.0 - 1.0;
    ne = max(ne, 1.0 - dot(n0, n));
  }
  float depthEdge = smoothstep(0.035, 0.08, de);
  float normalEdge = smoothstep(0.25, 0.55, ne);
  return clamp(max(depthEdge, normalEdge), 0.0, 1.0);
}

void main() {
  // render targets hold linear light: bring it to display space before judging tones
  vec3 col = pow(clamp(texture2D(tColor, vUv).rgb, 0.0, 1.0), vec3(1.0 / 2.2));
  float hero = texture2D(tMask, vUv).r;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * contrast + 0.5, 0.0, 1.0);

  // black & white world: hard shadows, halftone mid-tones, paper highlights
  float g;
  if (lum < 0.1) g = 0.0;
  else if (lum < 0.62) {
    // rotated halftone screen; darker tone = bigger ink dots
    vec2 fc = gl_FragCoord.xy / dotSize;
    float a = 0.785398;
    vec2 r = vec2(cos(a) * fc.x - sin(a) * fc.y, sin(a) * fc.x + cos(a) * fc.y);
    float dist = length(fract(r) - 0.5);
    float tone = (lum - 0.1) / 0.52;
    float radius = mix(0.62, 0.12, tone);
    g = dist < radius ? 0.12 : mix(0.55, 0.86, tone);
  } else if (lum < 0.82) g = 0.86;
  else g = 1.0;
  vec3 bw = mix(ink, paper, g);

  // color for heroes: flat comic bands, keep hue
  vec3 hsv = rgb2hsv(col);
  float v = hsv.z;
  v = v < 0.1 ? 0.04 : v < 0.25 ? 0.17 : v < 0.48 ? 0.4 : v < 0.72 ? 0.68 : 0.98;
  hsv.z = v;
  hsv.y = min(1.0, hsv.y * 1.15);
  vec3 heroCol = hsv2rgb(hsv);

  vec3 outc = mix(bw, heroCol, step(0.5, hero));
  float e = edge(vUv);
  outc = mix(outc, ink, e);
  float n = hash(gl_FragCoord.xy + time) - 0.5;
  outc += n * grain;
  gl_FragColor = vec4(outc, 1.0);
}
`;

export interface NoirOptions {
  lineWidth?: number;
  dotSize?: number;
  grain?: number;
  contrast?: number;
  paper?: string;
  ink?: string;
}

export class NoirPipeline {
  private colorRT: THREE.WebGLRenderTarget;
  private normalRT: THREE.WebGLRenderTarget;
  private maskRT: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private quadScene = new THREE.Scene();
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private normalMat = new THREE.MeshNormalMaterial();
  private black = new THREE.MeshBasicMaterial({ color: 0x000000 });
  private white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  readonly material: THREE.ShaderMaterial;
  private w = 1;
  private h = 1;

  constructor(opts: NoirOptions = {}) {
    const mk = (depth: boolean, samples = 0) => {
      const rt = new THREE.WebGLRenderTarget(1, 1, { samples, type: THREE.HalfFloatType });
      if (depth) rt.depthTexture = new THREE.DepthTexture(1, 1);
      return rt;
    };
    this.colorRT = mk(false, 4);
    this.normalRT = mk(true);
    this.maskRT = mk(false);
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: this.normalRT.depthTexture },
        tMask: { value: this.maskRT.texture },
        resolution: { value: new THREE.Vector2(1, 1) },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100 },
        lineWidth: { value: opts.lineWidth ?? 1.4 },
        dotSize: { value: opts.dotSize ?? 4.5 },
        grain: { value: opts.grain ?? 0.05 },
        time: { value: 0 },
        contrast: { value: opts.contrast ?? 1.25 },
        paper: { value: new THREE.Color(opts.paper ?? '#ece6da') },
        ink: { value: new THREE.Color(opts.ink ?? '#0b0b0d') },
      },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  setSize(w: number, h: number) {
    w = Math.max(1, Math.floor(w));
    h = Math.max(1, Math.floor(h));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.colorRT.setSize(w, h);
    this.normalRT.setSize(w, h);
    this.maskRT.setSize(w, h);
    (this.material.uniforms.resolution.value as THREE.Vector2).set(w, h);
  }

  set(opts: NoirOptions) {
    const u = this.material.uniforms;
    if (opts.lineWidth !== undefined) u.lineWidth.value = opts.lineWidth;
    if (opts.dotSize !== undefined) u.dotSize.value = opts.dotSize;
    if (opts.grain !== undefined) u.grain.value = opts.grain;
    if (opts.contrast !== undefined) u.contrast.value = opts.contrast;
    if (opts.paper) (u.paper.value as THREE.Color).set(opts.paper);
    if (opts.ink) (u.ink.value as THREE.Color).set(opts.ink);
  }

  /** Render scene through the noir passes into target (null = screen). */
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, target: THREE.WebGLRenderTarget | null = null) {
    const prevTarget = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    const prevBg = scene.background;
    const prevOverride = scene.overrideMaterial;
    const prevMask = camera.layers.mask;
    const prevFog = scene.fog;
    const prevClear = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();

    // 1. color
    renderer.setRenderTarget(this.colorRT);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. normals + depth
    scene.background = null;
    scene.fog = null;
    scene.overrideMaterial = this.normalMat;
    renderer.setRenderTarget(this.normalRT);
    renderer.setClearColor(0x8080ff, 1);
    renderer.clear();
    renderer.render(scene, camera);

    // 3. hero mask: everything black (for occlusion), then heroes white on equal depth
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(this.maskRT);
    renderer.clear();
    scene.overrideMaterial = this.black;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    this.white.depthFunc = THREE.LessEqualDepth;
    scene.overrideMaterial = this.white;
    camera.layers.set(HERO_LAYER);
    renderer.render(scene, camera);
    camera.layers.mask = prevMask;
    renderer.autoClear = prevAuto;

    scene.overrideMaterial = prevOverride;
    scene.background = prevBg;
    scene.fog = prevFog;

    // 4. composite
    const u = this.material.uniforms;
    const cam = camera as THREE.PerspectiveCamera;
    u.cameraNear.value = cam.near ?? 0.1;
    u.cameraFar.value = cam.far ?? 100;
    u.time.value = (u.time.value + 0.37) % 100;
    renderer.setClearColor(prevClear, prevAlpha);
    renderer.setRenderTarget(target);
    renderer.render(this.quadScene, this.quadCam);
    renderer.setRenderTarget(prevTarget);
  }

  dispose() {
    this.colorRT.dispose();
    this.normalRT.dispose();
    this.maskRT.dispose();
    this.material.dispose();
  }
}
