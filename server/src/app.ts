import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { catalogRouter } from "./modules/catalog/catalog.router.js";
import { searchRouter } from "./modules/search/search.router.js";

const AUDIO_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "storage",
  "audio",
);

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api/search", searchRouter);

  // Seeded audio. express.static handles Range requests, so seeking works.
  app.use(
    "/api/audio",
    express.static(AUDIO_DIR, {
      immutable: true,
      maxAge: "30d",
      fallthrough: false,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
