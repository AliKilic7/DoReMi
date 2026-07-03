"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/catalog/empty-state";
import { MediaCard } from "@/components/catalog/media-card";
import { SongRow } from "@/components/catalog/song-row";
import { SongRowSkeleton } from "@/components/catalog/skeletons";
import { NoteIcon, PlayIcon, WaveIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useArtist } from "@/hooks/use-catalog";
import { usePlay } from "@/hooks/use-play";
import { formatCompactNumber } from "@/lib/utils";

function DetailSkeleton() {
  return (
    <div className="px-3">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <Skeleton className="size-48 rounded-full" />
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-8 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ArtistDetailView({ slug }: { slug: string }) {
  const { data: artist, isPending, error, refetch } = useArtist(slug);
  const play = usePlay();
  const [showAllSongs, setShowAllSongs] = useState(false);

  if (isPending) return <DetailSkeleton />;
  if (error instanceof ApiError && error.status === 404) notFound();
  if (error || !artist)
    return (
      <EmptyState
        icon={<NoteIcon />}
        title="Couldn't load this artist"
        description="Something went wrong while talking to the server."
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );

  const visibleSongs = showAllSongs ? artist.topSongs : artist.topSongs.slice(0, 5);

  return (
    <div className="px-3">
      {/* hero */}
      <header className="relative -mx-8 -mt-6 px-8 pt-10 pb-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-35 blur-3xl"
          style={{ background: artist.gradient }}
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div
            className="size-44 shrink-0 rounded-full shadow-2xl md:size-52"
            style={{ background: artist.gradient }}
          />
          <div className="min-w-0 text-center sm:text-left">
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase sm:justify-start">
              <WaveIcon className="size-4 text-primary-soft" /> Verified artist
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-balance md:text-6xl">
              {artist.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {formatCompactNumber(artist.monthlyListeners)} monthly listeners
            </p>
          </div>
        </div>
      </header>

      <div className="mt-2 flex items-center gap-4">
        <Button
          size="lg"
          onClick={() => artist.topSongs[0] && play(artist.topSongs[0])}
          aria-label={`Play ${artist.name}`}
        >
          <PlayIcon className="size-5 translate-x-px" />
          Play
        </Button>
      </div>

      {/* popular songs */}
      <section aria-label="Popular songs" className="mt-8">
        <h2 className="font-display px-3 text-xl font-bold tracking-tight">Popular</h2>
        <div className="mt-3">
          {visibleSongs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i + 1} onPlay={play} />
          ))}
        </div>
        {artist.topSongs.length > 5 && (
          <button
            onClick={() => setShowAllSongs((v) => !v)}
            className="focus-ring mt-2 ml-3 rounded text-xs font-semibold text-subtle uppercase hover:text-foreground"
          >
            {showAllSongs ? "Show less" : "See more"}
          </button>
        )}
      </section>

      {/* discography */}
      <section aria-label="Discography" className="mt-10">
        <h2 className="font-display px-3 text-xl font-bold tracking-tight">Discography</h2>
        <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {artist.albums.map((album) => (
            <MediaCard
              key={album.id}
              href={`/album/${album.slug}`}
              title={album.title}
              subtitle={`Album · ${new Date(album.releaseDate).getUTCFullYear()}`}
              gradient={album.gradient}
            />
          ))}
        </div>
      </section>

      {/* about */}
      <section aria-label="About" className="mt-10 px-3 pb-4">
        <h2 className="font-display text-xl font-bold tracking-tight">About</h2>
        <div className="glass mt-3 max-w-3xl rounded-2xl p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
          <p className="mt-4 text-xs text-subtle">
            {formatCompactNumber(artist.monthlyListeners)} monthly listeners ·{" "}
            {formatCompactNumber(artist.followerCount)} followers on DoReMi
          </p>
        </div>
      </section>
    </div>
  );
}
