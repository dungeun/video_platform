const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function uploadCampaigns() {
  try {
    console.log('🗑️  기존 캠페인 데이터 삭제 중...');
    
    // 기존 캠페인 관련 데이터 삭제
    await prisma.campaignApplication.deleteMany({});
    await prisma.campaign.deleteMany({});
    
    console.log('✅ 기존 데이터 삭제 완료\n');
    
    // 크롤링된 데이터 읽기
    const campaignsPath = path.join(__dirname, '../public/crawled-campaigns.json');
    const campaigns = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
    
    console.log(`📋 ${campaigns.length}개의 캠페인 업로드 시작...\n`);
    
    // 테스트용 비즈니스 사용자 찾기 또는 생성
    let businessUser = await prisma.user.findFirst({
      where: { type: 'BUSINESS' }
    });
    
    if (!businessUser) {
      console.log('⚠️  비즈니스 사용자가 없어 생성합니다...');
      businessUser = await prisma.user.create({
        data: {
          email: 'business@revu.net',
          password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // secret
          name: 'Revu Business',
          type: 'BUSINESS',
          phone: '02-1234-5678',
          emailVerified: true
        }
      });
      console.log('✅ 비즈니스 사용자 생성 완료\n');
    }
    
    // 캠페인 데이터 변환 및 업로드
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      try {
        // 플랫폼 매핑
        const platformMap = {
          '인스타그램': 'INSTAGRAM',
          '유튜브': 'YOUTUBE',
          '블로그': 'BLOG',
          '틱톡': 'TIKTOK'
        };
        
        const platform = platformMap[campaign.platform] || 'INSTAGRAM';
        
        // 날짜 파싱
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14);
        
        if (campaign.info?.period) {
          const periodMatch = campaign.info.period.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/g);
          if (periodMatch && periodMatch.length >= 2) {
            const [startStr, endStr] = periodMatch;
            const [sy, sm, sd] = startStr.split('.').map(s => parseInt(s.trim()));
            const [ey, em, ed] = endStr.split('.').map(s => parseInt(s.trim()));
            
            startDate.setFullYear(sy, sm - 1, sd);
            endDate.setFullYear(ey, em - 1, ed);
          }
        }
        
        // 모집인원 파싱
        let maxApplicants = 10;
        if (campaign.info?.participants) {
          const match = campaign.info.participants.match(/(\d+)/);
          if (match) maxApplicants = parseInt(match[1]);
        }
        
        // 캠페인 생성
        const createdCampaign = await prisma.campaign.create({
          data: {
            businessId: businessUser.id,
            title: campaign.title || `캠페인 ${i + 1}`,
            description: campaign.description || '캠페인 설명',
            platform: platform,
            budget: Math.floor(Math.random() * 500000) + 100000, // 10만원 ~ 60만원
            targetFollowers: campaign.requirements?.followers || 1000,
            startDate: startDate,
            endDate: endDate,
            requirements: campaign.provides ? campaign.provides.join('\n') : '제품 제공',
            hashtags: `#${campaign.brand || 'revu'} #체험단`,
            imageUrl: campaign.thumbnail,
            imageId: campaign.detailImage,
            status: campaign.status === 'CLOSED' ? 'COMPLETED' : 'APPROVED',
            isPaid: true,
            maxApplicants: maxApplicants,
            viewCount: campaign.viewCount || Math.floor(Math.random() * 1000) + 100,
            location: '전국',
            detailedRequirements: JSON.stringify([
              '제품 사용 후 솔직한 리뷰 작성',
              '실사용 사진 3장 이상 포함',
              '지정 해시태그 필수 포함'
            ]),
            deliverables: JSON.stringify(campaign.provides || ['제품 정품 1개', '무료 배송']),
            productIntro: campaign.description,
            productImages: JSON.stringify([campaign.detailImage])
          }
        });
        
        console.log(`✓ [${i + 1}/${campaigns.length}] ${campaign.title}`);
        
      } catch (error) {
        console.error(`✗ [${i + 1}/${campaigns.length}] 실패: ${error.message}`);
      }
    }
    
    // 통계
    const totalCampaigns = await prisma.campaign.count();
    const activeCampaigns = await prisma.campaign.count({
      where: { status: 'APPROVED' }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 캠페인 업로드 완료!');
    console.log('='.repeat(50));
    console.log(`📊 총 캠페인: ${totalCampaigns}개`);
    console.log(`🟢 진행중: ${activeCampaigns}개`);
    console.log(`⏸️  종료: ${totalCampaigns - activeCampaigns}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
uploadCampaigns()
  .then(() => {
    console.log('\n프로세스 완료');
    process.exit(0);
  })
  .catch(err => {
    console.error('실행 오류:', err);
    process.exit(1);
  });