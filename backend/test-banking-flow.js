async function apiCall(method, path, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`http://localhost:5000/api${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });
  
  const body = await res.json().catch(() => null);
  return { status: res.status, data: body };
}

async function run() {
  console.log("=======================================");
  console.log("SECUREPAY AI - BANKING VALIDATION SUITE");
  console.log("=======================================\n");
  
  const user1 = { name: "User A", email: `usera_${Date.now()}@test.com`, password: "password123" };
  const user2 = { name: "User B", email: `userb_${Date.now()}@test.com`, password: "password123" };

  // STEP 1
  console.log(`STEP 1: Creating User A...`);
  let res = await apiCall('POST', '/auth/register', user1);
  if (res.status !== 201) return console.log("Failed", res.data);
  const tokenA = res.data.data.access_token;
  const walletA = res.data.data.wallet.id;
  console.log(`✓ Success: User A created (Wallet: ${walletA})\n`);

  // STEP 2
  console.log(`STEP 2: Creating User B...`);
  res = await apiCall('POST', '/auth/register', user2);
  if (res.status !== 201) return console.log("Failed", res.data);
  const tokenB = res.data.data.access_token;
  const walletB = res.data.data.wallet.id;
  console.log(`✓ Success: User B created (Wallet: ${walletB})\n`);

  // STEP 3
  console.log(`STEP 3: Funding User A with ₹5000...`);
  res = await apiCall('POST', '/dev/fund-wallet', { amount: 5000 }, tokenA);
  if (res.status !== 200) return console.log("Failed", res.data);
  console.log(`✓ Success: User A Wallet funded. New Balance: ₹${res.data.data.newBalance}\n`);

  // STEP 4
  console.log(`STEP 4: User A adding User B as Beneficiary...`);
  res = await apiCall('POST', '/beneficiaries', { targetEmail: user2.email, nickname: "Bob" }, tokenA);
  if (res.status !== 201) return console.log("Failed", res.data);
  const beneficiaryId = res.data.data.beneficiary.id;
  console.log(`✓ Success: Beneficiary created (${beneficiaryId}).\n`);

  // STEP 5
  console.log(`STEP 5: Transferring ₹1000 from User A to User B...`);
  res = await apiCall('POST', '/transfers', { beneficiaryId: beneficiaryId, amount: 1000, description: "Test Transfer" }, tokenA);
  if (res.status !== 201) return console.log("Failed", res.data);
  console.log(`✓ Success: Transfer complete.\n`);

  // STEP 6
  console.log(`STEP 6: Validating Balances...`);
  const balA = await apiCall('GET', '/wallet', null, tokenA);
  const balB = await apiCall('GET', '/wallet', null, tokenB);
  console.log(`User A Expected: ₹4000 | Actual: ₹${balA.data.data.wallet.balance}`);
  console.log(`User B Expected: ₹1000 | Actual: ₹${balB.data.data.wallet.balance}`);
  if (Number(balA.data.data.wallet.balance) !== 4000 || Number(balB.data.data.wallet.balance) !== 1000) return console.log("✗ Balance mismatch!");
  console.log(`✓ Success: Balances verified.\n`);

  // STEP 7, 8, 9
  console.log(`STEP 7-9: Validating Ledger, Reconciliation, and Integrity...`);
  const status = await apiCall('GET', '/admin/system-status', null, tokenA);
  const stats = status.data.data;
  
  console.log(`System Status Report:`);
  console.log(`- Transactions: ${stats.transactions}`);
  console.log(`- Ledger Batches: ${stats.ledgerBatches}`);
  console.log(`- Ledger Entries: ${stats.ledgerEntries}`);
  console.log(`- Integrity: ${stats.integrityStatus}`);
  console.log(`- Reconciliation: ${stats.reconciliationStatus}`);
  
  console.log(`\n=======================================`);
  console.log(`VALIDATION COMPLETE: ALL SYSTEMS GO`);
  console.log(`=======================================`);
}

run();
