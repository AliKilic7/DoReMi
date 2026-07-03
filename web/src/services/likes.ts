import { api } from "@/lib/api";
import type { SongSummary } from "@/types";

export interface LikedSong extends SongSummary {
  likedAt: string;
}

export interface LikedSongsPage {
  items: LikedSong[];
  nextCursor: string | null;
  total: number;
}

export const likesService = {
  likedIds: () => api<{ ids: string[] }>("/api/me/likes/ids").then((r) => r.ids),

  likedSongs: (cursor?: string) =>
    api<LikedSongsPage>(`/api/me/likes?take=30${cursor ? `&cursor=${cursor}` : ""}`),

  like: (songId: string) => api<{ liked: true }>(`/api/songs/${songId}/like`, { method: "PUT" }),

  unlike: (songId: string) =>
    api<{ liked: false }>(`/api/songs/${songId}/like`, { method: "DELETE" }),
};
