/**
 * Minimal local Invidious-compatible instance for offline development, tests
 * and CI (mounted at /mock/invidious when MOCK_YT=1, never in production).
 * Speaks just enough of the Invidious v1 API for the adapter: search,
 * trending, videos/:id (with audio adaptiveFormats) and channels.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { audioFileFor, MOCK_CHANNELS, MOCK_TRACKS, type FixtureTrack } from "./fixtures.js";

function selfBase(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

function thumbnails(videoId: string) {
  // Deterministic placeholder art served by any host — the UI falls back to
  // gradients when images fail, so this is purely cosmetic in dev.
  return [
    { quality: "medium", url: `https://picsum.photos/seed/${videoId}/320/180`, width: 320, height: 180 },
  ];
}

function toSearchItem(track: FixtureTrack) {
  return {
    type: "video",
    videoId: track.videoId,
    title: track.title,
    author: track.artist,
    authorId: track.channelId,
    lengthSeconds: track.durationSec,
    videoThumbnails: thumbnails(track.videoId),
  };
}

export const mockInvidiousRouter = Router();

mockInvidiousRouter.get("/api/v1/search", (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const page = Math.max(1, Number(req.query.page ?? 1));
  const matches = MOCK_TRACKS.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
  );
  res.json(matches.slice((page - 1) * 20, page * 20).map(toSearchItem));
});

mockInvidiousRouter.get("/api/v1/trending", (_req: Request, res: Response) => {
  res.json(MOCK_TRACKS.slice(0, 20).map(toSearchItem));
});

mockInvidiousRouter.get("/api/v1/videos/:id", (req: Request, res: Response) => {
  const track = MOCK_TRACKS.find((t) => t.videoId === req.params.id);
  if (!track) {
    res.status(404).json({ error: "Video unavailable" });
    return;
  }
  res.json({
    videoId: track.videoId,
    title: track.title,
    author: track.artist,
    authorId: track.channelId,
    lengthSeconds: track.durationSec,
    videoThumbnails: thumbnails(track.videoId),
    adaptiveFormats: [
      {
        url: `${selfBase(req)}/api/audio/${audioFileFor(track.videoId)}`,
        type: 'audio/wav',
        bitrate: "352800",
        audioQuality: "AUDIO_QUALITY_MEDIUM",
      },
    ],
  });
});

mockInvidiousRouter.get("/api/v1/channels/:id", (req: Request, res: Response) => {
  const channel = MOCK_CHANNELS.find((c) => c.channelId === req.params.id);
  if (!channel) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }
  res.json({
    author: channel.name,
    authorId: channel.channelId,
    subCount: 128_000,
    authorThumbnails: [{ url: `https://picsum.photos/seed/${channel.channelId}/176/176`, width: 176, height: 176 }],
  });
});

mockInvidiousRouter.get("/api/v1/channels/:id/videos", (req: Request, res: Response) => {
  const videos = MOCK_TRACKS.filter((t) => t.channelId === req.params.id).map(toSearchItem);
  res.json({ videos });
});
