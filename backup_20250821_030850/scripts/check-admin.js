const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin users...\n');
    
    // Find all admin users
    const adminUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: 'admin@videopick.com' },
          { type: 'ADMIN' },
          { email: { contains: 'admin' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        verified: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('\nWould you like to create one? Run: node scripts/create-admin.js');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach(user => {
        console.log('---');
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('Type:', user.type);
        console.log('Status:', user.status);
        console.log('Verified:', user.verified);
        console.log('Created:', user.createdAt);
      });
    }

    // Check total users
    const totalUsers = await prisma.users.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
    if (error.code === 'P2021') {
      console.log('\n⚠️  Table does not exist. Run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();