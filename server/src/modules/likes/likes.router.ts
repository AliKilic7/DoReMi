import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { paginationSchema } from "../../utils/pagination.js";
import { ensureProfile } from "../profiles/profiles.service.js";
import * as service from "./likes.service.js";
import { trackMetaSchema } from "../tracks/tracks.service.js";

export const likesRouter = Router();

/** Like a track — body carries the metadata so we can cache the Track row. */
likesRouter.put("/tracks/:videoId/like", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const meta = trackMetaSchema.parse({ ...req.body, videoId: String(req.params.videoId) });
  await service.likeTrack(req.userId!, meta);
  res.json({ liked: true });
});

likesRouter.delete("/tracks/:videoId/like", requireAuth, async (req: Request, res: Response) => {
  await service.unlikeTrack(req.userId!, String(req.params.videoId));
  res.json({ liked: false });
});

likesRouter.get("/me/likes/ids", requireAuth, async (req: Request, res: Response) => {
  res.json({ ids: await service.likedVideoIds(req.userId!) });
});

likesRouter.get("/me/likes", requireAuth, async (req: Request, res: Response) => {
  res.json(await service.listLikedTracks(req.userId!, paginationSchema.parse(req.query)));
});
