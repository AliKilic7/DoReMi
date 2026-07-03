"use client";

import { useEffect, useRef } from "react";
import { getAudio } from "@/lib/audio";
import { catalogService } from "@/services/catalog";
import { useCurrentSong, usePlayerStore } from "@/stores/player-store";

/**
 * Headless component that keeps the singleton <audio> element in sync with
 * the player store: source, play/pause, volume, seeks, auto-advance, play
 * tracking, Media Session metadata and global keyboard shortcuts.
 */
export function AudioEngine() {
  const song = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const pendingSeek = usePlayerStore((s) => s.pendingSeek);
  const lastTrackedRef = useRef<string | null>(null);

  // --- source ---------------------------------------------------------
  useEffect(() => {
    const audio = getAudio();
    if (!audio || !song) return;
    if (!audio.src.endsWith(song.audioUrl)) {
      audio.src = song.audioUrl;
      audio.load();
    }
  }, [song]);

  // --- play / pause ----------------------------------------------------
  useEffect(() => {
    const audio = getAudio();
    if (!audio || !song) return;
    if (isPlaying) {
      void audio.play().catch(() => usePlayerStore.getState().setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, song]);

  // --- volume ----------------------------------------------------------
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // --- seeks -----------------------------------------------------------
  useEffect(() => {
    const audio = getAudio();
    if (!audio || pendingSeek === null) return;
    audio.currentTime = pendingSeek;
    usePlayerStore.getState().clearPendingSeek();
  }, [pendingSeek]);

  // --- element events ----------------------------------------------------
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    let lastUpdate = 0;
    const onTimeUpdate = () => {
      const now = performance.now();
      if (now - lastUpdate < 240) return; // throttle re-renders
      lastUpdate = now;
      usePlayerStore.getState().setProgress(audio.currentTime, audio.duration || 0);
    };
    const onEnded = () => usePlayerStore.getState().next(true);
    const onPlaying = () => {
      // count one play per track start
      const current = usePlayerStore.getState().queue[usePlayerStore.getState().currentIndex];
      if (current && lastTrackedRef.current !== current.id) {
        lastTrackedRef.current = current.id;
        void catalogService.trackPlay(current.id).catch(() => {});
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("playing", onPlaying);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("playing", onPlaying);
    };
  }, []);

  // --- Media Session (OS-level controls) --------------------------------
  useEffect(() => {
    if (!("mediaSession" in navigator) || !song) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist.name,
      album: song.album.title,
    });
    const store = usePlayerStore.getState();
    navigator.mediaSession.setActionHandler("play", () => store.setPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => store.setPlaying(false));
    navigator.mediaSession.setActionHandler("nexttrack", () => store.next());
    navigator.mediaSession.setActionHandler("previoustrack", () => store.previous());
  }, [song]);

  // --- keyboard shortcuts -------------------------------------------------
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)
        return;

      const store = usePlayerStore.getState();
      const hasTrack = store.currentIndex >= 0;

      switch (event.key) {
        case " ":
          if (hasTrack) {
            event.preventDefault();
            store.togglePlay();
          }
          break;
        case "ArrowRight":
          if (!hasTrack) return;
          event.preventDefault();
          if (event.shiftKey) store.next();
          else store.seek(Math.min(store.duration, store.currentTime + 5));
          break;
        case "ArrowLeft":
          if (!hasTrack) return;
          event.preventDefault();
          if (event.shiftKey) store.previous();
          else store.seek(Math.max(0, store.currentTime - 5));
          break;
        case "ArrowUp":
          event.preventDefault();
          store.setVolume(store.volume + 0.05);
          break;
        case "ArrowDown":
          event.preventDefault();
          store.setVolume(store.volume - 0.05);
          break;
        case "m":
        case "M":
          store.toggleMute();
          break;
        case "f":
        case "F":
          if (hasTrack) store.setView(store.view === "full" ? "bar" : "full");
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
