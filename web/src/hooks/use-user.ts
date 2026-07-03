"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { catalogKeys } from "@/hooks/use-catalog";
import { ApiError } from "@/lib/api";
import { usersService } from "@/services/users";
import { useAuthStore } from "@/stores/auth-store";
import type { UserSettings } from "@/types";

/** Personal home sections (recently played, continue listening, follows). */
export function usePersonalHome() {
  const authed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: ["me", "home"],
    queryFn: usersService.personalHome,
    enabled: authed,
  });
}

export function useProfileMutations() {
  const setUser = useAuthStore((s) => s.setUser);

  const updateProfile = useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile updated");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Couldn't update your profile"),
  });

  const uploadAvatar = useMutation({
    mutationFn: usersService.uploadAvatar,
    onSuccess: (user) => {
      setUser(user);
      toast.success("Avatar updated");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Avatar upload failed"),
  });

  const changePassword = useMutation({
    mutationFn: usersService.changePassword,
    onSuccess: () => toast.success("Password changed — other sessions were signed out"),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Couldn't change the password"),
  });

  return { updateProfile, uploadAvatar, changePassword };
}

/** Auto-saving settings patcher, optimistic against the auth store. */
export function useUpdateSettings() {
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (patch: Partial<UserSettings>) => usersService.updateSettings(patch),
    onMutate: (patch) => {
      if (user) setUser({ ...user, settings: { ...user.settings, ...patch } });
      return { previous: user };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) setUser(context.previous);
      toast.error("Couldn't save that setting");
    },
    onSuccess: (settings) => {
      const current = useAuthStore.getState().user;
      if (current) setUser({ ...current, settings });
    },
  });
}

export function useFollowArtist(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistId, following }: { artistId: string; following: boolean }): Promise<void> => {
      if (following) await usersService.unfollow(artistId);
      else await usersService.follow(artistId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.artist(slug) });
      void queryClient.invalidateQueries({ queryKey: ["me", "home"] });
    },
  });
}
