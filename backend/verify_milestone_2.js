const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:5000/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText);
    err.response = { data, status: res.status };
    throw err;
  }
  return { data, headers: res.headers, status: res.status };
}

async function verify() {
  let user;
  let token;
  let depositRef;
  let walletBefore;
  let intentBefore;

  try {
    console.log("=== SETUP ===");
    // Create test user for isolated testing
    const email = `deposit_test_${Date.now()}@test.com`;
    const resReg = await fetchJSON(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Deposit Test User',
        email,
        password: 'password123'
      })
    });
    const accessToken = resReg.data.data ? resReg.data.data.access_token : resReg.data.access_token;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Get user ID
    const dbUser = await prisma.user.findUnique({ where: { email }, include: { wallet: true } });
    walletBefore = dbUser.wallet;
    console.log(`User created. Initial Balance: ₹${walletBefore.balance}`);

    console.log("\n=== 1. Create DepositIntent ===");
    const resDep = await fetchJSON(`${API_BASE}/deposits`, { 
      method: 'POST', 
      body: JSON.stringify({ amount: 1500 }), 
      headers: authHeaders 
    });
    const intent = resDep.data.data || resDep.data;
    depositRef = intent.reference;

    // Verify Pending
    intentBefore = await prisma.depositIntent.findUnique({ where: { reference: depositRef } });
    console.log(`Intent ID: ${intentBefore.id} | Reference: ${intentBefore.reference}`);
    console.log(`Status: ${intentBefore.status} | SettledAt: ${intentBefore.settled_at}`);
    
    if (intentBefore.status !== 'PENDING') throw new Error("Status should be PENDING");

    console.log("\n=== 2. Execute Settlement ===");
    const providerRef = `EXT-${Date.now()}`;
    const resWeb = await fetchJSON(`${API_BASE}/webhooks/mock-gateway`, {
      method: 'POST',
      body: JSON.stringify({
        securepay_reference: depositRef,
        provider_reference: providerRef
      })
    });

    console.log("Webhook Response:", resWeb.status, resWeb.data);

    // Verify Completed
    const intentAfter = await prisma.depositIntent.findUnique({ where: { reference: depositRef } });
    console.log(`Status: ${intentAfter.status} | SettledAt: ${intentAfter.settled_at}`);
    if (intentAfter.status !== 'COMPLETED') throw new Error("Status should be COMPLETED");
    if (!intentAfter.settled_at) throw new Error("SettledAt should be populated");
    if (intentAfter.provider_reference !== providerRef) throw new Error("Provider reference missing");

    const walletAfter = await prisma.wallet.findUnique({ where: { id: walletBefore.id } });
    console.log(`Wallet Balance After: ₹${walletAfter.balance} (Expected: ₹1500)`);
    if (Number(walletAfter.balance) !== 1500) throw new Error("Balance not increased");

    console.log("\n=== 3. LEDGER VALIDATION ===");
    const transaction = await prisma.transaction.findFirst({
      where: { receiver_wallet_id: walletAfter.id },
      include: { ledger_entries: { include: { ledger_account: true } } }
    });

    console.log("Ledger Entries:");
    let debitMatch = false;
    let creditMatch = false;
    let sumDebits = 0;
    let sumCredits = 0;
    for (const entry of transaction.ledger_entries) {
      console.log(`- ${entry.entry_type} | Account: ${entry.ledger_account.account_code} | Amount: ₹${entry.amount}`);
      if (entry.entry_type === 'DEBIT') {
        sumDebits += Number(entry.amount);
        if (entry.ledger_account.account_code === 'SYS-CLEARING') debitMatch = true;
      }
      if (entry.entry_type === 'CREDIT') {
        sumCredits += Number(entry.amount);
        if (entry.ledger_account.wallet_id === walletAfter.id) creditMatch = true;
      }
    }

    if (!debitMatch) throw new Error("SYS-CLEARING not debited");
    if (!creditMatch) throw new Error("User account not credited");
    if (sumDebits !== sumCredits) throw new Error("SUM(DEBITS) != SUM(CREDITS)");
    console.log(`SUM(DEBITS) [${sumDebits}] == SUM(CREDITS) [${sumCredits}]`);

    console.log("\n=== 4. IDEMPOTENCY VALIDATION ===");
    // Replay identical webhook
    const resWebReplay = await fetchJSON(`${API_BASE}/webhooks/mock-gateway`, {
      method: 'POST',
      body: JSON.stringify({
        securepay_reference: depositRef,
        provider_reference: providerRef
      })
    });
    console.log("Replay Response:", resWebReplay.status, resWebReplay.data);
    
    // Check balances and transactions count
    const walletReplay = await prisma.wallet.findUnique({ where: { id: walletBefore.id } });
    const txnReplayCount = await prisma.transaction.count({ where: { receiver_wallet_id: walletAfter.id } });
    if (Number(walletReplay.balance) !== 1500) throw new Error("Double credited on replay");
    if (txnReplayCount !== 1) throw new Error("Duplicate transaction on replay");
    console.log("No additional balance increase. No additional transactions.");

    console.log("\n=== 5. CONCURRENT WEBHOOK VALIDATION ===");
    const resDepCon = await fetchJSON(`${API_BASE}/deposits`, { 
      method: 'POST',
      body: JSON.stringify({ amount: 2000 }),
      headers: authHeaders
    });
    const intentCon = resDepCon.data.data || resDepCon.data;
    const concurrentRef = intentCon.reference;
    
    console.log("Firing 5 webhooks simultaneously...");
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(fetchJSON(`${API_BASE}/webhooks/mock-gateway`, {
        method: 'POST',
        body: JSON.stringify({
          securepay_reference: concurrentRef,
          provider_reference: `EXT-CONC-${Date.now()}-${i}`
        })
      }).catch(e => e.response));
    }
    
    await Promise.all(promises);
    
    const walletCon = await prisma.wallet.findUnique({ where: { id: walletBefore.id } });
    console.log(`Wallet Balance After Concurrency: ₹${walletCon.balance} (Expected: ₹3500)`);
    if (Number(walletCon.balance) !== 3500) throw new Error("Concurrent double credit occurred");

    console.log("\n=== DONE ===");

  } catch (error) {
    console.error("FAIL:", error.message);
    if (error.response) {
      console.error(error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verify();
