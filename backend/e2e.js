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
  console.log("Starting E2E Flow...");
  
  const user1 = { name: "Alice", email: `alice_${Date.now()}@test.com`, password: "password123" };
  const user2 = { name: "Bob", email: `bob_${Date.now()}@test.com`, password: "password123" };

  // 1. Register User 1
  console.log(`\nRegistering ${user1.name}...`);
  let res = await apiCall('POST', '/auth/register', user1);
  if (res.status !== 201) return console.log("Failed", res.data);
  const token1 = res.data.data.access_token;
  const wallet1 = res.data.data.wallet.id;
  console.log(`Success! Token received. Wallet: ${wallet1}`);

  // 2. Register User 2
  console.log(`\nRegistering ${user2.name}...`);
  res = await apiCall('POST', '/auth/register', user2);
  if (res.status !== 201) return console.log("Failed", res.data);
  const token2 = res.data.data.access_token;
  const wallet2 = res.data.data.wallet.id;
  console.log(`Success! Token received. Wallet: ${wallet2}`);

  // 3. Add Beneficiary (User 1 adds User 2)
  console.log(`\nAlice adding Bob as beneficiary...`);
  res = await apiCall('POST', '/beneficiaries', { targetEmail: user2.email, nickname: "Bob Test" }, token1);
  if (res.status !== 201) return console.log("Failed", res.data);
  console.log(`Success! Beneficiary added.`);

  // 4. Check Wallets before transfer (Balance should be 0)
  console.log(`\nChecking Alice's Wallet...`);
  res = await apiCall('GET', '/wallet', null, token1);
  console.log(`Alice Balance: ₹${res.data.data.wallet.balance}`);

  // Wait! To transfer money, Alice needs balance. But we don't have an "Add Money" endpoint yet.
  // How do we test transfer if balance is 0? The system will reject it with "Insufficient funds".
  console.log(`\nAttempting to send ₹500 from Alice to Bob (Should fail due to insufficient funds)...`);
  res = await apiCall('POST', '/transfers', { receiverWalletId: wallet2, amount: 500, description: "Test" }, token1);
  console.log(`Result Status: ${res.status}`);
  console.log(`Result Message: ${res.data.message || res.data.error}`);

  // 5. Test Ledger Health
  console.log(`\nChecking Ledger Health (Admin Endpoint)...`);
  res = await apiCall('GET', '/admin/ledger/health', null, token1);
  // Note: we haven't restricted /admin/ledger/health to ADMIN roles yet in the code, but let's see if it works
  console.log(`Health Status:`, res.data);

  console.log("\nE2E Flow Complete.");
}

run();
