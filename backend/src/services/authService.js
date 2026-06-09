const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
const { generateWalletNumber } = require('../utils/walletGenerator');

exports.registerUser = async (name, email, password) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error('Email is already registered');
    err.statusCode = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Generate a unique wallet number. In production, retry logic would be added for collisions.
  const walletNumber = generateWalletNumber();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password_hash
      }
    });

    const wallet = await tx.wallet.create({
      data: {
        user_id: user.id,
        wallet_number: walletNumber,
        balance: 0.00
      }
    });

    const ledgerAccount = await tx.ledgerAccount.create({
      data: {
        wallet_id: wallet.id,
        account_code: `USR-WALLET-${wallet.id}`,
        account_name: `${name} Wallet`
      }
    });

    return { user, wallet, ledgerAccount };
  });

  const accessToken = generateAccessToken(result.user.id, result.user.role);
  const refreshToken = generateRefreshToken(result.user.id);
  
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: result.user.id },
    data: { refresh_token: refreshHash }
  });

  delete result.user.password_hash;
  delete result.user.refresh_token;

  return { user: result.user, wallet: result.wallet, accessToken, refreshToken };
};

exports.loginUser = async (email, password, ipAddress, device) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  // Log History
  await prisma.loginHistory.create({
    data: {
      user_id: user.id,
      ip_address: ipAddress || 'Unknown',
      device: device || 'Unknown'
    }
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token: refreshHash }
  });

  delete user.password_hash;
  delete user.refresh_token;

  return { user, accessToken, refreshToken };
};

exports.refreshTokens = async (refreshToken) => {
  const jwt = require('jsonwebtoken');
  let decoded;
  
  try {
    if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.refresh_token) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refresh_token);
  if (!isMatch) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  const refreshHash = await bcrypt.hash(newRefreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token: refreshHash }
  });

  return { accessToken, refreshToken: newRefreshToken };
};

exports.logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refresh_token: null }
  });
};

exports.getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true }
  });
  
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  delete user.password_hash;
  delete user.refresh_token;

  return user;
};
