import { useCallback, useEffect, useState } from "react";
import type { Message, RoomListItem, UserSearchResult } from "@chat/shared";
import { useSocket } from "../hooks/useSocket";
import { createDirectRoom, fetchMessages, fetchRooms } from "../lib/api";
import { Chat } from "../components/Chat";
import { useAuth } from "../store/auth";
import { Sidebar } from "../components/Sidebar";
import { useTyping } from "../hooks/useTyping";

// ADJUST: get these from your auth state
// const { token, user } = useAuth();

const activityTime = (r: RoomListItem) =>
  new Date(r.lastMessage?.createdAt ?? r.createdAt).getTime();

const sortRooms = (rooms: RoomListItem[]) =>
  [...rooms].sort((a, b) => activityTime(b) - activityTime(a));

// merge by id, keep oldest -> newest
function mergeMessages(a: Message[], b: Message[]): Message[] {
  const map = new Map<string, Message>();
  for (const m of [...a, ...b]) map.set(m.id, m);
  return [...map.values()].sort(
    (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime(),
  );
}

export function ChatPage() {
  const { token, user, logout } = useAuth(); // ADJUST
  const { socket, connected } = useSocket(token);
  const { typingByRoom, clearTyping } = useTyping(socket, user?.id ?? "");
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messagesByRoom, setMessagesByRoom] = useState<
    Record<string, Message[]>
  >({});

  // Load the conversation list
  useEffect(() => {
    if (!token) return;
    fetchRooms()
      .then((list) => setRooms(sortRooms(list)))
      .catch((e) => console.error("load rooms failed:", e));
  }, [token]);

  // Load history when a room is selected
  useEffect(() => {
    if (!token || !selectedRoomId) return;
    let cancelled = false;

    fetchMessages(selectedRoomId)
      .then(({ messages }) => {
        if (cancelled) return;
        // merge, so live messages that arrived during the fetch are kept
        setMessagesByRoom((prev) => ({
          ...prev,
          [selectedRoomId]: mergeMessages(prev[selectedRoomId] ?? [], messages),
        }));
      })
      .catch((e) => console.error("load history failed:", e));

    return () => {
      cancelled = true;
    };
  }, [token, selectedRoomId]);

  // Socket listeners (registered once per socket)
  useEffect(() => {
    if (!socket || !token) return;

    function onMessageNew(message: Message) {
      clearTyping(message.roomId, message.authorId);

      setMessagesByRoom((prev) => ({
        ...prev,
        [message.roomId]: mergeMessages(prev[message.roomId] ?? [], [message]),
      }));

      setRooms((prev) => {
        if (!prev.some((r) => r.id === message.roomId)) {
          // unknown room (rare): reload the list
          fetchRooms().then((list) => setRooms(sortRooms(list)));
          return prev;
        }
        return sortRooms(
          prev.map((r) =>
            r.id === message.roomId
              ? {
                  ...r,
                  lastMessage: {
                    text: message.text,
                    createdAt: message.createdAt,
                    authorId: message.authorId,
                  },
                }
              : r,
          ),
        );
      });
    }

    function onRoomCreated(room: RoomListItem) {
      setRooms((prev) =>
        prev.some((r) => r.id === room.id) ? prev : sortRooms([...prev, room]),
      );
    }

    socket.on("message:new", onMessageNew);
    socket.on("room:created", onRoomCreated);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("room:created", onRoomCreated);
    };
  }, [socket, token]);

  const handleSend = useCallback(
    (text: string) => {
      if (!socket || !selectedRoomId) return;
      socket.emit(
        "message:send",
        { roomId: selectedRoomId, text },
        (result) => {
          if (!result.ok) console.error("send failed:", result.error);
        },
      );
    },
    [socket, selectedRoomId],
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !selectedRoomId) return;
      socket.emit(isTyping ? "typing:start" : "typing:stop", {
        roomId: selectedRoomId,
      });
    },
    [socket, selectedRoomId],
  );

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleStartChat = useCallback(async (user: UserSearchResult) => {
    const { room } = await createDirectRoom(user.id); // throws on failure; SearchBar catches

    const item: RoomListItem = {
      ...room,
      otherUser: { id: user.id, username: user.username },
      lastMessage: null,
    };

    setRooms((prev) =>
      prev.some((r) => r.id === room.id) ? prev : sortRooms([...prev, item]),
    );
    setSelectedRoomId(room.id);
  }, []);
  return (
    <div className="chat-page">
      <Sidebar
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        username={user?.username ?? ""}
        onSelect={setSelectedRoomId}
        onLogout={logout}
        onStartChat={handleStartChat}
        // typingByRoom={typingByRoom}
      />

      {selectedRoom ? (
        <Chat
          key={selectedRoom.id}
          title={
            selectedRoom.otherUser?.username ?? selectedRoom.name ?? "Chat"
          }
          messages={messagesByRoom[selectedRoom.id] ?? []}
          currentUserId={user?.id ?? ""}
          connected={connected}
          onSend={handleSend}
          onTyping={handleTyping}
          typingNames={Object.values(typingByRoom[selectedRoom.id] ?? {})}
        />
      ) : (
        <div className="chat-empty">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
