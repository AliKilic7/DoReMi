"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  ExpandIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  QueueIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeIcon,
} from "@/components/icons";
import { LikeButton } from "@/components/catalog/like-button";
import { MiniPlayer } from "@/components/player/mini-player";
import { Slider } from "@/components/ui/slider";
import { Visualizer } from "@/components/player/visualizer";
import { cn, formatDuration } from "@/lib/utils";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";

function ControlButton({
  label,
  active = false,
  onClick,
  children,
  badge,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "focus-ring relative rounded-full p-1.5 transition-all hover:scale-110 active:scale-95",
        active ? "text-primary-soft" : "text-muted-foreground hover:text-foreground",
        "[&_svg]:size-4.5",
      )}
    >
      {children}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
      {active && !badge && (
        <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary-soft" />
      )}
    </button>
  );
}

/** Persistent bottom player. Slides in the first time a song is loaded. */
export function PlayerBar() {
  const song = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const queueOpen = usePlayerStore((s) => s.queueOpen);
  const view = usePlayerStore((s) => s.view);
  const store = usePlayerStore;

  // While dragging we show the drag position, not the playhead.
  const [dragTime, setDragTime] = useState<number | null>(null);
  const shownTime = dragTime ?? currentTime;
  const effectiveDuration = duration || song?.durationSec || 0;

  const volumeLevel: 0 | 1 | 2 = muted || volume === 0 ? 0 : volume < 0.5 ? 1 : 2;

  return (
    <AnimatePresence mode="popLayout">
      {song && view === "mini" && <MiniPlayer key="mini" song={song} />}
      {song && view !== "mini" && (
        <motion.div
          key="bar"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="glass-strong flex items-center gap-4 rounded-2xl px-4 py-3"
          role="region"
          aria-label="Player"
        >
          {/* now playing */}
          <div className="flex w-56 min-w-0 shrink-0 items-center gap-3">
            <motion.button
              key={song.id}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => store.getState().setView("full")}
              aria-label="Open full screen player"
              className="focus-ring size-12 shrink-0 rounded-lg shadow-lg transition-transform hover:scale-105"
              style={{ background: song.gradient }}
            />
            <div className="min-w-0">
              <Link
                href={`/album/${song.album.slug}`}
                className="focus-ring block truncate rounded text-sm font-medium hover:underline"
              >
                {song.title}
              </Link>
              <Link
                href={`/artist/${song.artist.slug}`}
                className="focus-ring block truncate rounded text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {song.artist.name}
              </Link>
            </div>
            <LikeButton songId={song.id} songTitle={song.title} alwaysVisible className="shrink-0" />
          </div>

          {/* transport + seek */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block">
                <ControlButton label="Shuffle" active={shuffle} onClick={() => store.getState().toggleShuffle()}>
                  <ShuffleIcon />
                </ControlButton>
              </span>
              <ControlButton label="Previous track" onClick={() => store.getState().previous()}>
                <SkipPrevIcon className="size-5!" />
              </ControlButton>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => store.getState().togglePlay()}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="focus-ring flex size-10 items-center justify-center rounded-full bg-white text-background shadow-lg transition-transform hover:scale-105"
              >
                {isPlaying ? (
                  <PauseIcon className="size-4.5" />
                ) : (
                  <PlayIcon className="size-4.5 translate-x-px" />
                )}
              </motion.button>
              <ControlButton label="Next track" onClick={() => store.getState().next()}>
                <SkipNextIcon className="size-5!" />
              </ControlButton>
              <span className="hidden sm:block">
                <ControlButton
                  label={`Repeat: ${repeat}`}
                  active={repeat !== "off"}
                  onClick={() => store.getState().cycleRepeat()}
                  badge={repeat === "one" ? "1" : undefined}
                >
                  <RepeatIcon />
                </ControlButton>
              </span>
            </div>

            <div className="flex w-full max-w-xl items-center gap-2.5">
              <span className="w-9 text-right text-[11px] text-subtle tabular-nums">
                {formatDuration(shownTime)}
              </span>
              <Slider
                aria-label="Seek"
                value={[Math.min(shownTime, effectiveDuration)]}
                max={Math.max(1, effectiveDuration)}
                step={1}
                onValueChange={([value]) => setDragTime(value ?? 0)}
                onValueCommit={([value]) => {
                  store.getState().seek(value ?? 0);
                  setDragTime(null);
                }}
              />
              <span className="w-9 text-[11px] text-subtle tabular-nums">
                {formatDuration(effectiveDuration)}
              </span>
            </div>
          </div>

          {/* right cluster: visualizer + queue + volume */}
          <div className="hidden w-56 shrink-0 items-center justify-end gap-3 md:flex">
            <Visualizer />
            <ControlButton
              label={queueOpen ? "Close queue" : "Open queue"}
              active={queueOpen}
              onClick={() => store.getState().toggleQueue()}
            >
              <QueueIcon />
            </ControlButton>
            <button
              onClick={() => store.getState().toggleMute()}
              aria-label={muted ? "Unmute" : "Mute"}
              className="focus-ring rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <VolumeIcon level={volumeLevel} className="size-5" />
            </button>
            <Slider
              aria-label="Volume"
              className="w-24"
              value={[muted ? 0 : Math.round(volume * 100)]}
              max={100}
              step={1}
              onValueChange={([value]) => store.getState().setVolume((value ?? 0) / 100)}
            />
            <ControlButton label="Full screen player" onClick={() => store.getState().setView("full")}>
              <ExpandIcon />
            </ControlButton>
            <ControlButton label="Minimize player" onClick={() => store.getState().setView("mini")}>
              <MinimizeIcon />
            </ControlButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
