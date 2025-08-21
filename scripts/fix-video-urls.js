#!/usr/bin/env node

// 비디오 URL을 올바른 스토리지 서버 URL로 수정하는 스크립트

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVideoUrls() {
  try {
    console.log('비디오 URL 수정 시작...');
    
    // localhost URL을 가진 모든 비디오 찾기
    const videos = await prisma.videos.findMany({
      where: {
        OR: [
          { videoUrl: { contains: 'localhost' } },
          { videoUrl: { contains: '/api/upload/tus/' } }
        ]
      }
    });
    
    console.log(`수정할 비디오 ${videos.length}개 발견`);
    
    for (const video of videos) {
      let newUrl = video.videoUrl;
      
      // localhost URL을 storage.one-q.xyz로 변경
      if (video.videoUrl.includes('localhost')) {
        // URL에서 파일 ID 추출
        const match = video.videoUrl.match(/([a-f0-9-]{36})/);
        if (match) {
          const fileId = match[1];
          newUrl = `http://storage.one-q.xyz/${fileId}`;
          
          console.log(`비디오 ${video.id} URL 수정:`);
          console.log(`  이전: ${video.videoUrl}`);
          console.log(`  이후: ${newUrl}`);
          
          // 데이터베이스 업데이트
          await prisma.videos.update({
            where: { id: video.id },
            data: { videoUrl: newUrl }
          });
        }
      }
    }
    
    console.log('✅ 비디오 URL 수정 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
fixVideoUrls();