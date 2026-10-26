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

  const result = await prisma.user.findMany({
    where: {
      username: { startsWith: trimmedQuery, mode: "insensitive" },
      id: { not: currentUserId },
    },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
    take: 10,
  });

  return result;
}

export async function isRoomMember(
  roomId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
    select: { id: true },
  });

  return member !== null;
}
