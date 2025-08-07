const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addRealEstateVideos() {
  try {
    // Get admin user first
    const adminUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { type: 'ADMIN' },
        ],
      },
    });
    
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }
    
    console.log(`Using admin user: ${adminUser.email} (${adminUser.id})`);
    
    const videos = [
      {
        id: `yt_realestate_${Date.now()}_1`,
        youtubeId: 'sample_re_001',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_001',
        title: '2024년 서울 아파트 시장 전망! 강남 vs 강북 투자 분석',
        description: '부동산 전문가가 분석하는 2024년 서울 아파트 시장 전망과 투자 전략',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop',
        channelTitle: '부동산 박사TV',
        channelId: 'channel_realestate_001',
        duration: 'PT15M30S',
        viewCount: BigInt(156000),
        likeCount: 2800,
        commentCount: 342,
        publishedAt: new Date('2024-01-15'),
        tags: '부동산,아파트,투자,서울,강남',
        category: 'finance',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
      {
        id: `yt_realestate_${Date.now()}_2`,
        youtubeId: 'sample_re_002',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_002',
        title: '전세 대출 금리 인하! 지금이 기회? 부동산 대출 완벽 가이드',
        description: '최근 전세대출 금리 변화와 대출 받기 좋은 타이밍 분석',
        thumbnailUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=450&fit=crop',
        channelTitle: '대출 전문가',
        channelId: 'channel_loan_001',
        duration: 'PT12M45S',
        viewCount: BigInt(98000),
        likeCount: 1650,
        commentCount: 287,
        publishedAt: new Date('2024-01-14'),
        tags: '부동산,전세,대출,금리,재테크',
        category: 'finance',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
      {
        id: `yt_realestate_${Date.now()}_3`,
        youtubeId: 'sample_re_003',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_003',
        title: '인천 청라 신도시 현장 리포트! 실거주 vs 투자 분석',
        description: '청라 신도시의 현재 상황과 향후 전망을 현장에서 직접 확인',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
        channelTitle: '현장 탐방러',
        channelId: 'channel_field_001',
        duration: 'PT18M20S',
        viewCount: BigInt(67000),
        likeCount: 1200,
        commentCount: 195,
        publishedAt: new Date('2024-01-11'),
        tags: '부동산,청라,신도시,인천,아파트',
        category: '부동산',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
      {
        id: `yt_realestate_${Date.now()}_4`,
        youtubeId: 'sample_re_004',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_004',
        title: '강남 재건축 대박! 새 아파트 분양 정보 총정리',
        description: '강남 재건축 단지의 최신 분양 정보와 투자 포인트',
        thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=450&fit=crop',
        channelTitle: '부동산 왕',
        channelId: 'channel_king_001',
        duration: 'PT14M25S',
        viewCount: BigInt(189000),
        likeCount: 3200,
        commentCount: 456,
        publishedAt: new Date('2024-01-16'),
        tags: '부동산,강남,재건축,분양,투자',
        category: 'finance',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
      {
        id: `yt_realestate_${Date.now()}_5`,
        youtubeId: 'sample_re_005',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_005',
        title: 'GTX 개통 임박! 경기도 부동산 투자 핫스팟 5곳',
        description: 'GTX 개통으로 주목받는 경기도 부동산 투자 지역 완벽 분석',
        thumbnailUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=450&fit=crop',
        channelTitle: '투자의 신',
        channelId: 'channel_invest_001',
        duration: 'PT20M10S',
        viewCount: BigInt(234000),
        likeCount: 4100,
        commentCount: 523,
        publishedAt: new Date('2024-01-17'),
        tags: '부동산,GTX,경기도,투자,재테크',
        category: 'finance',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
      {
        id: `yt_realestate_${Date.now()}_6`,
        youtubeId: 'sample_re_006',
        youtubeUrl: 'https://youtube.com/watch?v=sample_re_006',
        title: '월세 vs 전세 vs 매매! 2024년 최적의 선택은?',
        description: '부동산 전문가가 알려주는 주거 형태별 장단점 완벽 분석',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&h=450&fit=crop',
        channelTitle: '부동산 컨설팅',
        channelId: 'channel_consult_001',
        duration: 'PT16M50S',
        viewCount: BigInt(145000),
        likeCount: 2500,
        commentCount: 389,
        publishedAt: new Date('2024-01-13'),
        tags: '부동산,월세,전세,매매,재테크',
        category: 'finance',
        importedBy: adminUser.id,
        importedAt: new Date(),
      },
    ];

    console.log('Adding real estate YouTube videos...');
    
    for (const video of videos) {
      await prisma.youtube_videos.create({
        data: video,
      });
      console.log(`Added: ${video.title}`);
    }
    
    const totalCount = await prisma.youtube_videos.count();
    const realEstateCount = await prisma.youtube_videos.count({
      where: {
        OR: [
          { category: 'finance' },
          { category: '부동산' },
          { tags: { contains: '부동산' } },
          { tags: { contains: '재테크' } },
          { title: { contains: '부동산' } },
          { description: { contains: '부동산' } },
        ],
      },
    });
    
    console.log(`\nTotal YouTube videos: ${totalCount}`);
    console.log(`Real estate related videos: ${realEstateCount}`);
    console.log('\nVideos added successfully!');
    
  } catch (error) {
    console.error('Error adding videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRealEstateVideos();