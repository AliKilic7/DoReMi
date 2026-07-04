import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { ensureProfile } from "../profiles/profiles.service.js";
import * as service from "./search.service.js";

const recordSchema = z.object({ query: z.string().trim().min(1).max(100) });

export const searchRouter = Router();

searchRouter.get("/history", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  res.json({ items: await service.listHistory(req.userId!) });
});

searchRouter.post("/history", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const { query } = recordSchema.parse(req.body);
  await service.recordHistory(req.userId!, query);
  res.status(201).json({ ok: true });
});

searchRouter.delete("/history/:id", requireAuth, async (req: Request, res: Response) => {
  await service.removeHistory(req.userId!, String(req.params.id));
  res.json({ ok: true });
});

searchRouter.delete("/history", requireAuth, async (req: Request, res: Response) => {
  await service.clearHistory(req.userId!);
  res.json({ ok: true });
});
