import { useEffect, useState } from "react";
import { createSocket } from "../lib/socket";

export type ChatSocket = ReturnType<typeof createSocket>;

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const s = createSocket(); // ADJUST: pass the token if your createSocket takes one
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.connect();
    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return { socket, connected };
}