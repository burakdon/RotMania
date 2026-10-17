import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { ToyRecipe } from '../game/types';
import { buildStrawbaby, buildToy } from './build';

/** A toy figure that idles with a gentle squish. */
export function Toy({ recipe, idle = true, seed = 0, ...props }: { recipe: ToyRecipe; idle?: boolean; seed?: number } & ThreeElements["group"]) {
  const obj = useMemo(() => buildToy(recipe), [recipe]);
  return <Squishy obj={obj} idle={idle} seed={seed} {...props} />;
}

export function Strawbaby({ coat = true, torn = false, glow = false, idle = true, ...props }: { coat?: boolean; torn?: boolean; glow?: boolean; idle?: boolean } & ThreeElements["group"]) {
  const obj = useMemo(() => buildStrawbaby({ coat, torn, glow }), [coat, torn, glow]);
  return <Squishy obj={obj} idle={idle} seed={7} {...props} />;
}

function Squishy({ obj, idle, seed, ...props }: { obj: THREE.Group; idle: boolean; seed: number } & ThreeElements["group"]) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !idle) return;
    const t = clock.elapsedTime * 2.2 + seed * 1.7;
    const s = Math.sin(t) * 0.025;
    ref.current.scale.set(1 + s, 1 - s, 1 + s);
    ref.current.rotation.y = Math.sin(t * 0.37) * 0.12;
  });
  return (
    <group {...props}>
      <group ref={ref}>
        <primitive object={obj} />
      </group>
    </group>
  );
}
