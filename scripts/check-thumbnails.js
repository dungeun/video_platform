const { PrismaClient } = require('@prisma/client');

// 환경변수 설정 확인
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://videopick:secure_password_here@localhost:5433/videopick";
console.log('Using DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function checkThumbnails() {
  try {
    const videos = await prisma.videos.findMany({
      where: {
        AND: [
          { thumbnailUrl: { not: '' } },
          { thumbnailUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('\n=== Videos with thumbnails ===');
    videos.forEach(video => {
      console.log(`
ID: ${video.id}
Title: ${video.title}
Thumbnail: ${video.thumbnailUrl ? video.thumbnailUrl.substring(0, 100) + '...' : 'NULL'}
Status: ${video.status}
Created: ${video.createdAt}
---`);
    });

    // Also check videos without thumbnails
    const videosWithoutThumbnails = await prisma.videos.findMany({
      where: {
        OR: [
          { thumbnailUrl: null },
          { thumbnailUrl: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n=== Videos WITHOUT thumbnails ===');
    videosWithoutThumbnails.forEach(video => {
      console.log(`
ID: ${video.id}
Title: ${video.title}
Status: ${video.status}
Created: ${video.createdAt}
---`);
    });

    // Get total counts
    const totalVideos = await prisma.videos.count();
    const videosWithThumbnailCount = await prisma.videos.count({
      where: {
        AND: [
          { thumbnailUrl: { not: '' } },
          { thumbnailUrl: { not: null } }
        ]
      }
    });

    console.log('\n=== Summary ===');
    console.log(`Total videos: ${totalVideos}`);
    console.log(`Videos with thumbnails: ${videosWithThumbnailCount}`);
    console.log(`Videos without thumbnails: ${totalVideos - videosWithThumbnailCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThumbnails();