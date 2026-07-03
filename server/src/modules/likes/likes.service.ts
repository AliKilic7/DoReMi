import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import type { Pagination } from "../../utils/pagination.js";
import { serializeSong, songInclude } from "../catalog/catalog.serializers.js";

export async function likeSong(userId: string, songId: string): Promise<void> {
  const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
  if (!song) throw ApiError.notFound("Song not found");

  await prisma.like.upsert({
    where: { userId_songId: { userId, songId } },
    update: {},
    create: { userId, songId },
  });
}

export async function unlikeSong(userId: string, songId: string): Promise<void> {
  await prisma.like.deleteMany({ where: { userId, songId } });
}

/** All liked song ids — powers instant heart state across the app. */
export async function likedSongIds(userId: string): Promise<string[]> {
  const likes = await prisma.like.findMany({
    where: { userId },
    select: { songId: true },
    orderBy: { createdAt: "desc" },
  });
  return likes.map((like) => like.songId);
}

/** Paginated liked songs, newest first. */
export async function listLikedSongs(userId: string, { cursor, take }: Pagination) {
  const rows = await prisma.like.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { songId: "asc" }],
    include: { song: { include: songInclude } },
    take: take + 1,
    ...(cursor
      ? { cursor: { userId_songId: { userId, songId: cursor } }, skip: 1 }
      : {}),
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return {
    items: items.map((like) => ({ ...serializeSong(like.song), likedAt: like.createdAt })),
    nextCursor: hasMore ? items[items.length - 1]!.songId : null,
    total: await prisma.like.count({ where: { userId } }),
  };
}
