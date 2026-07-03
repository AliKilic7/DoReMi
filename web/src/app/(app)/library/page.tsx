"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { MediaCard } from "@/components/catalog/media-card";
import { EmptyState } from "@/components/catalog/empty-state";
import { SongRow } from "@/components/catalog/song-row";
import { CardGridSkeleton, SongRowSkeleton } from "@/components/catalog/skeletons";
import { LibraryIcon, NoteIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGenres, useInfiniteAlbums, useInfiniteArtists, useInfiniteSongs } from "@/hooks/use-catalog";
import { usePlaylistMutations, usePlaylists } from "@/hooks/use-playlists";
import { useInView } from "@/hooks/use-in-view";
import { usePlay } from "@/hooks/use-play";
import { cn, formatCompactNumber } from "@/lib/utils";
import type { AlbumSort, ArtistSort, SongSort } from "@/types";

/** Sentinel + spinner that requests the next page when scrolled into view. */
function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={ref} className="flex justify-center py-6" aria-hidden={!isFetchingNextPage}>
      {isFetchingNextPage && <Spinner className="size-5" />}
    </div>
  );
}

function SortPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort by">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "focus-ring rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-white/12 text-foreground"
              : "text-muted-foreground hover:bg-white/6 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function useLibraryParams() {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/library?${next.toString()}`, { scroll: false });
  };

  return { params, setParam };
}

function SongsTab({ genre, songSort }: { genre?: string; songSort: SongSort }) {
  const play = usePlay();
  const query = useInfiniteSongs({ genre, sort: songSort });

  if (query.isPending)
    return (
      <div>
        {Array.from({ length: 8 }).map((_, i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    );
  if (!query.data?.length)
    return (
      <EmptyState icon={<NoteIcon />} title="No songs found" description="Try a different genre or sorting." />
    );

  return (
    <>
      <div role="list" aria-label="Songs">
        {query.data.map((song, i) => (
          <SongRow key={song.id} song={song} index={i + 1} onPlay={(s) => play(s, query.data)} />
        ))}
      </div>
      <LoadMore
        hasNextPage={!!query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  );
}

function AlbumsTab({ genre, albumSort }: { genre?: string; albumSort: AlbumSort }) {
  const query = useInfiniteAlbums({ genre, sort: albumSort });

  if (query.isPending) return <CardGridSkeleton />;
  if (!query.data?.length)
    return (
      <EmptyState icon={<LibraryIcon />} title="No albums found" description="Try a different genre or sorting." />
    );

  return (
    <>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {query.data.map((album) => (
          <MediaCard
            key={album.id}
            href={`/album/${album.slug}`}
            title={album.title}
            subtitle={`${album.artist.name} · ${new Date(album.releaseDate).getUTCFullYear()}`}
            gradient={album.gradient}
          />
        ))}
      </div>
      <LoadMore
        hasNextPage={!!query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  );
}

function ArtistsTab({ artistSort }: { artistSort: ArtistSort }) {
  const query = useInfiniteArtists({ sort: artistSort });

  if (query.isPending) return <CardGridSkeleton round />;
  if (!query.data?.length)
    return <EmptyState icon={<LibraryIcon />} title="No artists found" description="Check back soon." />;

  return (
    <>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {query.data.map((artist) => (
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
      <LoadMore
        hasNextPage={!!query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </>
  );
}

function PlaylistsTab() {
  const { data: playlists, isPending } = usePlaylists();
  const { create } = usePlaylistMutations();

  if (isPending) return <CardGridSkeleton count={6} />;
  if (!playlists?.length)
    return (
      <EmptyState
        icon={<LibraryIcon />}
        title="No playlists yet"
        description="Create your first playlist and start collecting songs you love."
        action={
          <Button size="sm" onClick={() => create.mutate({})} disabled={create.isPending}>
            <PlusIcon className="size-4" /> New playlist
          </Button>
        }
      />
    );

  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {playlists.map((playlist) => (
        <MediaCard
          key={playlist.id}
          href={`/playlist/${playlist.id}`}
          title={`${playlist.pinned ? "📌 " : ""}${playlist.name}`}
          subtitle={`${playlist.songCount} songs${playlist.favorite ? " · ♥" : ""}`}
          gradient={playlist.coverUrl ? `url(${playlist.coverUrl}) center/cover` : playlist.gradient}
        />
      ))}
      <button
        onClick={() => create.mutate({})}
        disabled={create.isPending}
        className="focus-ring group m-3 flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <PlusIcon className="size-7 transition-transform group-hover:scale-110" />
        <span className="text-sm font-medium">New playlist</span>
      </button>
    </div>
  );
}

function LibraryContent() {
  const { params, setParam } = useLibraryParams();
  const tab = params.get("tab") ?? "songs";
  const genre = params.get("genre") ?? undefined;
  const songSort = (params.get("sort") as SongSort) || "trending";
  const albumSort = (params.get("albumSort") as AlbumSort) || "recent";
  const artistSort = (params.get("artistSort") as ArtistSort) || "popular";

  const genres = useGenres();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Library</h1>
      </div>

      <Tabs value={tab} onValueChange={(value) => setParam("tab", value)} className="mt-5 px-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          {tab === "songs" && (
            <SortPills<SongSort>
              value={songSort}
              onChange={(value) => setParam("sort", value)}
              options={[
                { value: "trending", label: "Trending" },
                { value: "title", label: "A–Z" },
                { value: "recent", label: "Newest" },
                { value: "duration", label: "Shortest" },
              ]}
            />
          )}
          {tab === "albums" && (
            <SortPills<AlbumSort>
              value={albumSort}
              onChange={(value) => setParam("albumSort", value)}
              options={[
                { value: "recent", label: "Newest" },
                { value: "title", label: "A–Z" },
                { value: "popular", label: "Popular" },
              ]}
            />
          )}
          {tab === "artists" && (
            <SortPills<ArtistSort>
              value={artistSort}
              onChange={(value) => setParam("artistSort", value)}
              options={[
                { value: "popular", label: "Popular" },
                { value: "name", label: "A–Z" },
              ]}
            />
          )}
        </div>

        {/* Genre filter applies to songs & albums */}
        {tab !== "artists" && tab !== "playlists" && genres.data && (
          <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by genre">
            <button
              onClick={() => setParam("genre", undefined)}
              aria-pressed={!genre}
              className={cn(
                "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                !genre
                  ? "border-primary/50 bg-primary/15 text-primary-soft"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              All genres
            </button>
            {genres.data.map((g) => (
              <button
                key={g.id}
                onClick={() => setParam("genre", g.slug === genre ? undefined : g.slug)}
                aria-pressed={genre === g.slug}
                className={cn(
                  "focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  genre === g.slug
                    ? "border-primary/50 bg-primary/15 text-primary-soft"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        <TabsContent value="songs">
          <SongsTab genre={genre} songSort={songSort} />
        </TabsContent>
        <TabsContent value="albums">
          <AlbumsTab genre={genre} albumSort={albumSort} />
        </TabsContent>
        <TabsContent value="artists">
          <ArtistsTab artistSort={artistSort} />
        </TabsContent>
        <TabsContent value="playlists">
          <PlaylistsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <LibraryContent />
    </Suspense>
  );
}
