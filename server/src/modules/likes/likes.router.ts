import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { paginationSchema } from "../../utils/pagination.js";
import * as service from "./likes.service.js";

export const likesRouter = Router();

likesRouter.put("/songs/:id/like", requireAuth, async (req: Request, res: Response) => {
  await service.likeSong(req.userId!, String(req.params.id));
  res.json({ liked: true });
});

likesRouter.delete("/songs/:id/like", requireAuth, async (req: Request, res: Response) => {
  await service.unlikeSong(req.userId!, String(req.params.id));
  res.json({ liked: false });
});

likesRouter.get("/me/likes/ids", requireAuth, async (req: Request, res: Response) => {
  res.json({ ids: await service.likedSongIds(req.userId!) });
});

likesRouter.get("/me/likes", requireAuth, async (req: Request, res: Response) => {
  res.json(await service.listLikedSongs(req.userId!, paginationSchema.parse(req.query)));
});
