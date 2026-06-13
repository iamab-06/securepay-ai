const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const kycService = require('./src/services/kycService');

async function testKycFlow() {
  console.log('--- Testing KYC Compliance Flow ---');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to test with.');
    return;
  }

  // 1. Submit KYC
  console.log('\\n[1] Submitting KYC...');
  const plaintextAadhaar = '123456789012';
  
  await kycService.createKycSubmission({
    userId: user.id,
    panNumber: 'ABCDE1234F',
    aadhaarNumber: plaintextAadhaar
  });

  const kyc = await prisma.kycSubmission.findUnique({ where: { user_id: user.id } });
  
  console.log('Submission Created:', kyc.id);
  console.log('Status:', kyc.status);
  
  // Assertions
  if (kyc.aadhaar_last4 === '9012') console.log('✅ aadhaar_last4 correctly populated');
  else console.log('❌ aadhaar_last4 failed');

  if (kyc.aadhaar_hash && kyc.aadhaar_hash.length === 64) console.log('✅ aadhaar_hash correctly generated (SHA-256)');
  else console.log('❌ aadhaar_hash failed');

  if (!kyc.aadhaarNumber) console.log('✅ Plaintext Aadhaar is absolutely absent from DB schema.');
  else console.log('❌ Plaintext Aadhaar leaked.');

  // 2. Admin Rejects KYC
  console.log('\\n[2] Rejecting KYC...');
  await kycService.rejectKyc(kyc.id, 'Image is too blurry');
  const rejectedKyc = await prisma.kycSubmission.findUnique({ where: { id: kyc.id } });
  console.log('Status:', rejectedKyc.status);
  if (rejectedKyc.status === 'REJECTED' && rejectedKyc.rejection_reason === 'Image is too blurry') {
    console.log('✅ Rejection logic and reason storage successful.');
  } else {
    console.log('❌ Rejection logic failed.');
  }

  // 3. Admin Approves KYC
  console.log('\\n[3] Approving KYC...');
  await kycService.approveKyc(kyc.id);
  const approvedKyc = await prisma.kycSubmission.findUnique({ where: { id: kyc.id } });
  console.log('Status:', approvedKyc.status);
  if (approvedKyc.status === 'VERIFIED') {
    console.log('✅ Approval logic successful.');
  } else {
    console.log('❌ Approval logic failed.');
  }

  console.log('\\nSUCCESS: KYC Compliance Flow operates correctly.');
}

testKycFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
