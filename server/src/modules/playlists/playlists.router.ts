import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/errors.js";
import {
  addSongSchema,
  createPlaylistSchema,
  reorderSchema,
  updatePlaylistSchema,
} from "./playlists.schemas.js";
import * as service from "./playlists.service.js";

export const COVERS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
  "storage",
  "covers",
);
mkdirSync(COVERS_DIR, { recursive: true });

const COVER_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in COVER_TYPES),
});

export const playlistsRouter = Router();

playlistsRouter.get("/me/playlists", requireAuth, async (req: Request, res: Response) => {
  res.json({ items: await service.listPlaylists(req.userId!) });
});

playlistsRouter.post("/me/playlists", requireAuth, async (req: Request, res: Response) => {
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

playlistsRouter.post("/playlists/:id/songs", requireAuth, async (req: Request, res: Response) => {
  const { songId } = addSongSchema.parse(req.body);
  const added = await service.addSong(req.userId!, String(req.params.id), songId);
  res.status(added ? 201 : 200).json({ added });
});

playlistsRouter.delete(
  "/playlists/:id/songs/:songId",
  requireAuth,
  async (req: Request, res: Response) => {
    await service.removeSong(req.userId!, String(req.params.id), String(req.params.songId));
    res.json({ ok: true });
  },
);

playlistsRouter.put("/playlists/:id/songs", requireAuth, async (req: Request, res: Response) => {
  const { songIds } = reorderSchema.parse(req.body);
  await service.reorderSongs(req.userId!, String(req.params.id), songIds);
  res.json({ ok: true });
});

playlistsRouter.post(
  "/playlists/:id/cover",
  requireAuth,
  upload.single("cover"),
  async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("Upload a JPEG, PNG or WebP up to 2MB", "invalid_cover");
    const ext = COVER_TYPES[req.file.mimetype]!;
    const fileName = `${String(req.params.id)}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(COVERS_DIR, fileName), req.file.buffer);
    const playlist = await service.setCover(req.userId!, String(req.params.id), `/api/covers/${fileName}`);
    res.json({ playlist });
  },
);
