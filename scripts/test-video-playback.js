#!/usr/bin/env node

// 비디오 재생 가능 여부를 테스트하는 스크립트

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const prisma = new PrismaClient();

async function testVideoPlayback() {
  try {
    console.log('🎬 비디오 재생 테스트 시작...\n');
    
    // 최근 업로드된 비디오 가져오기
    const videos = await prisma.videos.findMany({
      where: {
        status: 'published'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    if (videos.length === 0) {
      console.log('⚠️ 테스트할 비디오가 없습니다.');
      return;
    }
    
    console.log(`📹 ${videos.length}개 비디오 발견:\n`);
    
    for (const video of videos) {
      console.log(`\n테스트 중: ${video.title}`);
      console.log(`  ID: ${video.id}`);
      console.log(`  URL: ${video.videoUrl}`);
      
      // URL 유효성 체크
      if (!video.videoUrl) {
        console.log('  ❌ 비디오 URL이 없습니다');
        continue;
      }
      
      // localhost URL 체크
      if (video.videoUrl.includes('localhost')) {
        console.log('  ⚠️ localhost URL 감지 - 스토리지 서버 URL로 변경 필요');
        continue;
      }
      
      // HTTP HEAD 요청으로 비디오 접근 가능 여부 확인
      await checkVideoAccess(video.videoUrl);
    }
    
    console.log('\n\n📊 테스트 완료!');
    console.log('-----------------------------------');
    console.log('해결 방법:');
    console.log('1. localhost URL이 있다면 fix-video-urls.js 스크립트 실행');
    console.log('2. CORS 오류가 있다면 스토리지 서버 CORS 설정 확인');
    console.log('3. 404 오류가 있다면 스토리지 서버에 파일이 존재하는지 확인');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function checkVideoAccess(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    // URL 파싱
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoTest/1.0)',
        'Origin': 'http://localhost:3003'
      }
    };
    
    const req = protocol.request(options, (res) => {
      const { statusCode, headers } = res;
      
      if (statusCode === 200 || statusCode === 206) {
        console.log('  ✅ 비디오 접근 가능');
        
        // CORS 헤더 체크
        const corsHeader = headers['access-control-allow-origin'];
        if (corsHeader) {
          console.log(`  ✅ CORS 헤더 존재: ${corsHeader}`);
        } else {
          console.log('  ⚠️ CORS 헤더 없음 - 브라우저에서 재생 불가능할 수 있음');
        }
        
        // Content-Type 체크
        const contentType = headers['content-type'];
        if (contentType && contentType.includes('video')) {
          console.log(`  ✅ 올바른 Content-Type: ${contentType}`);
        } else {
          console.log(`  ⚠️ Content-Type 확인 필요: ${contentType}`);
        }
      } else if (statusCode === 404) {
        console.log('  ❌ 비디오 파일을 찾을 수 없음 (404)');
      } else if (statusCode === 403) {
        console.log('  ❌ 접근 권한 없음 (403)');
      } else {
        console.log(`  ⚠️ 예상치 못한 상태 코드: ${statusCode}`);
      }
      
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ 연결 실패: ${error.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('  ❌ 요청 시간 초과');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

// 스크립트 실행
testVideoPlayback();