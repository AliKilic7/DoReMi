import { api } from "@/lib/api";
import type {
  AlbumDetail,
  AlbumSort,
  AlbumSummary,
  ArtistDetail,
  ArtistSort,
  ArtistSummary,
  BrowseHome,
  Genre,
  Paginated,
  SearchHistoryEntry,
  SearchResults,
  SongSort,
  SongSummary,
} from "@/types";

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export const catalogService = {
  browseHome: () => api<BrowseHome>("/api/browse/home"),

  genres: () => api<{ items: Genre[] }>("/api/genres").then((r) => r.items),

  artists: (params: { q?: string; sort?: ArtistSort; cursor?: string; take?: number }) =>
    api<Paginated<ArtistSummary>>(`/api/artists${qs(params)}`),

  artist: (slug: string) =>
    api<{ artist: ArtistDetail }>(`/api/artists/${slug}`).then((r) => r.artist),

  albums: (params: {
    q?: string;
    genre?: string;
    sort?: AlbumSort;
    cursor?: string;
    take?: number;
  }) => api<Paginated<AlbumSummary>>(`/api/albums${qs(params)}`),

  album: (slug: string) => api<{ album: AlbumDetail }>(`/api/albums/${slug}`).then((r) => r.album),

  songs: (params: {
    q?: string;
    genre?: string;
    sort?: SongSort;
    cursor?: string;
    take?: number;
  }) => api<Paginated<SongSummary>>(`/api/songs${qs(params)}`),

  search: (q: string, signal?: AbortSignal) =>
    api<SearchResults>(`/api/search${qs({ q })}`, { signal }),

  searchHistory: () => api<{ items: SearchHistoryEntry[] }>("/api/search/history").then((r) => r.items),

  recordSearch: (query: string) =>
    api<{ ok: true }>("/api/search/history", { method: "POST", body: { query } }),

  removeSearchEntry: (id: string) =>
    api<{ ok: true }>(`/api/search/history/${id}`, { method: "DELETE" }),

  clearSearchHistory: () => api<{ ok: true }>("/api/search/history", { method: "DELETE" }),

  trackPlay: (songId: string) => api<{ ok: true }>(`/api/songs/${songId}/play`, { method: "POST" }),
};
