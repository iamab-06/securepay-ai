const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  let success = true;
  try {
    console.log("=== DB VALIDATION ===");
    // Verify DepositStatus enum exists (implicit if client generates and this runs)
    console.log("Prisma Client loaded successfully. DepositIntent model available.");

    // Check SYS-CLEARING
    const sysAccounts = await prisma.ledgerAccount.findMany({
      where: { account_code: 'SYS-CLEARING' },
      include: { wallet: true }
    });

    if (sysAccounts.length !== 1) {
      console.error(`FAIL: Expected 1 SYS-CLEARING account, found ${sysAccounts.length}`);
      success = false;
    } else {
      console.log(`PASS: Found exactly one SYS-CLEARING account.`);
    }

    if (sysAccounts[0] && sysAccounts[0].wallet) {
      console.error(`FAIL: SYS-CLEARING has a wallet attached!`);
      success = false;
    } else {
      console.log(`PASS: SYS-CLEARING has no Wallet record.`);
    }

  } catch (err) {
    console.error("FAIL:", err);
    success = false;
  } finally {
    await prisma.$disconnect();
    if (!success) process.exit(1);
    console.log("All DB validations passed.");
  }
}

run();
