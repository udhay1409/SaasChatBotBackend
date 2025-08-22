const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
        errorType: 'NO_TOKEN',
        redirectTo: '/signin'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: token,
        expires: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        errorType: 'SESSION_EXPIRED',
        redirectTo: '/signin'
      });
    }
    
    // Check if user exists and get full user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        organizationId: true,
        subscription: true,
        chatbotsLimit: true,
        image: true
      }
    });

    if (!user) {
      // Clean up invalid session
      await prisma.session.deleteMany({
        where: { sessionToken: token }
      });
      
      return res.status(401).json({
        success: false,
        error: 'User not found',
        errorType: 'USER_NOT_FOUND',
        redirectTo: '/signin'
      });
    }

    // Check if user is verified - Admin users are always considered verified
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email address before accessing the dashboard',
        errorType: 'EMAIL_NOT_VERIFIED',
        redirectTo: '/signin'
      });
    }

    // Check if user is active - Admin users are always allowed
    if (!user.isActive && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated. Please contact admin for assistance.",
        errorType: 'ACCOUNT_DISABLED',
        redirectTo: '/signin'
      });
    }

    // Add user info to request
    req.userId = user.id;
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        errorType: 'INVALID_TOKEN',
        redirectTo: '/signin'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        errorType: 'TOKEN_EXPIRED',
        redirectTo: '/signin'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      errorType: 'AUTH_ERROR',
      redirectTo: '/signin'
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isVerified: true
        }
      });

      if (user && user.isActive) {
        req.userId = user.id;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};