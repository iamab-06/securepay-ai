const prisma = require('../config/db');

const SYSTEM_ACCOUNTS = [
  { code: 'SYS-RESERVE', name: 'System Reserve Account' },
  { code: 'SYS-FEE', name: 'System Fee Account' },
  { code: 'SYS-ESCROW', name: 'System Escrow Account' },
  { code: 'SYS-SUSPENSE', name: 'System Suspense Account' }
];

exports.bootstrapSystemAccounts = async () => {
  console.log('Bootstrapping System Accounts...');
  
  for (const acc of SYSTEM_ACCOUNTS) {
    await prisma.ledgerAccount.upsert({
      where: { account_code: acc.code },
      update: { account_name: acc.name },
      create: {
        account_code: acc.code,
        account_name: acc.name,
        wallet_id: null
      }
    });
    console.log(`Ensured system account: ${acc.code}`);
  }
  
  console.log('System Accounts bootstrap complete.');
};
