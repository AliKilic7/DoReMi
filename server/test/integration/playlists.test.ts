import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, registeredAgent } from "./helpers.js";

const app = makeApp();

async function songIds(count: number): Promise<string[]> {
  const res = await request(app).get(`/api/songs?take=${count}`);
  return res.body.items.map((s: { id: string }) => s.id);
}

describe("playlists API", () => {
  it("full lifecycle: create → add → reorder → rename → remove → delete", async () => {
    const { agent } = await registeredAgent(app);
    const [s1, s2, s3] = await songIds(3);

    const created = await agent.post("/api/me/playlists").send({}).expect(201);
    const id = created.body.playlist.id;

    for (const songId of [s1, s2, s3]) {
      await agent.post(`/api/playlists/${id}/songs`).send({ songId }).expect(201);
    }
    // duplicate add is a graceful no-op
    const dup = await agent.post(`/api/playlists/${id}/songs`).send({ songId: s1 });
    expect(dup.body.added).toBe(false);

    await agent.put(`/api/playlists/${id}/songs`).send({ songIds: [s3, s1, s2] }).expect(200);
    const detail = await agent.get(`/api/playlists/${id}`).expect(200);
    expect(detail.body.playlist.songs.map((s: { id: string }) => s.id)).toEqual([s3, s1, s2]);

    // mismatched reorder payload rejected
    await agent.put(`/api/playlists/${id}/songs`).send({ songIds: [s1] }).expect(400);

    const patched = await agent
      .patch(`/api/playlists/${id}`)
      .send({ name: "QA Mix", favorite: true, pinned: true })
      .expect(200);
    expect(patched.body.playlist).toMatchObject({ name: "QA Mix", favorite: true, pinned: true });

    await agent.delete(`/api/playlists/${id}/songs/${s1}`).expect(200);
    const after = await agent.get(`/api/playlists/${id}`);
    expect(after.body.playlist.songs).toHaveLength(2);

    await agent.delete(`/api/playlists/${id}`).expect(200);
    await agent.get(`/api/playlists/${id}`).expect(404);
  });

  it("enforces ownership — another user cannot read or modify my playlist", async () => {
    const owner = await registeredAgent(app);
    const intruder = await registeredAgent(app);

    const created = await owner.agent.post("/api/me/playlists").send({ name: "Private" });
    const id = created.body.playlist.id;

    await intruder.agent.get(`/api/playlists/${id}`).expect(404);
    await intruder.agent.patch(`/api/playlists/${id}`).send({ name: "Hacked" }).expect(404);
    await intruder.agent.delete(`/api/playlists/${id}`).expect(404);
    const [songId] = await songIds(1);
    await intruder.agent.post(`/api/playlists/${id}/songs`).send({ songId }).expect(404);

    // untouched
    const check = await owner.agent.get(`/api/playlists/${id}`);
    expect(check.body.playlist.name).toBe("Private");
    await owner.agent.delete(`/api/playlists/${id}`);
  });

  it("requires authentication", async () => {
    await request(app).get("/api/me/playlists").expect(401);
    await request(app).post("/api/me/playlists").send({}).expect(401);
  });

  it("rejects covers whose bytes don't match the image type", async () => {
    const { agent } = await registeredAgent(app);
    const created = await agent.post("/api/me/playlists").send({});
    const id = created.body.playlist.id;

    const res = await agent
      .post(`/api/playlists/${id}/cover`)
      .attach("cover", Buffer.from("<html>not an image</html>"), {
        filename: "x.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_image");
    await agent.delete(`/api/playlists/${id}`);
  });
});
