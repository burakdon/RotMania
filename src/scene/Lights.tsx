import { Environment, Lightformer } from '@react-three/drei';

/** Studio lighting with no network fetches: procedural environment + key light with soft shadows. */
export function StudioLights({ warm = false, intensity = 1 }: { warm?: boolean; intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.6 * intensity}
        color={warm ? '#ffe2c4' : '#fff6ee'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 4, -3]} intensity={0.5 * intensity} color="#c9d8ff" />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 5, -9]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={1.2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} color="#ffd6e0" />
        <Lightformer intensity={1.2} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} color="#d0ebff" />
        <Lightformer intensity={0.8} position={[0, -3, 3]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#fff4e6" />
      </Environment>
    </>
  );
}
