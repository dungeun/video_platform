const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkYouTubeVideos() {
  try {
    const count = await prisma.youtube_videos.count();
    console.log('Total YouTube videos:', count);
    
    if (count > 0) {
      const videos = await prisma.youtube_videos.findMany({
        select: {
          id: true,
          title: true,
          category: true,
          tags: true,
        },
        take: 5,
      });
      
      console.log('\nFirst 5 videos:');
      videos.forEach(v => {
        console.log(`- ${v.title} (category: ${v.category || 'none'}, tags: ${v.tags || 'none'})`);
      });
      
      // Check for real estate videos
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
      
      console.log('\nReal estate related videos:', realEstateCount);
    } else {
      console.log('\nNo YouTube videos in database. You need to import some videos first.');
      console.log('Use the admin panel at /admin/youtube to import videos.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYouTubeVideos();