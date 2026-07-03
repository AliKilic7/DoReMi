"use client";

import { useCallback } from "react";
import { ensureAnalyser } from "@/lib/audio";
import { usePlayerStore } from "@/stores/player-store";
import type { SongSummary } from "@/types";

/**
 * Central play entry point. Pass the surrounding list as `context` so the
 * queue continues naturally (album tracklist, search results, top songs…).
 * Must be invoked from a user gesture — it also unlocks the Web Audio graph.
 */
export function usePlay() {
  return useCallback((song: SongSummary, context?: SongSummary[]) => {
    ensureAnalyser();
    usePlayerStore.getState().playSong(song, context);
  }, []);
}
