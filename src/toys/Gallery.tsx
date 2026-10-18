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

/** Dev view: Darth Berry up close, front and three-quarter. Open with #darth. */
export function DarthCloseup() {
  return (
    <Canvas camera={{ position: [0, 1.0, 3.6], fov: 35 }}>
      <color attach="background" args={['#b9b5ad']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 5]} intensity={2.4} />
      <directionalLight position={[-3, 2, -3]} intensity={0.8} />
      <primitive object={markHero(buildDarthBerry())} position={[-0.75, 0, 0]} />
      <primitive object={markHero(buildDarthBerry())} position={[0.75, 0, 0]} rotation-y={-0.6} />
      {GENERALS.map((g, i) => (
        <primitive key={g.id} object={markHero(buildToy(g.toy))} position={[-2.5 + i, 0, -1.6]} scale={0.8} />
      ))}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#a19d95" />
      </mesh>
      <OrbitControls target={[0, 0.75, 0]} />
      <NoirEffect />
    </Canvas>
  );
}
