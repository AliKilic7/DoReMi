import { describe, expect, it } from "vitest";
import { buildPage, cursorArgs, paginationSchema } from "../../src/utils/pagination.js";

describe("paginationSchema", () => {
  it("defaults and clamps take", () => {
    expect(paginationSchema.parse({}).take).toBe(24);
    expect(() => paginationSchema.parse({ take: "999" })).toThrow();
    expect(() => paginationSchema.parse({ take: "0" })).toThrow();
    expect(paginationSchema.parse({ take: "50" }).take).toBe(50);
  });
});

describe("cursorArgs", () => {
  it("fetches one extra row to detect the next page", () => {
    expect(cursorArgs({ take: 10 })).toEqual({ take: 11 });
  });

  it("skips the cursor row itself", () => {
    expect(cursorArgs({ take: 10, cursor: "abc" })).toEqual({
      take: 11,
      cursor: { id: "abc" },
      skip: 1,
    });
  });
});

describe("buildPage", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id${i}` }));

  it("returns null cursor when there is no next page", () => {
    expect(buildPage(rows(5), 10)).toEqual({ items: rows(5), nextCursor: null });
  });

  it("trims the sentinel row and points the cursor at the last visible item", () => {
    const { items, nextCursor } = buildPage(rows(11), 10);
    expect(items).toHaveLength(10);
    expect(nextCursor).toBe("id9");
  });
});
