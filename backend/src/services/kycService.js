const crypto = require('crypto');
const prisma = require('../config/db');

class KycService {
  /**
   * Generates a SHA-256 hash for Aadhaar uniqueness and compliance checks.
   */
  generateAadhaarHash(aadhaarNumber) {
    if (!aadhaarNumber) return null;
    return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
  }

  /**
   * Submits a new KYC application for a user.
   */
  async createKycSubmission({ userId, panNumber, aadhaarNumber }) {
    // CRITICAL: Extract last 4 and hash immediately
    let aadhaarLast4 = null;
    let aadhaarHash = null;

    if (aadhaarNumber) {
      aadhaarLast4 = aadhaarNumber.slice(-4);
      aadhaarHash = this.generateAadhaarHash(aadhaarNumber);
    }

    // Check if submission already exists
    const existing = await prisma.kycSubmission.findUnique({
      where: { user_id: userId }
    });

    if (existing) {
      return prisma.kycSubmission.update({
        where: { user_id: userId },
        data: {
          pan_number: panNumber,
          aadhaar_last4: aadhaarLast4,
          aadhaar_hash: aadhaarHash,
          status: 'UNDER_REVIEW',
          rejection_reason: null
        }
      });
    }

    return prisma.kycSubmission.create({
      data: {
        user_id: userId,
        pan_number: panNumber,
        aadhaar_last4: aadhaarLast4,
        aadhaar_hash: aadhaarHash,
        status: 'UNDER_REVIEW'
      }
    });
  }

  /**
   * Retrieves KYC status for a user.
   */
  async getUserKycStatus(userId) {
    const kyc = await prisma.kycSubmission.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        status: true,
        rejection_reason: true,
        pan_number: true,
        aadhaar_last4: true,
        created_at: true,
        updated_at: true
        // aadhaar_hash is explicitly excluded
      }
    });
    return kyc;
  }

  /**
   * Admin approves a KYC submission.
   */
  async approveKyc(kycId) {
    return prisma.kycSubmission.update({
      where: { id: kycId },
      data: {
        status: 'VERIFIED',
        rejection_reason: null
      }
    });
  }

  /**
   * Admin rejects a KYC submission.
   */
  async rejectKyc(kycId, reason) {
    return prisma.kycSubmission.update({
      where: { id: kycId },
      data: {
        status: 'REJECTED',
        rejection_reason: reason || 'Information mismatch'
      }
    });
  }

  /**
   * Fetch paginated list of KYC queues for Admin
   */
  async getAdminKycQueue(status = 'UNDER_REVIEW') {
    return prisma.kycSubmission.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });
  }
}

module.exports = new KycService();
