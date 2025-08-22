const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('./database');
const { sendEmail } = require('./connectSMTP');

// Generate random token for verification
const generateRandomToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.emails[0].value },
          { googleId: profile.id }
        ]
      }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          name: profile.displayName,
          image: profile.photos[0].value,
          provider: 'google',
          lastLogin: new Date()
        }
      });
    } else {
      // Determine user role
      let userRole = 'user';
      const adminEmails = ['manoj@mntfuture.com', 'admin@company.com'];
      if (adminEmails.includes(profile.emails[0].value.toLowerCase())) {
        userRole = 'admin';
      }

      // Generate verification token
      const verificationToken = generateRandomToken();

      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          googleId: profile.id,
          name: profile.displayName,
          image: profile.photos[0].value,
          provider: 'google',
          isVerified: false, // Google users also need verification
          verificationToken,
          role: userRole,
          lastLogin: new Date(),
          subscription: 'free',
          chatbotsLimit: 1,
          isActive: true
        }
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      const emailData = {
        to: profile.emails[0].value,
        subject: 'Verify Your Email - Employee Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Employee Management System!</h2>
            <p>Hi ${profile.displayName},</p>
            <p>Thank you for signing up with Google. Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        `
      };

      try {
        await sendEmail(null, emailData);
      } catch (emailError) {
        console.error('Failed to send verification email to Google user:', emailError);
      }
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth Strategy error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        isVerified: true,
        isActive: true,
        organizationId: true,
        subscription: true,
        chatbotsLimit: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;