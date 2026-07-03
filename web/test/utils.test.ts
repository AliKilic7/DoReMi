import { describe, expect, it } from "vitest";
import {
  cn,
  formatCompactNumber,
  formatDuration,
  formatTotalDuration,
  releaseYear,
} from "@/lib/utils";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(61)).toBe("1:01");
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("clamps negatives and floors fractions", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(89.9)).toBe("1:29");
  });
});

describe("formatCompactNumber", () => {
  it("abbreviates large values", () => {
    expect(formatCompactNumber(950)).toBe("950");
    expect(formatCompactNumber(45_300)).toBe("45.3K");
    expect(formatCompactNumber(2_845_120)).toBe("2.8M");
  });
});

describe("formatTotalDuration", () => {
  it("switches to hours past 60 minutes", () => {
    expect(formatTotalDuration(240)).toBe("4 min");
    expect(formatTotalDuration(3660)).toBe("1 hr 1 min");
  });
});

describe("releaseYear", () => {
  it("extracts the UTC year", () => {
    expect(releaseYear("2024-12-31T23:00:00.000Z")).toBe(2024);
  });
});

describe("cn", () => {
  it("merges conflicting tailwind classes, last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", false && "hidden", "text-blue-500")).toBe("text-blue-500");
  });
});
