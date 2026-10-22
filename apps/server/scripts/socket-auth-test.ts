import { io } from "socket.io-client";

const BASE = "http://localhost:3000";
const suffix = Math.random().toString(36).slice(2, 8);
const email = `sock_${suffix}@example.com`;
const username = `sock_${suffix}`;
const password = "supersecret123";

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const reg = await api("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, username, password }),
});
const token = reg.body.token;
console.log("registered:", reg.status, username);

function connect(auth) {
  return new Promise((resolve) => {
    const socket = io(BASE, { autoConnect: true, auth });
    socket.on("connect", () => resolve({ ok: true, socket }));
    socket.on("connect_error", (err) => resolve({ ok: false, error: err.message }));
    setTimeout(() => resolve({ ok: false, error: "timeout" }), 8000);
  });
}

console.log("\n== socket with NO token (expect rejected) ==");
const bad = await connect({});
console.log("rejected:", !bad.ok, "error:", bad.error);
bad.socket?.close();

console.log("\n== socket with BAD token (expect rejected) ==");
const badToken = await connect({ token: "not.a.jwt" });
console.log("rejected:", !badToken.ok, "error:", badToken.error);
badToken.socket?.close();

console.log("\n== socket with VALID token (expect connected) ==");
const good = await connect({ token });
console.log("connected:", good.ok);
if (good.ok) {
  const sock = good.socket;

  const received = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 6000);
    sock.on("message:new", (message) => {
      clearTimeout(timer);
      resolve(message);
    });
    sock.emit("room:join", { roomId: "lobby" });
    setTimeout(() => sock.emit("message:send", { roomId: "lobby", text: "hello from test" }), 300);
  });

  console.log("message received:", JSON.stringify(received));
  console.log("author is real user:", received?.author === username);
  console.log("authorId matches user id:", received?.authorId === reg.body.user.id);

  const ack = await new Promise((resolve) => {
    sock.emit("message:send", { roomId: "lobby", text: "ack test" }, resolve);
    setTimeout(() => resolve(null), 5000);
  });
  console.log("ack:", JSON.stringify(ack));

  sock.close();
}

console.log("\n== cleanup ==");
const { prisma } = await import("../src/config/db.js");
const del = await prisma.user.deleteMany({
  where: { username: { startsWith: "sock_" } },
});
console.log("deleted", del.count, "test users");
process.exit(0);
