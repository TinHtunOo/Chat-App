import type { Server } from "node:http";
import { Server as SocketServer } from "socket.io";
import {
  sendMessageInputSchema,
  type ClientToServerEvents,
  type Message,
  type ServerToClientEvents,
} from "@chat/shared";
import { env } from "./config/env.js";

const roomChannel = (roomId: string) => `room:${roomId}`;

export function setupSocket(httpServer: Server) {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: env.CLIENT_ORIGIN },
    },
  );

  io.on("connection", (socket) => {
    console.log(`socket connected: ${socket.id}`);

    socket.on("room:join", ({ roomId }) => {
      socket.join(roomChannel(roomId));
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomChannel(roomId));
    });

    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomChannel(roomId)).emit("typing:update", {
        roomId,
        userId: socket.id,
        username: "unknown",
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomChannel(roomId)).emit("typing:update", {
        roomId,
        userId: socket.id,
        username: "unknown",
        isTyping: false,
      });
    });

    socket.on("message:send", (payload, ack) => {
      const result = sendMessageInputSchema.safeParse(payload);

      if (!result.success) {
        ack?.({ ok: false, error: "Invalid message payload" });
        return;
      }

      const message: Message = {
        id: crypto.randomUUID(),
        roomId: result.data.roomId,
        authorId: socket.id,
        author: "unknown",
        text: result.data.text,
        createdAt: new Date().toISOString(),
      };

      io.to(roomChannel(result.data.roomId)).emit("message:new", message);
      ack?.({ ok: true, message });
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
