import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/videos - 비디오 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sort') || 'latest';
    const isPremium = searchParams.get('premium') === 'true';
    const isFeatured = searchParams.get('featured') === 'true';
    const channelId = searchParams.get('channelId') || undefined;
    
    // Build where clause
    const where: any = {
      status: 'published',
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
      ...(category && category !== 'all' && { category }),
      // isPremium과 isFeatured 필드가 없음
      ...(channelId && { channelId }),
    };
    
    // Build order by
    const orderBy: any[] = [];
    switch (sortBy) {
      case 'popular':
      case 'views':
        orderBy.push({ viewCount: 'desc' });
        break;
      case 'likes':
        orderBy.push({ likeCount: 'desc' });
        break;
      case 'oldest':
        orderBy.push({ publishedAt: 'asc' });
        break;
      case 'trending':
        // Trending: combination of recent views and engagement
        orderBy.push({ viewCount: 'desc' }, { likeCount: 'desc' });
        break;
      case 'latest':
      default:
        orderBy.push({ publishedAt: 'desc' });
        break;
    }
    
    // Get videos with channel information
    const [videos, totalCount] = await Promise.all([
      prisma.videos.findMany({
        where,
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
              isVerified: true,
              subscriberCount: true,
            },
          },
          _count: {
            select: {
              video_likes: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.videos.count({ where }),
    ]);
    
    // Format response
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      viewCount: video.viewCount.toString(),
      likeCount: video.likeCount,
      dislikeCount: video.dislikeCount,
      commentCount: 0, // comments 테이블 없음
      shareCount: 0, // shareCount 필드 없음
      status: video.status,
      isPremium: false,
      isFeatured: false,
      category: video.category,
      tags: video.tags,
      publishedAt: video.publishedAt,
      createdAt: video.createdAt,
      channel: {
        id: video.channels.id,
        name: video.channels.name,
        handle: video.channels.handle,
        avatar: video.channels.avatarUrl,
        isVerified: video.channels.isVerified,
        subscriberCount: video.channels.subscriberCount,
      },
    }));
    
    // Get featured videos if on first page (viewCount 기반)
    let featuredVideos = [];
    if (page === 1 && !search && !category) {
      const featured = await prisma.videos.findMany({
        where: {
          status: 'published',
          viewCount: { gte: 100000 }, // isFeatured 대신 viewCount 사용
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: { viewCount: 'desc' },
        take: 5,
      });
      
      featuredVideos = featured.map(video => ({
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount.toString(),
        channel: {
          name: video.channels.name,
          avatar: video.channels.avatarUrl,
        },
      }));
    }
    
    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      featured: featuredVideos,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST /api/videos - 비디오 업로드/생성
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      description,
      thumbnailUrl,
      videoUrl,
      duration,
      category,
      tags = [],
      isPremium = false,
    } = body;
    
    // Validate required fields
    if (!title || !videoUrl || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user from token (simplified - implement proper JWT validation)
    const token = authHeader.substring(7);
    // TODO: Validate JWT and get user ID
    const userId = 'temp-user-id'; // Replace with actual user ID from JWT
    
    // Check if user has a channel
    let channel = await prisma.channels.findUnique({
      where: { userId },
    });
    
    // Create channel if it doesn't exist
    if (!channel) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      channel = await prisma.channels.create({
        data: {
          id: `channel-${userId}`,
          userId,
          name: user.name,
          handle: user.email.split('@')[0],
          description: `${user.name}'s Channel`,
        },
      });
    }
    
    // Create video
    const video = await prisma.videos.create({
      data: {
        id: `video-${Date.now()}`,
        channelId: channel.id,
        title,
        description: description || '',
        thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/640x360',
        videoUrl,
        duration,
        category: category || 'general',
        tags,
        isPremium,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Simulate video processing (in production, this would be a background job)
    setTimeout(async () => {
      await prisma.videos.update({
        where: { id: video.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });
    }, 5000);
    
    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
      },
      message: 'Video uploaded successfully. Processing...',
    });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 500 }
    );
  }
}