"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/catalog/empty-state";
import { SongRow } from "@/components/catalog/song-row";
import { SongRowSkeleton } from "@/components/catalog/skeletons";
import { NoteIcon, PlayIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useAlbum } from "@/hooks/use-catalog";
import { usePlay } from "@/hooks/use-play";
import { formatTotalDuration, releaseYear } from "@/lib/utils";

function DetailSkeleton() {
  return (
    <div className="px-3">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <Skeleton className="size-48 rounded-2xl" />
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-8 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AlbumDetailView({ slug }: { slug: string }) {
  const { data: album, isPending, error, refetch } = useAlbum(slug);
  const play = usePlay();

  if (isPending) return <DetailSkeleton />;
  if (error instanceof ApiError && error.status === 404) notFound();
  if (error || !album)
    return (
      <EmptyState
        icon={<NoteIcon />}
        title="Couldn't load this album"
        description="Something went wrong while talking to the server."
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );

  return (
    <div className="px-3">
      {/* hero */}
      <header className="relative -mx-8 -mt-6 px-8 pt-10 pb-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-35 blur-3xl"
          style={{ background: album.gradient }}
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div
            className="size-44 shrink-0 rounded-2xl shadow-2xl md:size-52"
            style={{ background: album.gradient }}
          />
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Album · {album.genre.name}
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              {album.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <Link
                href={`/artist/${album.artist.slug}`}
                className="focus-ring rounded font-semibold text-foreground hover:underline"
              >
                {album.artist.name}
              </Link>
              <span aria-hidden> · </span>
              {releaseYear(album.releaseDate)}
              <span aria-hidden> · </span>
              {album.songCount} songs, {formatTotalDuration(album.totalDurationSec)}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-2 flex items-center gap-4">
        <Button
          size="lg"
          onClick={() => album.songs[0] && play(album.songs[0], album.songs)}
          aria-label="Play album"
        >
          <PlayIcon className="size-5 translate-x-px" />
          Play
        </Button>
      </div>

      {/* tracklist */}
      <div className="mt-6" role="list" aria-label="Track list">
        <div className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-border px-3 pb-2 text-xs font-medium tracking-wide text-subtle uppercase sm:grid-cols-[2rem_4fr_3fr_auto]">
          <span>#</span>
          <span>Title</span>
          <span className="hidden sm:block" />
          <span>Time</span>
        </div>
        <div className="mt-2">
          {album.songs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              index={song.trackNumber}
              onPlay={(s) => play(s, album.songs)}
              hideAlbum
              hideArt
            />
          ))}
        </div>
      </div>

      <p className="mt-8 px-3 pb-4 text-xs text-subtle">
        Released {new Date(album.releaseDate).toLocaleDateString("en-US", { dateStyle: "long" })}
      </p>
    </div>
  );
}
