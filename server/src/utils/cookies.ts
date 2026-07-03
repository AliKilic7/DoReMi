import type { Response } from "express";
import { isProd } from "../config/env.js";

export const ACCESS_COOKIE = "dm_at";
export const REFRESH_COOKIE = "dm_rt";

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Sets both auth cookies. When `remember` is false the refresh cookie is a
 * session cookie (dropped when the browser closes); otherwise it persists 30 days.
 */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  remember: boolean,
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: FIFTEEN_MINUTES });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    ...(remember ? { maxAge: THIRTY_DAYS } : {}),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
