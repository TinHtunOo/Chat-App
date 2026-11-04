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
import {
  getUserRoomIds,
  isRoomMember,
  saveMessage,
} from "./services/room.service.js";
import { roomChannel } from "./helper/realtime.js";

interface SocketData {
  user: { sub: string; username: string };
}

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

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    console.log(`socket connected: ${socket.id} (${user.username})`);

    socket.join(`user:${user.sub}`);

    try {
      const roomIds = await getUserRoomIds(user.sub);
      socket.join(roomIds.map(roomChannel));
    } catch (error) {
      console.error("auto-join failed:", error);
    }

    socket.on("room:join", async (payload) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string" || !roomId) return;
      try {
        if (await isRoomMember(roomId, user.sub)) {
          socket.join(roomChannel(roomId));
        }
      } catch (error) {
        console.error("room-join failed:", error);
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomChannel(roomId));
    });

    socket.on("typing:start", async (payload) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string" || !roomId) return;
      try {
        if (await isRoomMember(roomId, user.sub)) {
          socket.to(roomChannel(roomId)).emit("typing:update", {
            roomId,
            userId: user.sub,
            username: user.username,
            isTyping: true,
          });
        }
      } catch (error) {
        console.error("typing-start failed:", error);
      }
    });

    socket.on("typing:stop", async (payload) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string" || !roomId) return;
      try {
        if (await isRoomMember(roomId, user.sub)) {
          socket.to(roomChannel(roomId)).emit("typing:update", {
            roomId,
            userId: user.sub,
            username: user.username,
            isTyping: false,
          });
        }
      } catch (error) {
        console.error("typing-stop failed:", error);
      }
    });

    socket.on("message:send", async (payload, ack) => {
      const result = sendMessageInputSchema.safeParse(payload);
      if (!result.success) {
        ack?.({ ok: false, error: "Invalid message payload" });
        return;
      }

      try {
        const message = await saveMessage(
          result.data.roomId,
          user.sub,
          result.data.text,
        );
        io.to(roomChannel(message.roomId)).emit("message:new", message);
        ack?.({ ok: true, message });
      } catch (error) {
        console.error("message:send failed:", error);
        ack?.({ ok: false, error: "Could not send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: ${socket.id} (${user.username})`);
    });
  });

  return io;
}
