#!/usr/bin/env node

// 비디오 URL을 MinIO 서버 직접 URL로 수정하는 스크립트

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVideoUrlsToMinio() {
  try {
    console.log('비디오 URL을 MinIO 서버로 수정 시작...');
    
    // 모든 비디오 가져오기
    const videos = await prisma.videos.findMany();
    
    console.log(`수정할 비디오 ${videos.length}개 발견`);
    
    const minioUrl = 'http://64.176.226.119:9000';
    const bucketName = 'videopick-videos'; // MinIO 버킷 이름
    
    for (const video of videos) {
      let newUrl = video.videoUrl;
      
      // storage.one-q.xyz URL을 MinIO 직접 URL로 변경
      if (video.videoUrl.includes('storage.one-q.xyz')) {
        // URL에서 파일 ID 추출
        const match = video.videoUrl.match(/([a-f0-9-]{36})/);
        if (match) {
          const fileId = match[1];
          // MinIO 직접 URL 형식으로 변경
          newUrl = `${minioUrl}/${bucketName}/${fileId}`;
          
          console.log(`비디오 ${video.id} URL 수정:`);
          console.log(`  이전: ${video.videoUrl}`);
          console.log(`  이후: ${newUrl}`);
          
          // 데이터베이스 업데이트
          await prisma.videos.update({
            where: { id: video.id },
            data: { videoUrl: newUrl }
          });
        }
      } else if (video.videoUrl.includes('localhost')) {
        // localhost URL도 MinIO로 변경
        const match = video.videoUrl.match(/([a-f0-9-]{36})/);
        if (match) {
          const fileId = match[1];
          newUrl = `${minioUrl}/${bucketName}/${fileId}`;
          
          console.log(`비디오 ${video.id} URL 수정:`);
          console.log(`  이전: ${video.videoUrl}`);
          console.log(`  이후: ${newUrl}`);
          
          await prisma.videos.update({
            where: { id: video.id },
            data: { videoUrl: newUrl }
          });
        }
      }
    }
    
    console.log('✅ 비디오 URL 수정 완료');
    
    // MinIO 접속 정보 출력
    console.log('\n📌 MinIO 설정 정보:');
    console.log(`  서버: ${minioUrl}`);
    console.log(`  버킷: ${bucketName}`);
    console.log('\n주의: MinIO 서버에서 다음 설정이 필요합니다:');
    console.log('1. 버킷 정책을 public으로 설정');
    console.log('2. CORS 설정 추가 (모든 origin 허용)');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
fixVideoUrlsToMinio();