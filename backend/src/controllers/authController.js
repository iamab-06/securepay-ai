const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

// Helper to set cookie
const setTokenCookie = (res, token) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, wallet, accessToken, refreshToken } = await authService.registerUser(name, email, password);
    
    setTokenCookie(res, refreshToken);
    return successResponse(res, { user, wallet, access_token: accessToken }, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const device = req.headers['user-agent'];
    
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password, ipAddress, device);
    
    setTokenCookie(res, refreshToken);
    return successResponse(res, { user, access_token: accessToken });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      const err = new Error('No refresh token provided');
      err.statusCode = 401;
      throw err;
    }

    const tokens = await authService.refreshTokens(refreshToken);
    setTokenCookie(res, tokens.refreshToken);
    return successResponse(res, { access_token: tokens.accessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // Requires protection middleware if we extract userId
    if (req.user) {
      await authService.logoutUser(req.user.userId);
    }
    
    res.cookie('refresh_token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    return successResponse(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.userId);
    return successResponse(res, { user });
  } catch (err) {
    next(err);
  }
};
