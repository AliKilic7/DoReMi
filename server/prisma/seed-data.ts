/** Static source data for the seed: genres, artists, albums and title banks. */

export interface GenreSeed {
  name: string;
  gradient: string;
}

export interface AlbumSeed {
  title: string;
  year: number;
}

export interface ArtistSeed {
  name: string;
  genre: string;
  monthlyListeners: number;
  bio: string;
  gradient: string;
  albums: AlbumSeed[];
}

export const GENRES: GenreSeed[] = [
  { name: "Synthwave", gradient: "linear-gradient(135deg,#4a044e,#a21caf,#22d3ee)" },
  { name: "Indie", gradient: "linear-gradient(135deg,#7f1d1d,#ea580c,#fbbf24)" },
  { name: "Electronic", gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed,#e879f9)" },
  { name: "Hip-Hop", gradient: "linear-gradient(135deg,#0f172a,#334155,#94a3b8)" },
  { name: "Jazz", gradient: "linear-gradient(135deg,#78350f,#b45309,#fcd34d)" },
  { name: "Lo-Fi", gradient: "linear-gradient(135deg,#155e75,#0891b2,#67e8f9)" },
  { name: "Rock", gradient: "linear-gradient(135deg,#831843,#db2777,#f9a8d4)" },
  { name: "Ambient", gradient: "linear-gradient(135deg,#042f2e,#0d9488,#99f6e4)" },
  { name: "Pop", gradient: "linear-gradient(135deg,#312e81,#6366f1,#a5b4fc)" },
  { name: "Soul", gradient: "linear-gradient(135deg,#3f6212,#65a30d,#bef264)" },
];

export const ARTISTS: ArtistSeed[] = [
  {
    name: "Neon Harbor",
    genre: "Synthwave",
    monthlyListeners: 2_845_120,
    bio: "Two ex-arcade technicians turning CRT hum and VHS memories into widescreen synthwave. Their live shows end when the fog machine gives up.",
    gradient: "linear-gradient(135deg,#7c3aed,#c026d3,#fb7185)",
    albums: [
      { title: "Midnight Arcade", year: 2024 },
      { title: "Chrome Sunset", year: 2021 },
    ],
  },
  {
    name: "Velvet Static",
    genre: "Indie",
    monthlyListeners: 1_204_884,
    bio: "Bedroom-pop four-piece from a coastal town that only has one venue — so they built their own in a greenhouse. Fuzzy guitars, warmer harmonies.",
    gradient: "linear-gradient(135deg,#0ea5e9,#22d3ee,#34d399)",
    albums: [
      { title: "Glass Gardens", year: 2023 },
      { title: "Slowmotion Summer", year: 2020 },
    ],
  },
  {
    name: "Luna Reyes",
    genre: "Pop",
    monthlyListeners: 4_182_902,
    bio: "Lisbon-born, Mexico City-raised songwriter whose voice sits somewhere between dusk and neon. Writes every lyric on hotel stationery.",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316,#ef4444)",
    albums: [
      { title: "Saudade", year: 2025 },
      { title: "Amber Nights", year: 2022 },
    ],
  },
  {
    name: "The Cartographers",
    genre: "Rock",
    monthlyListeners: 987_450,
    bio: "Five friends mapping heartbreak like terrain. Anthemic choruses, tour-van poetry, and a trumpet where you least expect it.",
    gradient: "linear-gradient(135deg,#312e81,#6366f1,#a5b4fc)",
    albums: [
      { title: "Parallel Skies", year: 2024 },
      { title: "Atlas of Us", year: 2019 },
    ],
  },
  {
    name: "Mara Kingsley",
    genre: "Electronic",
    monthlyListeners: 3_412_777,
    bio: "Producer and modular-synth obsessive. Builds every track from a single field recording — a train door, a swimming pool, her grandmother's clock.",
    gradient: "linear-gradient(135deg,#155e75,#0891b2,#67e8f9)",
    albums: [
      { title: "Ultraviolet", year: 2025 },
      { title: "Afterglow Protocol", year: 2023 },
    ],
  },
  {
    name: "Driftwood Choir",
    genre: "Ambient",
    monthlyListeners: 642_310,
    bio: "A rotating collective recording in lighthouses and empty churches. Their music is what the sea would hum if it could.",
    gradient: "linear-gradient(135deg,#831843,#db2777,#f9a8d4)",
    albums: [
      { title: "Low Tide Hymns", year: 2022 },
      { title: "Salt & Cedar", year: 2020 },
    ],
  },
  {
    name: "Analog Ghosts",
    genre: "Synthwave",
    monthlyListeners: 1_876_223,
    bio: "Brother duo resurrecting their father's tape machines. Every album is mixed to cassette first, then remastered — hiss included, on purpose.",
    gradient: "linear-gradient(135deg,#3f6212,#65a30d,#bef264)",
    albums: [
      { title: "Fever Signal", year: 2023 },
      { title: "Rewind Culture", year: 2021 },
    ],
  },
  {
    name: "Iris & June",
    genre: "Indie",
    monthlyListeners: 2_034_559,
    bio: "Twin sisters who learned harmony before they learned to argue. Sun-soaked folk-pop with teeth.",
    gradient: "linear-gradient(135deg,#1e1b4b,#7c3aed,#e879f9)",
    albums: [
      { title: "Golden Hour", year: 2024 },
      { title: "Postcards from July", year: 2021 },
    ],
  },
  {
    name: "Polaroid Winter",
    genre: "Lo-Fi",
    monthlyListeners: 1_512_040,
    bio: "An anonymous producer who uploads one track every full moon. Nobody has seen their face; everyone has studied to their drums.",
    gradient: "linear-gradient(135deg,#7f1d1d,#ea580c,#fbbf24)",
    albums: [
      { title: "Static Bloom", year: 2025 },
      { title: "Quiet Frames", year: 2022 },
    ],
  },
  {
    name: "Cobalt Youth",
    genre: "Rock",
    monthlyListeners: 890_114,
    bio: "Garage-born, festival-raised. Three chords, two amps and one unreasonable amount of reverb.",
    gradient: "linear-gradient(135deg,#0f172a,#334155,#94a3b8)",
    albums: [
      { title: "Night Swimming", year: 2023 },
      { title: "Runaway Colors", year: 2020 },
    ],
  },
  {
    name: "Wren Calloway",
    genre: "Soul",
    monthlyListeners: 2_688_431,
    bio: "A voice like late honey. Recorded her debut in a decommissioned radio station with the original 1962 microphones.",
    gradient: "linear-gradient(135deg,#4a044e,#a21caf,#22d3ee)",
    albums: [
      { title: "Ashes & Honey", year: 2024 },
      { title: "Velvet Morning", year: 2021 },
    ],
  },
  {
    name: "Prism Society",
    genre: "Electronic",
    monthlyListeners: 3_099_876,
    bio: "A design studio that accidentally became a band. Every release ships with its own typeface.",
    gradient: "linear-gradient(135deg,#042f2e,#0d9488,#99f6e4)",
    albums: [
      { title: "Chromatic", year: 2025 },
      { title: "Spectrum City", year: 2022 },
    ],
  },
  {
    name: "Ezra Stone",
    genre: "Hip-Hop",
    monthlyListeners: 3_845_002,
    bio: "Poet first, producer second. Samples his own street's noise complaints. Two mixtapes, zero features, all bars.",
    gradient: "linear-gradient(135deg,#78350f,#b45309,#fcd34d)",
    albums: [
      { title: "Concrete Poems", year: 2024 },
      { title: "Grey Area Gold", year: 2022 },
    ],
  },
  {
    name: "The Marlowe Quartet",
    genre: "Jazz",
    monthlyListeners: 421_889,
    bio: "Four conservatory dropouts who swore off sheet music. Every recording is take one — mistakes are arrangements now.",
    gradient: "linear-gradient(135deg,#7c3aed,#c026d3,#fb7185)",
    albums: [
      { title: "Blue Hour Sessions", year: 2023 },
      { title: "Midnight in Meridian", year: 2020 },
    ],
  },
  {
    name: "Kaito Mori",
    genre: "Lo-Fi",
    monthlyListeners: 1_988_745,
    bio: "Osaka sound-collagist layering rain, vinyl crackle and his cat's purr into three-minute exhales.",
    gradient: "linear-gradient(135deg,#0ea5e9,#22d3ee,#34d399)",
    albums: [
      { title: "Paper Cranes", year: 2025 },
      { title: "Rainfall Index", year: 2023 },
    ],
  },
  {
    name: "Scarlet Meridian",
    genre: "Pop",
    monthlyListeners: 2_310_450,
    bio: "Stadium-sized hooks written in a basement flat. The neighbors filed complaints; the label filed contracts.",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316,#ef4444)",
    albums: [
      { title: "Heartline", year: 2024 },
      { title: "Neon Cathedral", year: 2021 },
    ],
  },
];

/** Word banks for procedural song titles. */
export const TITLE_ADJECTIVES = [
  "Midnight", "Golden", "Electric", "Quiet", "Neon", "Velvet", "Broken", "Silver",
  "Restless", "Hollow", "Crimson", "Faded", "Wild", "Frozen", "Amber", "Lonely",
  "Static", "Pale", "Burning", "Distant", "Tidal", "Glass", "Paper", "Cobalt",
];

export const TITLE_NOUNS = [
  "Hearts", "Skyline", "Motorway", "Echoes", "Satellites", "Rivers", "Shadows",
  "Fireflies", "Horizon", "Voltage", "Streetlights", "Tides", "Polaroids", "Embers",
  "Constellations", "Windows", "Gardens", "Frequencies", "Currents", "Lanterns",
  "Monuments", "Mirrors", "Sirens", "Islands",
];

export const TITLE_PATTERNS = [
  (a: string, n: string) => `${a} ${n}`,
  (a: string, n: string) => `${n} in ${a} Light`,
  (a: string, n: string) => `When the ${n} Sleep`,
  (a: string, n: string) => `${a} ${n} (Reprise)`,
  (a: string, n: string) => `Chasing ${n}`,
  (a: string, n: string) => `${a} Hours`,
  (a: string, n: string) => `Letters to the ${n}`,
  (a: string, n: string) => `${n} Don't Wait`,
];
