import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers.js";

const app = makeApp();

describe("catalog API (public)", () => {
  it("lists genres with song counts", async () => {
    const res = await request(app).get("/api/genres").expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty("songCount");
  });

  it("paginates artists with a working cursor", async () => {
    const page1 = await request(app).get("/api/artists?take=5").expect(200);
    expect(page1.body.items).toHaveLength(5);
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await request(app)
      .get(`/api/artists?take=5&cursor=${page1.body.nextCursor}`)
      .expect(200);
    const ids1 = new Set(page1.body.items.map((a: { id: string }) => a.id));
    for (const artist of page2.body.items) expect(ids1.has(artist.id)).toBe(false);
  });

  it("filters songs by genre", async () => {
    const genres = await request(app).get("/api/genres");
    const slug = genres.body.items[0].slug;
    const res = await request(app).get(`/api/songs?genre=${slug}&take=10`).expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("returns album detail with ordered tracklist", async () => {
    const albums = await request(app).get("/api/albums?take=1");
    const slug = albums.body.items[0].slug;
    const res = await request(app).get(`/api/albums/${slug}`).expect(200);
    const tracks = res.body.album.songs.map((s: { trackNumber: number }) => s.trackNumber);
    expect(tracks).toEqual([...tracks].sort((a, b) => a - b));
    expect(res.body.album.totalDurationSec).toBeGreaterThan(0);
  });

  it("404s for a missing album and rejects bad query params", async () => {
    await request(app).get("/api/albums/definitely-not-real").expect(404);
    await request(app).get("/api/songs?take=5000").expect(422);
    await request(app).get("/api/songs?sort=nonsense").expect(422);
  });

  it("grouped search finds an artist as top result", async () => {
    const res = await request(app).get("/api/search?q=neon").expect(200);
    expect(res.body.topResult.type).toBe("artist");
    expect(res.body.songs.length).toBeGreaterThan(0);
  });

  it("tracks plays", async () => {
    const songs = await request(app).get("/api/songs?take=1&sort=title");
    const song = songs.body.items[0];
    await request(app).post(`/api/songs/${song.id}/play`).expect(200);
    await request(app).post("/api/songs/not-a-song/play").expect(404);
  });
});
