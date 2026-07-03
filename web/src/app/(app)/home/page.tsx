"use client";

import Link from "next/link";
import { MediaCard } from "@/components/catalog/media-card";
import { Shelf } from "@/components/catalog/shelf";
import { ShelfSkeleton } from "@/components/catalog/skeletons";
import { NoteIcon } from "@/components/icons";
import { EmptyState } from "@/components/catalog/empty-state";
import { useBrowseHome } from "@/hooks/use-catalog";
import { usePersonalHome } from "@/hooks/use-user";
import { usePlay } from "@/hooks/use-play";
import { formatCompactNumber, greeting } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const { data, isPending, isError, refetch } = useBrowseHome();
  const personal = usePersonalHome();
  const user = useAuthStore((s) => s.user);
  const play = usePlay();

  return (
    <>
      <h1 className="font-display px-3 text-3xl font-bold tracking-tight">
        {greeting()}
        {user ? `, ${user.displayName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1 px-3 text-sm text-muted-foreground">
        Here&apos;s what the world is listening to right now.
      </p>

      <div className="mt-6">
        {isPending && (
          <>
            <ShelfSkeleton />
            <ShelfSkeleton />
            <ShelfSkeleton round />
          </>
        )}

        {isError && (
          <EmptyState
            icon={<NoteIcon />}
            title="Couldn't load your feed"
            description="Something went wrong while talking to the server."
            action={
              <button onClick={() => refetch()} className="focus-ring rounded text-sm font-medium text-primary-soft hover:underline">
                Try again
              </button>
            }
          />
        )}

        {data && (
          <>
            {personal.data && personal.data.recentlyPlayed.length > 0 && (
              <Shelf title="Recently played">
                {personal.data.recentlyPlayed.slice(0, 6).map((song) => (
                  <MediaCard
                    key={song.id}
                    href={`/album/${song.album.slug}`}
                    title={song.title}
                    subtitle={song.artist.name}
                    gradient={song.gradient}
                    onPlay={() => play(song, personal.data!.recentlyPlayed)}
                  />
                ))}
              </Shelf>
            )}

            {personal.data && personal.data.continueListening.length > 0 && (
              <Shelf title="Continue listening">
                {personal.data.continueListening.slice(0, 6).map((album) => (
                  <MediaCard
                    key={album.id}
                    href={`/album/${album.slug}`}
                    title={album.title}
                    subtitle={album.artist.name}
                    gradient={album.gradient}
                  />
                ))}
              </Shelf>
            )}

            <Shelf title="Trending now" href="/library?tab=songs">
              {data.trendingSongs.slice(0, 6).map((song) => (
                <MediaCard
                  key={song.id}
                  href={`/album/${song.album.slug}`}
                  title={song.title}
                  subtitle={song.artist.name}
                  gradient={song.gradient}
                  onPlay={() => play(song, data.trendingSongs)}
                />
              ))}
            </Shelf>

            {personal.data && personal.data.recommended.length > 0 && (
              <Shelf title="Made for you">
                {personal.data.recommended.slice(0, 6).map((album) => (
                  <MediaCard
                    key={album.id}
                    href={`/album/${album.slug}`}
                    title={album.title}
                    subtitle={`${album.artist.name} · ${album.genre.name}`}
                    gradient={album.gradient}
                  />
                ))}
              </Shelf>
            )}

            <Shelf title="New releases" href="/library?tab=albums">
              {data.newReleases.slice(0, 6).map((album) => (
                <MediaCard
                  key={album.id}
                  href={`/album/${album.slug}`}
                  title={album.title}
                  subtitle={album.artist.name}
                  gradient={album.gradient}
                />
              ))}
            </Shelf>

            {personal.data && personal.data.followedArtists.length > 0 && (
              <Shelf title="Your artists">
                {personal.data.followedArtists.slice(0, 6).map((artist) => (
                  <MediaCard
                    key={artist.id}
                    href={`/artist/${artist.slug}`}
                    title={artist.name}
                    subtitle={`${formatCompactNumber(artist.monthlyListeners)} monthly listeners`}
                    gradient={artist.gradient}
                    round
                  />
                ))}
              </Shelf>
            )}

            <Shelf title="Popular artists" href="/library?tab=artists">
              {data.popularArtists.slice(0, 6).map((artist) => (
                <MediaCard
                  key={artist.id}
                  href={`/artist/${artist.slug}`}
                  title={artist.name}
                  subtitle={`${formatCompactNumber(artist.monthlyListeners)} monthly listeners`}
                  gradient={artist.gradient}
                  round
                />
              ))}
            </Shelf>

            <section aria-label="Browse genres" className="mt-8 px-3 pb-4">
              <h2 className="font-display mb-4 text-xl font-bold tracking-tight">Browse genres</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {data.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/library?tab=songs&genre=${genre.slug}`}
                    className="focus-ring relative h-24 overflow-hidden rounded-2xl p-4 transition-transform hover:scale-[1.02]"
                    style={{ background: genre.gradient }}
                  >
                    <span className="font-display text-lg font-bold text-white drop-shadow">
                      {genre.name}
                    </span>
                    <span className="absolute right-3 bottom-2 text-xs font-medium text-white/80">
                      {genre.songCount} songs
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
