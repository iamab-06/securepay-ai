const crypto = require('crypto');

/**
 * Generates a unique, human-readable wallet number.
 * Format: SP-XXXXXXXX
 */
exports.generateWalletNumber = () => {
  // Generate 8 random digits securely
  const randomBytes = crypto.randomBytes(4);
  const number = Math.abs(randomBytes.readInt32BE(0) % 100000000);
  const paddedNumber = number.toString().padStart(8, '0');
  return `SP-${paddedNumber}`;
};
