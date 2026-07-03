/** Shared domain types mirrored from the API's public payloads. */

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  gradient: string;
  songCount: number;
}

export interface ArtistSummary {
  id: string;
  name: string;
  slug: string;
  gradient: string;
  monthlyListeners: number;
}

export interface AlbumSummary {
  id: string;
  title: string;
  slug: string;
  gradient: string;
  releaseDate: string;
  songCount: number;
  artist: Pick<ArtistSummary, "id" | "name" | "slug">;
  genre: Pick<Genre, "id" | "name" | "slug">;
}

export interface SongSummary {
  id: string;
  title: string;
  trackNumber: number;
  durationSec: number;
  audioUrl: string;
  playCount: number;
  gradient: string;
  artist: Pick<ArtistSummary, "id" | "name" | "slug">;
  album: { id: string; title: string; slug: string };
}

export interface ArtistDetail extends ArtistSummary {
  bio: string;
  followerCount: number;
  albums: AlbumSummary[];
  topSongs: SongSummary[];
}

export interface AlbumDetail extends AlbumSummary {
  songs: SongSummary[];
  totalDurationSec: number;
}

export type SearchTopResult =
  | { type: "artist"; artist: ArtistSummary }
  | { type: "song"; song: SongSummary }
  | { type: "album"; album: AlbumSummary }
  | null;

export interface SearchResults {
  topResult: SearchTopResult;
  songs: SongSummary[];
  albums: AlbumSummary[];
  artists: ArtistSummary[];
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  createdAt: string;
}

export interface BrowseHome {
  trendingSongs: SongSummary[];
  newReleases: AlbumSummary[];
  popularArtists: ArtistSummary[];
  genres: Genre[];
}

export type AlbumSort = "recent" | "title" | "popular";
export type ArtistSort = "popular" | "name";
export type SongSort = "trending" | "title" | "recent" | "duration";
