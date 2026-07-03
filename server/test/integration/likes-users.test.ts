import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, registeredAgent } from "./helpers.js";

const app = makeApp();

describe("likes API", () => {
  it("like → listed → unlike, idempotently", async () => {
    const { agent } = await registeredAgent(app);
    const songs = await request(app).get("/api/songs?take=2");
    const [s1, s2] = songs.body.items;

    await agent.put(`/api/songs/${s1.id}/like`).expect(200);
    await agent.put(`/api/songs/${s1.id}/like`).expect(200); // idempotent
    await agent.put(`/api/songs/${s2.id}/like`).expect(200);

    const ids = await agent.get("/api/me/likes/ids");
    expect(ids.body.ids).toHaveLength(2);
    expect(ids.body.ids[0]).toBe(s2.id); // newest first

    const list = await agent.get("/api/me/likes");
    expect(list.body.total).toBe(2);
    expect(list.body.items[0].likedAt).toBeTruthy();

    await agent.delete(`/api/songs/${s1.id}/like`).expect(200);
    const after = await agent.get("/api/me/likes/ids");
    expect(after.body.ids).toHaveLength(1);
  });

  it("likes are per-user and guarded", async () => {
    await request(app).get("/api/me/likes").expect(401);
    const a = await registeredAgent(app);
    const b = await registeredAgent(app);
    const songs = await request(app).get("/api/songs?take=1");
    await a.agent.put(`/api/songs/${songs.body.items[0].id}/like`);
    const bIds = await b.agent.get("/api/me/likes/ids");
    expect(bIds.body.ids).toHaveLength(0);
  });
});

describe("users API", () => {
  it("updates profile and rejects taken usernames", async () => {
    const a = await registeredAgent(app);
    const b = await registeredAgent(app);

    const updated = await a.agent
      .patch("/api/me")
      .send({ displayName: "Renamed", bio: "hi" })
      .expect(200);
    expect(updated.body.user.displayName).toBe("Renamed");

    await b.agent.patch("/api/me").send({ username: a.user.username }).expect(409);
    await b.agent.patch("/api/me").send({ username: "BAD NAME!" }).expect(422);
  });

  it("merges settings and rejects unknown values", async () => {
    const { agent } = await registeredAgent(app);
    await agent.patch("/api/me/settings").send({ language: "tr" }).expect(200);
    const second = await agent
      .patch("/api/me/settings")
      .send({ audioQuality: "lossless" })
      .expect(200);
    expect(second.body.settings).toMatchObject({ language: "tr", audioQuality: "lossless" });
    await agent.patch("/api/me/settings").send({ audioQuality: "ultra" }).expect(422);
  });

  it("follow/unfollow drives isFollowing and personal home", async () => {
    const { agent } = await registeredAgent(app);
    const artists = await request(app).get("/api/artists?take=1");
    const artist = artists.body.items[0];

    await agent.put(`/api/artists/${artist.id}/follow`).expect(200);
    const detail = await agent.get(`/api/artists/${artist.slug}`);
    expect(detail.body.artist.isFollowing).toBe(true);

    const home = await agent.get("/api/me/home").expect(200);
    expect(home.body.followedArtists.map((a: { id: string }) => a.id)).toContain(artist.id);

    await agent.delete(`/api/artists/${artist.id}/follow`).expect(200);
  });

  it("search history records, dedupes and clears", async () => {
    const { agent } = await registeredAgent(app);
    await agent.post("/api/search/history").send({ query: "neon" }).expect(201);
    await agent.post("/api/search/history").send({ query: "jazz" }).expect(201);
    await agent.post("/api/search/history").send({ query: "neon" }).expect(201); // bump, not dupe

    const list = await agent.get("/api/search/history");
    expect(list.body.items.map((h: { query: string }) => h.query)).toEqual(["neon", "jazz"]);

    await agent.delete("/api/search/history").expect(200);
    const after = await agent.get("/api/search/history");
    expect(after.body.items).toHaveLength(0);
  });
});
