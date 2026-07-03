import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SongSummary } from "@/types";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  /** Current play order. */
  queue: SongSummary[];
  /** Unshuffled order, kept so shuffle can be toggled off losslessly. */
  baseQueue: SongSummary[];
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  /** Written by the audio engine (~4×/s). */
  currentTime: number;
  duration: number;
  /** One-shot seek request consumed by the audio engine. */
  pendingSeek: number | null;
  /** Whether the queue side panel is open. */
  queueOpen: boolean;
  /** Player chrome: full bar, floating mini pill, or full-screen overlay. */
  view: "bar" | "mini" | "full";

  playSong: (song: SongSummary, context?: SongSummary[]) => void;
  playAt: (index: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: (auto?: boolean) => void;
  previous: () => void;
  seek: (time: number) => void;
  clearPendingSeek: () => void;
  setProgress: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (index: number) => void;
  /** Appends a song; returns false if it's already queued. */
  addToQueue: (song: SongSummary) => boolean;
  /** Replaces everything after the current track (drag & drop reorder). */
  setUpcoming: (songs: SongSummary[]) => void;
  clearUpcoming: () => void;
  toggleQueue: () => void;
  setView: (view: "bar" | "mini" | "full") => void;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      baseQueue: [],
      currentIndex: -1,
      isPlaying: false,
      shuffle: false,
      repeat: "off",
      volume: 0.8,
      muted: false,
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      queueOpen: false,
      view: "bar",

      playSong: (song, context) => {
        const base = context && context.length > 0 ? context : [song];
        const startIndex = Math.max(
          0,
          base.findIndex((s) => s.id === song.id),
        );
        const { shuffle } = get();
        const queue = shuffle
          ? [song, ...shuffled(base.filter((s) => s.id !== song.id))]
          : base;
        set({
          baseQueue: base,
          queue,
          currentIndex: shuffle ? 0 : startIndex,
          isPlaying: true,
          currentTime: 0,
          duration: song.durationSec,
        });
      },

      playAt: (index) => {
        const { queue } = get();
        if (index < 0 || index >= queue.length) return;
        set({ currentIndex: index, isPlaying: true, currentTime: 0 });
      },

      togglePlay: () => {
        const { currentIndex, queue } = get();
        if (currentIndex < 0 || queue.length === 0) return;
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      setPlaying: (playing) => set({ isPlaying: playing }),

      next: (auto = false) => {
        const { queue, currentIndex, repeat } = get();
        if (queue.length === 0) return;

        // auto-advance with repeat-one replays the same track
        if (auto && repeat === "one") {
          set({ pendingSeek: 0, isPlaying: true, currentTime: 0 });
          return;
        }

        const last = currentIndex >= queue.length - 1;
        if (last) {
          if (repeat === "off" && auto) {
            set({ isPlaying: false, currentTime: 0 });
            return;
          }
          set({ currentIndex: 0, isPlaying: true, currentTime: 0 });
          return;
        }
        set({ currentIndex: currentIndex + 1, isPlaying: true, currentTime: 0 });
      },

      previous: () => {
        const { currentIndex, currentTime } = get();
        // past 3s → restart the track instead (standard player behavior)
        if (currentTime > 3 || currentIndex <= 0) {
          set({ pendingSeek: 0, currentTime: 0, isPlaying: true });
          return;
        }
        set({ currentIndex: currentIndex - 1, isPlaying: true, currentTime: 0 });
      },

      seek: (time) => set({ pendingSeek: time, currentTime: time }),
      clearPendingSeek: () => set({ pendingSeek: null }),
      setProgress: (currentTime, duration) => set({ currentTime, duration }),

      setVolume: (volume) =>
        set({ volume: Math.min(1, Math.max(0, volume)), muted: volume === 0 ? true : false }),
      toggleMute: () => set((state) => ({ muted: !state.muted })),

      toggleShuffle: () => {
        const { shuffle, queue, baseQueue, currentIndex } = get();
        const current = queue[currentIndex];
        if (!current) {
          set({ shuffle: !shuffle });
          return;
        }
        if (!shuffle) {
          // turn on: current first, rest shuffled
          set({
            shuffle: true,
            queue: [current, ...shuffled(queue.filter((_, i) => i !== currentIndex))],
            currentIndex: 0,
          });
        } else {
          // turn off: restore original order
          const index = baseQueue.findIndex((s) => s.id === current.id);
          set({ shuffle: false, queue: baseQueue, currentIndex: Math.max(0, index) });
        }
      },

      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
        })),

      removeFromQueue: (index) => {
        const { queue, currentIndex } = get();
        if (index === currentIndex) return; // never remove the playing track
        const removed = queue[index];
        set({
          queue: queue.filter((_, i) => i !== index),
          baseQueue: get().baseQueue.filter((s) => s.id !== removed?.id),
          currentIndex: index < currentIndex ? currentIndex - 1 : currentIndex,
        });
      },

      addToQueue: (song) => {
        const { queue } = get();
        if (queue.some((s) => s.id === song.id)) return false;
        set((state) => ({
          queue: [...state.queue, song],
          baseQueue: [...state.baseQueue, song],
        }));
        // starting a queue from scratch loads (but doesn't autoplay) the song
        if (get().currentIndex < 0) set({ currentIndex: 0 });
        return true;
      },

      setUpcoming: (songs) => {
        const { queue, currentIndex } = get();
        const played = queue.slice(0, currentIndex + 1);
        set({ queue: [...played, ...songs], baseQueue: [...played, ...songs] });
      },

      clearUpcoming: () => {
        const { queue, currentIndex } = get();
        set({ queue: queue.slice(0, currentIndex + 1), baseQueue: queue.slice(0, currentIndex + 1) });
      },

      toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen })),

      setView: (view) => set({ view }),
    }),
    {
      name: "doremi-player",
      // Only remember preferences, never the transient playback state.
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    },
  ),
);

/** The song currently loaded in the player, if any. */
export function useCurrentSong(): SongSummary | null {
  return usePlayerStore((state) => state.queue[state.currentIndex] ?? null);
}
