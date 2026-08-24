const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function run() {
  try {
    const userId = 'a5015002-6128-46b8-9ff6-7dde5d518723';
    console.log("Querying user via Prisma...");
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log("User via Prisma:", user);

    console.log("\nUpdating user name via Prisma...");
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: 'Mayur Karthick' }
    });
    console.log("Updated user via Prisma:", updated);

  } catch (err) {
    console.error("❌ Prisma query/update error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
