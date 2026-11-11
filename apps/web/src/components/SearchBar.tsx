import { useEffect, useRef, useState } from "react";
import { ApiError, searchUsers } from "../lib/api";
import type { UserSearchResult } from "@chat/shared";

type Props = {
  roomByUserId: Map<string, string>;
  onSelect: (roomId: string) => void;
  onStartChat: (user: UserSearchResult) => Promise<void>;
};

export function SearchBar({ roomByUserId, onSelect, onStartChat }: Props) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 2;
  useEffect(() => {
    if (trimmed.length < 2) {
      setUsers([]);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchUsers(trimmed);
        if (!cancelled) setUsers(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Unable to search");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);
  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function handleClick(user: UserSearchResult) {
    const existingRoomId = roomByUserId.get(user.id);

    if (existingRoomId) {
      onSelect(existingRoomId);
      setQuery("");
      setOpen(false);
      return;
    }

    setPendingUserId(user.id);
    setError("");
    try {
      await onStartChat(user);
      setQuery("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start chat");
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="search">
      <div className="search-box" ref={boxRef}>
        <input
          className="search-input"
          type="text"
          value={query}
          placeholder="Search users"
          maxLength={30}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
          }}
        />

        {showDropdown && (
          <div className="search-dropdown">
            {loading && <p className="search-status">Searching...</p>}
            {error && <p className="search-status">{error}</p>}
            {!loading && !error && users.length === 0 && (
              <p className="search-status">No users found</p>
            )}

            <ul className="search-results">
              {users.map((user) => {
                const existingRoomId = roomByUserId.get(user.id);
                return (
                  <li
                    key={user.id}
                    className={pendingUserId === user.id ? "pending" : ""}
                    onClick={() => handleClick(user)}
                  >
                    <span>{user.username}</span>
                    {existingRoomId && (
                      <span className="search-badge">Already chatting</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
