import { describe, expect, it } from "vitest";
import { createRng, renderSong } from "../../prisma/synth.js";

describe("synth", () => {
  it("rng is deterministic for a given seed", () => {
    const a = createRng(1234);
    const b = createRng(1234);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("renders identical audio for the same seed", () => {
    const first = renderSong(42);
    const second = renderSong(42);
    expect(first.durationSec).toBe(second.durationSec);
    expect(first.wav.equals(second.wav)).toBe(true);
  });

  it("emits a valid 16-bit mono 22050Hz WAV header", () => {
    const { wav, durationSec } = renderSong(7);
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.subarray(8, 12).toString()).toBe("WAVE");
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt32LE(24)).toBe(22050); // sample rate
    expect(wav.readUInt16LE(34)).toBe(16); // bit depth
    // duration metadata matches the actual sample count
    const dataSize = wav.readUInt32LE(40);
    expect(Math.round(dataSize / 2 / 22050)).toBe(durationSec);
    expect(durationSec).toBeGreaterThan(10);
    expect(durationSec).toBeLessThan(90);
  });

  it("produces different audio for different seeds", () => {
    expect(renderSong(1).wav.equals(renderSong(2).wav)).toBe(false);
  });
});
