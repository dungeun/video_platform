const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin account...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.users.create({
      data: {
        id: 'admin-' + Date.now(),
        email: 'admin@videopick.com',
        password: hashedPassword,
        name: '관리자',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('Admin account created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin account already exists');
    } else {
      console.error('Error creating admin account:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();