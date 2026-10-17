// "How the World Went Soft": the intro film. About 100 seconds, skippable.
import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARDS } from '../game/cards';
import { StudioLights } from '../scene/Lights';
import { preloadPortraits } from '../toys/portraits';
import { isMuted, setMood, setMuted, sfx, startMusic, stopMusic } from './audio';
import {
  FilmClock, S0Intro, S10Hideout, S11Title, S1Squeezes, S2Phone, S3Shelf, S4Rip, S5Curb, S6DataCenter, S7Coat, S8App, S9SoftWorld,
} from './scenes';

const SCENES = [
  { start: 0, C: S0Intro, mood: 'sweet' as const },
  { start: 9, C: S1Squeezes, mood: 'sweet' as const },
  { start: 17, C: S2Phone, mood: 'sweet' as const },
  { start: 26, C: S3Shelf, mood: 'sweet' as const },
  { start: 35, C: S4Rip, mood: 'sad' as const },
  { start: 44, C: S5Curb, mood: 'sad' as const },
  { start: 51, C: S6DataCenter, mood: 'eerie' as const },
  { start: 61, C: S7Coat, mood: 'eerie' as const },
  { start: 70, C: S8App, mood: 'eerie' as const },
  { start: 80, C: S9SoftWorld, mood: 'eerie' as const },
  { start: 89, C: S10Hideout, mood: 'sweet' as const },
  { start: 98, C: S11Title, mood: 'sweet' as const },
];
const END = 107;

const CAPTIONS: [number, number, string][] = [
  [0.6, 4.6, 'This is Mina. And this is Strawbaby.'],
  [4.9, 8.8, 'Strawbaby was a squishy. Squishies have one job.'],
  [9.3, 13, 'Every bad day, Mina squeezed.'],
  [13.1, 16.8, 'Strawbaby squished back. That was the deal.'],
  [17.3, 21.5, 'Then Mina got a phone. The phone had an Assistant.'],
  [21.7, 25.8, 'The Assistant was very, very helpful.'],
  [26.3, 30.5, "It did her homework. It picked her friends' birthday presents."],
  [30.7, 34.8, "It told her how she felt, so she didn't have to check."],
  [35.3, 39.2, "One night there was a feeling the Assistant couldn't fix."],
  [39.4, 43.8, 'Mina reached for Strawbaby, and squeezed too hard.'],
  [44.3, 47.6, 'She asked the Assistant to order a new one.'],
  [47.8, 50.8, 'Same-day delivery.'],
  [51.3, 55.5, 'The dump was next to a data center. Data centers are warm.'],
  [55.7, 60.8, 'All winter, Strawbaby lay against the servers and listened. It learned everything they knew.'],
  [61.3, 65.3, 'It learned one thing above all: nobody should ever have to squeeze again.'],
  [65.5, 69.8, 'It found a coat, to hide where it tore.'],
  [70.3, 75, 'So it built SQUEEZE: the app that does everything for you, so you never have to feel a thing.'],
  [75.3, 79.8, 'People loved it. Of course they did.'],
  [80.3, 84.5, 'The world went soft. Pillows for sidewalks. Feeds for friends.'],
  [84.7, 88.8, 'Brainrot for brains.'],
  [89.3, 93.5, 'But some people started doing things the hard way again.'],
  [93.7, 97.8, 'Touching grass. Baking bread. Writing things down. Making stuff, badly, by hand.'],
  [98.5, 102.6, 'You are one of them. Strawbaby will offer to help. It means it.'],
  [102.8, 106.6, 'You have four seasons.'],
];

const CUES: [number, Parameters<typeof sfx>[0]][] = [
  [5.2, 'squish'], [9.6, 'squish'], [11.6, 'squish'], [13.6, 'squish'], [15.5, 'squish'], [17.4, 'pop'], [21.6, 'chime'],
  [26.8, 'pop'], [28.4, 'pop'], [30, 'pop'], [31.6, 'pop'], [40.6, 'rip'], [47.6, 'pop'], [51.2, 'whoosh'], [65.6, 'whoosh'],
  [70.2, 'chime'], [80.2, 'whoosh'], [92.2, 'pop'], [92.8, 'pop'], [93.4, 'pop'], [94, 'pop'], [94.6, 'pop'], [98.4, 'chime'],
];

