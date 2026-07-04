import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../utils/pagination.js";
import { serializeTrack, upsertTrack, type TrackMetaInput } from "../tracks/tracks.service.js";

export async function likeTrack(userId: string, meta: TrackMetaInput): Promise<void> {
  const track = await upsertTrack(meta);
  await prisma.like.upsert({
    where: { userId_trackId: { userId, trackId: track.id } },
    update: {},
    create: { userId, trackId: track.id },
  });
}

export async function unlikeTrack(userId: string, videoId: string): Promise<void> {
  const track = await prisma.track.findUnique({ where: { videoId }, select: { id: true } });
  if (!track) return;
  await prisma.like.deleteMany({ where: { userId, trackId: track.id } });
}

/** All liked video ids — powers instant heart state across the app. */
export async function likedVideoIds(userId: string): Promise<string[]> {
  const likes = await prisma.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { track: { select: { videoId: true } } },
  });
  return likes.map((like) => like.track.videoId);
}

/** Paginated liked tracks, newest first (cursor = trackId). */
export async function listLikedTracks(userId: string, { cursor, take }: Pagination) {
  const rows = await prisma.like.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { trackId: "asc" }],
    include: { track: true },
    take: take + 1,
    ...(cursor ? { cursor: { userId_trackId: { userId, trackId: cursor } }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return {
    items: items.map((like) => ({ ...serializeTrack(like.track), likedAt: like.createdAt })),
    nextCursor: hasMore ? items[items.length - 1]!.trackId : null,
    total: await prisma.like.count({ where: { userId } }),
  };
}
