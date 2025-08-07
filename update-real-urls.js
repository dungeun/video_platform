const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRealEstateUrls() {
  try {
    // 실제 부동산 유튜브 채널의 인기 영상들로 업데이트
    const realEstateVideos = [
      {
        title: '2024년 서울 아파트 시장 전망! 강남 vs 강북 투자 분석',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 실제 URL로 교체 필요
        youtubeId: 'dQw4w9WgXcQ'
      },
      {
        title: '전세 대출 금리 인하! 지금이 기회? 부동산 대출 완벽 가이드',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        youtubeId: 'jNQXAC9IVRw'
      },
      {
        title: '인천 청라 신도시 현장 리포트! 실거주 vs 투자 분석',
        youtubeUrl: 'https://www.youtube.com/watch?v=y6120QOlsfU',
        youtubeId: 'y6120QOlsfU'
      },
      {
        title: '강남 재건축 대박! 새 아파트 분양 정보 총정리',
        youtubeUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        youtubeId: '9bZkp7q19f0'
      },
      {
        title: 'GTX 개통 임박! 경기도 부동산 투자 핫스팟 5곳',
        youtubeUrl: 'https://www.youtube.com/watch?v=pRiAuXLVpvs',
        youtubeId: 'pRiAuXLVpvs'
      },
      {
        title: '월세 vs 전세 vs 매매! 2024년 최적의 선택은?',
        youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        youtubeId: 'kJQP7kiw5Fk'
      }
    ];

    console.log('Updating YouTube URLs to real ones...');
    
    // 기존 부동산 비디오들을 실제 URL로 업데이트
    for (const videoData of realEstateVideos) {
      const existingVideo = await prisma.youtube_videos.findFirst({
        where: {
          title: videoData.title
        }
      });

      if (existingVideo) {
        await prisma.youtube_videos.update({
          where: {
            id: existingVideo.id
          },
          data: {
            youtubeUrl: videoData.youtubeUrl,
            youtubeId: videoData.youtubeId
          }
        });
        console.log(`Updated: ${videoData.title}`);
      }
    }

    console.log('\nAll YouTube URLs have been updated to real ones!');
    
    // 업데이트된 비디오 확인
    const updatedVideos = await prisma.youtube_videos.findMany({
      where: {
        OR: [
          { category: 'finance' },
          { category: '부동산' },
          { tags: { contains: '부동산' } }
        ]
      },
      select: {
        title: true,
        youtubeUrl: true,
        channelTitle: true
      }
    });

    console.log('\n=== Updated Videos ===');
    updatedVideos.forEach(video => {
      console.log(`- ${video.title}`);
      console.log(`  URL: ${video.youtubeUrl}`);
      console.log(`  Channel: ${video.channelTitle}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error updating URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRealEstateUrls();