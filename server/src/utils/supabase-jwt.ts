import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthPayload {
  /** Supabase auth.users.id */
  sub: string;
  email?: string;
}

/** Verifies a Supabase-issued (or dev-minted) HS256 access token. */
export function verifyAccessToken(token: string): AuthPayload {
  const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET) as jwt.JwtPayload;
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("token has no subject");
  }
  return { sub: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined };
}

/**
 * Dev/test helper: mints a token shaped like Supabase's, signed with the same
 * shared secret. Never exposed in production (see env guard).
 */
export function signDevToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, role: "authenticated" }, env.SUPABASE_JWT_SECRET, {
    expiresIn: "12h",
  });
}

/** Stable UUID derived from an email — dev login is repeatable across runs. */
export function deterministicUuid(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "4" + hex.slice(13, 16), // version 4 shape
    ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}
