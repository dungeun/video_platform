const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = "postgresql://videopick:secure_password_here@localhost:5433/videopick";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function checkThumbnails() {
  try {
    // 모든 비디오 가져오기
    const allVideos = await prisma.videos.findMany({
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n=== All Videos ===');
    console.log(`Total videos: ${allVideos.length}`);
    
    const videosWithThumbnails = allVideos.filter(v => v.thumbnailUrl && v.thumbnailUrl !== '');
    const videosWithoutThumbnails = allVideos.filter(v => !v.thumbnailUrl || v.thumbnailUrl === '');
    
    console.log(`Videos with thumbnails: ${videosWithThumbnails.length}`);
    console.log(`Videos without thumbnails: ${videosWithoutThumbnails.length}`);
    
    console.log('\n=== Videos WITH thumbnails ===');
    videosWithThumbnails.forEach(video => {
      console.log(`
ID: ${video.id}
Title: ${video.title}
Thumbnail: ${video.thumbnailUrl.substring(0, 100)}${video.thumbnailUrl.length > 100 ? '...' : ''}
Status: ${video.status}
---`);
    });
    
    if (videosWithoutThumbnails.length > 0) {
      console.log('\n=== Videos WITHOUT thumbnails ===');
      videosWithoutThumbnails.forEach(video => {
        console.log(`
ID: ${video.id}
Title: ${video.title}
Status: ${video.status}
---`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThumbnails();