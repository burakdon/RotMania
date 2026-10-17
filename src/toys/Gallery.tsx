import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { CARDS } from '../game/cards';
import { RECLAIMERS } from '../game/content';
import { StudioLights } from '../scene/Lights';
import { Strawbaby, Toy } from './Toy';

/** Dev view: every toy in a grid. Open with #gallery. */
export function Closeup() {
  return (
    <Canvas shadows camera={{ position: [0, 1.4, 4.2], fov: 35 }} style={{ background: '#fbe9ef' }}>
      <StudioLights />
      <Strawbaby position={[-1.1, 0, 0]} scale={1.3} idle={false} />
      <Strawbaby position={[1.1, 0, 0]} scale={1.3} coat={false} torn idle={false} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f7d6e0" />
      </mesh>
      <OrbitControls target={[0, 0.9, 0]} />
    </Canvas>
  );
}

export function GalleryPage({ page }: { page: number }) {
  const all = [...CARDS.map((c) => ({ id: c.id, toy: c.toy })), ...Object.values(RECLAIMERS).map((r) => ({ id: r.id, toy: r.toy }))].slice(page * 10, page * 10 + 10);
  return (
    <Canvas shadows camera={{ position: [0, 3.4, 10], fov: 36 }} style={{ background: '#fbe9ef' }}>
      <StudioLights />
      {all.map((x, i) => (
        <Toy key={x.id} recipe={x.toy} idle={false} position={[((i % 5) - 2) * 1.6, 0, Math.floor(i / 5) * 1.9 - 1.2]} />
      ))}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f7d6e0" />
      </mesh>
      <OrbitControls target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function Gallery() {
  const all = [...CARDS.map((c) => ({ id: c.id, toy: c.toy })), ...Object.values(RECLAIMERS).map((r) => ({ id: r.id, toy: r.toy }))];
  const cols = 12;
  return (
    <Canvas shadows camera={{ position: [0, 9, 16], fov: 40 }} style={{ background: '#fbe9ef' }}>
      <StudioLights />
      <Strawbaby position={[-2, 0, 6]} scale={1.6} />
      <Strawbaby position={[2, 0, 6]} scale={1.6} coat={false} torn />
      {all.map((x, i) => (
        <Toy key={x.id} recipe={x.toy} seed={i} position={[((i % cols) - cols / 2 + 0.5) * 1.25, 0, Math.floor(i / cols) * 1.6 - 5]} />
      ))}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f7d6e0" />
      </mesh>
      <OrbitControls target={[0, 0.6, 0]} />
    </Canvas>
  );
}
