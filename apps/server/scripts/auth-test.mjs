const BASE = "http://localhost:3000";
const suffix = Math.random().toString(36).slice(2, 8);
const email = `auth_${suffix}@example.com`;
const username = `auth_${suffix}`;
const password = "supersecret123";

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

console.log("== register ==");
const reg = await call("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, username, password }),
});
console.log(reg.status, JSON.stringify(reg.body));

console.log("\n== register duplicate (expect 409) ==");
const dup = await call("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, username, password }),
});
console.log(dup.status, JSON.stringify(dup.body));

console.log("\n== register weak password (expect 400) ==");
const weak = await call("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email: `w_${suffix}@example.com`, username: `w_${suffix}`, password: "123" }),
});
console.log(weak.status, JSON.stringify(weak.body));

console.log("\n== login correct ==");
const login = await call("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
console.log(login.status, JSON.stringify(login.body));

console.log("\n== login wrong password (expect 401) ==");
const badLogin = await call("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password: "wrongpassword" }),
});
console.log(badLogin.status, JSON.stringify(badLogin.body));

const token = login.body?.token;

console.log("\n== /auth/me without token (expect 401) ==");
const noToken = await call("/auth/me");
console.log(noToken.status, JSON.stringify(noToken.body));

console.log("\n== /auth/me with token (expect 200) ==");
const me = await call("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
console.log(me.status, JSON.stringify(me.body));

console.log("\n== /auth/me with bad token (expect 401) ==");
const badToken = await call("/auth/me", { headers: { Authorization: `Bearer not.a.jwt` } });
console.log(badToken.status, JSON.stringify(badToken.body));
