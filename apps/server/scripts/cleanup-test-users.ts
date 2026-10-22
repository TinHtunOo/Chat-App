import { prisma } from "../src/config/db.js";

const prefixes = ["auth_", "web_", "sock_"];

for (const prefix of prefixes) {
  const result = await prisma.user.deleteMany({
    where: { username: { startsWith: prefix } },
  });
  console.log(`deleted ${result.count} users matching "${prefix}"`);
}

console.log(`users remaining: ${await prisma.user.count()}`);
process.exit(0);
