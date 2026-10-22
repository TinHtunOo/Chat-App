import type { Server } from "node:http";
import { Server as SocketServer } from "socket.io";
import {
  sendMessageInputSchema,
  type ClientToServerEvents,
  type Message,
  type ServerToClientEvents,
} from "@chat/shared";
import { env } from "./config/env.js";
import { verifyToken } from "./services/auth.service.js";

interface SocketData {
  user: { sub: string; username: string };
}

const roomChannel = (roomId: string) => `room:${roomId}`;

export function setupSocket(httpServer: Server) {
  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string" || !token) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = { sub: payload.sub, username: payload.username };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`socket connected: ${socket.id} (${user.username})`);

    socket.on("room:join", ({ roomId }) => {
      socket.join(roomChannel(roomId));
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomChannel(roomId));
    });

    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomChannel(roomId)).emit("typing:update", {
        roomId,
        userId: user.sub,
        username: user.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomChannel(roomId)).emit("typing:update", {
        roomId,
        userId: user.sub,
        username: user.username,
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
        authorId: user.sub,
        author: user.username,
        text: result.data.text,
        createdAt: new Date().toISOString(),
      };

      io.to(roomChannel(result.data.roomId)).emit("message:new", message);
      ack?.({ ok: true, message });
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: ${socket.id} (${user.username})`);
    });
  });

  return io;
}
