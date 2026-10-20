import { prisma } from "../src/config/db.js";

const suffix = Math.random().toString(36).slice(2, 10);

try {
  const created = await prisma.user.create({
    data: {
      email: `test_${suffix}@example.com`,
      username: `test_${suffix}`,
      passwordHash: "x",
    },
  });
  const total = await prisma.user.count();
  console.log(JSON.stringify({ created: created.id, totalUsers: total }));

  await prisma.user.delete({ where: { id: created.id } });
  const afterDelete = await prisma.user.count();
  console.log(JSON.stringify({ cleanup: "ok", totalUsers: afterDelete }));
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
