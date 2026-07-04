import { z } from "zod";
import type { Track } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

/** Metadata clients send when attaching a YouTube track to personal data. */
export const trackMetaSchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "Invalid video id"),
  title: z.string().trim().min(1).max(300),
  artist: z.string().trim().min(1).max(200),
  channelId: z.string().trim().max(100).nullish(),
  thumbnailUrl: z.string().url().max(500),
  durationSec: z.number().int().min(0).max(6 * 60 * 60),
});

export type TrackMetaInput = z.infer<typeof trackMetaSchema>;

/** Lazily caches a YouTube track's metadata, refreshing it on every touch. */
export async function upsertTrack(meta: TrackMetaInput): Promise<Track> {
  const data = {
    title: meta.title,
    artist: meta.artist,
    channelId: meta.channelId ?? null,
    thumbnailUrl: meta.thumbnailUrl,
    durationSec: meta.durationSec,
  };
  return prisma.track.upsert({
    where: { videoId: meta.videoId },
    update: data,
    create: { videoId: meta.videoId, ...data },
  });
}

export function serializeTrack(track: Track) {
  return {
    videoId: track.videoId,
    title: track.title,
    artist: track.artist,
    channelId: track.channelId,
    thumbnailUrl: track.thumbnailUrl,
    durationSec: track.durationSec,
  };
}
