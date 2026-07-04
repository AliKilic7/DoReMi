import type { Server } from "node:http";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { deterministicUuid, signDevToken } from "../../src/utils/supabase-jwt.js";

export function makeApp(): Express {
  return createApp();
}

/**
 * Starts the app on an ephemeral port and points the YouTube adapter at its
 * own mounted mock instance, so adapter tests run fully offline.
 */
export async function makeAppWithMockYt(): Promise<{ app: Express; server: Server; close: () => Promise<void> }> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  env.YT_INSTANCES.length = 0;
  env.YT_INSTANCES.push(`http://127.0.0.1:${port}/mock/invidious`);
  return {
    app,
    server,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

/** A fresh authenticated user: Supabase-style token signed with the shared secret. */
export function freshUser(label = "t") {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.doremi.dev`;
  const userId = deterministicUuid(email);
  return { email, userId, token: signDevToken(userId, email) };
}

/** Supertest agent that sends the Bearer token on every request. */
export function authedAgent(app: Express, token: string) {
  const agent = request.agent(app);
  agent.set("Authorization", `Bearer ${token}`);
  return agent;
}

export const SAMPLE_META = {
  title: "Test Track",
  artist: "Test Artist",
  channelId: "UCtestchannel000000000001",
  thumbnailUrl: "https://i.ytimg.com/vi/aaaaaaaaaaa/mqdefault.jpg",
  durationSec: 180,
};

/** Deterministic 11-char video ids for tests. */
export function videoId(n: number): string {
  return `tstvid${String(n).padStart(5, "0")}`.slice(0, 11);
}
