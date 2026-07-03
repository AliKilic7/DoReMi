import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const listArtistsSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["popular", "name"]).default("popular"),
});

export const listAlbumsSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  genre: z.string().optional(),
  sort: z.enum(["recent", "title", "popular"]).default("recent"),
});

export const listSongsSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  genre: z.string().optional(),
  sort: z.enum(["trending", "title", "recent", "duration"]).default("trending"),
});

export type ListArtistsQuery = z.infer<typeof listArtistsSchema>;
export type ListAlbumsQuery = z.infer<typeof listAlbumsSchema>;
export type ListSongsQuery = z.infer<typeof listSongsSchema>;
