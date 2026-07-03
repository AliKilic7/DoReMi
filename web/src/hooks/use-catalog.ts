"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { catalogService } from "@/services/catalog";
import type { AlbumSort, ArtistSort, Paginated, SongSort } from "@/types";

export const catalogKeys = {
  home: ["browse", "home"] as const,
  genres: ["genres"] as const,
  artists: (params: object) => ["artists", params] as const,
  artist: (slug: string) => ["artist", slug] as const,
  albums: (params: object) => ["albums", params] as const,
  album: (slug: string) => ["album", slug] as const,
  songs: (params: object) => ["songs", params] as const,
  search: (q: string) => ["search", q] as const,
  searchHistory: ["search-history"] as const,
};

export function useBrowseHome() {
  return useQuery({ queryKey: catalogKeys.home, queryFn: catalogService.browseHome });
}

export function useGenres() {
  return useQuery({
    queryKey: catalogKeys.genres,
    queryFn: catalogService.genres,
    staleTime: 5 * 60_000,
  });
}

/** Shared config for infinite catalog lists. */
function infiniteOptions<T>(fetcher: (cursor?: string) => Promise<Paginated<T>>) {
  return {
    queryFn: ({ pageParam }: { pageParam?: string }) => fetcher(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Paginated<T>) => last.nextCursor ?? undefined,
    select: (data: InfiniteData<Paginated<T>>) => data.pages.flatMap((page) => page.items),
  };
}

export function useInfiniteAlbums(params: { q?: string; genre?: string; sort?: AlbumSort }) {
  return useInfiniteQuery({
    queryKey: catalogKeys.albums(params),
    ...infiniteOptions((cursor) => catalogService.albums({ ...params, cursor })),
  });
}

export function useInfiniteArtists(params: { q?: string; sort?: ArtistSort }) {
  return useInfiniteQuery({
    queryKey: catalogKeys.artists(params),
    ...infiniteOptions((cursor) => catalogService.artists({ ...params, cursor })),
  });
}

export function useInfiniteSongs(params: { q?: string; genre?: string; sort?: SongSort }) {
  return useInfiniteQuery({
    queryKey: catalogKeys.songs(params),
    ...infiniteOptions((cursor) => catalogService.songs({ ...params, cursor })),
  });
}

export function useAlbum(slug: string) {
  return useQuery({ queryKey: catalogKeys.album(slug), queryFn: () => catalogService.album(slug) });
}

export function useArtist(slug: string) {
  return useQuery({
    queryKey: catalogKeys.artist(slug),
    queryFn: () => catalogService.artist(slug),
  });
}

/** Instant search — pass the already-debounced query. */
export function useSearch(q: string) {
  return useQuery({
    queryKey: catalogKeys.search(q),
    queryFn: ({ signal }) => catalogService.search(q, signal),
    enabled: q.trim().length >= 2,
    placeholderData: (previous) => previous, // keep last results while typing
  });
}

export function useSearchHistory(enabled: boolean) {
  return useQuery({
    queryKey: catalogKeys.searchHistory,
    queryFn: catalogService.searchHistory,
    enabled,
  });
}

export function useSearchHistoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: catalogKeys.searchHistory });

  const record = useMutation({ mutationFn: catalogService.recordSearch, onSuccess: invalidate });
  const remove = useMutation({
    mutationFn: catalogService.removeSearchEntry,
    onSuccess: invalidate,
  });
  const clear = useMutation({ mutationFn: catalogService.clearSearchHistory, onSuccess: invalidate });

  return { record, remove, clear };
}
