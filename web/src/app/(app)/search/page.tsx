"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MediaCard } from "@/components/catalog/media-card";
import { EmptyState } from "@/components/catalog/empty-state";
import { SongRow } from "@/components/catalog/song-row";
import { CardSkeleton, SongRowSkeleton } from "@/components/catalog/skeletons";
import { ClockIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearch, useSearchHistory, useSearchHistoryMutations } from "@/hooks/use-catalog";
import { usePlay } from "@/hooks/use-play";
import { formatCompactNumber } from "@/lib/utils";
import type { SearchResults } from "@/types";

function TopResultCard({ topResult }: { topResult: NonNullable<SearchResults["topResult"]> }) {
  const play = usePlay();

  if (topResult.type === "artist") {
    const { artist } = topResult;
    return (
      <Link
        href={`/artist/${artist.slug}`}
        className="focus-ring group flex items-center gap-5 rounded-2xl bg-white/4 p-5 transition-colors hover:bg-white/8"
      >
        <div className="size-24 rounded-full shadow-xl" style={{ background: artist.gradient }} />
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Artist</p>
          <p className="font-display mt-1 text-2xl font-bold">{artist.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCompactNumber(artist.monthlyListeners)} monthly listeners
          </p>
        </div>
      </Link>
    );
  }

  if (topResult.type === "song") {
    const { song } = topResult;
    return (
      <button
        onClick={() => play(song)}
        className="focus-ring group flex w-full items-center gap-5 rounded-2xl bg-white/4 p-5 text-left transition-colors hover:bg-white/8"
      >
        <div className="size-24 rounded-xl shadow-xl" style={{ background: song.gradient }} />
        <div>
          <p className="text-xs font-medium tracking-wide text-subtle uppercase">Song</p>
          <p className="font-display mt-1 text-2xl font-bold">{song.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{song.artist.name}</p>
        </div>
      </button>
    );
  }

  const { album } = topResult;
  return (
    <Link
      href={`/album/${album.slug}`}
      className="focus-ring group flex items-center gap-5 rounded-2xl bg-white/4 p-5 transition-colors hover:bg-white/8"
    >
      <div className="size-24 rounded-xl shadow-xl" style={{ background: album.gradient }} />
      <div>
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Album</p>
        <p className="font-display mt-1 text-2xl font-bold">{album.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{album.artist.name}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const active = debounced.trim().length >= 2;

  const { data, isFetching } = useSearch(debounced);
  const history = useSearchHistory(!active);
  const { record, remove, clear } = useSearchHistoryMutations();
  const play = usePlay();

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  // Record a committed search once results have been viewed for a beat.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => record.mutate(debounced.trim()), 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, active]);

  const showSkeletons = active && !data && isFetching;
  const noResults =
    active && data && !data.topResult && data.songs.length === 0 && data.albums.length === 0;

  return (
    <>
      <div className="relative px-3">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-7 size-5 -translate-y-1/2 text-subtle" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          aria-label="Search"
          className="h-13 rounded-2xl pl-12 text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="focus-ring absolute top-1/2 right-7 -translate-y-1/2 rounded-md p-1 text-subtle hover:text-foreground"
          >
            <CloseIcon className="size-4.5" />
          </button>
        )}
      </div>

      <div className="mt-6 px-3">
        {/* Recent searches when idle */}
        {!active && (
          <section aria-label="Recent searches">
            {history.data && history.data.length > 0 ? (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-bold tracking-tight">Recent searches</h2>
                  <button
                    onClick={() => clear.mutate()}
                    className="focus-ring rounded text-xs font-medium text-subtle hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {history.data.map((entry) => (
                    <span key={entry.id} className="glass inline-flex items-center gap-1 rounded-full pl-1">
                      <button
                        onClick={() => setQuery(entry.query)}
                        className="focus-ring flex items-center gap-2 rounded-full py-1.5 pl-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ClockIcon className="size-3.5" />
                        {entry.query}
                      </button>
                      <button
                        onClick={() => remove.mutate(entry.id)}
                        aria-label={`Remove ${entry.query} from history`}
                        className="focus-ring rounded-full p-1.5 pr-2 text-subtle hover:text-foreground"
                      >
                        <CloseIcon className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<SearchIcon />}
                title="Search DoReMi"
                description="Find your favorite songs, artists and albums. Try “neon”, “golden” or “midnight”."
              />
            )}
          </section>
        )}

        {showSkeletons && (
          <div className="space-y-3">
            <SongRowSkeleton />
            <SongRowSkeleton />
            <SongRowSkeleton />
            <SongRowSkeleton />
          </div>
        )}

        {noResults && (
          <EmptyState
            icon={<SearchIcon />}
            title={`No results for “${debounced.trim()}”`}
            description="Check the spelling, or try a different artist, song or album."
          />
        )}

        {active && data && !noResults && (
          <div className="space-y-9">
            <div className="grid gap-4 lg:grid-cols-2">
              {data.topResult && (
                <section aria-label="Top result">
                  <h2 className="font-display mb-3 text-xl font-bold tracking-tight">Top result</h2>
                  <TopResultCard topResult={data.topResult} />
                </section>
              )}
              {data.songs.length > 0 && (
                <section aria-label="Songs">
                  <h2 className="font-display mb-3 text-xl font-bold tracking-tight">Songs</h2>
                  <div>
                    {data.songs.slice(0, 4).map((song, i) => (
                      <SongRow key={song.id} song={song} index={i + 1} onPlay={(s) => play(s, data.songs)} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {data.artists.length > 0 && (
              <section aria-label="Artists">
                <h2 className="font-display mb-1 text-xl font-bold tracking-tight">Artists</h2>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {data.artists.map((artist) => (
                    <MediaCard
                      key={artist.id}
                      href={`/artist/${artist.slug}`}
                      title={artist.name}
                      subtitle={`${formatCompactNumber(artist.monthlyListeners)} monthly listeners`}
                      gradient={artist.gradient}
                      round
                    />
                  ))}
                </div>
              </section>
            )}

            {data.albums.length > 0 && (
              <section aria-label="Albums">
                <h2 className="font-display mb-1 text-xl font-bold tracking-tight">Albums</h2>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {data.albums.map((album) => (
                    <MediaCard
                      key={album.id}
                      href={`/album/${album.slug}`}
                      title={album.title}
                      subtitle={album.artist.name}
                      gradient={album.gradient}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* keeps grid height stable during quick refetches */}
        {active && !data && !isFetching && <CardSkeleton />}
      </div>
    </>
  );
}
