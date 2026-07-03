import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { setAuthCookies } from "../../utils/cookies.js";
import { ApiError } from "../../utils/errors.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { toPublicUser } from "../auth/auth.service.js";
import { changePasswordSchema, settingsSchema, updateProfileSchema } from "./users.schemas.js";
import * as service from "./users.service.js";

export const AVATARS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
  "storage",
  "avatars",
);
mkdirSync(AVATARS_DIR, { recursive: true });

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in IMAGE_TYPES),
});

export const usersRouter = Router();

usersRouter.patch("/me", requireAuth, async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);
  res.json({ user: await service.updateProfile(req.userId!, input) });
});

usersRouter.put("/me/password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await service.changePassword(req.userId!, currentPassword, newPassword);
  // Other sessions are revoked (tokenVersion bumped) — keep this one alive.
  setAuthCookies(
    res,
    {
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id, user.tokenVersion, true),
    },
    true,
  );
  res.json({ user: toPublicUser(user) });
});

usersRouter.get("/me/settings", requireAuth, async (req: Request, res: Response) => {
  res.json({ settings: await service.getSettings(req.userId!) });
});

usersRouter.patch("/me/settings", requireAuth, async (req: Request, res: Response) => {
  const patch = settingsSchema.parse(req.body);
  res.json({ settings: await service.updateSettings(req.userId!, patch) });
});

usersRouter.post(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("Upload a JPEG, PNG or WebP up to 2MB", "invalid_avatar");
    const ext = IMAGE_TYPES[req.file.mimetype]!;
    const fileName = `${req.userId}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(AVATARS_DIR, fileName), req.file.buffer);
    res.json({ user: await service.setAvatar(req.userId!, `/api/avatars/${fileName}`) });
  },
);

usersRouter.put("/artists/:id/follow", requireAuth, async (req: Request, res: Response) => {
  await service.followArtist(req.userId!, String(req.params.id));
  res.json({ following: true });
});

usersRouter.delete("/artists/:id/follow", requireAuth, async (req: Request, res: Response) => {
  await service.unfollowArtist(req.userId!, String(req.params.id));
  res.json({ following: false });
});

usersRouter.get("/me/home", requireAuth, async (req: Request, res: Response) => {
  res.json(await service.personalHome(req.userId!));
});
