const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://videopick:secure_password_here@localhost:5433/videopick?schema=public"
});

async function updateAdminPassword() {
  try {
    const email = 'admin@test.com';
    const password = 'admin123!@#';
    
    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 업데이트
    const user = await prisma.users.update({
      where: { email },
      data: { 
        password: hashedPassword,
        verified: true
      }
    });
    
    console.log('✅ 비밀번호 업데이트 완료:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Type: ${user.type}`);
    console.log(`   Password: admin123!@#`);
    
  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();