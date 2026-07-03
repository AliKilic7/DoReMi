"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { LikeButton } from "@/components/catalog/like-button";
import {
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from "@/components/icons";
import { Slider } from "@/components/ui/slider";
import { Visualizer } from "@/components/player/visualizer";
import { cn, formatDuration } from "@/lib/utils";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";

/** Immersive full-screen playback view with an ambient gradient backdrop. */
export function FullscreenPlayer() {
  const song = useCurrentSong();
  const view = usePlayerStore((s) => s.view);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const store = usePlayerStore;

  const open = view === "full" && song !== null;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") store.getState().setView("bar");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, store]);

  const effectiveDuration = duration || song?.durationSec || 0;

  return (
    <AnimatePresence>
      {open && song && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Now playing (full screen)"
        >
          {/* ambient backdrop */}
          <div aria-hidden className="absolute inset-0">
            <div
              className="absolute inset-0 opacity-50 blur-[110px] saturate-150"
              style={{ background: song.gradient }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          </div>

          <div className="relative flex items-center justify-between px-6 pt-6 md:px-10">
            <p className="text-xs font-medium tracking-widest text-white/70 uppercase">
              Now playing
            </p>
            <button
              onClick={() => store.getState().setView("bar")}
              aria-label="Close full screen"
              className="focus-ring rounded-full bg-black/25 p-2 text-white/85 backdrop-blur transition-colors hover:text-white"
            >
              <ChevronDownIcon className="size-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6">
            <motion.div
              key={song.id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              className={cn(
                "aspect-square w-full max-w-72 rounded-3xl shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)] md:max-w-87",
                isPlaying && "animate-float [animation-duration:9s]",
              )}
              style={{ background: song.gradient }}
            />

            <div className="w-full max-w-xl text-center">
              <div className="flex items-center justify-center gap-3">
                <h2 className="font-display truncate text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {song.title}
                </h2>
                <LikeButton songId={song.id} songTitle={song.title} alwaysVisible />
              </div>
              <p className="mt-1.5 text-base text-white/70">
                {song.artist.name} · {song.album.title}
              </p>
            </div>

            <Visualizer width={320} height={44} className="block! opacity-80" />
          </div>

          <div className="relative mx-auto w-full max-w-2xl px-6 pb-10">
            <div className="flex items-center gap-3">
              <span className="w-10 text-right text-xs text-white/60 tabular-nums">
                {formatDuration(currentTime)}
              </span>
              <Slider
                aria-label="Seek"
                value={[Math.min(currentTime, effectiveDuration)]}
                max={Math.max(1, effectiveDuration)}
                step={1}
                onValueCommit={([value]) => store.getState().seek(value ?? 0)}
              />
              <span className="w-10 text-xs text-white/60 tabular-nums">
                {formatDuration(effectiveDuration)}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-7">
              <button
                onClick={() => store.getState().toggleShuffle()}
                aria-label="Shuffle"
                aria-pressed={shuffle}
                className={cn(
                  "focus-ring rounded-full p-2 transition-transform hover:scale-110",
                  shuffle ? "text-primary-soft" : "text-white/70 hover:text-white",
                )}
              >
                <ShuffleIcon className="size-5.5" />
              </button>
              <button
                onClick={() => store.getState().previous()}
                aria-label="Previous track"
                className="focus-ring rounded-full p-2 text-white/85 transition-transform hover:scale-110 hover:text-white"
              >
                <SkipPrevIcon className="size-7" />
              </button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => store.getState().togglePlay()}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="focus-ring flex size-16 items-center justify-center rounded-full bg-white text-background shadow-2xl transition-transform hover:scale-105"
              >
                {isPlaying ? (
                  <PauseIcon className="size-6" />
                ) : (
                  <PlayIcon className="size-6 translate-x-0.5" />
                )}
              </motion.button>
              <button
                onClick={() => store.getState().next()}
                aria-label="Next track"
                className="focus-ring rounded-full p-2 text-white/85 transition-transform hover:scale-110 hover:text-white"
              >
                <SkipNextIcon className="size-7" />
              </button>
              <button
                onClick={() => store.getState().cycleRepeat()}
                aria-label={`Repeat: ${repeat}`}
                className={cn(
                  "focus-ring relative rounded-full p-2 transition-transform hover:scale-110",
                  repeat !== "off" ? "text-primary-soft" : "text-white/70 hover:text-white",
                )}
              >
                <RepeatIcon className="size-5.5" />
                {repeat === "one" && (
                  <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
