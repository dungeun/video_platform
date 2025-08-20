const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // YouTube 비디오 조회
    const videos = await prisma.youTubeVideo.findMany({
      where: {
        status: 'published',
        featured: true
      },
      take: 4,
      orderBy: {
        publishedAt: 'desc'
      }
    })
    
    console.log('Featured YouTube videos:', videos.length)
    videos.forEach(v => {
      console.log(`- ${v.title} (featured: ${v.featured}, status: ${v.status})`)
    })
    
    // 모든 YouTube 비디오 상태 확인
    const allVideos = await prisma.youTubeVideo.findMany({
      select: {
        id: true,
        title: true,
        featured: true,
        status: true,
        category: true
      }
    })
    
    console.log('\nAll YouTube videos:', allVideos.length)
    allVideos.forEach(v => {
      console.log(`- ${v.title} (featured: ${v.featured}, status: ${v.status}, category: ${v.category})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()