/**
 * v2 seed — development conveniences only:
 *   1. Generates the WAV audio behind the mock Invidious instance (skipped for
 *      files that already exist; deterministic per videoId).
 *   2. Creates a demo profile (dev login: demo@doremi.dev) with a playlist,
 *      likes and play history built from the mock catalog.
 * Production data lives in Supabase and never comes from this script.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/prisma/index.js";
import { audioFileFor, MOCK_TRACKS, seedFrom } from "../src/dev/fixtures.js";
import { deterministicUuid } from "../src/utils/supabase-jwt.js";
import { renderSong } from "../src/dev/synth.js";

const prisma = new PrismaClient();

const AUDIO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "storage", "audio");

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_SEED !== "1") {
    console.error("✋ Refusing to seed in production. Set FORCE_SEED=1 if you really mean it.");
    process.exit(1);
  }

  console.log("Seeding DoReMi v2 (dev fixtures)…");

  // 1. audio for the mock instance
  mkdirSync(AUDIO_DIR, { recursive: true });
  let bytes = 0;
  for (const track of MOCK_TRACKS) {
    const file = path.join(AUDIO_DIR, audioFileFor(track.videoId));
    if (existsSync(file)) continue;
    const rendered = renderSong(seedFrom(track.videoId));
    writeFileSync(file, rendered.wav);
    bytes += rendered.wav.length;
  }
  console.log(`  ♪ mock audio ready (${(bytes / 1024 / 1024).toFixed(0)} MB newly generated)`);

  // 2. cached Track rows for the mock catalog
  const trackIds = new Map<string, string>();
  for (const track of MOCK_TRACKS) {
    const row = await prisma.track.upsert({
      where: { videoId: track.videoId },
      update: { title: track.title, artist: track.artist },
      create: {
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        channelId: track.channelId,
        thumbnailUrl: `https://picsum.photos/seed/${track.videoId}/320/180`,
        durationSec: track.durationSec,
      },
    });
    trackIds.set(track.videoId, row.id);
  }

  // 3. demo profile + personal data
  const demoId = deterministicUuid("demo@doremi.dev");
  await prisma.profile.upsert({
    where: { id: demoId },
    update: {},
    create: { id: demoId, username: "demo", displayName: "Demo Listener", bio: "Just here for the music." },
  });

  const ids = [...trackIds.values()];
  await prisma.like.createMany({
    data: ids.slice(0, 12).map((trackId) => ({ userId: demoId, trackId })),
    skipDuplicates: true,
  });

  const existingPlaylist = await prisma.playlist.findFirst({
    where: { ownerId: demoId, name: "Late Night Coding" },
  });
  if (!existingPlaylist) {
    const playlist = await prisma.playlist.create({
      data: {
        name: "Late Night Coding",
        description: "Focus fuel after midnight.",
        gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed,#e879f9)",
        pinned: true,
        ownerId: demoId,
      },
    });
    await prisma.playlistTrack.createMany({
      data: ids.slice(4, 16).map((trackId, position) => ({ playlistId: playlist.id, trackId, position })),
    });
  }

  await prisma.playHistory.createMany({
    data: ids.slice(0, 20).map((trackId, i) => ({
      userId: demoId,
      trackId,
      playedAt: new Date(Date.now() - i * 47 * 60 * 1000),
    })),
  });

  console.log(`Done: ${MOCK_TRACKS.length} mock tracks, demo user demo@doremi.dev (dev login)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
