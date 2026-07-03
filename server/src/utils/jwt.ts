import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL_REMEMBER = "30d";
const REFRESH_TTL_SESSION = "1d";

export interface AccessPayload {
  sub: string;
}

export interface RefreshPayload {
  sub: string;
  /** Token version — bumping User.tokenVersion revokes all refresh tokens. */
  tv: number;
  /** Whether the session should be remembered across browser restarts. */
  rm: boolean;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string, tokenVersion: number, remember: boolean): string {
  return jwt.sign(
    { sub: userId, tv: tokenVersion, rm: remember } satisfies RefreshPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: remember ? REFRESH_TTL_REMEMBER : REFRESH_TTL_SESSION },
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
