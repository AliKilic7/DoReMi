import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { serializeSong, songInclude } from "../catalog/catalog.serializers.js";
import type { Playlist } from "../../../generated/prisma/index.js";

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#c026d3,#fb7185)",
  "linear-gradient(135deg,#0ea5e9,#22d3ee,#34d399)",
  "linear-gradient(135deg,#f59e0b,#f97316,#ef4444)",
  "linear-gradient(135deg,#312e81,#6366f1,#a5b4fc)",
  "linear-gradient(135deg,#155e75,#0891b2,#67e8f9)",
  "linear-gradient(135deg,#831843,#db2777,#f9a8d4)",
  "linear-gradient(135deg,#1e1b4b,#7c3aed,#e879f9)",
  "linear-gradient(135deg,#042f2e,#0d9488,#99f6e4)",
];

function serializePlaylist(playlist: Playlist & { _count?: { songs: number } }) {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    gradient: playlist.gradient,
    coverUrl: playlist.coverUrl,
    favorite: playlist.favorite,
    pinned: playlist.pinned,
    songCount: playlist._count?.songs ?? 0,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

/** Loads a playlist and asserts ownership. */
async function ownedPlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { _count: { select: { songs: true } } },
  });
  if (!playlist || playlist.ownerId !== userId) throw ApiError.notFound("Playlist not found");
  return playlist;
}

export async function listPlaylists(userId: string) {
  const playlists = await prisma.playlist.findMany({
    where: { ownerId: userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { songs: true } } },
  });
  return playlists.map(serializePlaylist);
}

export async function createPlaylist(userId: string, input: { name?: string; description?: string }) {
  const count = await prisma.playlist.count({ where: { ownerId: userId } });
  const playlist = await prisma.playlist.create({
    data: {
      name: input.name ?? `My Playlist #${count + 1}`,
      description: input.description,
      gradient: COVER_GRADIENTS[count % COVER_GRADIENTS.length]!,
      ownerId: userId,
    },
    include: { _count: { select: { songs: true } } },
  });
  return serializePlaylist(playlist);
}

export async function getPlaylist(userId: string, playlistId: string) {
  const playlist = await ownedPlaylist(userId, playlistId);
  const entries = await prisma.playlistSong.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
    include: { song: { include: songInclude } },
  });
  const songs = entries.map((entry) => ({ ...serializeSong(entry.song), addedAt: entry.addedAt }));
  return {
    ...serializePlaylist(playlist),
    songs,
    totalDurationSec: songs.reduce((sum, song) => sum + song.durationSec, 0),
  };
}

export async function updatePlaylist(
  userId: string,
  playlistId: string,
  input: { name?: string; description?: string | null; favorite?: boolean; pinned?: boolean },
) {
  await ownedPlaylist(userId, playlistId);
  const playlist = await prisma.playlist.update({
    where: { id: playlistId },
    data: input,
    include: { _count: { select: { songs: true } } },
  });
  return serializePlaylist(playlist);
}

export async function deletePlaylist(userId: string, playlistId: string): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  await prisma.playlist.delete({ where: { id: playlistId } });
}

/** Appends a song; returns false when it was already in the playlist. */
export async function addSong(userId: string, playlistId: string, songId: string): Promise<boolean> {
  await ownedPlaylist(userId, playlistId);
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
  if (!song) throw ApiError.notFound("Song not found");

  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) return false;

  const last = await prisma.playlistSong.aggregate({
    where: { playlistId },
    _max: { position: true },
  });
  await prisma.$transaction([
    prisma.playlistSong.create({
      data: { playlistId, songId, position: (last._max.position ?? -1) + 1 },
    }),
    prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } }),
  ]);
  return true;
}

export async function removeSong(userId: string, playlistId: string, songId: string): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  await prisma.playlistSong.deleteMany({ where: { playlistId, songId } });
}

/** Rewrites positions to match the given song id order. */
export async function reorderSongs(userId: string, playlistId: string, songIds: string[]): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  const entries = await prisma.playlistSong.findMany({ where: { playlistId } });
  const byySongId = new Map(entries.map((entry) => [entry.songId, entry]));

  if (songIds.length !== entries.length || songIds.some((id) => !byySongId.has(id))) {
    throw ApiError.badRequest("Song list doesn't match the playlist contents", "reorder_mismatch");
  }

  await prisma.$transaction(
    songIds.map((songId, position) =>
      prisma.playlistSong.update({
        where: { playlistId_songId: { playlistId, songId } },
        data: { position },
      }),
    ),
  );
}

export async function setCover(userId: string, playlistId: string, coverUrl: string) {
  await ownedPlaylist(userId, playlistId);
  const playlist = await prisma.playlist.update({
    where: { id: playlistId },
    data: { coverUrl },
    include: { _count: { select: { songs: true } } },
  });
  return serializePlaylist(playlist);
}
