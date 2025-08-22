const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding default admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'manoj@mntfuture.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const saltRounds = 12;
    const defaultPassword = 'Admin@123'; // You can change this
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    const admin = await prisma.user.create({
      data: {
        email: 'manoj@mntfuture.com',
        password: hashedPassword,
        name: 'Manoj Admin',
        role: 'admin',
        isActive: true,
        isVerified: true, // Admin is pre-verified
        provider: 'local',
        subscription: 'enterprise', // Admin gets enterprise subscription
        chatbotsLimit: 999, // Admin gets unlimited chatbots
        organizationId: null // Admin is not part of any organization
      }
    });

    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: manoj@mntfuture.com');
    console.log('🔑 Password: Admin@123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAdmin();