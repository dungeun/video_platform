const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // 새 비밀번호 해시 생성
    const newPassword = 'admin123!@#';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('Updating admin password...');
    console.log('New password:', newPassword);
    console.log('New hash:', hashedPassword);
    
    // 관리자 계정 업데이트
    const result = await prisma.users.update({
      where: {
        email: 'admin@videopick.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin password updated successfully!');
    console.log('Updated user:', {
      id: result.id,
      email: result.email,
      name: result.name,
      type: result.type
    });
    
    // 해시 검증
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();