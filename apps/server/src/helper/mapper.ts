import { Room, Message } from "@chat/shared";
import {
  Room as DbRoom,
  Message as DbMessage,
} from "../generated/prisma/index.js";

export function toRoomDto(room: DbRoom): Room {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    createdAt: room.createdAt.toISOString(),
  };
}

type DbMessageWithAuthor = DbMessage & { author: { username: string } };

export function toMessageDto(message: DbMessageWithAuthor): Message {
  return {
    id: message.id,
    roomId: message.roomId,
    authorId: message.authorId,
    author: message.author.username, // shared type uses the username string
    text: message.text,
    createdAt: message.createdAt.toISOString(), // Date -> string
  };
}
