import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/errors.js";
import { assertImageSignature, IMAGE_EXTENSIONS, imageUpload } from "../../utils/uploads.js";
import { ensureProfile } from "../profiles/profiles.service.js";
import { trackMetaSchema } from "../tracks/tracks.service.js";
import { createPlaylistSchema, updatePlaylistSchema } from "./playlists.schemas.js";
import * as service from "./playlists.service.js";

export const COVERS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
  "storage",
  "covers",
);
mkdirSync(COVERS_DIR, { recursive: true });

const reorderSchema = z.object({
  videoIds: z.array(z.string().regex(/^[A-Za-z0-9_-]{11}$/)).max(1000),
});

export const playlistsRouter = Router();

playlistsRouter.get("/me/playlists", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  res.json({ items: await service.listPlaylists(req.userId!) });
});

playlistsRouter.post("/me/playlists", requireAuth, async (req: Request, res: Response) => {
  await ensureProfile(req.userId!, req.userEmail);
  const input = createPlaylistSchema.parse(req.body ?? {});
  res.status(201).json({ playlist: await service.createPlaylist(req.userId!, input) });
});

playlistsRouter.get("/playlists/:id", requireAuth, async (req: Request, res: Response) => {
  res.json({ playlist: await service.getPlaylist(req.userId!, String(req.params.id)) });
});

playlistsRouter.patch("/playlists/:id", requireAuth, async (req: Request, res: Response) => {
  const input = updatePlaylistSchema.parse(req.body);
  res.json({ playlist: await service.updatePlaylist(req.userId!, String(req.params.id), input) });
});

playlistsRouter.delete("/playlists/:id", requireAuth, async (req: Request, res: Response) => {
  await service.deletePlaylist(req.userId!, String(req.params.id));
  res.json({ ok: true });
});

playlistsRouter.post("/playlists/:id/tracks", requireAuth, async (req: Request, res: Response) => {
  const meta = trackMetaSchema.parse(req.body);
  const added = await service.addTrack(req.userId!, String(req.params.id), meta);
  res.status(added ? 201 : 200).json({ added });
});

playlistsRouter.delete(
  "/playlists/:id/tracks/:videoId",
  requireAuth,
  async (req: Request, res: Response) => {
    await service.removeTrack(req.userId!, String(req.params.id), String(req.params.videoId));
    res.json({ ok: true });
  },
);

playlistsRouter.put("/playlists/:id/tracks", requireAuth, async (req: Request, res: Response) => {
  const { videoIds } = reorderSchema.parse(req.body);
  await service.reorderTracks(req.userId!, String(req.params.id), videoIds);
  res.json({ ok: true });
});

playlistsRouter.post(
  "/playlists/:id/cover",
  requireAuth,
  imageUpload.single("cover"),
  async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("Upload a JPEG, PNG or WebP up to 2MB", "invalid_cover");
    assertImageSignature(req.file.buffer, req.file.mimetype);
    const ext = IMAGE_EXTENSIONS[req.file.mimetype]!;
    const fileName = `${String(req.params.id)}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(COVERS_DIR, fileName), req.file.buffer);
    const playlist = await service.setCover(req.userId!, String(req.params.id), `/api/covers/${fileName}`);
    res.json({ playlist });
  },
);
