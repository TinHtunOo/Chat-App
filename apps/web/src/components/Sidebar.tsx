import type { RoomListItem } from "@chat/shared";

type Props = {
  rooms: RoomListItem[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
};

export function Sidebar({ rooms, selectedRoomId, onSelect }: Props) {
  return (
    <aside className="sidebar">
      {/* Phase 6: search box goes here */}
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
