const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi() {
  const user = await prisma.user.findFirst();
  if (!user) return console.log('no user');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET || 'supersecretjwtaccesskey', // WAIT! I used JWT_SECRET in hitApi.js!
    { expiresIn: '15m' }
  );

  const payload = JSON.stringify({
    panNumber: 'TESTP1234X',
    aadhaarNumber: '999988887777'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/kyc/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
  });

  req.on('error', e => console.error(e));
  req.write(payload);
  req.end();
}

testApi().finally(() => prisma.$disconnect());
