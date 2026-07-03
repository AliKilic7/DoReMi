"use client";

import { AnimatePresence, motion, Reorder } from "framer-motion";
import { CloseIcon, EqualizerIcon, QueueIcon } from "@/components/icons";
import { EmptyState } from "@/components/catalog/empty-state";
import { cn, formatDuration } from "@/lib/utils";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";
import type { SongSummary } from "@/types";

function QueueEntry({
  song,
  onRemove,
  onPlay,
}: {
  song: SongSummary;
  onRemove: () => void;
  onPlay: () => void;
}) {
  return (
    <Reorder.Item
      value={song}
      id={song.id}
      className="group relative flex cursor-grab items-center gap-3 rounded-xl bg-transparent px-2 py-2 transition-colors select-none hover:bg-white/6 active:cursor-grabbing"
      whileDrag={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.1)", zIndex: 10 }}
    >
      <button
        onClick={onPlay}
        aria-label={`Play ${song.title} now`}
        className="focus-ring size-9 shrink-0 rounded-lg shadow"
        style={{ background: song.gradient }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.artist.name}</p>
      </div>
      <span className="text-xs text-subtle tabular-nums group-hover:opacity-0">
        {formatDuration(song.durationSec)}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${song.title} from queue`}
        className="focus-ring absolute right-2 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <CloseIcon className="size-4" />
      </button>
    </Reorder.Item>
  );
}

/** Sliding queue panel: now playing, drag-to-reorder upcoming, remove & clear. */
export function QueuePanel() {
  const open = usePlayerStore((s) => s.queueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const current = useCurrentSong();
  const store = usePlayerStore;

  const upcoming = queue.slice(currentIndex + 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="glass-strong fixed top-3 right-3 bottom-24 z-40 flex w-[21rem] max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl"
          role="region"
          aria-label="Queue"
        >
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold">Queue</h2>
            <div className="flex items-center gap-1">
              {upcoming.length > 0 && (
                <button
                  onClick={() => store.getState().clearUpcoming()}
                  className="focus-ring rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => store.getState().toggleQueue()}
                aria-label="Close queue"
                className="focus-ring rounded-full p-1.5 text-muted-foreground hover:text-foreground"
              >
                <CloseIcon className="size-4.5" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {current ? (
              <>
                <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-subtle uppercase">
                  Now playing
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-2 py-2 ring-1 ring-primary/25">
                  <div
                    className="size-9 shrink-0 rounded-lg shadow"
                    style={{ background: current.gradient }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary-soft">{current.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{current.artist.name}</p>
                  </div>
                  {isPlaying && <EqualizerIcon className="size-4 shrink-0 text-primary-soft" />}
                </div>

                <p className={cn("px-2 pt-5 pb-2 text-xs font-semibold tracking-wide text-subtle uppercase")}>
                  Next up · {upcoming.length}
                </p>
                {upcoming.length > 0 ? (
                  <Reorder.Group
                    axis="y"
                    values={upcoming}
                    onReorder={(songs) => store.getState().setUpcoming(songs)}
                    className="space-y-0.5"
                  >
                    {upcoming.map((song, i) => (
                      <QueueEntry
                        key={song.id}
                        song={song}
                        onPlay={() => store.getState().playAt(currentIndex + 1 + i)}
                        onRemove={() => store.getState().removeFromQueue(currentIndex + 1 + i)}
                      />
                    ))}
                  </Reorder.Group>
                ) : (
                  <p className="px-2 py-6 text-center text-sm text-subtle">
                    Nothing queued — this is the last track.
                  </p>
                )}
              </>
            ) : (
              <EmptyState
                icon={<QueueIcon />}
                title="Your queue is empty"
                description="Play something, or use “Add to queue” on any song."
              />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
