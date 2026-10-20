import { prisma } from "../src/config/db.js";

const result = await prisma.user.deleteMany({
  where: { username: { startsWith: "auth_" } },
});
console.log(`deleted ${result.count} test users`);

const remaining = await prisma.user.count();
console.log(`users remaining: ${remaining}`);
process.exit(0);
