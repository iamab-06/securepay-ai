const prisma = require('../config/db');

exports.evaluateTransferRisk = async (senderWalletId, receiverWalletId, amount) => {
  let score = 0;
  const flaggedRules = [];

  const transferAmount = Number(amount);

  // RULE 1: LARGE TRANSFER RISK
  if (transferAmount > 10000) {
    score += 50;
    flaggedRules.push({ code: "LARGE_TRANSFER_RISK", score: 50 });
  }

  // RULE 2: VELOCITY RISK
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentTransfersCount = await prisma.transaction.count({
    where: {
      sender_wallet_id: senderWalletId,
      created_at: { gte: tenMinutesAgo }
    }
  });

  if (recentTransfersCount > 3) {
    score += 40;
    flaggedRules.push({ code: "VELOCITY_RISK", score: 40 });
  }

  // RULE 3: NEW BENEFICIARY RISK
  // We need to resolve wallet IDs to user IDs to check the Beneficiary table.
  const senderWallet = await prisma.wallet.findUnique({ where: { id: senderWalletId }, select: { user_id: true } });
  const receiverWallet = await prisma.wallet.findUnique({ where: { id: receiverWalletId }, select: { user_id: true } });

  if (senderWallet && receiverWallet) {
    const beneficiaryLink = await prisma.beneficiary.findUnique({
      where: {
        owner_user_id_beneficiary_user_id: {
          owner_user_id: senderWallet.user_id,
          beneficiary_user_id: receiverWallet.user_id
        }
      }
    });

    if (beneficiaryLink) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (new Date(beneficiaryLink.created_at) > twentyFourHoursAgo) {
        score += 20;
        flaggedRules.push({ code: "NEW_BENEFICIARY_RISK", score: 20 });
      }
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score,
    flaggedRules,
    isBlocked: score >= 80
  };
};
