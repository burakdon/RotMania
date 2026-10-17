// Small shared 3D pieces: crafts, soft tokens, stash capsules, cards with portrait faces.
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { POOL_COLORS } from '../game/content';
import type { Face } from '../game/types';
import { G, mat } from '../toys/kit';

export function Craft(props: { position: [number, number, number] }) {
  return <mesh geometry={G.heart()} material={mat('#ff8fab', 'fabric')} scale={0.11} rotation={[-Math.PI / 2 + 0.3, 0, 0]} castShadow {...props} />;
}

export function StashBead({ color, ...props }: { color: string; position: [number, number, number] }) {
  return <mesh geometry={G.sph()} material={mat(color)} scale={0.075} castShadow {...props} />;
}

export function Capsule({ face, ...props }: { face: Face } & ThreeElements['group']) {
  const top = mat(POOL_COLORS[face]);
  const clear = mat('#ffffff', 'glass');
  return (
    <group {...props}>
      <mesh geometry={G.hemi()} material={top} scale={0.26} castShadow />
      <mesh geometry={G.hemi()} material={clear} scale={0.26} rotation={[Math.PI, 0, 0]} />
      <mesh geometry={G.tor(0.08)} material={mat('#ffffff')} scale={0.26} rotation={[Math.PI / 2, 0, 0]} />
      {face === 'juice' && <mesh geometry={G.heart()} material={mat('#ffffff', 'glow')} scale={0.09} position={[0, 0.12, 0.2]} />}
    </group>
  );
}

/** Pink jelly that sits on a row: the crew in that row forgot how. */
export function SoftBlob({ count, ...props }: { count: number } & ThreeElements['group']) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 3;
    ref.current.scale.set(1 + Math.sin(t) * 0.06, 1 - Math.sin(t) * 0.08, 1 + Math.sin(t) * 0.06);
  });
  if (!count) return null;
  return (
    <group {...props}>
      <group ref={ref}>
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i} geometry={G.sph()} material={softMat} scale={[0.32, 0.2, 0.32]} position={[i * 0.18, 0.12 + i * 0.16, 0]} castShadow />
        ))}
      </group>
    </group>
  );
}
const softMat = new THREE.MeshPhysicalMaterial({ color: '#ff8fb8', roughness: 0.15, transmission: 0.35, thickness: 0.6, clearcoat: 1, transparent: true, opacity: 0.92 });

/** Load a data URL as a texture (cards, portraits). */
export function useUrlTexture(url: string | undefined) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return tex;
}

/** A card lying on (or standing on) the table, with a portrait printed on its face. */
export function CardMesh({ portrait, color = '#fff8ef', band = '#ff922b', ...props }: { portrait?: string; color?: string; band?: string } & ThreeElements['group']) {
  const tex = useUrlTexture(portrait);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), []);
  useEffect(() => {
    face.map = tex;
    face.needsUpdate = true;
  }, [tex, face]);
  return (
    <group {...props}>
      <mesh geometry={G.rbox(0.08)} material={mat(color, 'matte')} scale={[1.1, 0.04, 1.55]} castShadow receiveShadow />
      <mesh geometry={G.box()} material={mat(band, 'matte')} scale={[1.02, 0.045, 0.22]} position={[0, 0.002, -0.6]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0.05]} material={face}>
        <planeGeometry args={[0.95, 0.95]} />
      </mesh>
    </group>
  );
}

export function CardBack(props: ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh geometry={G.rbox(0.08)} material={mat('#3b1f4a', 'matte')} scale={[1.1, 0.04, 1.55]} castShadow receiveShadow />
      <mesh geometry={G.heart()} material={mat('#ff4d6d')} scale={0.28} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}
