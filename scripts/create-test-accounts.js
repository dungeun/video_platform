const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://videopick:secure_password_here@localhost:5433/videopick?schema=public"
});

async function createTestAccounts() {
  try {
    const accounts = [
      {
        id: 'user-demo-001',
        email: 'user@test.com',
        password: 'password',
        name: '일반유저',
        type: 'USER'
      },
      {
        id: 'streamer-demo-001',
        email: 'streamer@test.com',
        password: 'password',
        name: '스트리머',
        type: 'INFLUENCER'  // 스트리머는 INFLUENCER 타입 사용
      },
      {
        id: 'admin-demo-001',
        email: 'admin@test.com',
        password: 'password',
        name: '관리자',
        type: 'ADMIN'
      }
    ];

    for (const account of accounts) {
      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      // 기존 계정 확인
      const existingUser = await prisma.users.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        // 기존 계정 업데이트
        const updated = await prisma.users.update({
          where: { email: account.email },
          data: {
            password: hashedPassword,
            name: account.name,
            type: account.type,
            status: 'ACTIVE',
            verified: true
          }
        });
        console.log(`✅ 계정 업데이트: ${updated.email} (${updated.type})`);
      } else {
        // 새 계정 생성
        const created = await prisma.users.create({
          data: {
            id: account.id,
            email: account.email,
            password: hashedPassword,
            name: account.name,
            type: account.type,
            status: 'ACTIVE',
            verified: true
          }
        });
        console.log(`✅ 계정 생성: ${created.email} (${created.type})`);
      }
    }

    console.log('\n📋 테스트 계정 정보:');
    console.log('------------------------');
    accounts.forEach(acc => {
      console.log(`${acc.name}:`);
      console.log(`  Email: ${acc.email}`);
      console.log(`  Password: ${acc.password}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();