const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('데이터베이스 연결 중...');
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        password: true,
        createdAt: true
      }
    });
    
    console.log('\n=== 현재 등록된 사용자 ===');
    console.log(`총 ${users.length}명의 사용자가 있습니다.\n`);
    
    users.forEach((user, index) => {
      console.log(`[사용자 ${index + 1}]`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Type: ${user.type}`);
      console.log(`  Password: ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('---');
    });
    
    // 테스트 로그인
    console.log('\n=== 테스트 로그인 시도 ===');
    const testEmail = 'admin@videopick.com';
    const testUser = users.find(u => u.email === testEmail);
    
    if (testUser) {
      console.log(`✅ ${testEmail} 계정 존재`);
      console.log(`   Type: ${testUser.type}`);
      console.log(`   Password hash: ${testUser.password ? testUser.password.substring(0, 30) + '...' : 'No password'}`);
    } else {
      console.log(`❌ ${testEmail} 계정이 없습니다.`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();