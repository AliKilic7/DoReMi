"use client";

import Link from "next/link";
import { EqualizerIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";
import type { SongSummary } from "@/types";

interface SongRowProps {
  song: SongSummary;
  index: number;
  onPlay: (song: SongSummary) => void;
  /** Hide the album column (e.g. on the album page itself). */
  hideAlbum?: boolean;
  /** Hide the artwork thumbnail (album pages show track numbers instead). */
  hideArt?: boolean;
}

/** One track in any list: index/play, art, title/artist, album, duration. */
export function SongRow({ song, index, onPlay, hideAlbum = false, hideArt = false }: SongRowProps) {
  const isCurrent = useCurrentSong()?.id === song.id;
  const isPlaying = usePlayerStore((s) => s.isPlaying) && isCurrent;
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const handlePlay = () => (isCurrent ? togglePlay() : onPlay(song));

  return (
    <div
      className={cn(
        "group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/6 sm:grid-cols-[2rem_4fr_3fr_auto]",
        isCurrent && "bg-white/4",
      )}
      onDoubleClick={handlePlay}
    >
      <div className="relative flex size-8 items-center justify-center">
        {isPlaying ? (
          <EqualizerIcon className="size-4 text-primary-soft group-hover:opacity-0" />
        ) : (
          <span className="text-sm text-subtle tabular-nums group-hover:opacity-0">{index}</span>
        )}
        <button
          onClick={handlePlay}
          aria-label={
            isPlaying ? `Pause ${song.title}` : `Play ${song.title} by ${song.artist.name}`
          }
          className="focus-ring absolute inset-0 flex items-center justify-center rounded-lg text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {!hideArt && (
          <div className="size-10 shrink-0 rounded-lg shadow" style={{ background: song.gradient }} />
        )}
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary-soft")}>
            {song.title}
          </p>
          <Link
            href={`/artist/${song.artist.slug}`}
            className="focus-ring truncate rounded text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {song.artist.name}
          </Link>
        </div>
      </div>

      <Link
        href={`/album/${song.album.slug}`}
        className={cn(
          "focus-ring hidden min-w-0 truncate rounded text-sm text-muted-foreground hover:text-foreground hover:underline sm:block",
          hideAlbum && "sm:invisible",
        )}
      >
        {song.album.title}
      </Link>

      <span className="text-sm text-subtle tabular-nums">{formatDuration(song.durationSec)}</span>
    </div>
  );
}
