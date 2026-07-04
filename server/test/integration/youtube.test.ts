import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { makeAppWithMockYt } from "./helpers.js";

let app: Express;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ app, close } = await makeAppWithMockYt());
});
afterAll(() => close());

describe("youtube adapter endpoints (against the mounted mock instance)", () => {
  it("searches tracks with normalized metadata", async () => {
    const res = await request(app).get("/api/yt/search?q=midnight").expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    const track = res.body.items[0];
    expect(track).toMatchObject({
      title: expect.stringMatching(/midnight/i),
      artist: expect.any(String),
      durationSec: expect.any(Number),
    });
    expect(track.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(track.thumbnailUrl).toMatch(/^https?:\/\//);
  });

  it("validates search input", async () => {
    await request(app).get("/api/yt/search").expect(422);
    await request(app).get("/api/yt/search?q=" + "x".repeat(200)).expect(422);
  });

  it("returns trending tracks", async () => {
    const res = await request(app).get("/api/yt/trending").expect(200);
    expect(res.body.items.length).toBeGreaterThan(10);
  });

  it("returns channel info with its tracks", async () => {
    const search = await request(app).get("/api/yt/search?q=neon");
    const channelId = search.body.items[0].channelId;
    const res = await request(app).get(`/api/yt/channels/${channelId}`).expect(200);
    expect(res.body.channel.name).toBeTruthy();
    expect(res.body.channel.tracks.length).toBeGreaterThan(0);
  });

  it("resolves an audio stream with a same-origin proxy URL", async () => {
    const search = await request(app).get("/api/yt/search?q=midnight");
    const videoId = search.body.items[0].videoId;

    const res = await request(app).get(`/api/stream/${videoId}`).expect(200);
    expect(res.body.stream.mimeType).toMatch(/^audio\//);
    expect(res.body.stream.proxyUrl).toBe(`/api/stream/${videoId}/audio`);
    expect(res.body.stream.directUrl).toMatch(/^https?:\/\//);
  });

  it("proxies audio bytes with Range support", async () => {
    const search = await request(app).get("/api/yt/search?q=midnight");
    const videoId = search.body.items[0].videoId;

    const head = await request(app)
      .get(`/api/stream/${videoId}/audio`)
      .set("Range", "bytes=0-99")
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(head.status).toBe(206);
    expect((head.body as Buffer).subarray(0, 4).toString()).toBe("RIFF"); // WAV magic
  });

  it("rejects malformed ids and 404s unknown videos without failover storms", async () => {
    await request(app).get("/api/stream/short").expect(400);
    await request(app).get("/api/stream/AAAAAAAAAAA").expect(404);
  });
});
