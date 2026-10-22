import { prisma } from "../src/config/db.js";

const users = await prisma.user.findMany({
  select: { id: true, username: true, email: true, createdAt: true },
});
console.log(JSON.stringify(users, null, 2));
process.exit(0);
