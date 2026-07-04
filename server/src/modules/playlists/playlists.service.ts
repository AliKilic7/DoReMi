import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { serializeTrack, upsertTrack, type TrackMetaInput } from "../tracks/tracks.service.js";
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

function serializePlaylist(playlist: Playlist & { _count?: { tracks: number } }) {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    gradient: playlist.gradient,
    coverUrl: playlist.coverUrl,
    favorite: playlist.favorite,
    pinned: playlist.pinned,
    trackCount: playlist._count?.tracks ?? 0,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

/** Loads a playlist and asserts ownership. */
async function ownedPlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { _count: { select: { tracks: true } } },
  });
  if (!playlist || playlist.ownerId !== userId) throw ApiError.notFound("Playlist not found");
  return playlist;
}

export async function listPlaylists(userId: string) {
  const playlists = await prisma.playlist.findMany({
    where: { ownerId: userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { tracks: true } } },
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
    include: { _count: { select: { tracks: true } } },
  });
  return serializePlaylist(playlist);
}

export async function getPlaylist(userId: string, playlistId: string) {
  const playlist = await ownedPlaylist(userId, playlistId);
  const entries = await prisma.playlistTrack.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
    include: { track: true },
  });
  const tracks = entries.map((entry) => ({ ...serializeTrack(entry.track), addedAt: entry.addedAt }));
  return {
    ...serializePlaylist(playlist),
    tracks,
    totalDurationSec: tracks.reduce((sum, track) => sum + track.durationSec, 0),
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
    include: { _count: { select: { tracks: true } } },
  });
  return serializePlaylist(playlist);
}

export async function deletePlaylist(userId: string, playlistId: string): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  await prisma.playlist.delete({ where: { id: playlistId } });
}

/** Appends a track (caching its metadata); false when already present. */
export async function addTrack(
  userId: string,
  playlistId: string,
  meta: TrackMetaInput,
): Promise<boolean> {
  await ownedPlaylist(userId, playlistId);
  const track = await upsertTrack(meta);

  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId: track.id } },
  });
  if (existing) return false;

  const last = await prisma.playlistTrack.aggregate({
    where: { playlistId },
    _max: { position: true },
  });
  await prisma.$transaction([
    prisma.playlistTrack.create({
      data: { playlistId, trackId: track.id, position: (last._max.position ?? -1) + 1 },
    }),
    prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } }),
  ]);
  return true;
}

export async function removeTrack(userId: string, playlistId: string, videoId: string): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  const track = await prisma.track.findUnique({ where: { videoId }, select: { id: true } });
  if (!track) return;
  await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId: track.id } });
}

/** Rewrites positions to match the given videoId order. */
export async function reorderTracks(
  userId: string,
  playlistId: string,
  videoIds: string[],
): Promise<void> {
  await ownedPlaylist(userId, playlistId);
  const entries = await prisma.playlistTrack.findMany({
    where: { playlistId },
    include: { track: { select: { videoId: true } } },
  });
  const byVideoId = new Map(entries.map((entry) => [entry.track.videoId, entry]));

  if (videoIds.length !== entries.length || videoIds.some((id) => !byVideoId.has(id))) {
    throw ApiError.badRequest("Track list doesn't match the playlist contents", "reorder_mismatch");
  }

  await prisma.$transaction(
    videoIds.map((videoId, position) =>
      prisma.playlistTrack.update({
        where: { id: byVideoId.get(videoId)!.id },
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
    include: { _count: { select: { tracks: true } } },
  });
  return serializePlaylist(playlist);
}
