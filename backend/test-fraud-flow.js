const prisma = require('./src/config/db');

const API_URL = 'http://localhost:5000/api';

async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    const responseData = await response.json().catch(() => null);
    return { status: response.status, data: responseData };
  } catch (err) {
    return { status: 500, data: err.message };
  }
}

async function runTest() {
  console.log("=======================================");
  console.log("SECUREPAY AI - FRAUD ISOLATION SUITE");
  console.log("=======================================\n");

  // Get baseline DB metrics
  const baselineBatches = await prisma.ledgerBatch.count();
  const baselineEntries = await prisma.ledgerEntry.count();

  // Create Users
  const userA = { name: "Fraud Tester", email: `fraud${Date.now()}@test.com`, password: "password123" };
  const userB = { name: "Fraud Target", email: `target${Date.now()}@test.com`, password: "password123" };

  const regA = await apiCall('POST', '/auth/register', userA);
  if (regA.status !== 201) {
    console.error("Register A failed:", regA);
    process.exit(1);
  }
  const loginA = await apiCall('POST', '/auth/login', { email: userA.email, password: userA.password });
  if (loginA.status !== 200) {
    console.error("Login failed:", loginA);
    process.exit(1);
  }
  const tokenA = loginA.data.data.token;
  
  const walletARes = await apiCall('GET', '/wallet', null, tokenA);
  if (walletARes.status !== 200) {
    console.error("Wallet fetch failed:", walletARes);
    process.exit(1);
  }
  const walletA = walletARes.data.data.wallet.id;

  const regB = await apiCall('POST', '/auth/register', userB);
  if (regB.status !== 201) {
    console.error("Register B failed:", regB);
    process.exit(1);
  }
  const loginB = await apiCall('POST', '/auth/login', { email: userB.email, password: userB.password });
  if (loginB.status !== 200) {
    console.error("Login B failed:", loginB);
    process.exit(1);
  }
  const tokenB = loginB.data.data.token;

  // Fund Wallet A with 20000
  await apiCall('POST', '/dev/fund-wallet', { amount: 20000 }, tokenA);
  
  // Add B as beneficiary to A
  const benRes = await apiCall('POST', '/beneficiaries', { targetEmail: userB.email, nickname: "Target" }, tokenA);
  if (benRes.status !== 201) {
    console.error("Beneficiary creation failed:", benRes);
    process.exit(1);
  }
  const beneficiaryId = benRes.data.data.beneficiary.id;

  // Re-fetch baseline after funding
  const preTransferBatches = await prisma.ledgerBatch.count();
  const preTransferEntries = await prisma.ledgerEntry.count();
  const preTransferWallet = await apiCall('GET', '/wallet', null, tokenA);
  const preTransferBalance = Number(preTransferWallet.data.data.wallet.balance);

  console.log(`Pre-Transfer Balance: ₹${preTransferBalance}`);
  console.log(`Pre-Transfer Batches: ${preTransferBatches}`);
  console.log(`Pre-Transfer Entries: ${preTransferEntries}\n`);

  console.log(`Triggering BLOCKED transaction (Amount: ₹15000 > 10000)...`);
  
  // Send 15000 to trigger LARGE_TRANSFER_RISK
  const transferRes = await apiCall('POST', '/transfers', { beneficiaryId, amount: 15000, description: "Large Transfer" }, tokenA);
  
  console.log(`Transfer Response Status: ${transferRes.status}`);
  console.log(`Transfer Response Message: ${transferRes.data.message}\n`);

  // Assertions
  if (transferRes.status !== 403) {
    console.error("✗ FAILED: Transfer was not blocked!");
    process.exit(1);
  }

  // Check DB metrics after blocked transfer
  const postTransferBatches = await prisma.ledgerBatch.count();
  const postTransferEntries = await prisma.ledgerEntry.count();
  const postTransferWallet = await apiCall('GET', '/wallet', null, tokenA);
  const postTransferBalance = Number(postTransferWallet.data.data.wallet.balance);

  console.log(`Post-Transfer Balance: ₹${postTransferBalance}`);
  console.log(`Post-Transfer Batches: ${postTransferBatches}`);
  console.log(`Post-Transfer Entries: ${postTransferEntries}\n`);

  let success = true;

  if (preTransferBalance !== postTransferBalance) {
    console.error("✗ CRITICAL FAILURE: Wallet balance mutated during blocked transaction!");
    success = false;
  }
  if (preTransferBatches !== postTransferBatches) {
    console.error("✗ CRITICAL FAILURE: Ledger Batch was created during blocked transaction!");
    success = false;
  }
  if (preTransferEntries !== postTransferEntries) {
    console.error("✗ CRITICAL FAILURE: Ledger Entries were created during blocked transaction!");
    success = false;
  }

  // Check that BLOCKED transaction actually exists
  const blockedCount = await prisma.transaction.count({
    where: { status: 'BLOCKED', sender_wallet_id: walletA }
  });

  if (blockedCount !== 1) {
    console.error("✗ CRITICAL FAILURE: BLOCKED transaction was not persisted!");
    success = false;
  }

  // Check Reconciliation
  const healthRes = await apiCall('GET', '/admin/system-status', null, tokenA);
  console.log(`System Integrity: ${healthRes.data.data.integrityStatus}`);
  console.log(`System Reconciliation: ${healthRes.data.data.reconciliationStatus}\n`);

  if (success) {
    console.log("✓ SUCCESS: Fraud Engine isolated financial state flawlessly.");
  } else {
    console.log("✗ FAILED: Ledger Isolation broken.");
    process.exit(1);
  }
}

runTest().catch(console.error).finally(() => process.exit(0));
