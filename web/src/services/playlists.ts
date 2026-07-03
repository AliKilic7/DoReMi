import { api, ApiError } from "@/lib/api";
import type { PlaylistDetail, PlaylistSummary } from "@/types";

export const playlistsService = {
  list: () => api<{ items: PlaylistSummary[] }>("/api/me/playlists").then((r) => r.items),

  create: (input: { name?: string; description?: string } = {}) =>
    api<{ playlist: PlaylistSummary }>("/api/me/playlists", { method: "POST", body: input }).then(
      (r) => r.playlist,
    ),

  get: (id: string) =>
    api<{ playlist: PlaylistDetail }>(`/api/playlists/${id}`).then((r) => r.playlist),

  update: (
    id: string,
    input: { name?: string; description?: string | null; favorite?: boolean; pinned?: boolean },
  ) =>
    api<{ playlist: PlaylistSummary }>(`/api/playlists/${id}`, {
      method: "PATCH",
      body: input,
    }).then((r) => r.playlist),

  remove: (id: string) => api<{ ok: true }>(`/api/playlists/${id}`, { method: "DELETE" }),

  addSong: (id: string, songId: string) =>
    api<{ added: boolean }>(`/api/playlists/${id}/songs`, { method: "POST", body: { songId } }),

  removeSong: (id: string, songId: string) =>
    api<{ ok: true }>(`/api/playlists/${id}/songs/${songId}`, { method: "DELETE" }),

  reorder: (id: string, songIds: string[]) =>
    api<{ ok: true }>(`/api/playlists/${id}/songs`, { method: "PUT", body: { songIds } }),

  /** Multipart upload — bypasses the JSON api client. */
  uploadCover: async (id: string, file: File): Promise<PlaylistSummary> => {
    const form = new FormData();
    form.append("cover", file);
    const res = await fetch(`/api/playlists/${id}/cover`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        error?: { code: string; message: string };
      } | null;
      throw new ApiError(
        res.status,
        payload?.error ?? { code: "upload_failed", message: "Cover upload failed" },
      );
    }
    return ((await res.json()) as { playlist: PlaylistSummary }).playlist;
  },
};
