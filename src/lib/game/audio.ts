// ============================================================
// NUMBER TEMPLE ESCAPE - Audio Engine
// Synthesized SFX (Web Audio API) + voice lines (SpeechSynthesis)
// Recreates the sound feel of the original "numbers" video:
// counting voices, catchphrases, pops, boings, rumbles, sparkles
// ============================================================

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let muted = false;

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const AC: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.85;
  sfxGain.connect(masterGain);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.32;
  musicGain.connect(masterGain);
}

export function setMuted(m: boolean): void {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.9;
  if (m && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

export function isMuted(): boolean {
  return muted;
}

function now(): number {
  return ctx ? ctx.currentTime : 0;
}

// ---------- basic tone helper ----------
interface ToneOpts {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  delay?: number;
  attack?: number;
  dest?: AudioNode | null;
}

function tone(o: ToneOpts): void {
  if (!ctx || !sfxGain) return;
  const dest = o.dest ?? sfxGain;
  if (!dest) return;
  const t0 = now() + (o.delay ?? 0);
  const dur = o.dur ?? 0.15;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), t0 + dur);
  }
  const vol = o.vol ?? 0.5;
  const atk = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, filterFreq: number, delay = 0, filterEnd?: number): void {
  if (!ctx || !sfxGain) return;
  const t0 = now() + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(filterFreq, t0);
  if (filterEnd !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnd), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  src.start(t0);
  src.stop(t0 + dur);
}

// ---------- named SFX ----------

export function sfxPop(pitch = 1): void {
  // golden apple pop - bright upward blip
  tone({ freq: 420 * pitch, freqEnd: 880 * pitch, type: 'sine', dur: 0.12, vol: 0.5 });
  tone({ freq: 840 * pitch, freqEnd: 1320 * pitch, type: 'triangle', dur: 0.1, vol: 0.22, delay: 0.02 });
}

export function sfxBoing(pitch = 1): void {
  // jump / tap bounce
  tone({ freq: 180 * pitch, freqEnd: 90 * pitch, type: 'triangle', dur: 0.18, vol: 0.4 });
}

export function sfxTap(pitch = 1): void {
  tone({ freq: 520 * pitch, freqEnd: 700 * pitch, type: 'triangle', dur: 0.07, vol: 0.35 });
}

export function sfxClack(): void {
  noise(0.06, 0.3, 2400);
  tone({ freq: 200, freqEnd: 120, type: 'square', dur: 0.08, vol: 0.2 });
}

export function sfxWhoosh(): void {
  noise(0.35, 0.35, 900, 0, 150);
}

export function sfxSparkle(): void {
  // magic merge / reveal arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    tone({ freq: f, type: 'sine', dur: 0.22, vol: 0.28, delay: i * 0.07 });
    tone({ freq: f * 2, type: 'triangle', dur: 0.18, vol: 0.1, delay: i * 0.07 });
  });
}

export function sfxBoom(): void {
  noise(0.5, 0.6, 400, 0, 60);
  tone({ freq: 90, freqEnd: 30, type: 'sine', dur: 0.5, vol: 0.7 });
}

export function sfxAlarm(): void {
  // giant roaming alert - two tone
  for (let i = 0; i < 3; i++) {
    tone({ freq: 660, type: 'square', dur: 0.14, vol: 0.16, delay: i * 0.28 });
    tone({ freq: 440, type: 'square', dur: 0.14, vol: 0.16, delay: i * 0.28 + 0.14 });
  }
}

export function sfxBonk(): void {
  tone({ freq: 160, freqEnd: 60, type: 'square', dur: 0.25, vol: 0.5 });
  noise(0.15, 0.3, 600);
}

export function sfxSneak(): void {
  noise(0.08, 0.08, 500);
}

