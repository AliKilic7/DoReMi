import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { authedAgent, freshUser, makeApp } from "./helpers.js";

const app = makeApp();

describe("auth (Supabase-compatible tokens)", () => {
  it("rejects missing, malformed and wrongly-signed tokens", async () => {
    await request(app).get("/api/me").expect(401);
    await request(app).get("/api/me").set("Authorization", "Bearer nope").expect(401);

    const forged = jwt.sign({ sub: freshUser().userId }, "wrong-secret-entirely");
    await request(app).get("/api/me").set("Authorization", `Bearer ${forged}`).expect(401);
  });

  it("dev login mints a working, deterministic identity", async () => {
    const email = `dev-${Date.now()}@test.doremi.dev`;
    const first = await request(app).post("/api/dev/login").send({ email }).expect(200);
    const second = await request(app).post("/api/dev/login").send({ email }).expect(200);
    expect(first.body.user.id).toBe(second.body.user.id);

    const me = await authedAgent(app, first.body.token).get("/api/me").expect(200);
    expect(me.body.user.id).toBe(first.body.user.id);
  });
});

describe("profiles", () => {
  it("creates the profile on first contact with a username from the email", async () => {
    const user = freshUser("alice");
    const me = await authedAgent(app, user.token).get("/api/me").expect(200);
    expect(me.body.user.id).toBe(user.userId);
    expect(me.body.user.username).toMatch(/^alice/);
    expect(me.body.user.settings.audioQuality).toBe("high");
  });

  it("updates profile fields and rejects taken usernames", async () => {
    const a = freshUser();
    const b = freshUser();
    const agentA = authedAgent(app, a.token);
    const agentB = authedAgent(app, b.token);

    const aMe = await agentA.get("/api/me");
    await agentB.get("/api/me");

    const updated = await agentA
      .patch("/api/me")
      .send({ displayName: "Renamed", bio: "hi" })
      .expect(200);
    expect(updated.body.user.displayName).toBe("Renamed");

    await agentB.patch("/api/me").send({ username: aMe.body.user.username }).expect(409);
    await agentB.patch("/api/me").send({ username: "BAD NAME!" }).expect(422);
  });

  it("merges settings across patches", async () => {
    const agent = authedAgent(app, freshUser().token);
    await agent.patch("/api/me/settings").send({ language: "tr" }).expect(200);
    const second = await agent.patch("/api/me/settings").send({ audioQuality: "lossless" }).expect(200);
    expect(second.body.settings).toMatchObject({ language: "tr", audioQuality: "lossless" });
    await agent.patch("/api/me/settings").send({ audioQuality: "ultra" }).expect(422);
  });

  it("rejects avatars whose bytes don't match the declared type", async () => {
    const agent = authedAgent(app, freshUser().token);
    await agent.get("/api/me");
    const res = await agent
      .post("/api/me/avatar")
      .attach("avatar", Buffer.from("<html>nope</html>"), {
        filename: "x.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_image");
  });
});
