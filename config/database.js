const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Connected to MongoDB via Prisma');
    return prisma;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB
};