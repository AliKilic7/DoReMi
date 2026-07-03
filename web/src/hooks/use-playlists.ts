"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { playlistsService } from "@/services/playlists";
import { useAuthStore } from "@/stores/auth-store";
import type { PlaylistDetail } from "@/types";

const LIST_KEY = ["playlists"] as const;
const detailKey = (id: string) => ["playlist", id] as const;

export function usePlaylists() {
  const authed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({ queryKey: LIST_KEY, queryFn: playlistsService.list, enabled: authed });
}

export function usePlaylist(id: string) {
  return useQuery({ queryKey: detailKey(id), queryFn: () => playlistsService.get(id) });
}

export function usePlaylistMutations() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });
  const invalidateDetail = (id: string) =>
    queryClient.invalidateQueries({ queryKey: detailKey(id) });

  const create = useMutation({
    mutationFn: playlistsService.create,
    onSuccess: (playlist) => {
      void invalidateList();
      toast.success(`Created "${playlist.name}"`);
      router.push(`/playlist/${playlist.id}`);
    },
    onError: () => toast.error("Couldn't create the playlist"),
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof playlistsService.update>[1]) =>
      playlistsService.update(id, input),
    onSuccess: (playlist) => {
      void invalidateList();
      void invalidateDetail(playlist.id);
    },
    onError: () => toast.error("Couldn't update the playlist"),
  });

  const remove = useMutation({
    mutationFn: playlistsService.remove,
    onSuccess: () => {
      void invalidateList();
      toast("Playlist deleted");
      router.push("/library?tab=playlists");
    },
    onError: () => toast.error("Couldn't delete the playlist"),
  });

  const addSong = useMutation({
    mutationFn: ({ id, songId }: { id: string; songId: string; playlistName?: string; songTitle?: string }) =>
      playlistsService.addSong(id, songId),
    onSuccess: ({ added }, { id, playlistName, songTitle }) => {
      void invalidateList();
      void invalidateDetail(id);
      toast(
        added
          ? `Added ${songTitle ? `"${songTitle}"` : "song"} to ${playlistName ?? "playlist"}`
          : `Already in ${playlistName ?? "that playlist"}`,
      );
    },
    onError: () => toast.error("Couldn't add the song"),
  });

  const removeSong = useMutation({
    mutationFn: ({ id, songId }: { id: string; songId: string }) =>
      playlistsService.removeSong(id, songId),
    onSuccess: (_data, { id }) => {
      void invalidateList();
      void invalidateDetail(id);
    },
    onError: () => toast.error("Couldn't remove the song"),
  });

  const reorder = useMutation({
    mutationFn: ({ id, songIds }: { id: string; songIds: string[] }) =>
      playlistsService.reorder(id, songIds),
    onMutate: async ({ id, songIds }) => {
      // optimistic: rewrite the cached detail order immediately
      await queryClient.cancelQueries({ queryKey: detailKey(id) });
      const previous = queryClient.getQueryData<PlaylistDetail>(detailKey(id));
      if (previous) {
        const byId = new Map(previous.songs.map((song) => [song.id, song]));
        queryClient.setQueryData<PlaylistDetail>(detailKey(id), {
          ...previous,
          songs: songIds.map((songId) => byId.get(songId)!).filter(Boolean),
        });
      }
      return { previous };
    },
    onError: (_error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey(id), context.previous);
      toast.error("Couldn't reorder the playlist");
    },
    onSettled: (_data, _error, { id }) => void invalidateDetail(id),
  });

  const uploadCover = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      playlistsService.uploadCover(id, file),
    onSuccess: (playlist) => {
      void invalidateList();
      void invalidateDetail(playlist.id);
      toast.success("Cover updated");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Cover upload failed"),
  });

  return { create, update, remove, addSong, removeSong, reorder, uploadCover };
}
