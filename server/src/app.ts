import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import {
  apiLimiter,
  authLimiter,
  compress,
  securityHeaders,
  verifyOrigin,
} from "./middleware/security.js";
import { mockInvidiousRouter } from "./dev/mock-invidious.js";
import { devAuthRouter } from "./modules/devauth/devauth.router.js";
import { likesRouter } from "./modules/likes/likes.router.js";
import { meRouter } from "./modules/me/me.router.js";
import { COVERS_DIR, playlistsRouter } from "./modules/playlists/playlists.router.js";
import { AVATARS_DIR, profilesRouter } from "./modules/profiles/profiles.router.js";
import { searchRouter } from "./modules/search/search.router.js";
import { youtubeRouter } from "./modules/youtube/youtube.router.js";

const AUDIO_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "storage",
  "audio",
);

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  // Behind a reverse proxy (nginx, a PaaS) the client IP arrives in
  // X-Forwarded-For; rate limiting keys on it.
  app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use(compress);
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(verifyOrigin);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Dev-only surfaces — env.ts refuses to boot production with these on.
  if (env.MOCK_YT) {
    // Local Invidious-compatible instance (fixtures + generated audio).
    app.use("/mock/invidious", mockInvidiousRouter);
    app.use("/api/audio", express.static(AUDIO_DIR, { immutable: true, maxAge: "30d", fallthrough: false }));
  }
  if (env.DEV_AUTH) {
    app.use("/api", authLimiter, devAuthRouter);
  }

  // Uploaded playlist covers & avatars (excluded from the API rate limit).
  app.use("/api/covers", express.static(COVERS_DIR, { maxAge: "7d", fallthrough: false }));
  app.use("/api/avatars", express.static(AVATARS_DIR, { maxAge: "7d", fallthrough: false }));

  app.use("/api", apiLimiter);
  app.use("/api", youtubeRouter);
  app.use("/api", profilesRouter);
  app.use("/api", meRouter);
  app.use("/api", likesRouter);
  app.use("/api", playlistsRouter);
  app.use("/api/search", searchRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
