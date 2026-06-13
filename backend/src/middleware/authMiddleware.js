const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');
const prisma = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Not authorized to access this route', 401);
  }

  try {
    if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not configured');
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Add real-time DB check to universally enforce User Status even if token is valid
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      return errorResponse(res, 'User no longer exists', 401);
    }

    if (user.status === 'FROZEN' || user.status === 'SUSPENDED') {
      return errorResponse(res, `Account is ${user.status.toLowerCase()}. Access denied.`, 403);
    }

    req.user = { userId: user.id, role: user.role, status: user.status };
    next();
  } catch (err) {
    return errorResponse(res, 'Not authorized to access this route', 401);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};
