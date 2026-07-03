/**
 * Fictional albums used for decorative artwork tiles on marketing pages.
 * Every cover is a pure CSS gradient — no image assets required.
 */

export interface AlbumTile {
  title: string;
  artist: string;
  gradient: string;
}

const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed 0%,#c026d3 55%,#fb7185 100%)",
  "linear-gradient(135deg,#0ea5e9 0%,#22d3ee 50%,#34d399 100%)",
  "linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)",
  "linear-gradient(135deg,#312e81 0%,#6366f1 55%,#a5b4fc 100%)",
  "linear-gradient(135deg,#155e75 0%,#0891b2 50%,#67e8f9 100%)",
  "linear-gradient(135deg,#831843 0%,#db2777 55%,#f9a8d4 100%)",
  "linear-gradient(135deg,#3f6212 0%,#65a30d 55%,#bef264 100%)",
  "linear-gradient(135deg,#1e1b4b 0%,#7c3aed 60%,#e879f9 100%)",
  "linear-gradient(135deg,#7f1d1d 0%,#ea580c 55%,#fbbf24 100%)",
  "linear-gradient(135deg,#0f172a 0%,#334155 55%,#94a3b8 100%)",
  "linear-gradient(135deg,#4a044e 0%,#a21caf 55%,#22d3ee 100%)",
  "linear-gradient(135deg,#042f2e 0%,#0d9488 55%,#99f6e4 100%)",
];

const ALBUMS: [string, string][] = [
  ["Midnight Arcade", "Neon Harbor"],
  ["Glass Gardens", "Velvet Static"],
  ["Saudade", "Luna Reyes"],
  ["Parallel Skies", "The Cartographers"],
  ["Ultraviolet", "Mara Kingsley"],
  ["Low Tide Hymns", "Driftwood Choir"],
  ["Fever Signal", "Analog Ghosts"],
  ["Golden Hour", "Iris & June"],
  ["Static Bloom", "Polaroid Winter"],
  ["Night Swimming", "Cobalt Youth"],
  ["Ashes & Honey", "Wren Calloway"],
  ["Chromatic", "Prism Society"],
];

export const albumTiles: AlbumTile[] = ALBUMS.map(([title, artist], i) => ({
  title,
  artist,
  gradient: GRADIENTS[i % GRADIENTS.length]!,
}));
