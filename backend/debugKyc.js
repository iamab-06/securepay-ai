const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const kycController = require('./src/controllers/kycController');

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user');
    return;
  }

  const req = {
    body: {
      panNumber: 'TESTP1234X',
      aadhaarNumber: '999988887777'
    },
    user: { id: user.id },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'TestScript' }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response:', this.statusCode, data);
    }
  };

  await kycController.submitKyc(req, res);
}

test().finally(() => prisma.$disconnect());
