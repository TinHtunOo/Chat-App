const BASE = "http://localhost:3000";
const WEB = "http://localhost:5173";
const suffix = Math.random().toString(36).slice(2, 8);
const email = `web_${suffix}@example.com`;
const username = `web_${suffix}`;
const password = "supersecret123";

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

console.log("== register ==");
const reg = await call("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, username, password }),
});
console.log(reg.status, JSON.stringify(reg.body));

const token = reg.body?.token;

console.log("\n== /auth/me with token (expect full User) ==");
const me = await call("/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
console.log(me.status, JSON.stringify(me.body));

console.log("\n== web dev server serves the app ==");
const page = await fetch(WEB);
const html = await page.text();
console.log(page.status, "html length:", html.length);
console.log("has #root:", html.includes('id="root"'));

console.log("\n== web dev server serves /login route (SPA fallback) ==");
const loginRoute = await fetch(`${WEB}/login`);
console.log(loginRoute.status, loginRoute.headers.get("content-type"));

console.log("\n== CORS preflight from web origin ==");
const preflight = await fetch(`${BASE}/auth/login`, {
  method: "OPTIONS",
  headers: {
    Origin: WEB,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  },
});
console.log(
  preflight.status,
  "allow-origin:",
  preflight.headers.get("access-control-allow-origin"),
);

console.log("\n== cleanup ==");
const { prisma } = await import(
  "file:///C:/Users/95944/Desktop/chat-app/apps/server/src/config/db.ts"
);
const del = await prisma.user.deleteMany({
  where: { username: { startsWith: "web_" } },
});
console.log("deleted", del.count, "test users");
await prisma.$disconnect();
