import { prisma } from "../../lib/prisma.js";
import {
  albumInclude,
  serializeAlbum,
  serializeArtist,
  serializeSong,
  songInclude,
} from "../catalog/catalog.serializers.js";

const GROUP_SIZE = 6;

/** Grouped instant search across songs, albums and artists. */
export async function search(query: string) {
  const contains = { contains: query, mode: "insensitive" as const };

  const [songs, albums, artists] = await Promise.all([
    prisma.song.findMany({
      where: { OR: [{ title: contains }, { artist: { name: contains } }] },
      orderBy: [{ playCount: "desc" }, { id: "asc" }],
      take: GROUP_SIZE,
      include: songInclude,
    }),
    prisma.album.findMany({
      where: { OR: [{ title: contains }, { artist: { name: contains } }] },
      orderBy: [{ releaseDate: "desc" }, { id: "asc" }],
      take: GROUP_SIZE,
      include: albumInclude,
    }),
    prisma.artist.findMany({
      where: { name: contains },
      orderBy: [{ monthlyListeners: "desc" }, { id: "asc" }],
      take: GROUP_SIZE,
    }),
  ]);

  // Top result: an artist whose name starts with the query wins, then the
  // most-played matching song, then the newest matching album.
  const lowered = query.toLowerCase();
  const artistHit = artists.find((a) => a.name.toLowerCase().startsWith(lowered));
  const topResult = artistHit
    ? { type: "artist" as const, artist: serializeArtist(artistHit) }
    : songs[0]
      ? { type: "song" as const, song: serializeSong(songs[0]) }
      : albums[0]
        ? { type: "album" as const, album: serializeAlbum(albums[0]) }
        : null;

  return {
    topResult,
    songs: songs.map(serializeSong),
    albums: albums.map(serializeAlbum),
    artists: artists.map(serializeArtist),
  };
}

// ------------------------------------------------------------ history

export async function listHistory(userId: string) {
  const rows = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return rows.map((row) => ({ id: row.id, query: row.query, createdAt: row.createdAt }));
}

/** Records a committed search; repeating a query bumps it to the top. */
export async function recordHistory(userId: string, query: string) {
  await prisma.searchHistory.upsert({
    where: { userId_query: { userId, query } },
    update: { createdAt: new Date() },
    create: { userId, query },
  });
}

export async function removeHistory(userId: string, id: string) {
  await prisma.searchHistory.deleteMany({ where: { id, userId } });
}

export async function clearHistory(userId: string) {
  await prisma.searchHistory.deleteMany({ where: { userId } });
}
