"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/catalog/empty-state";
import { SongRow } from "@/components/catalog/song-row";
import { SongRowSkeleton } from "@/components/catalog/skeletons";
import { HeartIcon, PlayIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useInfiniteLikedSongs } from "@/hooks/use-likes";
import { useInView } from "@/hooks/use-in-view";
import { usePlay } from "@/hooks/use-play";
import { formatTotalDuration } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function LikedSongsPage() {
  const query = useInfiniteLikedSongs();
  const play = usePlay();
  const user = useAuthStore((s) => s.user);
  const { ref, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [inView, query]);

  const songs = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const totalDuration = songs.reduce((sum, song) => sum + song.durationSec, 0);

  return (
    <div className="px-3">
      {/* hero */}
      <header className="relative -mx-8 -mt-6 px-8 pt-10 pb-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 blur-3xl"
          style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3,#e879f9)" }}
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div
            className="flex size-44 shrink-0 items-center justify-center rounded-2xl shadow-2xl md:size-52"
            style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3,#e879f9)" }}
          >
            <HeartIcon filled className="size-20 text-white drop-shadow-lg" />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Playlist
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold tracking-tight md:text-6xl">
              Liked Songs
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{user?.displayName}</span>
              <span aria-hidden> · </span>
              {total} songs
              {total > 0 && (
                <>
                  <span aria-hidden> · </span>
                  {formatTotalDuration(totalDuration)}
                  {query.hasNextPage ? "+" : ""}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {total > 0 && (
        <div className="mt-2">
          <Button size="lg" onClick={() => songs[0] && play(songs[0], songs)} aria-label="Play liked songs">
            <PlayIcon className="size-5 translate-x-px" />
            Play
          </Button>
        </div>
      )}

      <div className="mt-6 pb-4">
        {query.isPending &&
          Array.from({ length: 8 }).map((_, i) => <SongRowSkeleton key={i} />)}

        {!query.isPending && total === 0 && (
          <EmptyState
            icon={<HeartIcon />}
            title="Songs you like will appear here"
            description="Tap the heart on any song to save it. Your favorites stay synced everywhere."
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href="/library">Browse the library</Link>
              </Button>
            }
          />
        )}

        <div role="list" aria-label="Liked songs">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i + 1} onPlay={(s) => play(s, songs)} />
          ))}
        </div>

        <div ref={ref} className="flex justify-center py-6">
          {query.isFetchingNextPage && <Spinner className="size-5" />}
        </div>
      </div>
    </div>
  );
}
