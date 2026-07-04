import type { Profile } from "../../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { DEFAULT_SETTINGS, type UserSettings } from "./profiles.schemas.js";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  settings: Required<UserSettings>;
}

export function serializeProfile(profile: Profile): PublicProfile {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    createdAt: profile.createdAt,
    settings: { ...DEFAULT_SETTINGS, ...((profile.settings as UserSettings) ?? {}) },
  };
}

/** Derives a unique handle from the email local part. */
async function generateUsername(email: string | undefined): Promise<string> {
  const base =
    (email ?? "listener")
      .split("@")[0]!
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24) || "listener";

  for (let attempt = 0; ; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt}`;
    const exists = await prisma.profile.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
}

/**
 * Fetches the profile for a verified Supabase user, creating it on first
 * contact (Supabase Auth owns the account; we own the app-level profile).
 */
export async function ensureProfile(userId: string, email?: string): Promise<Profile> {
  const existing = await prisma.profile.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const username = await generateUsername(email);
  return prisma.profile.create({
    data: {
      id: userId,
      username,
      displayName: email?.split("@")[0] ?? "Listener",
    },
  });
}

export async function updateProfile(
  userId: string,
  input: { displayName?: string; username?: string; bio?: string | null },
): Promise<PublicProfile> {
  if (input.username) {
    const taken = await prisma.profile.findFirst({
      where: { username: input.username, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw ApiError.conflict("That username is taken", "username_taken");
  }
  const profile = await prisma.profile.update({ where: { id: userId }, data: input });
  return serializeProfile(profile);
}

export async function getSettings(userId: string): Promise<Required<UserSettings>> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { settings: true },
  });
  return { ...DEFAULT_SETTINGS, ...((profile?.settings as UserSettings) ?? {}) };
}

export async function updateSettings(
  userId: string,
  patch: UserSettings,
): Promise<Required<UserSettings>> {
  const merged = { ...(await getSettings(userId)), ...patch };
  await prisma.profile.update({ where: { id: userId }, data: { settings: merged } });
  return merged;
}

export async function setAvatar(userId: string, avatarUrl: string): Promise<PublicProfile> {
  const profile = await prisma.profile.update({ where: { id: userId }, data: { avatarUrl } });
  return serializeProfile(profile);
}