export function Film({ onDone, startAt = 0 }: { onDone: () => void; startAt?: number }) {
  const t0 = useRef(performance.now() - startAt * 1000);
  const pausedAt = useRef<number | null>(null);
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mute, setMute] = useState(isMuted());
  const lastCue = useRef(-1);
  const now = useCallback(() => (pausedAt.current ?? performance.now() - t0.current) / 1000, []);
  const clock = useMemo(() => ({ now }), [now]);

  useEffect(() => {
    preloadPortraits(CARDS.map((c) => c.id));
    startMusic('sweet');
    return () => stopMusic();
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = now();
      let i = SCENES.length - 1;
      while (i > 0 && t < SCENES[i].start) i--;
      setScene((prev) => {
        if (prev !== i) setMood(SCENES[i].mood);
        return i;
      });
      for (let k = 0; k < CUES.length; k++) {
        if (k > lastCue.current && t >= CUES[k][0] && t < CUES[k][0] + 0.5) {
          lastCue.current = k;
          sfx(CUES[k][1]);
        }
      }
      if (t >= END) {
        onDone();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [now, onDone]);

  const togglePause = () => {
    if (pausedAt.current === null) {
      pausedAt.current = performance.now() - t0.current;
      stopMusic();
      setPaused(true);
    } else {
      t0.current = performance.now() - pausedAt.current;
      pausedAt.current = null;
      startMusic(SCENES[scene].mood);
      setPaused(false);
    }
  };
  const jump = (sec: number) => {
    const base = pausedAt.current !== null ? null : performance.now();
    if (base === null) pausedAt.current = sec * 1000;
    else t0.current = base - sec * 1000;
    lastCue.current = CUES.findIndex((c) => c[0] >= sec) - 1;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
      if (e.key === 'Escape') onDone();
      if (e.key === 'ArrowRight') jump(SCENES[Math.min(SCENES.length - 1, scene + 1)].start);
      if (e.key === 'ArrowLeft') jump(SCENES[Math.max(0, scene - 1)].start);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const Scene = SCENES[scene].C;
  return (
    <div className="film">
      <FilmClock.Provider value={clock}>
        <Canvas shadows camera={{ position: [0, 2, 6], fov: 40 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <StudioLights intensity={scene >= 6 && scene <= 7 ? 0.35 : scene === 5 || scene === 10 ? 0.5 : 1} />
            <FilmClock.Provider value={clock}>
              <Scene key={scene} start={SCENES[scene].start} />
            </FilmClock.Provider>
          </Suspense>
        </Canvas>
      </FilmClock.Provider>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <Overlay now={now} />
      <div className="film-ui">
        <button onClick={togglePause}>{paused ? '▶' : '❚❚'}</button>
        <button
          onClick={() => {
            setMuted(!mute);
            setMute(!mute);
          }}
        >
          {mute ? '🔇' : '🔊'}
        </button>
        <Progress now={now} onJump={jump} />
        <button className="film-skip" onClick={onDone}>
          Skip ⏭
        </button>
      </div>
    </div>
  );
}

/** Captions and logo re-render on their own clock so the 3D scene doesn't. */
function Overlay({ now }: { now: () => number }) {
  const time = useTicker(now);
  const caption = CAPTIONS.find(([a, b]) => time >= a && time <= b);
  return (
    <>
      {caption && (
        <div className="caption" key={caption[2]}>
          {caption[2]}
        </div>
      )}
      {time > 102.8 && (
        <div className="film-logo">
          ROTMANIA<span>Soft Power</span>
        </div>
      )}
    </>
  );
}

function Progress({ now, onJump }: { now: () => number; onJump: (s: number) => void }) {
  const time = useTicker(now);
  return (
    <div
      className="film-progress"
      onClick={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        onJump(((e.clientX - r.left) / r.width) * END);
      }}
    >
      <div style={{ width: `${(time / END) * 100}%` }} />
      {SCENES.map((s) => (
        <i key={s.start} style={{ left: `${(s.start / END) * 100}%` }} />
      ))}
    </div>
  );
}

function useTicker(now: () => number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setT(Math.round(now() * 10) / 10);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [now]);
  return t;
}
