import { useEffect, useRef, useState } from "react";
import type { Message } from "@chat/shared";

type Props = {
  title: string;
  messages: Message[];
  connected: boolean;
  onSend: (text: string) => void;
};

export function Chat({ title, messages, connected, onSend }: Props) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="chat">
      <header className="chat-header">
        {title} {!connected && <small>(reconnecting...)</small>}
      </header>

      <ul className="chat-messages" ref={listRef}>
        {messages.map((m) => (
          <li key={m.id} className="chat-message">
            <strong>{m.author}</strong>
            <span>{m.text}</span>
          </li>
        ))}
      </ul>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          maxLength={2000}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}