export function sfxFanfare(): void {
  const seq: Array<[number, number]> = [
    [523.25, 0], [523.25, 0.12], [523.25, 0.24], [698.46, 0.36],
    [659.25, 0.54], [587.33, 0.66], [698.46, 0.78], [783.99, 0.96],
  ];
  for (const [f, d] of seq) {
    tone({ freq: f, type: 'triangle', dur: 0.2, vol: 0.3, delay: d });
    tone({ freq: f / 2, type: 'sine', dur: 0.22, vol: 0.2, delay: d });
  }
}

export function sfxChime(pitch = 1): void {
  tone({ freq: 784 * pitch, type: 'sine', dur: 0.25, vol: 0.3 });
  tone({ freq: 1176 * pitch, type: 'sine', dur: 0.2, vol: 0.15, delay: 0.05 });
}

// ---------- rumble loop (giant boulder) ----------
interface RumbleHandle { stop(): void }
let rumbleHandle: RumbleHandle | null = null;

export function startRumble(): void {
  if (!ctx || !sfxGain || rumbleHandle) return;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 140;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
  src.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  src.start();
  rumbleHandle = {
    stop: () => {
      g.gain.linearRampToValueAtTime(0, ctx!.currentTime + 0.3);
      setTimeout(() => { try { src.stop(); } catch { /* noop */ } }, 400);
    },
  };
}

export function stopRumble(): void {
  if (rumbleHandle) {
    rumbleHandle.stop();
    rumbleHandle = null;
  }
}

// ---------- light adventure music loop ----------
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
const MELODY = [
  523.25, 0, 392, 440, 523.25, 0, 440, 392,
  349.23, 0, 440, 523.25, 587.33, 0, 493.88, 440,
];
const BASS = [130.81, 130.81, 174.61, 174.61, 196, 196, 174.61, 174.61];

export function startMusic(): void {
  if (!ctx || !musicGain || musicTimer) return;
  musicStep = 0;
  musicTimer = setInterval(() => {
    if (!ctx || !musicGain) return;
    const m = MELODY[musicStep % MELODY.length];
    if (m > 0) {
      tone({ freq: m, type: 'triangle', dur: 0.16, vol: 0.5, dest: musicGain, attack: 0.01 });
    }
    if (musicStep % 2 === 0) {
      const b = BASS[Math.floor(musicStep / 2) % BASS.length];
      tone({ freq: b, type: 'sine', dur: 0.3, vol: 0.6, dest: musicGain, attack: 0.02 });
    }
    if (musicStep % 8 === 4) noise(0.05, 0.12, 5000, 0); // hat tick
    musicStep++;
  }, 240);
}

export function stopMusic(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// ============================================================
// VOICE - SpeechSynthesis
// ============================================================

let voice: SpeechSynthesisVoice | null = null;
let voiceReady = false;

export function pickVoice(): void {
  if (typeof speechSynthesis === 'undefined') return;
  const load = (): void => {
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    // Prefer an energetic English voice
    const prefer = [
      'Google UK English Female', 'Google UK English Male', 'Google US English',
      'Samantha', 'Karen', 'Daniel', 'Microsoft Zira', 'Microsoft Hazel',
    ];
    for (const name of prefer) {
      const v = vs.find((x) => x.name.includes(name));
      if (v) { voice = v; voiceReady = true; return; }
    }
    const en = vs.find((v) => v.lang.startsWith('en'));
    voice = en ?? vs[0];
    voiceReady = true;
  };
  load();
  if (!voiceReady && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = load;
  }
}

interface SayOpts {
  rate?: number;
  pitch?: number;
  vol?: number;
  queue?: boolean;
}

export function say(text: string, o: SayOpts = {}): void {
  if (muted || typeof speechSynthesis === 'undefined') return;
  if (!voice) pickVoice();
  if (!o.queue) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = o.rate ?? 1.06;
  u.pitch = o.pitch ?? 1.15;
  u.volume = o.vol ?? 1;
  speechSynthesis.speak(u);
}

// Number counting with rising excitement (used for apple catches / taps)
export function sayNumber(n: number): void {
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const w = words[n - 1] ?? String(n);
  say(w, { rate: 1.1, pitch: 1.0 + n * 0.06 });
}
