import { prisma } from "../src/config/db.js";

const [messages, rooms, members] = await Promise.all([
  prisma.message.count(),
  prisma.room.count(),
  prisma.roomMember.count(),
]);

console.log(`messages in DB: ${messages}`);
console.log(`rooms in DB: ${rooms}`);
console.log(`room members in DB: ${members}`);
process.exit(0);
