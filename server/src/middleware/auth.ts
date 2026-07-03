import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { ApiError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return undefined;
}

/** Rejects the request with 401 unless a valid access token is present. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();
  try {
    req.userId = verifyAccessToken(token).sub;
  } catch {
    throw ApiError.unauthorized("Session expired", "token_expired");
  }
  next();
}

/** Attaches userId when a valid token is present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.userId = verifyAccessToken(token).sub;
    } catch {
      // ignore invalid token — treated as anonymous
    }
  }
  next();
}
