import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(300).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty").max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

export const addSongSchema = z.object({
  songId: z.string().min(1),
});

export const reorderSchema = z.object({
  songIds: z.array(z.string().min(1)).max(1000),
});
