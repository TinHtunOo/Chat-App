import { useEffect, useRef, useState } from "react";
import type { Message } from "@chat/shared";

type Props = {
  title: string;
  messages: Message[];
  connected: boolean;
  onSend: (text: string) => void;
  currentUserId: string;
  onTyping: (isTyping: boolean) => void; // NEW
  typingNames: string[];
};

const STOP_DELAY_MS = 2000;

export function Chat({
  title,
  messages,
  connected,
  onSend,
  currentUserId,
  onTyping,
  typingNames,
}: Props) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const isTypingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;

  function stopTyping() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingRef.current(false);
    }
  }

  // Send "stop" when leaving the room (Chat remounts per room via key)
  useEffect(() => stopTyping, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setText(value);

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingRef.current(true);
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(stopTyping, STOP_DELAY_MS);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    stopTyping(); // NEW
    onSend(trimmed);
    setText("");
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const typingLabel =
    typingNames.length === 0
      ? null
      : typingNames.length === 1
        ? `${typingNames[0]} is typing...`
        : "Several people are typing...";

  return (
    <div className="chat">
      <header className="chat-header">
        {title} {!connected && <small>(reconnecting...)</small>}
      </header>

      <ul className="chat-messages" ref={listRef}>
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.authorId === currentUserId
                ? "chat-message mine"
                : "chat-message"
            }
          >
            <strong>{m.author}</strong>
            <span>{m.text}</span>
          </li>
        ))}
      </ul>

      <div className="typing-indicator">{typingLabel}</div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={handleChange}
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
