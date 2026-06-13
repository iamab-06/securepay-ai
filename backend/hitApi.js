const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApi() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst();
    if (!user) return console.log('no user');

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey123!@#',
      { expiresIn: '15m' }
    );

    console.log('Generated token, sending request to http://localhost:5000/api/kyc/submit');

    const kycRes = await axios.post('http://localhost:5000/api/kyc/submit', {
      panNumber: 'TESTP1234X',
      aadhaarNumber: '999988887777'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('KYC successful:', kycRes.data);

  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
  }
}

testApi();
