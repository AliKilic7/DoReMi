/**
 * Fixture catalog for the local mock Invidious instance. Track ids follow the
 * real 11-char YouTube shape so validators behave identically against real
 * instances. Audio maps to procedurally generated WAVs (see prisma/seed.ts).
 */
import { createHash } from "node:crypto";
import { songDuration } from "./synth.js";

export interface FixtureChannel {
  channelId: string;
  name: string;
}

export interface FixtureTrack {
  videoId: string;
  title: string;
  channelId: string;
  artist: string;
  durationSec: number;
}

const CHANNELS: [string, string][] = [
  ["UCmock0000000000dmneon01", "Neon Harbor"],
  ["UCmock0000000000dmvelv02", "Velvet Static"],
  ["UCmock0000000000dmluna03", "Luna Reyes"],
  ["UCmock0000000000dmmara04", "Mara Kingsley"],
  ["UCmock0000000000dmanlg05", "Analog Ghosts"],
  ["UCmock0000000000dmiris06", "Iris & June"],
  ["UCmock0000000000dmezra07", "Ezra Stone"],
  ["UCmock0000000000dmkait08", "Kaito Mori"],
];

const TITLES = [
  "Midnight Arcade", "Glass Gardens", "Golden Hour", "Fever Signal", "Paper Cranes",
  "Ultraviolet", "Static Bloom", "Night Swimming", "Chasing Satellites", "Amber Nights",
  "Electric Rivers", "Quiet Frames", "Chrome Sunset", "Restless Hearts", "Distant Lanterns",
  "Velvet Morning", "Concrete Poems", "Neon Cathedral", "Tidal Echoes", "Silver Horizon",
  "Burning Fireflies", "Broken Voltage", "Hollow Streetlights", "Frozen Currents", "Wild Monuments",
  "Faded Polaroids", "Crimson Skyline", "Lonely Frequencies", "Pale Embers", "Cobalt Mirrors",
  "Saudade", "Rainfall Index", "Spectrum City", "Grey Area Gold", "Slowmotion Summer",
  "Parallel Skies", "Atlas of Us", "Low Tide Hymns", "Rewind Culture", "Postcards from July",
];

export const seedFrom = (value: string): number =>
  createHash("sha256").update(value).digest().readUInt32LE(0);

/** 11-char, YouTube-shaped id derived deterministically from the title. */
function makeVideoId(title: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const digest = createHash("sha256").update(title).digest();
  let id = "";
  for (let i = 0; i < 11; i++) id += alphabet[digest[i]! % 64];
  return id;
}

export const MOCK_CHANNELS: FixtureChannel[] = CHANNELS.map(([channelId, name]) => ({
  channelId,
  name,
}));

export const MOCK_TRACKS: FixtureTrack[] = TITLES.map((title, i) => {
  const [channelId, artist] = CHANNELS[i % CHANNELS.length]!;
  const videoId = makeVideoId(title);
  return { videoId, title, channelId, artist, durationSec: songDuration(seedFrom(videoId)) };
});

export const audioFileFor = (videoId: string): string => `yt-${videoId}.wav`;
