const express = require('express');
const passport = require('../../config/auth');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const {
  register,
  login,
  handleGoogleCallback,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  getAllUsers,
  updateUserRole,
  resendVerificationEmail,
  logout
} = require('../../controllers/auth/authController');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Google OAuth initiate
router.get('/google', 
  passport.authenticate('google', {  
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  handleGoogleCallback
);

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

// Admin only routes
router.get('/users', authenticateToken, getAllUsers);
router.put('/users/role', authenticateToken, updateUserRole);

module.exports = router;