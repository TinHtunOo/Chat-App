import type { Server } from "socket.io";
import type { Room, RoomListItem } from "@chat/shared";

export const roomChannel = (roomId: string) => `room:${roomId}`;
export const userChannel = (userId: string) => `user:${userId}`;

type RealtimeUser = { id: string; username: string };

// Same generics as in socket.ts, or use `Server<any, any, any, any>` if typing is a hassle
let io: Server | null = null;

export function initRealtime(instance: Server) {
  io = instance;
}

export function notifyRoomCreated(
  room: Room, // the DTO, already passed through toRoomDto
  creator: RealtimeUser,
  target: RealtimeUser,
) {
  if (!io) {
    throw new Error("Realtime not initialised: call initRealtime(io) first");
  }

  // 1. Join every connected socket of both users BEFORE emitting
  io.in(userChannel(creator.id)).socketsJoin(roomChannel(room.id));
  io.in(userChannel(target.id)).socketsJoin(roomChannel(room.id));

  // 2. Each side gets its own payload: otherUser is the *other* person
  const forCreator: RoomListItem = {
    ...room,
    otherUser: target,
    lastMessage: null,
  };
  const forTarget: RoomListItem = {
    ...room,
    otherUser: creator,
    lastMessage: null,
  };

  io.to(userChannel(creator.id)).emit("room:created", forCreator);
  io.to(userChannel(target.id)).emit("room:created", forTarget);
}
