import { z } from "zod";

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(50).default(24),
});

export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Prisma cursor-pagination arguments. Callers must pair this with an orderBy
 * that ends in a unique column (we always tiebreak on id).
 */
export function cursorArgs({ cursor, take }: Pagination) {
  return {
    take: take + 1, // fetch one extra to know whether a next page exists
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

/** Trims the sentinel row and derives the next cursor. */
export function buildPage<T extends { id: string }>(rows: T[], take: number) {
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}
