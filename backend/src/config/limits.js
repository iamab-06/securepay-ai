/**
 * Centralized Configuration for Transfer Limits & Risk Parameters
 */
module.exports = {
  TRANSFER_LIMITS: {
    TIER_1: {
      description: 'Unverified / KYC Pending',
      per_transaction: 10000,
      velocity: 50000
    },
    TIER_3: {
      description: 'Fully KYC Verified',
      per_transaction: 1000000,
      velocity: null // unlimited
    }
  }
};
