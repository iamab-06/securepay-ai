const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteToAdmin() {
  const email = 'samsulek@securepay.com'; // Change this if you want to use a different account
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { email: true, role: true }
    });
    
    console.log(`Successfully promoted user:`, updatedUser);
  } catch (err) {
    console.error(`Failed to update user. Ensure the email exists.`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
