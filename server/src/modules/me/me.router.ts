import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { ensureProfile } from "../profiles/profiles.service.js";
import { serializeTrack, trackMetaSchema, upsertTrack } from "../tracks/tracks.service.js";

const HISTORY_KEEP = 200;

const followSchema = z.object({
  name: z.string().trim().min(1).max(200),
  thumbnailUrl: z.string().url().max(500).nullish(),
});

export const meRouter = Router();

/** Records a play (called by the player once per track start). */
meRouter.post("/me/history", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const meta = trackMetaSchema.parse(req.body);
  const track = await upsertTrack(meta);
  await prisma.playHistory.create({ data: { userId: req.userId!, trackId: track.id } });

  // prune: keep only the newest N rows per user
  const stale = await prisma.playHistory.findMany({
    where: { userId: req.userId! },
    orderBy: { playedAt: "desc" },
    skip: HISTORY_KEEP,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.playHistory.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
  }
  res.status(201).json({ ok: true });
});

/** Personal home: recently played (distinct) + followed artists. */
meRouter.get("/me/home", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const [history, follows] = await Promise.all([
    prisma.playHistory.findMany({
      where: { userId: req.userId! },
      orderBy: { playedAt: "desc" },
      take: 60,
      include: { track: true },
    }),
    prisma.followedArtist.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const seen = new Set<string>();
  const recentlyPlayed = [];
  for (const entry of history) {
    if (seen.has(entry.trackId)) continue;
    seen.add(entry.trackId);
    recentlyPlayed.push(serializeTrack(entry.track));
    if (recentlyPlayed.length >= 12) break;
  }

  res.json({
    recentlyPlayed,
    followedArtists: follows.map((f) => ({
      channelId: f.channelId,
      name: f.name,
      thumbnailUrl: f.thumbnailUrl,
    })),
  });
});

meRouter.put("/channels/:id/follow", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const { name, thumbnailUrl } = followSchema.parse(req.body);
  await prisma.followedArtist.upsert({
    where: { userId_channelId: { userId: req.userId!, channelId: String(req.params.id) } },
    update: { name, thumbnailUrl: thumbnailUrl ?? null },
    create: {
      userId: req.userId!,
      channelId: String(req.params.id),
      name,
      thumbnailUrl: thumbnailUrl ?? null,
    },
  });
  res.json({ following: true });
});

meRouter.delete("/channels/:id/follow", requireAuth, async (req: Request, res: Response) => {
  await prisma.followedArtist.deleteMany({
    where: { userId: req.userId!, channelId: String(req.params.id) },
  });
  res.json({ following: false });
});

meRouter.get("/me/following", requireAuth, async (req: Request, res: Response) => {
  const follows = await prisma.followedArtist.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    items: follows.map((f) => ({
      channelId: f.channelId,
      name: f.name,
      thumbnailUrl: f.thumbnailUrl,
    })),
  });
});
