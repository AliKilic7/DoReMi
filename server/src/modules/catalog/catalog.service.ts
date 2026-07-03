import type { Prisma } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { buildPage, cursorArgs } from "../../utils/pagination.js";
import {
  albumInclude,
  serializeAlbum,
  serializeArtist,
  serializeSong,
  songInclude,
} from "./catalog.serializers.js";
import type { ListAlbumsQuery, ListArtistsQuery, ListSongsQuery } from "./catalog.schemas.js";

const insensitive = (value: string) =>
  ({ contains: value, mode: "insensitive" }) satisfies Prisma.StringFilter;

// ---------------------------------------------------------------- genres

export async function listGenres() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { songs: true } } },
  });
  return genres.map((genre) => ({
    id: genre.id,
    name: genre.name,
    slug: genre.slug,
    gradient: genre.gradient,
    songCount: genre._count.songs,
  }));
}

// ---------------------------------------------------------------- artists

const ARTIST_SORTS: Record<ListArtistsQuery["sort"], Prisma.ArtistOrderByWithRelationInput[]> = {
  popular: [{ monthlyListeners: "desc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

export async function listArtists(query: ListArtistsQuery) {
  const rows = await prisma.artist.findMany({
    where: query.q ? { name: insensitive(query.q) } : undefined,
    orderBy: ARTIST_SORTS[query.sort],
    ...cursorArgs(query),
  });
  const { items, nextCursor } = buildPage(rows, query.take);
  return { items: items.map(serializeArtist), nextCursor };
}

export async function getArtistBySlug(slug: string, userId?: string) {
  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: { _count: { select: { followers: true } } },
  });
  if (!artist) throw ApiError.notFound("Artist not found");

  const isFollowing = userId
    ? (await prisma.followArtist.findUnique({
        where: { userId_artistId: { userId, artistId: artist.id } },
      })) !== null
    : false;

  const [albums, topSongs] = await Promise.all([
    prisma.album.findMany({
      where: { artistId: artist.id },
      orderBy: { releaseDate: "desc" },
      include: albumInclude,
    }),
    prisma.song.findMany({
      where: { artistId: artist.id },
      orderBy: [{ playCount: "desc" }, { id: "asc" }],
      take: 10,
      include: songInclude,
    }),
  ]);

  return {
    ...serializeArtist(artist),
    bio: artist.bio,
    followerCount: artist._count.followers,
    isFollowing,
    albums: albums.map(serializeAlbum),
    topSongs: topSongs.map(serializeSong),
  };
}

// ---------------------------------------------------------------- albums

const ALBUM_SORTS: Record<ListAlbumsQuery["sort"], Prisma.AlbumOrderByWithRelationInput[]> = {
  recent: [{ releaseDate: "desc" }, { id: "asc" }],
  title: [{ title: "asc" }, { id: "asc" }],
  popular: [{ artist: { monthlyListeners: "desc" } }, { id: "asc" }],
};

export async function listAlbums(query: ListAlbumsQuery) {
  const rows = await prisma.album.findMany({
    where: {
      ...(query.q ? { title: insensitive(query.q) } : {}),
      ...(query.genre ? { genre: { slug: query.genre } } : {}),
    },
    orderBy: ALBUM_SORTS[query.sort],
    include: albumInclude,
    ...cursorArgs(query),
  });
  const { items, nextCursor } = buildPage(rows, query.take);
  return { items: items.map(serializeAlbum), nextCursor };
}

export async function getAlbumBySlug(slug: string) {
  const album = await prisma.album.findUnique({
    where: { slug },
    include: {
      ...albumInclude,
      songs: { orderBy: { trackNumber: "asc" }, include: songInclude },
    },
  });
  if (!album) throw ApiError.notFound("Album not found");

  return {
    ...serializeAlbum(album),
    songs: album.songs.map(serializeSong),
    totalDurationSec: album.songs.reduce((sum, song) => sum + song.durationSec, 0),
  };
}

// ---------------------------------------------------------------- songs

const SONG_SORTS: Record<ListSongsQuery["sort"], Prisma.SongOrderByWithRelationInput[]> = {
  trending: [{ playCount: "desc" }, { id: "asc" }],
  title: [{ title: "asc" }, { id: "asc" }],
  recent: [{ album: { releaseDate: "desc" } }, { id: "asc" }],
  duration: [{ durationSec: "asc" }, { id: "asc" }],
};

export async function listSongs(query: ListSongsQuery) {
  const rows = await prisma.song.findMany({
    where: {
      ...(query.q
        ? {
            OR: [
              { title: insensitive(query.q) },
              { artist: { name: insensitive(query.q) } },
              { album: { title: insensitive(query.q) } },
            ],
          }
        : {}),
      ...(query.genre ? { genre: { slug: query.genre } } : {}),
    },
    orderBy: SONG_SORTS[query.sort],
    include: songInclude,
    ...cursorArgs(query),
  });
  const { items, nextCursor } = buildPage(rows, query.take);
  return { items: items.map(serializeSong), nextCursor };
}

/** Registers a play: bumps the counter and, when signed in, records history. */
export async function trackPlay(songId: string, userId?: string) {
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
  if (!song) throw ApiError.notFound("Song not found");

  await prisma.$transaction([
    prisma.song.update({ where: { id: songId }, data: { playCount: { increment: 1 } } }),
    ...(userId ? [prisma.playHistory.create({ data: { userId, songId } })] : []),
  ]);
}

// ---------------------------------------------------------------- browse

/** Sections for the home / browse surface. */
export async function browseHome() {
  const [trendingSongs, newReleases, popularArtists, genres] = await Promise.all([
    prisma.song.findMany({
      orderBy: [{ playCount: "desc" }, { id: "asc" }],
      take: 12,
      include: songInclude,
    }),
    prisma.album.findMany({
      orderBy: [{ releaseDate: "desc" }, { id: "asc" }],
      take: 12,
      include: albumInclude,
    }),
    prisma.artist.findMany({
      orderBy: [{ monthlyListeners: "desc" }, { id: "asc" }],
      take: 12,
    }),
    listGenres(),
  ]);

  return {
    trendingSongs: trendingSongs.map(serializeSong),
    newReleases: newReleases.map(serializeAlbum),
    popularArtists: popularArtists.map(serializeArtist),
    genres,
  };
}
