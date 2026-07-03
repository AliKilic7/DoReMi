import { describe, expect, it } from "vitest";
import { assertImageSignature } from "../../src/utils/uploads.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]);
const HTML = Buffer.from("<script>alert(1)</script>");

describe("assertImageSignature", () => {
  it("accepts matching magic bytes", () => {
    expect(() => assertImageSignature(PNG, "image/png")).not.toThrow();
    expect(() => assertImageSignature(JPEG, "image/jpeg")).not.toThrow();
    expect(() => assertImageSignature(WEBP, "image/webp")).not.toThrow();
  });

  it("rejects content that doesn't match the declared type", () => {
    expect(() => assertImageSignature(HTML, "image/png")).toThrow();
    expect(() => assertImageSignature(PNG, "image/jpeg")).toThrow();
    expect(() => assertImageSignature(JPEG, "image/webp")).toThrow();
    expect(() => assertImageSignature(Buffer.alloc(0), "image/png")).toThrow();
  });
});
