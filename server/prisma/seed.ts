/**
 * Seeds the DoReMi catalog: genres, artists, albums and songs — including
 * procedurally synthesized audio files — plus a demo user with playlists,
 * likes, follows and listening history.
 *
 * Deterministic: the same seed data and audio are produced on every run.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/index.js";
import { ARTISTS, GENRES, TITLE_ADJECTIVES, TITLE_NOUNS, TITLE_PATTERNS } from "./seed-data.js";
import { createRng, renderSong } from "./synth.js";

const prisma = new PrismaClient();

const AUDIO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "storage", "audio");

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Stable 32-bit seed derived from any string. */
const seedFrom = (value: string): number =>
  createHash("sha256").update(value).digest().readUInt32LE(0);

function generateTrackTitles(rng: () => number, count: number): string[] {
  const titles = new Set<string>();
  while (titles.size < count) {
    const pattern = TITLE_PATTERNS[Math.floor(rng() * TITLE_PATTERNS.length)]!;
    const adjective = TITLE_ADJECTIVES[Math.floor(rng() * TITLE_ADJECTIVES.length)]!;
    const noun = TITLE_NOUNS[Math.floor(rng() * TITLE_NOUNS.length)]!;
    titles.add(pattern(adjective, noun));
  }
  return [...titles];
}

async function seedCatalog() {
  mkdirSync(AUDIO_DIR, { recursive: true });

  const genres = new Map<string, string>();
  for (const genre of GENRES) {
    const created = await prisma.genre.create({
      data: { name: genre.name, slug: slugify(genre.name), gradient: genre.gradient },
    });
    genres.set(genre.name, created.id);
  }

  const songIds: string[] = [];
  let audioBytes = 0;

  for (const artistSeed of ARTISTS) {
    const artist = await prisma.artist.create({
      data: {
        name: artistSeed.name,
        slug: slugify(artistSeed.name),
        bio: artistSeed.bio,
        monthlyListeners: artistSeed.monthlyListeners,
        gradient: artistSeed.gradient,
      },
    });

    for (const albumSeed of artistSeed.albums) {
      const albumSlug = slugify(`${artistSeed.name} ${albumSeed.title}`);
      const rng = createRng(seedFrom(albumSlug));
      const trackCount = 7 + Math.floor(rng() * 3); // 7–9 tracks
      const titles = generateTrackTitles(rng, trackCount);
      const releaseDate = new Date(
        Date.UTC(albumSeed.year, Math.floor(rng() * 12), 1 + Math.floor(rng() * 28)),
      );

      const album = await prisma.album.create({
        data: {
          title: albumSeed.title,
          slug: albumSlug,
          releaseDate,
          gradient: artistSeed.gradient,
          artistId: artist.id,
          genreId: genres.get(artistSeed.genre)!,
        },
      });

      for (let track = 0; track < trackCount; track++) {
        const fileName = `${albumSlug}-${String(track + 1).padStart(2, "0")}.wav`;
        const filePath = path.join(AUDIO_DIR, fileName);

        const rendered = renderSong(seedFrom(fileName));
        if (!existsSync(filePath)) writeFileSync(filePath, rendered.wav);
        audioBytes += rendered.wav.length;

        const song = await prisma.song.create({
          data: {
            title: titles[track]!,
            trackNumber: track + 1,
            durationSec: rendered.durationSec,
            audioUrl: `/api/audio/${fileName}`,
            playCount: 1_000 + Math.floor(rng() * 2_400_000),
            albumId: album.id,
            artistId: artist.id,
            genreId: genres.get(artistSeed.genre)!,
          },
        });
        songIds.push(song.id);
      }
    }
    console.log(`  ✓ ${artistSeed.name} (${artistSeed.albums.length} albums)`);
  }

  console.log(`  ♪ audio: ${(audioBytes / 1024 / 1024).toFixed(0)} MB in ${AUDIO_DIR}`);
  return songIds;
}

async function seedDemoUser(songIds: string[]) {
  const rng = createRng(seedFrom("demo-user"));
  const pick = (count: number): string[] => {
    const pool = [...songIds];
    const chosen: string[] = [];
    while (chosen.length < count && pool.length > 0) {
      chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
    }
    return chosen;
  };

  const demo = await prisma.user.upsert({
    where: { email: "demo@doremi.dev" },
    update: {},
    create: {
      email: "demo@doremi.dev",
      username: "demo",
      displayName: "Demo Listener",
      passwordHash: await bcrypt.hash("demo1234", 10),
      bio: "Just here for the music.",
    },
  });

  const playlists: [string, string, { pinned?: boolean; favorite?: boolean }][] = [
    ["Late Night Coding", "Focus fuel: synths, lo-fi and zero lyrics after midnight.", { pinned: true }],
    ["Sunday Reset", "Slow mornings, warm coffee, softer songs.", { favorite: true }],
  ];

  for (const [name, description, flags] of playlists) {
    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed,#e879f9)",
        ownerId: demo.id,
        ...flags,
      },
    });
    const tracks = pick(12 + Math.floor(rng() * 4));
    await prisma.playlistSong.createMany({
      data: tracks.map((songId, index) => ({ playlistId: playlist.id, songId, position: index })),
    });
  }

  await prisma.like.createMany({
    data: pick(30).map((songId) => ({ userId: demo.id, songId })),
    skipDuplicates: true,
  });

  const artists = await prisma.artist.findMany({ take: 5, orderBy: { monthlyListeners: "desc" } });
  await prisma.followArtist.createMany({
    data: artists.map((artist) => ({ userId: demo.id, artistId: artist.id })),
  });

  const now = Date.now();
  await prisma.playHistory.createMany({
    data: pick(40).map((songId, index) => ({
      userId: demo.id,
      songId,
      playedAt: new Date(now - index * 47 * 60 * 1000), // spread over the last ~31h
    })),
  });

  console.log("  ✓ demo user (demo@doremi.dev / demo1234)");
}

async function main() {
  // The seed WIPES the catalog and all user-generated content that hangs off
  // it. Guard against running it on a production database by accident.
  if (process.env.NODE_ENV === "production" && process.env.FORCE_SEED !== "1") {
    console.error(
      "✋ Refusing to seed in production — this destroys existing data. " +
        "Set FORCE_SEED=1 if you really mean it.",
    );
    process.exit(1);
  }

  console.log("Seeding DoReMi…");

  // wipe catalog + demo content (order respects FK constraints via cascades)
  await prisma.playHistory.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.like.deleteMany();
  await prisma.followArtist.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.genre.deleteMany();

  const songIds = await seedCatalog();
  await seedDemoUser(songIds);

  const counts = {
    genres: await prisma.genre.count(),
    artists: await prisma.artist.count(),
    albums: await prisma.album.count(),
    songs: await prisma.song.count(),
  };
  console.log("Done:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
