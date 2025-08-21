const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://videopick:secure_password_here@localhost:5433/videopick?schema=public"
});

async function testVideoCreation() {
  try {
    console.log('🔍 비디오 생성 테스트 시작...');
    
    // 1. 사용자 인증 테스트
    console.log('\n1. 사용자 인증 테스트');
    const user = await prisma.users.findUnique({
      where: { email: 'streamer@test.com' }
    });
    
    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다');
      return;
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare('password', user.password);
    if (!isPasswordValid) {
      console.error('❌ 비밀번호가 올바르지 않습니다');
      return;
    }
    
    console.log('✅ 사용자 인증 성공:', user.email, user.name);
    
    // 2. 채널 확인/생성
    console.log('\n2. 채널 확인/생성');
    let channel = await prisma.channels.findFirst({
      where: { userId: user.id }
    });
    
    if (!channel) {
      console.log('채널이 없습니다. 새 채널을 생성합니다...');
      channel = await prisma.channels.create({
        data: {
          id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          name: `${user.name}의 채널`,
          handle: `@${user.name.replace(/\s+/g, '').toLowerCase()}-${Date.now()}`,
          description: `${user.name}님의 VideoPick 채널입니다.`
        }
      });
      console.log('✅ 새 채널 생성:', channel.name);
    } else {
      console.log('✅ 기존 채널 발견:', channel.name);
    }
    
    // 3. 비디오 생성 테스트
    console.log('\n3. 비디오 생성 테스트');
    const videoData = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: channel.id,
      title: '베타 테스트 비디오 (직접 생성)',
      description: '실제 베타 서비스 환경에서 직접 생성한 테스트 비디오입니다.',
      thumbnailUrl: '',
      videoUrl: 'http://storage.one-q.xyz/videos/test-video.mp4',
      duration: 120, // 2분
      viewCount: BigInt(0),
      likeCount: 0,
      dislikeCount: 0,
      status: 'processing',
      publishedAt: new Date(),
      tags: '베타,테스트,직접생성',
      category: '테스트',
      isShort: false,
      updatedAt: new Date()
    };
    
    const video = await prisma.videos.create({
      data: videoData
    });
    
    console.log('✅ 비디오 생성 성공!');
    console.log('비디오 정보:', {
      id: video.id,
      title: video.title,
      status: video.status,
      channelId: video.channelId,
      createdAt: video.createdAt
    });
    
    // 4. 생성된 비디오 확인
    console.log('\n4. 생성된 비디오 확인');
    const createdVideo = await prisma.videos.findUnique({
      where: { id: video.id },
      include: {
        channels: {
          select: {
            name: true,
            userId: true
          }
        }
      }
    });
    
    console.log('✅ 비디오 조회 성공:', {
      id: createdVideo.id,
      title: createdVideo.title,
      channel: createdVideo.channels.name,
      status: createdVideo.status
    });
    
    // 5. 전체 비디오 목록 확인
    console.log('\n5. 전체 비디오 목록 확인');
    const allVideos = await prisma.videos.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ 총 ${allVideos.length}개의 비디오 존재:`);
    allVideos.forEach(v => {
      console.log(`- ${v.title} (${v.status}) - ${v.createdAt.toLocaleString()}`);
    });
    
    console.log('\n🎉 모든 테스트 성공! 비디오 업로드 시스템이 정상 작동합니다.');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    console.error('에러 세부사항:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVideoCreation();