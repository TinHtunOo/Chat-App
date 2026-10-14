import type { Server } from "node:http";
import { Server as SocketServer } from "socket.io";
import {
  sendMessageSchema,
  type ClientToServerEvents,
  type Message,
  type ServerToClientEvents,
} from "@chat/shared";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export function setupSocket(httpServer: Server) {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: CLIENT_ORIGIN },
    },
  );

  io.on("connection", (socket) => {
    console.log(`socket connected: ${socket.id}`);

    socket.on("message:send", (payload, ack) => {
      const result = sendMessageSchema.safeParse(payload);

      if (!result.success) {
        console.warn("invalid message payload", result.error.flatten());
        return;
      }
      // console.log("message:sent", result.data.text);
      const message: Message = {
        id: crypto.randomUUID(),
        author: result.data.author,
        text: result.data.text,
        createdAt: new Date().toISOString(),
      };

      io.emit("message:new", message);
      ack?.(message);
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
