/**
 * Singleton audio graph. The <audio> element lives outside React so hot
 * reloads, strict-mode double mounts and route changes never interrupt
 * playback. The Web Audio analyser (for the visualizer) is created lazily on
 * the first user gesture, since AudioContext requires user activation.
 */

let audio: HTMLAudioElement | null = null;
let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
  }
  return audio;
}

/** Must be called from a user gesture (click) the first time. */
export function ensureAnalyser(): AnalyserNode | null {
  const element = getAudio();
  if (!element) return null;

  if (!context) {
    context = new AudioContext();
    const source = context.createMediaElementSource(element);
    analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return analyser;
}

export function getAnalyser(): AnalyserNode | null {
  return analyser;
}
