import { prisma } from "../../lib/prisma.js";

// Catalog search itself lives in the YouTube adapter (/api/yt/search) — this
// module only manages the user's committed search history.

export async function listHistory(userId: string) {
  const rows = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return rows.map((row) => ({ id: row.id, query: row.query, createdAt: row.createdAt }));
}

/** Records a committed search; repeating a query bumps it to the top. */
export async function recordHistory(userId: string, query: string) {
  await prisma.searchHistory.upsert({
    where: { userId_query: { userId, query } },
    update: { createdAt: new Date() },
    create: { userId, query },
  });
}

export async function removeHistory(userId: string, id: string) {
  await prisma.searchHistory.deleteMany({ where: { id, userId } });
}

export async function clearHistory(userId: string) {
  await prisma.searchHistory.deleteMany({ where: { userId } });
}
