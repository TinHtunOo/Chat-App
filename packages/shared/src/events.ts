import type { Message, SendMessageInput } from "./message";

export interface ServerToClientEvents {
  "message:new": (message: Message) => void;
}

export interface ClientToServerEvents {
  "message:send": (
    payload: SendMessageInput,
    ack?: (message: Message) => void,
  ) => void;
}
