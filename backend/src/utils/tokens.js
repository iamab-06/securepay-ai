const jwt = require('jsonwebtoken');

exports.generateAccessToken = (userId, role) => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are not configured in environment variables');
  }
  return jwt.sign(
    { userId, role }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: '15m' }
  );
};

exports.generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
};
