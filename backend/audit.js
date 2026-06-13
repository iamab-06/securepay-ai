const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const fraudRuleEngine = require('./src/services/fraudRuleEngine');

async function runAudit() {
  console.log("=== PHASE 7 ACCEPTANCE AUDIT ===");

  try {
    // 1. Create a mock user
    const email = `audit_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        name: 'Audit User',
        email,
        password_hash: 'hash',
        risk_tier: 'CRITICAL'
      }
    });
    
    console.log(`Created User: ${user.id} (CRITICAL risk)`);

    const wallet = await prisma.wallet.create({
      data: {
        user_id: user.id,
        wallet_number: `WAL-${Date.now()}`,
        balance: 1000000
      }
    });
    
    // Create Beneficiary (Triggers RULE_004 if loop, but let's test directly)
    const target = await prisma.user.create({
      data: { name: 'Target', email: `target_${Date.now()}@test.com`, password_hash: 'hash' }
    });
    
    const beneficiary = await prisma.beneficiary.create({
      data: { owner_user_id: user.id, beneficiary_user_id: target.id }
    });
    
    console.log("Created Beneficiary. Simulating RULE_004...");
    // Simulate RULE_004 by artificially injecting 3 old beneficiaries
    const target2 = await prisma.user.create({ data: { name: 'T2', email: `t2_${Date.now()}@test.com`, password_hash: 'h' } });
    const target3 = await prisma.user.create({ data: { name: 'T3', email: `t3_${Date.now()}@test.com`, password_hash: 'h' } });

    await prisma.beneficiary.createMany({
      data: [
        { owner_user_id: user.id, beneficiary_user_id: target2.id, nickname: '1' },
        { owner_user_id: user.id, beneficiary_user_id: target3.id, nickname: '2' }, 
      ]
    });
    await fraudRuleEngine.evaluateBeneficiaryRules(user.id);
    
    console.log("Simulating RULE_001, 002, 003, 005 via evaluateTransferRules...");
    const tx = await prisma.transaction.create({
      data: {
        transaction_reference: `TX-${Date.now()}`,
        receiver_wallet_id: wallet.id,
        amount: 60000,
        status: 'SUCCESS'
      }
    });

    // Artificially create 3 old tx to trigger RULE_001
    await prisma.transaction.createMany({
      data: [
        { transaction_reference: `TX-A-${Date.now()}`, receiver_wallet_id: wallet.id, amount: 10, sender_wallet_id: wallet.id },
        { transaction_reference: `TX-B-${Date.now()}`, receiver_wallet_id: wallet.id, amount: 10, sender_wallet_id: wallet.id },
        { transaction_reference: `TX-C-${Date.now()}`, receiver_wallet_id: wallet.id, amount: 10, sender_wallet_id: wallet.id }
      ]
    });

    await fraudRuleEngine.evaluateTransferRules(user.id, target.id, tx.id, 60000);
    
    // Let's pause for a second to allow async inserts
    await new Promise(r => setTimeout(r, 2000));
    
    const alerts = await prisma.fraudAlert.findMany({ where: { user_id: user.id } });
    console.log("\n--- Fraud Alerts Generated ---");
    alerts.forEach(a => console.log(`${a.rule}: ${a.severity} - ${a.status} (${a.title})`));
    
    // Test Case Lifecycle
    if (alerts.length > 0) {
      console.log("\n--- Testing Case Lifecycle ---");
      const testAlert = alerts[0];
      
      // ESCALATED
      await prisma.fraudAlert.update({ where: { id: testAlert.id }, data: { status: 'ESCALATED' } });
      const fCase = await prisma.fraudCase.create({
        data: { alert_id: testAlert.id, assigned_to: user.id }
      });
      console.log(`Alert ESCALATED. Case Created: ${fCase.id}`);
      
      // RESOLVED
      await prisma.fraudCase.update({
        where: { id: fCase.id },
        data: { resolution: 'FALSE_POSITIVE', resolved_at: new Date() }
      });
      await prisma.fraudAlert.update({ where: { id: testAlert.id }, data: { status: 'RESOLVED' } });
      console.log(`Case RESOLVED. Alert RESOLVED.`);
    }

    // Database Verification
    const alertCount = await prisma.fraudAlert.count();
    const caseCount = await prisma.fraudCase.count();
    console.log(`\n--- DB Counts ---\nAlerts: ${alertCount}\nCases: ${caseCount}`);

    // Verify Indexes
    const indexes = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'fraud_alerts';`;
    console.log("\n--- Indexes ---");
    indexes.forEach(i => console.log(i.indexname));

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
