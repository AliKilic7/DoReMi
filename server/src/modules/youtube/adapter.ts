/**
 * Source adapter over the Invidious v1 API with instance failover.
 *
 * Every public helper tries each configured instance (YT_INSTANCES) in order,
 * validates responses with zod and caches results in-memory — search results
 * briefly, resolved stream URLs a little longer (they expire server-side after
 * a few hours, we stay well under that).
 */
import { z } from "zod";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/errors.js";
import { TtlCache } from "./cache.js";

export interface TrackMeta {
  videoId: string;
  title: string;
  artist: string;
  channelId: string | null;
  thumbnailUrl: string;
  durationSec: number;
}

export interface StreamInfo {
  videoId: string;
  url: string;
  mimeType: string;
  bitrate: number;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  tracks: TrackMeta[];
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const isVideoId = (value: string): boolean => VIDEO_ID.test(value);

const thumbnailSchema = z.object({ url: z.string(), width: z.number().optional() });

const searchItemSchema = z.object({
  type: z.string().optional(),
  videoId: z.string(),
  title: z.string(),
  author: z.string().default("Unknown artist"),
  authorId: z.string().nullish(),
  lengthSeconds: z.number().default(0),
  videoThumbnails: z.array(thumbnailSchema).default([]),
});

const videoSchema = searchItemSchema.extend({
  adaptiveFormats: z
    .array(
      z.object({
        url: z.string(),
        type: z.string(),
        bitrate: z.union([z.string(), z.number()]).optional(),
      }),
    )
    .default([]),
});

const channelSchema = z.object({
  author: z.string(),
  authorId: z.string(),
  subCount: z.number().nullish(),
  authorThumbnails: z.array(thumbnailSchema).default([]),
});

const searchCache = new TtlCache<TrackMeta[]>(5 * 60_000);
const trendingCache = new TtlCache<TrackMeta[]>(30 * 60_000);
const streamCache = new TtlCache<StreamInfo>(30 * 60_000);
const channelCache = new TtlCache<ChannelInfo>(30 * 60_000);

function pickThumbnail(thumbs: { url: string; width?: number }[], videoId: string): string {
  const sorted = [...thumbs].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const best = sorted.find((t) => (t.width ?? 0) <= 640) ?? sorted[0];
  // Normalize relative Invidious thumbnail paths to the canonical CDN.
  if (!best || best.url.startsWith("/")) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  return best.url;
}

function toTrackMeta(item: z.infer<typeof searchItemSchema>): TrackMeta {
  return {
    videoId: item.videoId,
    title: item.title,
    artist: item.author,
    channelId: item.authorId ?? null,
    thumbnailUrl: pickThumbnail(item.videoThumbnails, item.videoId),
    durationSec: item.lengthSeconds,
  };
}

/** Tries each configured instance until one answers with valid JSON. */
async function fromAnyInstance<T>(path: string, parse: (json: unknown) => T): Promise<T> {
  const instances = env.YT_INSTANCES;
  let lastError: unknown;

  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "doremi/1.0" },
      });
      // A definitive "does not exist" shouldn't fail over to other instances.
      if (res.status === 404) throw ApiError.notFound("Not found at the source", "source_not_found");
      if (!res.ok) throw new Error(`${instance} responded ${res.status}`);
      return parse(await res.json());
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error;
    }
  }

  console.error(`[yt-adapter] all instances failed for ${path}:`, lastError);
  throw new ApiError(502, "Music source is unreachable right now", "source_unavailable");
}

export async function searchTracks(query: string, page = 1): Promise<TrackMeta[]> {
  const key = `${page}:${query.toLowerCase()}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const results = await fromAnyInstance(
    `/api/v1/search?q=${encodeURIComponent(query)}&page=${page}&type=video`,
    (json) => z.array(searchItemSchema).parse(json),
  );
  const tracks = results.filter((r) => r.type === undefined || r.type === "video").map(toTrackMeta);
  searchCache.set(key, tracks);
  return tracks;
}

export async function trendingTracks(): Promise<TrackMeta[]> {
  const cached = trendingCache.get("music");
  if (cached) return cached;

  const results = await fromAnyInstance("/api/v1/trending?type=Music", (json) =>
    z.array(searchItemSchema).parse(json),
  );
  const tracks = results.map(toTrackMeta);
  trendingCache.set("music", tracks);
  return tracks;
}

/** Resolves the best audio-only stream for a video. */
export async function resolveStream(videoId: string): Promise<StreamInfo> {
  if (!isVideoId(videoId)) throw ApiError.badRequest("Invalid video id", "invalid_video_id");
  const cached = streamCache.get(videoId);
  if (cached) return cached;

  const video = await fromAnyInstance(`/api/v1/videos/${videoId}`, (json) =>
    videoSchema.parse(json),
  );

  const audio = video.adaptiveFormats
    .filter((f) => f.type.startsWith("audio/"))
    .map((f) => ({ ...f, bitrateNum: Number(f.bitrate ?? 0) }))
    .sort((a, b) => b.bitrateNum - a.bitrateNum)[0];

  if (!audio) throw ApiError.notFound("No audio stream available for this track", "no_audio");

  const info: StreamInfo = {
    videoId,
    url: audio.url,
    mimeType: audio.type.split(";")[0]!,
    bitrate: audio.bitrateNum,
  };
  streamCache.set(videoId, info);
  return info;
}

/** Fetches track metadata for a single video (used when caching on demand). */
export async function videoMeta(videoId: string): Promise<TrackMeta> {
  if (!isVideoId(videoId)) throw ApiError.badRequest("Invalid video id", "invalid_video_id");
  const video = await fromAnyInstance(`/api/v1/videos/${videoId}`, (json) =>
    videoSchema.parse(json),
  );
  return toTrackMeta(video);
}

export async function channelInfo(channelId: string): Promise<ChannelInfo> {
  const cached = channelCache.get(channelId);
  if (cached) return cached;

  const [about, videos] = await Promise.all([
    fromAnyInstance(`/api/v1/channels/${encodeURIComponent(channelId)}`, (json) =>
      channelSchema.parse(json),
    ),
    fromAnyInstance(`/api/v1/channels/${encodeURIComponent(channelId)}/videos`, (json) =>
      z.object({ videos: z.array(searchItemSchema).default([]) }).parse(json),
    ),
  ]);

  const info: ChannelInfo = {
    channelId: about.authorId,
    name: about.author,
    thumbnailUrl: about.authorThumbnails.at(-1)?.url ?? null,
    subscriberCount: about.subCount ?? null,
    tracks: videos.videos.map(toTrackMeta),
  };
  channelCache.set(channelId, info);
  return info;
}
