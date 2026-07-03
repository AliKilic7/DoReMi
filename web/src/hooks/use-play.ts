"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { SongSummary } from "@/types";

/**
 * Central play entry point. The audio engine ships with the player feature —
 * until then every play affordance funnels here so swapping in the real
 * implementation is a one-file change.
 */
export function usePlay() {
  return useCallback((song: SongSummary) => {
    toast(`"${song.title}" — the player arrives with the next update 🎧`);
  }, []);
}
