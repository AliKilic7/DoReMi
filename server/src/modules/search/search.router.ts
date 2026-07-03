import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import * as service from "./search.service.js";

const querySchema = z.object({ q: z.string().trim().min(1).max(100) });
const recordSchema = z.object({ query: z.string().trim().min(1).max(100) });

export const searchRouter = Router();

searchRouter.get("/", async (req: Request, res: Response) => {
  const { q } = querySchema.parse(req.query);
  res.json(await service.search(q));
});

searchRouter.get("/history", requireAuth, async (req: Request, res: Response) => {
  res.json({ items: await service.listHistory(req.userId!) });
});

searchRouter.post("/history", requireAuth, async (req: Request, res: Response) => {
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
