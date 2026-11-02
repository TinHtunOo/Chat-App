import { prisma } from "../config/db.js";

export type UserSearchResult = {
  id: string;
  username: string;
};

export async function searchUsers(
  query: string,
  currentUserId: string,
): Promise<UserSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  return prisma.user.findMany({
    where: {
      username: { startsWith: trimmedQuery, mode: "insensitive" },
      id: { not: currentUserId },
    },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
    take: 10,
  });
}
