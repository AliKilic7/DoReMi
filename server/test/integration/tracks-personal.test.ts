import { describe, expect, it } from "vitest";
import request from "supertest";
import { authedAgent, freshUser, makeApp, SAMPLE_META, videoId } from "./helpers.js";

const app = makeApp();

describe("likes", () => {
  it("like caches the track, lists newest-first, unlikes idempotently", async () => {
    const agent = authedAgent(app, freshUser().token);
    const [v1, v2] = [videoId(1), videoId(2)];

    await agent.put(`/api/tracks/${v1}/like`).send(SAMPLE_META).expect(200);
    await agent.put(`/api/tracks/${v1}/like`).send(SAMPLE_META).expect(200); // idempotent
    await agent.put(`/api/tracks/${v2}/like`).send({ ...SAMPLE_META, title: "Second" }).expect(200);

    const ids = await agent.get("/api/me/likes/ids").expect(200);
    expect(ids.body.ids).toEqual([v2, v1]);

    const list = await agent.get("/api/me/likes").expect(200);
    expect(list.body.total).toBe(2);
    expect(list.body.items[0]).toMatchObject({ videoId: v2, title: "Second" });
    expect(list.body.items[0].likedAt).toBeTruthy();

    await agent.delete(`/api/tracks/${v1}/like`).expect(200);
    const after = await agent.get("/api/me/likes/ids");
    expect(after.body.ids).toEqual([v2]);
  });

  it("validates metadata and requires auth", async () => {
    const agent = authedAgent(app, freshUser().token);
    await agent
      .put(`/api/tracks/${videoId(3)}/like`)
      .send({ ...SAMPLE_META, thumbnailUrl: "not-a-url" })
      .expect(422);
    await request(app).put(`/api/tracks/${videoId(3)}/like`).send(SAMPLE_META).expect(401);
    await agent.put("/api/tracks/short/like").send(SAMPLE_META).expect(422);
  });
});

describe("playlists", () => {
  it("full lifecycle with videoId-based tracks", async () => {
    const agent = authedAgent(app, freshUser().token);
    await agent.get("/api/me");
    const created = await agent.post("/api/me/playlists").send({}).expect(201);
    const id = created.body.playlist.id;
    const vids = [videoId(10), videoId(11), videoId(12)];

    for (const v of vids) {
      await agent
        .post(`/api/playlists/${id}/tracks`)
        .send({ ...SAMPLE_META, videoId: v, title: `Track ${v}` })
        .expect(201);
    }
    const dup = await agent
      .post(`/api/playlists/${id}/tracks`)
      .send({ ...SAMPLE_META, videoId: vids[0] });
    expect(dup.body.added).toBe(false);

    await agent
      .put(`/api/playlists/${id}/tracks`)
      .send({ videoIds: [vids[2], vids[0], vids[1]] })
      .expect(200);
    const detail = await agent.get(`/api/playlists/${id}`).expect(200);
    expect(detail.body.playlist.tracks.map((t: { videoId: string }) => t.videoId)).toEqual([
      vids[2],
      vids[0],
      vids[1],
    ]);
    expect(detail.body.playlist.totalDurationSec).toBe(3 * SAMPLE_META.durationSec);

    await agent.put(`/api/playlists/${id}/tracks`).send({ videoIds: [vids[0]] }).expect(400);

    await agent.delete(`/api/playlists/${id}/tracks/${vids[2]}`).expect(200);
    const after = await agent.get(`/api/playlists/${id}`);
    expect(after.body.playlist.tracks).toHaveLength(2);

    await agent.delete(`/api/playlists/${id}`).expect(200);
    await agent.get(`/api/playlists/${id}`).expect(404);
  });

  it("enforces ownership", async () => {
    const owner = authedAgent(app, freshUser().token);
    const intruder = authedAgent(app, freshUser().token);
    await owner.get("/api/me");
    await intruder.get("/api/me");

    const created = await owner.post("/api/me/playlists").send({ name: "Private" });
    const id = created.body.playlist.id;

    await intruder.get(`/api/playlists/${id}`).expect(404);
    await intruder.patch(`/api/playlists/${id}`).send({ name: "Hacked" }).expect(404);
    await intruder
      .post(`/api/playlists/${id}/tracks`)
      .send({ ...SAMPLE_META, videoId: videoId(20) })
      .expect(404);

    await owner.delete(`/api/playlists/${id}`);
  });
});

describe("history, follows & personal home", () => {
  it("history feeds recently played; follows feed followed artists", async () => {
    const agent = authedAgent(app, freshUser().token);
    const [v1, v2] = [videoId(30), videoId(31)];

    await agent.post("/api/me/history").send({ ...SAMPLE_META, videoId: v1 }).expect(201);
    await agent.post("/api/me/history").send({ ...SAMPLE_META, videoId: v2 }).expect(201);
    await agent.post("/api/me/history").send({ ...SAMPLE_META, videoId: v1 }).expect(201); // replay

    await agent
      .put("/api/channels/UCfollowme0000000000000x/follow")
      .send({ name: "Followed Channel", thumbnailUrl: "https://i.ytimg.com/x.jpg" })
      .expect(200);

    const home = await agent.get("/api/me/home").expect(200);
    // distinct, newest first
    expect(home.body.recentlyPlayed.map((t: { videoId: string }) => t.videoId)).toEqual([v1, v2]);
    expect(home.body.followedArtists[0]).toMatchObject({ name: "Followed Channel" });

    await agent.delete("/api/channels/UCfollowme0000000000000x/follow").expect(200);
    const following = await agent.get("/api/me/following");
    expect(following.body.items).toHaveLength(0);
  });

  it("search history records, dedupes, clears", async () => {
    const agent = authedAgent(app, freshUser().token);
    await agent.post("/api/search/history").send({ query: "neon" }).expect(201);
    await agent.post("/api/search/history").send({ query: "jazz" }).expect(201);
    await agent.post("/api/search/history").send({ query: "neon" }).expect(201);

    const list = await agent.get("/api/search/history");
    expect(list.body.items.map((h: { query: string }) => h.query)).toEqual(["neon", "jazz"]);

    await agent.delete("/api/search/history").expect(200);
    expect((await agent.get("/api/search/history")).body.items).toHaveLength(0);
  });
});
