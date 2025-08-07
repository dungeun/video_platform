const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = 'admin@videopick.com';
  const password = 'admin123!';
  
  try {
    // Check if admin already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Admin user already exists');
      console.log('Email:', email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique ID (using timestamp + random string)
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const adminUser = await prisma.users.create({
      data: {
        id: adminId,
        email,
        password: hashedPassword,
        name: 'Admin',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        updatedAt: new Date(),
      },
    });

    console.log('Admin user created successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', adminUser.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });