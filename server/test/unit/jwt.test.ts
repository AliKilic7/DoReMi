import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt.js";

describe("jwt utils", () => {
  it("round-trips access tokens", () => {
    const token = signAccessToken("user-1");
    expect(verifyAccessToken(token).sub).toBe("user-1");
  });

  it("round-trips refresh tokens with version and remember flag", () => {
    const payload = verifyRefreshToken(signRefreshToken("user-2", 7, true));
    expect(payload).toMatchObject({ sub: "user-2", tv: 7, rm: true });
  });

  it("rejects tampered tokens", () => {
    const token = signAccessToken("user-3");
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("access and refresh secrets are not interchangeable", () => {
    expect(() => verifyAccessToken(signRefreshToken("u", 0, false))).toThrow();
    expect(() => verifyRefreshToken(signAccessToken("u"))).toThrow();
  });
});
