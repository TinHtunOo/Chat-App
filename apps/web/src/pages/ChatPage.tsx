import { Chat } from "../components/Chat";
import { useAuth } from "../store/auth";

export function ChatPage() {
  const { user, logout } = useAuth();

  return (
    <main className="app">
      <header className="app-header">
        <h1>Chat</h1>
        <div className="app-user">
          <span>{user?.username}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <Chat />
    </main>
  );
}
