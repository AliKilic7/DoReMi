import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/errors.js";
import { assertImageSignature, IMAGE_EXTENSIONS, imageUpload } from "../../utils/uploads.js";
import { settingsSchema, updateProfileSchema } from "./profiles.schemas.js";
import * as service from "./profiles.service.js";

export const AVATARS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
  "storage",
  "avatars",
);
mkdirSync(AVATARS_DIR, { recursive: true });

export const profilesRouter = Router();

/** Returns the profile, creating it on the first authenticated call. */
profilesRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  const profile = await service.ensureProfile(req.userId!, req.userEmail);
  res.json({ user: service.serializeProfile(profile) });
});

profilesRouter.patch("/me", requireAuth, async (req: Request, res: Response) => {
  await service.ensureProfile(req.userId!, req.userEmail);
  const input = updateProfileSchema.parse(req.body);
  res.json({ user: await service.updateProfile(req.userId!, input) });
});

profilesRouter.get("/me/settings", requireAuth, async (req: Request, res: Response) => {
  await service.ensureProfile(req.userId!, req.userEmail);
  res.json({ settings: await service.getSettings(req.userId!) });
});

profilesRouter.patch("/me/settings", requireAuth, async (req: Request, res: Response) => {
  await service.ensureProfile(req.userId!, req.userEmail);
  const patch = settingsSchema.parse(req.body);
  res.json({ settings: await service.updateSettings(req.userId!, patch) });
});

profilesRouter.post(
  "/me/avatar",
  requireAuth,
  imageUpload.single("avatar"),
  async (req: Request, res: Response) => {
    await service.ensureProfile(req.userId!, req.userEmail);
    if (!req.file) throw ApiError.badRequest("Upload a JPEG, PNG or WebP up to 2MB", "invalid_avatar");
    assertImageSignature(req.file.buffer, req.file.mimetype);
    const ext = IMAGE_EXTENSIONS[req.file.mimetype]!;
    const fileName = `${req.userId}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(AVATARS_DIR, fileName), req.file.buffer);
    res.json({ user: await service.setAvatar(req.userId!, `/api/avatars/${fileName}`) });
  },
);
