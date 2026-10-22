import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@chat/shared";
import { getToken } from "./token";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

export function createSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token: getToken(),
    },
  });
}

export const socket = createSocket();
