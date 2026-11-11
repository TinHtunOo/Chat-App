import type { RoomListItem, UserSearchResult } from "@chat/shared";
import { SearchBar } from "./SearchBar";
import { useMemo } from "react";

type Props = {
  rooms: RoomListItem[];
  selectedRoomId: string | null;
  username: string;
  onSelect: (roomId: string) => void;
  onLogout: () => void;
  onStartChat: (user: UserSearchResult) => Promise<void>;
};

export function Sidebar({
  rooms,
  selectedRoomId,
  username,
  onSelect,
  onLogout,
  onStartChat,
}: Props) {
  const roomByUserId = useMemo(() => {
    const map = new Map<string, string>(); // userId -> roomId
    for (const room of rooms) {
      if (room.otherUser) map.set(room.otherUser.id, room.id);
    }
    return map;
  }, [rooms]);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-user">{username}</span>
        <button className="btn-logout" onClick={onLogout}>
          Log out
        </button>
      </div>

      <SearchBar
        roomByUserId={roomByUserId}
        onStartChat={onStartChat}
        onSelect={onSelect}
      />
      <ul className="room-list">
        {rooms.length === 0 && (
          <li className="room-empty">No conversations yet</li>
        )}
        {rooms.map((room) => (
          <li key={room.id}>
            <button
              className={room.id === selectedRoomId ? "room active" : "room"}
              onClick={() => onSelect(room.id)}
            >
              <strong>{room.otherUser?.username ?? room.name ?? "Chat"}</strong>
              <span>{room.lastMessage?.text ?? "No messages yet"}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
