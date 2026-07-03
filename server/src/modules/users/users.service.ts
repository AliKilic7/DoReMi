import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { toPublicUser, type PublicUser } from "../auth/auth.service.js";
import { serializeAlbum, serializeArtist, serializeSong, songInclude, albumInclude } from "../catalog/catalog.serializers.js";
import { DEFAULT_SETTINGS, type UserSettings } from "./users.schemas.js";

export async function updateProfile(
  userId: string,
  input: { displayName?: string; username?: string; bio?: string | null },
): Promise<PublicUser> {
  if (input.username) {
    const taken = await prisma.user.findFirst({
      where: { username: input.username, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw ApiError.conflict("That username is taken", "username_taken");
  }
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toPublicUser(user);
}

/** Changes the password and revokes every other session via tokenVersion. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("Current password is incorrect", "wrong_password");
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      tokenVersion: { increment: 1 },
    },
  });
}

export async function getSettings(userId: string): Promise<Required<UserSettings>> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { settings: true } });
  return { ...DEFAULT_SETTINGS, ...((user?.settings as UserSettings) ?? {}) };
}

export async function updateSettings(
  userId: string,
  patch: UserSettings,
): Promise<Required<UserSettings>> {
  const current = await getSettings(userId);
  const merged = { ...current, ...patch };
  await prisma.user.update({ where: { id: userId }, data: { settings: merged } });
  return merged;
}

export async function setAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
  const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  return toPublicUser(user);
}

// ------------------------------------------------------------ follows

export async function followArtist(userId: string, artistId: string): Promise<void> {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });
  if (!artist) throw ApiError.notFound("Artist not found");
  await prisma.followArtist.upsert({
    where: { userId_artistId: { userId, artistId } },
    update: {},
    create: { userId, artistId },
  });
}

export async function unfollowArtist(userId: string, artistId: string): Promise<void> {
  await prisma.followArtist.deleteMany({ where: { userId, artistId } });
}

// ------------------------------------------------------------ personal home

/** Personal home sections derived from listening history and follows. */
export async function personalHome(userId: string) {
  const history = await prisma.playHistory.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    take: 120,
    include: { song: { include: songInclude } },
  });

  // newest-first distinct songs / albums
  const seenSongs = new Set<string>();
  const recentlyPlayed = [];
  const seenAlbums = new Set<string>();
  const albumIds: string[] = [];
  for (const entry of history) {
    if (!seenSongs.has(entry.songId) && recentlyPlayed.length < 12) {
      seenSongs.add(entry.songId);
      recentlyPlayed.push(serializeSong(entry.song));
    }
    if (!seenAlbums.has(entry.song.album.id) && albumIds.length < 8) {
      seenAlbums.add(entry.song.album.id);
      albumIds.push(entry.song.album.id);
    }
  }

  const [albums, follows] = await Promise.all([
    prisma.album.findMany({ where: { id: { in: albumIds } }, include: albumInclude }),
    prisma.followArtist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { artist: true },
    }),
  ]);
  const albumsById = new Map(albums.map((album) => [album.id, album]));

  return {
    recentlyPlayed,
    continueListening: albumIds
      .map((id) => albumsById.get(id))
      .filter((album) => album !== undefined)
      .map(serializeAlbum),
    followedArtists: follows.map((follow) => serializeArtist(follow.artist)),
  };
}
