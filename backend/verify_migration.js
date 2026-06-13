const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({ select: { id: true, email: true, status: true, risk_tier: true } });
  const wallet = await prisma.wallet.findFirst({ select: { id: true, status: true } });
  
  console.log("=== DB VALIDATION REPORT ===");
  console.log("User:", user);
  console.log("Wallet:", wallet);
}

check().then(() => process.exit(0)).catch(console.error);
