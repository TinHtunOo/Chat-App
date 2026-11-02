import { Room, RoomListItem } from "@chat/shared";
import { prisma } from "../config/db.js";
import { Prisma } from "../generated/prisma/index.js";
import { toMessageDto, toRoomDto } from "../helper/mapper.js";
import type { Message } from "@chat/shared";
import { BadRequestError, NotFoundError } from "../helper/error.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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

export async function findOrCreateDirectRoom(
  userId: string,
  targetId: string,
): Promise<{ room: Room; created: boolean }> {
  if (userId === targetId) {
    throw new BadRequestError("You can't start a chat with yourself");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!target) {
    throw new NotFoundError("User not found");
  }

  // Sorted so A+B and B+A produce the same key
  const directKey = [userId, targetId].sort().join(":");

  const existing = await prisma.room.findUnique({ where: { directKey } });
  if (existing) {
    return { room: toRoomDto(existing), created: false };
  }

  try {
    // One atomic write: the room and both memberships
    const room = await prisma.room.create({
      data: {
        type: "DIRECT",
        directKey,
        members: {
          create: [{ userId }, { userId: targetId }],
        },
      },
    });
    return { room: toRoomDto(room), created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const room = await prisma.room.findUnique({ where: { directKey } });
      if (room) {
        return { room: toRoomDto(room), created: false };
      }
    }
    throw error;
  }
}

export async function listMyRooms(userId: string): Promise<RoomListItem[]> {
  const memberships = await prisma.roomMember.findMany({
    where: {
      userId,
      room: { type: "DIRECT" }, // remove this filter when group rooms come back
    },
    select: {
      room: {
        include: {
          // used to find the other person in the room
          members: {
            select: {
              userId: true,
              user: { select: { id: true, username: true } },
            },
          },
          // only the latest message, not the whole history
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { text: true, createdAt: true, authorId: true },
          },
        },
      },
    },
  });

  const items: RoomListItem[] = memberships.map(({ room }) => {
    const other = room.members.find((m) => m.userId !== userId);
    const last = room.messages[0];

    return {
      ...toRoomDto(room),
      otherUser:
        room.type === "DIRECT" && other
          ? { id: other.user.id, username: other.user.username }
          : null,
      lastMessage: last
        ? {
            text: last.text,
            createdAt: last.createdAt.toISOString(),
            authorId: last.authorId,
          }
        : null,
    };
  });

  // Most recent activity first; rooms with no messages fall back to createdAt
  return items.sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt ?? a.createdAt).getTime();
    const bTime = new Date(b.lastMessage?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

export async function getRoomMessages(
  roomId: string,
  userId: string,
  options: { limit?: number } = {},
): Promise<{ messages: Message[]; hasMore: boolean }> {
  // Same error for "not a member" and "room doesn't exist"
  if (!(await isRoomMember(roomId, userId))) {
    throw new NotFoundError("Room not found");
  }

  const limit = Math.min(
    Math.max(Math.floor(options.limit ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );

  const rows = await prisma.message.findMany({
    where: { roomId },
    include: { author: { select: { username: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // one extra row, only to detect older messages
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    messages: page.reverse().map(toMessageDto), // oldest -> newest
    hasMore,
  };
}

export async function saveMessage(
  roomId: string,
  userId: string,
  text: string,
): Promise<Message> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new BadRequestError("Message is empty");
  }

  if (!(await isRoomMember(roomId, userId))) {
    throw new NotFoundError("Room not found");
  }

  const result = await prisma.message.create({
    data: { text: trimmedText, roomId, authorId: userId },
    include: { author: { select: { username: true } } },
  });

  return toMessageDto(result);
}
