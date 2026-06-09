const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    console.log(users);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
