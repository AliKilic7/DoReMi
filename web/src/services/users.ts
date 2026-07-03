import { api, ApiError } from "@/lib/api";
import type { PersonalHome, User, UserSettings } from "@/types";

export const usersService = {
  updateProfile: (input: { displayName?: string; username?: string; bio?: string | null }) =>
    api<{ user: User }>("/api/me", { method: "PATCH", body: input }).then((r) => r.user),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    api<{ user: User }>("/api/me/password", { method: "PUT", body: input }).then((r) => r.user),

  updateSettings: (patch: Partial<UserSettings>) =>
    api<{ settings: UserSettings }>("/api/me/settings", { method: "PATCH", body: patch }).then(
      (r) => r.settings,
    ),

  uploadAvatar: async (file: File): Promise<User> => {
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/me/avatar", {
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
        payload?.error ?? { code: "upload_failed", message: "Avatar upload failed" },
      );
    }
    return ((await res.json()) as { user: User }).user;
  },

  follow: (artistId: string) =>
    api<{ following: true }>(`/api/artists/${artistId}/follow`, { method: "PUT" }),

  unfollow: (artistId: string) =>
    api<{ following: false }>(`/api/artists/${artistId}/follow`, { method: "DELETE" }),

  personalHome: () => api<PersonalHome>("/api/me/home"),
};
