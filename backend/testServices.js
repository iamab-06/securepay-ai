const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const activityService = require('./src/services/activityService');
const auditService = require('./src/services/auditService');
const notificationService = require('./src/services/notificationService');

async function testServices() {
  console.log('--- Testing Internal Event Services ---');

  // Fetch an admin and a user to simulate events (or just use random uuids for isolated test)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No users found in database to test with.');
    return;
  }

  // 1. Test ActivityService
  await activityService.logActivity({
    userId: user.id,
    type: 'USER_LOGGED_IN',
    ipAddress: '192.168.1.1',
    device: 'Chrome / Windows',
    metadata: { test: true }
  });
  console.log('✅ ActivityService triggered');

  // 2. Test AuditService
  await auditService.logAdminAction({
    adminId: user.id, // Just using the first user as a mock admin
    action: 'TEST_AUDIT',
    targetId: 'wallet-xyz',
    details: { oldStatus: 'ACTIVE', newStatus: 'FROZEN' }
  });
  console.log('✅ AuditService triggered');

  // 3. Test NotificationService
  await notificationService.createNotification({
    userId: user.id,
    type: 'LIMIT_WARNING',
    title: 'Approaching KYC Limit',
    message: 'You have transferred 45k. Complete KYC to lift your limits.',
    actionUrl: '/settings/kyc',
    metadata: { limit: 50000, current: 45000 }
  });
  console.log('✅ NotificationService triggered');

  // Validate writes
  const activities = await prisma.userActivity.count();
  const audits = await prisma.adminAuditLog.count();
  const notifications = await prisma.notification.count();

  console.log(`\nValidation Results:
  - User Activities: ${activities}
  - Admin Audit Logs: ${audits}
  - Notifications: ${notifications}
  `);

  if (activities > 0 && audits > 0 && notifications > 0) {
    console.log('SUCCESS: All internal services successfully write to Neon.');
  } else {
    console.log('FAILURE: Missing records.');
  }
}

testServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
