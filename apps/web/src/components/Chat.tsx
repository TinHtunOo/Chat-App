import { useEffect, useRef, useState } from "react";
import type { Message } from "@chat/shared";
import { socket } from "../lib/socket";

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const roomId = "lobby";

  useEffect(() => {
    function onNewMessage(message: Message) {
      setMessages((prev) => [...prev, message]);
    }

    socket.on("message:new", onNewMessage);
    socket.emit("room:join", { roomId });

    return () => {
      socket.off("message:new", onNewMessage);
      socket.emit("room:leave", { roomId });
    };
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    socket.emit("message:send", { roomId, text: trimmedText }, (result) => {
      if (!result.ok) {
        console.error("send failed:", result.error);
      }
    });

    setText("");
  }

  return (
    <div className="chat">
      <ul className="chat-messages" ref={listRef}>
        {messages.map((message) => (
          <li key={message.id} className="chat-message">
            <strong>{message.author}</strong>
            <span>{message.text}</span>
          </li>
        ))}
      </ul>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message"
          maxLength={2000}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
