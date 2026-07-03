import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/index.js";
import { ApiError } from "../utils/errors.js";
import { isProd } from "../config/env.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "not_found", message: "Route not found" } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "validation_error",
        message: err.issues[0]?.message ?? "Invalid input",
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Unique-constraint races (e.g. two simultaneous registrations) → 409
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      error: { code: "conflict", message: "That value is already taken — try again" },
    });
    return;
  }

  // http-errors style (thrown by express.static, body-parser, …)
  if (err instanceof Error && "statusCode" in err && typeof err.statusCode === "number") {
    res.status(err.statusCode).json({
      error: { code: "http_error", message: err.statusCode === 404 ? "Not found" : err.message },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "internal_error",
      message: isProd ? "Something went wrong" : err instanceof Error ? err.message : String(err),
    },
  });
}
