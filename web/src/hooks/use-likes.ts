"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { likesService } from "@/services/likes";
import { useAuthStore } from "@/stores/auth-store";

const IDS_KEY = ["liked-ids"] as const;
const SONGS_KEY = ["liked-songs"] as const;

/** Set of liked song ids — powers every heart in the app. */
export function useLikedIds(): Set<string> {
  const authed = useAuthStore((s) => s.status === "authenticated");
  const { data } = useQuery({
    queryKey: IDS_KEY,
    queryFn: likesService.likedIds,
    enabled: authed,
    staleTime: 60_000,
    select: (ids) => new Set(ids),
  });
  return data ?? new Set();
}

/** Optimistic like/unlike toggle. */
export function useToggleLike() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ songId, liked }: { songId: string; liked: boolean }): Promise<void> => {
      if (liked) await likesService.unlike(songId);
      else await likesService.like(songId);
    },
    onMutate: async ({ songId, liked }) => {
      await queryClient.cancelQueries({ queryKey: IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(IDS_KEY);
      queryClient.setQueryData<string[]>(IDS_KEY, (ids = []) =>
        liked ? ids.filter((id) => id !== songId) : [songId, ...ids],
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(IDS_KEY, context.previous);
      toast.error("Couldn't update your likes. Try again.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: IDS_KEY });
      void queryClient.invalidateQueries({ queryKey: SONGS_KEY });
    },
  });

  return useCallback(
    (songId: string, liked: boolean, title?: string) => {
      mutation.mutate({ songId, liked });
      if (!liked && title) toast(`Added "${title}" to your Liked Songs 💜`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

export function useInfiniteLikedSongs() {
  return useInfiniteQuery({
    queryKey: SONGS_KEY,
    queryFn: ({ pageParam }: { pageParam?: string }) => likesService.likedSongs(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
