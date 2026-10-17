import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { BRAINROTS } from '../game/cards';
import { GENERALS } from '../game/content';
import { NoirEffect } from '../noir/NoirEffect';
import { markHero } from '../noir/pipeline';
import { buildDarthBerry, buildToy } from './build';

/** Dev view: every figure in a grid, inked. Open with #gallery. */
export function Gallery() {
  const all = [...BRAINROTS.map((c) => c.toy), ...GENERALS.map((g) => g.toy)];
  const cols = 12;
  return (
    <Canvas camera={{ position: [0, 9, 16], fov: 40 }}>
      <color attach="background" args={['#9a9690']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 5]} intensity={2.2} />
      <primitive object={markHero(buildDarthBerry())} position={[0, 0, 6]} scale={1.6} />
      {all.map((t, i) => (
        <primitive key={i} object={markHero(buildToy(t))} position={[((i % cols) - cols / 2 + 0.5) * 1.25, 0, Math.floor(i / cols) * 1.6 - 5]} />
      ))}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#b0aca5" />
      </mesh>
      <OrbitControls target={[0, 0.6, 0]} />
      <NoirEffect />
    </Canvas>
  );
}
