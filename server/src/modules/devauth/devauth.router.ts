/**
 * Development-only login bridge. In production the frontend authenticates
 * against Supabase Auth directly (supabase-js) and this router is never
 * mounted (enforced twice: mount guard + env.ts refuses DEV_AUTH in prod).
 * It mints tokens with the same shared secret Supabase would use, so the
 * rest of the stack behaves identically in both modes.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { ensureProfile, serializeProfile } from "../profiles/profiles.service.js";
import { deterministicUuid, signDevToken } from "../../utils/supabase-jwt.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const devAuthRouter = Router();

devAuthRouter.post("/dev/login", async (req: Request, res: Response) => {
  const { email } = loginSchema.parse(req.body);
  const userId = deterministicUuid(email);
  const profile = await ensureProfile(userId, email);
  res.json({ token: signDevToken(userId, email), user: serializeProfile(profile) });
});
