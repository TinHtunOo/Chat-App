import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSocket } from "./useSocket";

type TypingByRoom = Record<string, Record<string, string>>; // roomId -> userId -> username

const EXPIRY_MS = 5000;

export function useTyping(socket: ChatSocket | null, currentUserId: string) {
  const [typingByRoom, setTypingByRoom] = useState<TypingByRoom>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((roomId: string, userId: string) => {
    const key = `${roomId}:${userId}`;
    const t = timers.current.get(key);
    if (t) clearTimeout(t);
    timers.current.delete(key);

    setTypingByRoom((prev) => {
      if (!prev[roomId]?.[userId]) return prev;
      const { [userId]: _removed, ...rest } = prev[roomId];
      return { ...prev, [roomId]: rest };
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onTypingUpdate(p: {
      roomId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }) {
      if (p.userId === currentUserId) return;

      if (!p.isTyping) {
        remove(p.roomId, p.userId);
        return;
      }

      setTypingByRoom((prev) => ({
        ...prev,
        [p.roomId]: { ...prev[p.roomId], [p.userId]: p.username },
      }));

      // Safety expiry in case the "stop" event never arrives
      const key = `${p.roomId}:${p.userId}`;
      const old = timers.current.get(key);
      if (old) clearTimeout(old);
      timers.current.set(
        key,
        setTimeout(() => remove(p.roomId, p.userId), EXPIRY_MS),
      );
    }

    function onDisconnect() {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      setTypingByRoom({});
    }

    socket.on("typing:update", onTypingUpdate);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("typing:update", onTypingUpdate);
      socket.off("disconnect", onDisconnect);
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, [socket, currentUserId, remove]);

  return { typingByRoom, clearTyping: remove };
}
