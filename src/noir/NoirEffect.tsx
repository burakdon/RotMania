// Takes over R3F's render loop and draws the scene through the noir ink pipeline.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { NoirPipeline, type NoirOptions } from './pipeline';

export function NoirEffect(opts: NoirOptions) {
  const { gl, size, viewport } = useThree();
  const pipe = useMemo(() => new NoirPipeline(opts), []);
  useEffect(() => () => pipe.dispose(), [pipe]);
  useEffect(() => {
    pipe.set(opts);
  }, [opts.contrast, opts.dotSize, opts.lineWidth, opts.grain, pipe]);
  useFrame(({ scene, camera }) => {
    const dpr = viewport.dpr;
    pipe.setSize(size.width * dpr, size.height * dpr);
    pipe.render(gl, scene, camera, null);
  }, 1);
  return null;
}
