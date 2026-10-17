// A hand-drawn-looking city map texture (used on the resistance table in the comic).
import * as THREE from 'three';

let tex: THREE.Texture | null = null;

export function cityMapTexture() {
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 683;
  const x = c.getContext('2d')!;
  x.fillStyle = '#e6dfcf';
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#2a2a2a';
  x.lineWidth = 3;
  // streets
  for (let i = 0; i < 8; i++) {
    x.beginPath();
    x.moveTo(0, 60 + i * 85 + Math.sin(i) * 10);
    x.lineTo(c.width, 40 + i * 85 + Math.cos(i) * 18);
    x.stroke();
  }
  for (let i = 0; i < 11; i++) {
    x.beginPath();
    x.moveTo(40 + i * 95, 0);
    x.lineTo(70 + i * 92, c.height);
    x.stroke();
  }
  // districts circled in red marker
  const spots: [number, number, string][] = [
    [220, 180, 'SERVER FARM'], [620, 140, 'MALL'], [820, 420, 'SCRAPYARD'], [380, 470, 'PARK'], [160, 560, 'CLINIC'], [600, 600, 'FEED TOWER'],
  ];
  x.font = 'bold 30px "Special Elite", monospace';
  for (const [sx, sy, label] of spots) {
    x.strokeStyle = '#c8102e';
    x.lineWidth = 6;
    x.beginPath();
    x.ellipse(sx, sy, 90, 50, -0.15, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = '#1a1a1a';
    x.fillText(label, sx - 80, sy + 10);
  }
  x.strokeStyle = '#c8102e';
  x.lineWidth = 8;
  x.beginPath();
  x.moveTo(380, 470);
  x.quadraticCurveTo(300, 300, 220, 180);
  x.stroke();
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
