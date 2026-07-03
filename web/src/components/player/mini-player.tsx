"use client";

import { motion } from "framer-motion";
import { EqualizerIcon, ExpandIcon, PauseIcon, PlayIcon, SkipNextIcon } from "@/components/icons";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";
import type { SongSummary } from "@/types";

/** Compact floating pill shown when the player bar is collapsed. */
export function MiniPlayer({ song }: { song: SongSummary }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const current = useCurrentSong();
  const store = usePlayerStore;
  const active = current?.id === song.id;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 40, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="glass-strong fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-full py-2 pr-3 pl-2 shadow-2xl"
      role="region"
      aria-label="Mini player"
    >
      <button
        onClick={() => store.getState().setView("full")}
        aria-label="Open full screen player"
        className="focus-ring relative size-10 shrink-0 overflow-hidden rounded-full shadow"
        style={{ background: song.gradient }}
      >
        {isPlaying && active && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <EqualizerIcon className="size-4 text-white" />
          </span>
        )}
      </button>

      <div className="hidden max-w-36 sm:block">
        <p className="truncate text-xs font-medium">{song.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{song.artist.name}</p>
      </div>

      <button
        onClick={() => store.getState().togglePlay()}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="focus-ring flex size-9 items-center justify-center rounded-full bg-white text-background shadow transition-transform hover:scale-105"
      >
        {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4 translate-x-px" />}
      </button>
      <button
        onClick={() => store.getState().next()}
        aria-label="Next track"
        className="focus-ring rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <SkipNextIcon className="size-4.5" />
      </button>
      <button
        onClick={() => store.getState().setView("bar")}
        aria-label="Expand player bar"
        className="focus-ring rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExpandIcon className="size-4" />
      </button>
    </motion.div>
  );
}
