import { beforeEach, describe, expect, it } from "vitest";
import { usePlayerStore } from "@/stores/player-store";
import type { SongSummary } from "@/types";

const song = (id: string): SongSummary => ({
  id,
  title: `Song ${id}`,
  trackNumber: 1,
  durationSec: 30,
  audioUrl: `/api/audio/${id}.wav`,
  playCount: 0,
  gradient: "linear-gradient(#000,#fff)",
  artist: { id: "a", name: "Artist", slug: "artist" },
  album: { id: "al", title: "Album", slug: "album" },
});

const context = ["s1", "s2", "s3", "s4"].map(song);
const store = () => usePlayerStore.getState();

beforeEach(() => {
  usePlayerStore.setState({
    queue: [],
    baseQueue: [],
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    repeat: "off",
    currentTime: 0,
    duration: 0,
    pendingSeek: null,
    queueOpen: false,
    view: "bar",
  });
});

describe("playSong", () => {
  it("loads the surrounding context as the queue at the right index", () => {
    store().playSong(context[2]!, context);
    expect(store().queue).toHaveLength(4);
    expect(store().currentIndex).toBe(2);
    expect(store().isPlaying).toBe(true);
  });

  it("falls back to a single-song queue without context", () => {
    store().playSong(song("solo"));
    expect(store().queue).toHaveLength(1);
    expect(store().currentIndex).toBe(0);
  });
});

describe("next / previous", () => {
  it("advances and stops at the end when repeat is off (auto)", () => {
    store().playSong(context[3]!, context); // last track
    store().next(true);
    expect(store().isPlaying).toBe(false); // stopped, no wrap
  });

  it("wraps at the end when repeat is all", () => {
    store().playSong(context[3]!, context);
    store().cycleRepeat(); // all
    store().next(true);
    expect(store().currentIndex).toBe(0);
    expect(store().isPlaying).toBe(true);
  });

  it("repeat-one replays the same track on auto-advance only", () => {
    store().playSong(context[0]!, context);
    store().cycleRepeat();
    store().cycleRepeat(); // one
    store().next(true);
    expect(store().currentIndex).toBe(0);
    expect(store().pendingSeek).toBe(0);
    store().clearPendingSeek();
    store().next(false); // manual next still advances
    expect(store().currentIndex).toBe(1);
  });

  it("previous restarts after 3s, otherwise goes back", () => {
    store().playSong(context[1]!, context);
    usePlayerStore.setState({ currentTime: 10 });
    store().previous();
    expect(store().currentIndex).toBe(1);
    expect(store().pendingSeek).toBe(0);

    usePlayerStore.setState({ currentTime: 1, pendingSeek: null });
    store().previous();
    expect(store().currentIndex).toBe(0);
  });
});

describe("shuffle", () => {
  it("keeps the current track first and restores original order on toggle off", () => {
    store().playSong(context[1]!, context);
    store().toggleShuffle();
    expect(store().queue[store().currentIndex]!.id).toBe("s2");
    expect(new Set(store().queue.map((s) => s.id))).toEqual(new Set(["s1", "s2", "s3", "s4"]));

    store().toggleShuffle();
    expect(store().queue.map((s) => s.id)).toEqual(["s1", "s2", "s3", "s4"]);
    expect(store().currentIndex).toBe(1);
  });
});

describe("queue editing", () => {
  it("addToQueue dedupes and reports it", () => {
    store().playSong(context[0]!, context);
    expect(store().addToQueue(song("s9"))).toBe(true);
    expect(store().addToQueue(song("s9"))).toBe(false);
    expect(store().queue).toHaveLength(5);
  });

  it("removeFromQueue never removes the playing track and fixes the index", () => {
    store().playSong(context[2]!, context);
    store().removeFromQueue(2); // playing track → no-op
    expect(store().queue).toHaveLength(4);

    store().removeFromQueue(0); // before current → index shifts
    expect(store().queue).toHaveLength(3);
    expect(store().currentIndex).toBe(1);
    expect(store().queue[store().currentIndex]!.id).toBe("s3");
  });

  it("setUpcoming replaces only the tracks after the current one", () => {
    store().playSong(context[0]!, context);
    store().setUpcoming([song("x1"), song("x2")]);
    expect(store().queue.map((s) => s.id)).toEqual(["s1", "x1", "x2"]);
    expect(store().currentIndex).toBe(0);
  });

  it("clearUpcoming keeps history up to the current track", () => {
    store().playSong(context[1]!, context);
    store().clearUpcoming();
    expect(store().queue.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("volume", () => {
  it("clamps to [0,1] and mutes at zero", () => {
    store().setVolume(1.4);
    expect(store().volume).toBe(1);
    store().setVolume(-2);
    expect(store().volume).toBe(0);
    expect(store().muted).toBe(true);
  });
});
