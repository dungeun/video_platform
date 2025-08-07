import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all'; // all, trending, premium, recommended
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const sections: any = {};
    
    // Get trending videos (high views in last 7 days)
    if (section === 'all' || section === 'trending') {
      const trendingVideos = await prisma.videos.findMany({
        where: {
          status: 'published',
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
        ],
        take: limit,
      });
      
      sections.trending = trendingVideos.map(formatVideo);
    }
    
    // Get premium videos (현재는 카테고리 기반으로 대체)
    if (section === 'all' || section === 'premium') {
      const premiumVideos = await prisma.videos.findMany({
        where: {
          status: 'published',
          // isPremium 필드가 없으므로 viewCount가 높은 비디오를 프리미엄으로 간주
          viewCount: { gte: 50000 },
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
        ],
        take: limit,
      });
      
      sections.premium = premiumVideos.map(formatVideo);
    }
    
    // Get recommended videos (popular)
    if (section === 'all' || section === 'recommended') {
      const recommendedVideos = await prisma.videos.findMany({
        where: {
          status: 'published',
          viewCount: { gte: 10000 },
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit,
      });
      
      sections.recommended = recommendedVideos.map(formatVideo);
    }
    
    // Get latest videos
    if (section === 'all' || section === 'latest') {
      const latestVideos = await prisma.videos.findMany({
        where: {
          status: 'published',
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
      
      sections.latest = latestVideos.map(formatVideo);
    }
    
    // Get real estate YouTube videos (부동산 유튜브)
    if (section === 'all' || section === 'realestate') {
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
        orderBy: [
          { publishedAt: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit,
      });
      
      sections.realestate = realEstateVideos.map(formatYouTubeVideo);
    }
    
    // Get categories with video counts
    const categories = await prisma.$queryRaw`
      SELECT 
        COALESCE(category, 'general') as category,
        COUNT(*) as count
      FROM videos
      WHERE status = 'published'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    
    // Get statistics
    const stats = await prisma.videos.aggregate({
      where: { status: 'published' },
      _count: true,
      _sum: {
        viewCount: true,
      },
    });
    
    const channelCount = await prisma.channels.count();
    
    return NextResponse.json({
      success: true,
      sections,
      categories: categories.map((c: any) => ({
        name: getCategoryName(c.category),
        slug: c.category,
        count: parseInt(c.count),
      })),
      statistics: {
        totalVideos: stats._count,
        totalViews: stats._sum.viewCount?.toString() || '0',
        totalChannels: channelCount,
      },
    });
  } catch (error) {
    console.error('Error fetching home videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// Helper function to format video response
function formatVideo(video: any) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    viewCount: video.viewCount.toString(),
    likeCount: video.likeCount,
    category: video.category,
    isPremium: false, // videos 테이블에 이 필드가 없음
    isFeatured: false, // videos 테이블에 이 필드가 없음
    publishedAt: video.publishedAt,
    channel: {
      id: video.channels.id,
      name: video.channels.name,
      avatar: video.channels.avatarUrl,
      isVerified: video.channels.isVerified,
    },
  };
}

// Helper function to format YouTube video response
function formatYouTubeVideo(video: any) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    duration: parseDuration(video.duration || 'PT0S'),
    viewCount: video.viewCount?.toString() || '0',
    likeCount: video.likeCount?.toString() || '0',
    category: video.category,
    isPremium: false,
    isFeatured: false,
    publishedAt: video.publishedAt,
    youtubeId: video.youtubeId,
    channelTitle: video.channelTitle,
    channel: {
      id: video.channelId,
      name: video.channelTitle,
      avatar: video.channelThumbnail,
      isVerified: false,
    },
  };
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to get category display name
function getCategoryName(slug: string): string {
  const categoryMap: { [key: string]: string } = {
    entertainment: '엔터테인먼트',
    gaming: '게임',
    education: '교육',
    sports: '스포츠',
    news: '뉴스',
    music: '음악',
    film: '영화/애니메이션',
    tech: '과학기술',
    cooking: '요리',
    beauty: '뷰티/패션',
    travel: '여행',
    auto: '자동차',
    pets: '반려동물',
    finance: '부동산/재테크',
    lifestyle: '라이프스타일',
    general: '일반',
  };
  
  return categoryMap[slug] || slug;
}