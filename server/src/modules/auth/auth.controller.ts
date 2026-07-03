import type { Request, Response } from "express";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../../utils/cookies.js";
import { ApiError } from "../../utils/errors.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  setAuthCookies(res, result, result.remember);
  res.status(201).json({ user: result.user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  setAuthCookies(res, result, result.remember);
  res.json({ user: result.user });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw ApiError.unauthorized("No session", "no_refresh_token");
  const result = await authService.refresh(token);
  setAuthCookies(res, result, result.remember);
  res.json({ user: result.user });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.userId!);
  res.json({ user });
}
