import type { Express } from "express";
import request from "supertest";
import { createApp } from "../../src/app.js";

export function makeApp(): Express {
  return createApp();
}

/** Registers a fresh user and returns an agent with its session cookies. */
export async function registeredAgent(app: Express, password = "password123") {
  const email = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.doremi.dev`;
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/register")
    .send({ displayName: "Test User", email, password });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, email, password, user: res.body.user as { id: string; username: string } };
}
