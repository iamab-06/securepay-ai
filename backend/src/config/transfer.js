/**
 * Centralized configuration for Transfer Engine.
 * Isolates business limits from logic to prepare for Phase 3 risk engine.
 */
module.exports = {
  limits: {
    MAX_TRANSFER_AMOUNT: 500000.00, // INR 5 Lakhs
    MIN_TRANSFER_AMOUNT: 1.00       // Minimum 1 INR
  },
  fees: {
    STANDARD_FEE_PERCENTAGE: 0.00
  }
};
