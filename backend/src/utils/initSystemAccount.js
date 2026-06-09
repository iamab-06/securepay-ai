const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initSystemAccount() {
  try {
    console.log('Starting system ledger account initialization...');

    // Upsert the SYS-CLEARING Ledger Account
    // This account holds no wallet - it strictly serves as the counterparty
    // to all external fiat deposits (a liability on our ledger).
    const sysClearing = await prisma.ledgerAccount.upsert({
      where: { account_code: 'SYS-CLEARING' },
      update: {},
      create: {
        account_code: 'SYS-CLEARING',
        account_name: 'System Omnibus Clearing Account',
      },
    });

    console.log('✅ System Account Initialized:');
    console.log(sysClearing);

  } catch (error) {
    console.error('❌ Failed to initialize system account:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initSystemAccount();
}

module.exports = { initSystemAccount };
