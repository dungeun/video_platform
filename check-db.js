const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    // Check total videos
    const totalVideos = await prisma.youtube_videos.count();
    console.log(`Total YouTube videos: ${totalVideos}`);
    
    // Check real estate videos
    const realEstateVideos = await prisma.youtube_videos.findMany({
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
      select: {
        id: true,
        title: true,
        category: true,
        tags: true
      }
    });
    
    console.log(`\nReal estate videos found: ${realEstateVideos.length}`);
    realEstateVideos.forEach(v => {
      console.log(`- ${v.title} (category: ${v.category}, tags: ${v.tags})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();