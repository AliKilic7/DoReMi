import type { Prisma } from "../../../generated/prisma/index.js";

/** Prisma include used everywhere a song is returned with its context. */
export const songInclude = {
  artist: { select: { id: true, name: true, slug: true } },
  album: { select: { id: true, title: true, slug: true, gradient: true } },
} satisfies Prisma.SongInclude;

export type SongWithContext = Prisma.SongGetPayload<{ include: typeof songInclude }>;

export function serializeSong(song: SongWithContext) {
  return {
    id: song.id,
    title: song.title,
    trackNumber: song.trackNumber,
    durationSec: song.durationSec,
    audioUrl: song.audioUrl,
    playCount: song.playCount,
    gradient: song.album.gradient,
    artist: song.artist,
    album: { id: song.album.id, title: song.album.title, slug: song.album.slug },
  };
}

export const albumInclude = {
  artist: { select: { id: true, name: true, slug: true } },
  genre: { select: { id: true, name: true, slug: true } },
  _count: { select: { songs: true } },
} satisfies Prisma.AlbumInclude;

export type AlbumWithContext = Prisma.AlbumGetPayload<{ include: typeof albumInclude }>;

export function serializeAlbum(album: AlbumWithContext) {
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    gradient: album.gradient,
    releaseDate: album.releaseDate,
    songCount: album._count.songs,
    artist: album.artist,
    genre: album.genre,
  };
}

export function serializeArtist(artist: {
  id: string;
  name: string;
  slug: string;
  gradient: string;
  monthlyListeners: number;
}) {
  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    gradient: artist.gradient,
    monthlyListeners: artist.monthlyListeners,
  };
}
