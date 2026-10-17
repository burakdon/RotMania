// Tiny synthesized soundtrack: a music-box loop plus a few sound effects. No audio files needed.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let muted = false;

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.05);
}

const SCALES = {
  sweet: [523.25, 587.33, 659.25, 783.99, 880, 1046.5],
  sad: [440, 523.25, 587.33, 659.25, 783.99, 880],
  eerie: [415.3, 466.16, 554.37, 622.25, 739.99, 830.61],
};

/** A slow music-box arpeggio. mood can change mid-film. */
export function startMusic(mood: keyof typeof SCALES = 'sweet') {
  stopMusic();
  const c = ac();
  let step = 0;
  const pattern = [0, 2, 4, 5, 4, 2, 1, 3];
  const tick = () => {
    const scale = SCALES[currentMood];
    const at = c.currentTime + 0.02;
    const n = scale[pattern[step % pattern.length]];
    tone(n, at, 1.4, 0.07, 'sine');
    tone(n * 2, at, 0.5, 0.02, 'triangle');
    if (step % 4 === 0) tone(scale[0] / 2, at, 2.2, 0.05, 'sine');
    step++;
  };
  currentMood = mood;
  tick();
  musicTimer = setInterval(tick, 430);
}
let currentMood: keyof typeof SCALES = 'sweet';
export function setMood(m: keyof typeof SCALES) {
  currentMood = m;
}
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

export function sfx(kind: 'squish' | 'rip' | 'pop' | 'whoosh' | 'chime') {
  if (muted) return;
  const c = ac();
  const at = c.currentTime + 0.01;
  switch (kind) {
    case 'squish': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(220, at);
      o.frequency.exponentialRampToValueAtTime(90, at + 0.25);
      g.gain.setValueAtTime(0.25, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
      o.connect(g).connect(master!);
      o.start(at);
      o.stop(at + 0.35);
      break;
    }
    case 'rip': {
      const len = 0.6;
      const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2) * (0.6 + 0.4 * Math.sin(i / 40));
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(2500, at);
      f.frequency.exponentialRampToValueAtTime(600, at + len);
      const g = c.createGain();
      g.gain.value = 0.6;
      src.connect(f).connect(g).connect(master!);
      src.start(at);
      break;
    }
    case 'pop':
      tone(880, at, 0.12, 0.12, 'triangle');
      tone(1320, at + 0.04, 0.1, 0.08, 'sine');
      break;
    case 'whoosh': {
      const buf = c.createBuffer(1, c.sampleRate * 0.8, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / d.length) * Math.PI);
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      const g = c.createGain();
      g.gain.value = 0.25;
      src.connect(f).connect(g).connect(master!);
      src.start(at);
      break;
    }
    case 'chime':
      [0, 0.12, 0.24].forEach((d, i) => tone([784, 988, 1175][i], at + d, 1.2, 0.08, 'sine'));
      break;
  }
}

export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}
export function isMuted() {
  return muted;
}
