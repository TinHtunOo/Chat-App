import { useEffect, useRef, useState } from "react";
import type { Message } from "@chat/shared";
import { socket } from "../lib/socket";

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function onNewMessage(message: Message) {
      setMessages((prev) => [...prev, message]);
    }

    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedAuthor = author.trim();
    const trimmedText = text.trim();

    if (!trimmedAuthor || !trimmedText) {
      return;
    }

    socket.emit("message:send", {
      author: trimmedAuthor,
      text: trimmedText,
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
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="Your name"
          maxLength={50}
        />
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
