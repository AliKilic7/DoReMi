/**
 * Procedural audio synthesizer for seed data.
 *
 * Generates short, listenable mini-compositions (chords, bass, melody and a
 * light drum pattern) as 16-bit mono WAV buffers. Every song is derived from a
 * deterministic seed so re-seeding produces identical audio.
 */

const SAMPLE_RATE = 22050;

/** Deterministic PRNG (mulberry32). */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Chord progressions expressed as scale degrees. */
const PROGRESSIONS: number[][] = [
  [0, 5, 3, 4],
  [0, 3, 4, 4],
  [0, 5, 1, 4],
  [0, 2, 3, 4],
  [5, 3, 0, 4],
  [0, 4, 5, 3],
];

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const PENTA_MAJOR = [0, 2, 4, 7, 9];
const PENTA_MINOR = [0, 3, 5, 7, 10];

interface SongRecipe {
  bpm: number;
  bars: number;
  rootMidi: number;
  minor: boolean;
  progression: number[];
  /** 0..1 — how busy the melody is. */
  energy: number;
  hasDrums: boolean;
}

export interface RenderedSong {
  wav: Buffer;
  durationSec: number;
}

function makeRecipe(rng: () => number): SongRecipe {
  return {
    bpm: 72 + Math.floor(rng() * 56), // 72–128
    bars: 8 + 4 * Math.floor(rng() * 3), // 8 | 12 | 16
    rootMidi: 45 + Math.floor(rng() * 12), // A2–G#3
    minor: rng() < 0.55,
    progression: PROGRESSIONS[Math.floor(rng() * PROGRESSIONS.length)]!,
    energy: 0.35 + rng() * 0.6,
    hasDrums: rng() < 0.85,
  };
}

/** Renders one song to PCM float samples. */
function renderSamples(rng: () => number, recipe: SongRecipe): Float32Array {
  const { bpm, bars, rootMidi, minor, progression, energy, hasDrums } = recipe;
  const scale = minor ? MINOR : MAJOR;
  const penta = minor ? PENTA_MINOR : PENTA_MAJOR;

  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const durationSec = bars * barSec + 1.2; // tail for release
  const total = Math.floor(durationSec * SAMPLE_RATE);
  const out = new Float32Array(total);

  const degreeToMidi = (degree: number, octave = 0) =>
    rootMidi + 12 * (octave + Math.floor(degree / scale.length)) + scale[degree % scale.length]!;

  // --- pads: one triad per bar, slow attack/release --------------------
  for (let bar = 0; bar < bars; bar++) {
    const degree = progression[bar % progression.length]!;
    const chord = [degreeToMidi(degree, 1), degreeToMidi(degree + 2, 1), degreeToMidi(degree + 4, 1)];
    const start = bar * barSec;
    for (const midi of chord) {
      const freq = midiToFreq(midi);
      const detune = 1 + (rng() - 0.5) * 0.002;
      addTone(out, start, barSec * 1.05, (t) => {
        const env = Math.min(1, t / 0.4) * Math.exp(-t / (barSec * 0.9));
        return (
          env *
          0.11 *
          (Math.sin(2 * Math.PI * freq * detune * t) +
            0.5 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 2))
        );
      });
    }
  }

  // --- bass: root notes on beats 1 and 3 --------------------------------
  for (let bar = 0; bar < bars; bar++) {
    const degree = progression[bar % progression.length]!;
    const freq = midiToFreq(degreeToMidi(degree, 0) - 12);
    for (const beat of [0, 2]) {
      const start = bar * barSec + beat * beatSec;
      addTone(out, start, beatSec * 1.6, (t) => {
        const env = Math.min(1, t / 0.015) * Math.exp(-t * 2.2);
        return env * 0.22 * Math.sin(2 * Math.PI * freq * t + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t));
      });
    }
  }

  // --- melody: pentatonic random walk in eighth notes --------------------
  let melodyDegree = Math.floor(rng() * penta.length);
  for (let bar = 1; bar < bars - 1; bar++) {
    for (let eighth = 0; eighth < 8; eighth++) {
      if (rng() > energy) continue; // rest
      melodyDegree += Math.floor(rng() * 5) - 2;
      melodyDegree = Math.max(0, Math.min(penta.length * 2 - 1, melodyDegree));
      const midi =
        rootMidi +
        24 +
        12 * Math.floor(melodyDegree / penta.length) +
        penta[melodyDegree % penta.length]!;
      const freq = midiToFreq(midi);
      const start = bar * barSec + eighth * beatSec * 0.5;
      const len = beatSec * (rng() < 0.25 ? 1.0 : 0.5);
      addTone(out, start, len * 1.3, (t) => {
        const env = Math.min(1, t / 0.01) * Math.exp(-t / (len * 0.55));
        return env * 0.13 * (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 3 * t));
      });
    }
  }

  // --- drums --------------------------------------------------------------
  if (hasDrums) {
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const start = bar * barSec + beat * beatSec;
        // kick on 1 & 3 (and occasional 4)
        if (beat % 2 === 0 || (beat === 3 && rng() < 0.2)) {
          addTone(out, start, 0.16, (t) => {
            const env = Math.exp(-t * 26);
            return env * 0.5 * Math.sin(2 * Math.PI * (52 + 60 * Math.exp(-t * 32)) * t);
          });
        }
        // hats on offbeats
        const hatStart = start + beatSec * 0.5;
        addNoise(out, rng, hatStart, 0.05, (t) => Math.exp(-t * 70) * 0.07);
        // snare-ish on 2 & 4
        if (beat === 1 || beat === 3) {
          addNoise(out, rng, start, 0.11, (t) => Math.exp(-t * 30) * 0.12);
        }
      }
    }
  }

  // normalize to 0.88 peak
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(out[i]!));
  if (peak > 0) {
    const gain = 0.88 / peak;
    for (let i = 0; i < total; i++) out[i]! *= gain;
  }

  return out;
}

function addTone(
  out: Float32Array,
  startSec: number,
  lengthSec: number,
  sample: (t: number) => number,
): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const end = Math.min(out.length, start + Math.floor(lengthSec * SAMPLE_RATE));
  for (let i = start; i < end; i++) {
    out[i]! += sample((i - start) / SAMPLE_RATE);
  }
}

function addNoise(
  out: Float32Array,
  rng: () => number,
  startSec: number,
  lengthSec: number,
  envelope: (t: number) => number,
): void {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const end = Math.min(out.length, start + Math.floor(lengthSec * SAMPLE_RATE));
  for (let i = start; i < end; i++) {
    out[i]! += (rng() * 2 - 1) * envelope((i - start) / SAMPLE_RATE);
  }
}

/** Encodes float samples as a 16-bit mono WAV file. */
function encodeWav(samples: Float32Array): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]!));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buffer;
}

/** Renders a full song for the given seed. */
export function renderSong(seed: number): RenderedSong {
  const rng = createRng(seed);
  const recipe = makeRecipe(rng);
  const samples = renderSamples(rng, recipe);
  return {
    wav: encodeWav(samples),
    durationSec: Math.round(samples.length / SAMPLE_RATE),
  };
}

/** Duration a render for this seed would have — without rendering the audio. */
export function songDuration(seed: number): number {
  const rng = createRng(seed);
  const { bpm, bars } = makeRecipe(rng);
  const durationSec = bars * 4 * (60 / bpm) + 1.2;
  return Math.round(Math.floor(durationSec * SAMPLE_RATE) / SAMPLE_RATE);
}
