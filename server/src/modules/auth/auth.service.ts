import bcrypt from "bcryptjs";
import type { User } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";
import { DEFAULT_SETTINGS, type UserSettings } from "../users/users.schemas.js";

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  settings: Required<UserSettings>;
}

export function toPublicUser(user: User): PublicUser {
  const { id, email, username, displayName, avatarUrl, bio, createdAt } = user;
  return {
    id,
    email,
    username,
    displayName,
    avatarUrl,
    bio,
    createdAt,
    settings: { ...DEFAULT_SETTINGS, ...((user.settings as UserSettings) ?? {}) },
  };
}

interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  remember: boolean;
}

/** Derives a unique handle from the email local part, e.g. "jane" → "jane", "jane1". */
async function generateUsername(email: string): Promise<string> {
  const base =
    email
      .split("@")[0]!
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24) || "listener";

  for (let attempt = 0; ; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists", "email_taken");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      username: await generateUsername(input.email),
      passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
    },
  });

  return issueTokens(user, input.remember);
}

// Compared against when the email doesn't exist, so login latency doesn't
// reveal whether an account exists (timing-based user enumeration).
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", SALT_ROUNDS);

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    throw ApiError.unauthorized("Incorrect email or password", "invalid_credentials");
  }
  return issueTokens(user, input.remember);
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Session expired", "refresh_expired");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.tokenVersion !== payload.tv) {
    throw ApiError.unauthorized("Session revoked", "refresh_revoked");
  }
  return issueTokens(user, payload.rm);
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();
  return toPublicUser(user);
}

function issueTokens(user: User, remember: boolean): AuthResult {
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id, user.tokenVersion, remember),
    remember,
  };
}
