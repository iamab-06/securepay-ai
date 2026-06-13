const prisma = require('../config/db');
const fraudRuleEngine = require('./fraudRuleEngine');

exports.addBeneficiary = async (ownerUserId, targetEmail, nickname) => {
  // 1. Validate target user exists
  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail }
  });

  if (!targetUser) {
    const err = new Error('User not found with that email address');
    err.statusCode = 404;
    throw err;
  }

  // 2. Prevent self-addition
  if (targetUser.id === ownerUserId) {
    const err = new Error('Cannot add yourself as beneficiary');
    err.statusCode = 400;
    throw err;
  }

  // 3. Prevent duplicates explicitly
  const existing = await prisma.beneficiary.findFirst({
    where: {
      owner_user_id: ownerUserId,
      beneficiary_user_id: targetUser.id
    }
  });

  if (existing) {
    const err = new Error('Beneficiary already exists');
    err.statusCode = 400;
    throw err;
  }

  // 4. Create beneficiary
  const beneficiary = await prisma.beneficiary.create({
    data: {
      owner_user_id: ownerUserId,
      beneficiary_user_id: targetUser.id,
      nickname: nickname || targetUser.name
    },
    include: {
      beneficiary: {
        select: { name: true, email: true }
      }
    }
  });

  // ---- PHASE 7: ASYNC FRAUD ALERT GENERATION ----
  fraudRuleEngine.evaluateBeneficiaryRules(ownerUserId).catch(err => console.error('[FRAUD ALERT EXCEPTION]', err));

  return beneficiary;
};

exports.getBeneficiaries = async (ownerUserId) => {
  return prisma.beneficiary.findMany({
    where: { owner_user_id: ownerUserId },
    include: {
      beneficiary: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
};

exports.removeBeneficiary = async (ownerUserId, beneficiaryId) => {
  // Ensure the beneficiary belongs to the user
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId }
  });

  if (!beneficiary || beneficiary.owner_user_id !== ownerUserId) {
    const err = new Error('Beneficiary not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  await prisma.beneficiary.delete({
    where: { id: beneficiaryId }
  });

  return { success: true };
};
