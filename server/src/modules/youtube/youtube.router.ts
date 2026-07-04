import { Readable } from "node:stream";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import * as adapter from "./adapter.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  page: z.coerce.number().int().min(1).max(10).default(1),
});

export const youtubeRouter = Router();

youtubeRouter.get("/yt/search", async (req: Request, res: Response) => {
  const { q, page } = searchQuerySchema.parse(req.query);
  res.json({ items: await adapter.searchTracks(q, page), page });
});

youtubeRouter.get("/yt/trending", async (_req: Request, res: Response) => {
  res.json({ items: await adapter.trendingTracks() });
});

youtubeRouter.get("/yt/channels/:id", async (req: Request, res: Response) => {
  res.json({ channel: await adapter.channelInfo(String(req.params.id)) });
});

/** Resolves the audio-only stream for a track (URLs are short-lived). */
youtubeRouter.get("/stream/:videoId", async (req: Request, res: Response) => {
  const info = await adapter.resolveStream(String(req.params.videoId));
  res.json({
    stream: {
      videoId: info.videoId,
      mimeType: info.mimeType,
      bitrate: info.bitrate,
      /** Same-origin proxy — safe for the Web Audio visualizer (CORS). */
      proxyUrl: `/api/stream/${info.videoId}/audio`,
      /** Direct upstream URL — lower latency, but cross-origin. */
      directUrl: info.url,
    },
  });
});

/**
 * Streams the audio through our origin. Keeps the <audio> element same-origin
 * (required for the Web Audio analyser) and hides upstream URLs from clients.
 * Range requests are forwarded so seeking works.
 */
youtubeRouter.get("/stream/:videoId/audio", async (req: Request, res: Response) => {
  const info = await adapter.resolveStream(String(req.params.videoId));

  const upstream = await fetch(info.url, {
    headers: {
      "User-Agent": "doremi/1.0",
      ...(req.headers.range ? { Range: req.headers.range } : {}),
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!upstream.ok && upstream.status !== 206) {
    res.status(502).json({ error: { code: "stream_failed", message: "Upstream stream failed" } });
    return;
  }

  res.status(upstream.status);
  for (const header of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(header);
    if (value) res.setHeader(header, value);
  }
  if (!upstream.headers.get("content-type")) res.setHeader("content-type", info.mimeType);

  if (!upstream.body) {
    res.end();
    return;
  }
  const stream = Readable.fromWeb(upstream.body as never);
  stream.pipe(res);
  res.on("close", () => stream.destroy());
});
