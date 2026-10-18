// Hand-made (or generated) panel art dropped into src/comic/art/ replaces the 3D render for that panel.
const files = import.meta.glob('./art/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const PANEL_ART: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.(png|jpe?g|webp)$/i, ''), url]),
);
