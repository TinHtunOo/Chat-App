import type { Message, SendMessageInput } from "./schemas/message.js";

export type MessageAck =
  | { ok: true; message: Message }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string }) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "message:send": (
    payload: SendMessageInput,
    ack?: (result: MessageAck) => void,
  ) => void;
  "typing:start": (payload: { roomId: string }) => void;
  "typing:stop": (payload: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  "message:new": (message: Message) => void;
  "typing:update": (data: {
    roomId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  }) => void;
}
