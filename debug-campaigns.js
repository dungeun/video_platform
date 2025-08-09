const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

process.env.DATABASE_URL = 'postgres://linkpick_user:LinkPick2024!@coolify.one-q.xyz:5433/revu_platform';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testCampaignQuery() {
  try {
    console.log('Testing campaign query...');
    
    // 간단한 쿼리 먼저 테스트
    const simpleCount = await prisma.campaigns.count();
    console.log('Campaign count:', simpleCount);
    
    // 복잡한 쿼리 테스트
    const campaigns = await prisma.campaigns.findMany({
      include: {
        business: {
          select: {
            id: true,
            email: true,
            name: true,
            businessProfile: {
              select: {
                businessName: true,
                businessCategory: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      take: 5
    });
    
    console.log('Found campaigns:', campaigns.length);
    console.log('First campaign:', JSON.stringify(campaigns[0], null, 2));
    
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignQuery();