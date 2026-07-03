import compression from "compression";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

/** Standard security headers (nosniff, frame denial, HSTS in prod, …). */
export const securityHeaders = helmet({
  // This server only emits JSON and media; a restrictive CSP also protects
  // any directly-opened upload or error page.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      mediaSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
});

export const compress = compression() as unknown as RequestHandler;

const limiterDefaults = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many requests — slow down a little." } },
};

/**
 * Strict limiter for credential endpoints (login/register/refresh).
 * Only failed attempts count, so brute force is throttled without ever
 * locking out users who sign in successfully.
 */
export const authLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 10 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
});

/** General API limiter. Media/static routes are mounted after this and excluded. */
export const apiLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 1000,
  limit: 300,
});

/**
 * CSRF defense-in-depth. SameSite=Lax cookies already stop classic CSRF; this
 * additionally rejects state-changing requests whose Origin header points at
 * a different site (non-browser clients send no Origin and pass through).
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction): void {
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.headers.origin;
  if (mutating && origin && origin !== env.CORS_ORIGIN) {
    throw ApiError.forbidden("Cross-origin request rejected", "bad_origin");
  }
  next();
}
