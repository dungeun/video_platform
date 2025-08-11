import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log(`Loading home videos: section=${section}, limit=${limit}`);

    const result: any = {
      success: true,
      sections: {}
    };

    // 기본 비디오 데이터 (trending, popular 등)
    const videos = await prisma.videos.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        videoUrl: true,
        duration: true,
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
        status: true,
        publishedAt: true,
        tags: true,
        category: true,
        isShort: true,
        createdAt: true,
        updatedAt: true,
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            handle: true,
            subscriberCount: true
          }
        }
      }
    });

    // YouTube 비디오 데이터 추가
    const youtubeVideos = await prisma.youtube_videos.findMany({
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        youtubeId: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        channelTitle: true,
        channelId: true,
        publishedAt: true,
        duration: true,
        viewCount: true,
        category: true,
        featured: true
      }
    });

    console.log(`Found ${videos.length} regular videos and ${youtubeVideos.length} YouTube videos`);

    // 데이터 변환 함수들
    const transformRegularVideo = (video: any) => ({
      ...video,
      creator: {
        id: video.channels?.id || '',
        name: video.channels?.name || 'Unknown Creator',
        profileImage: video.channels?.avatarUrl,
        isVerified: false
      }
    });

    const transformYouTubeVideo = (video: any) => ({
      id: video.id,
      title: video.title || '',
      description: video.description,
      thumbnailUrl: video.thumbnailUrl || '',
      videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      duration: video.duration || 0,
      viewCount: video.viewCount || 0,
      likeCount: 0,
      createdAt: video.publishedAt,
      isLive: false,
      isPublic: true,
      category: video.category,
      creator: {
        id: video.channelId || '',
        name: video.channelTitle || 'Unknown Creator',
        profileImage: null,
        isVerified: false
      }
    });

    // 섹션별로 데이터 분류
    if (section === 'all' || section === 'trending') {
      // 조회수 기준 인기 비디오
      const trendingVideos = [...videos]
        .sort((a, b) => (parseInt(b.viewCount || '0')) - (parseInt(a.viewCount || '0')))
        .slice(0, 10)
        .map(transformRegularVideo);
      result.sections.trending = trendingVideos;
    }

    if (section === 'all' || section === 'popular') {
      // 좋아요 수 기준 인기 비디오
      const popularVideos = [...videos]
        .sort((a, b) => (parseInt(b.likeCount || '0')) - (parseInt(a.likeCount || '0')))
        .slice(0, 8)
        .map(transformRegularVideo);
      result.sections.popular = popularVideos;
    }

    if (section === 'all' || section === 'latest') {
      // 최신 비디오
      result.sections.latest = videos.slice(0, 12).map(transformRegularVideo);
    }

    if (section === 'all' || section === 'realestate') {
      // 부동산 카테고리 YouTube 비디오
      const realestateVideos = youtubeVideos
        .filter(video => 
          video.category === 'realestate' || 
          (video.title && (
            video.title.includes('부동산') || 
            video.title.includes('아파트') || 
            video.title.includes('재테크') ||
            video.title.includes('투자')
          ))
        )
        .slice(0, 12)
        .map(transformYouTubeVideo);
      
      result.sections.realestate = realestateVideos;
      console.log(`Filtered ${realestateVideos.length} realestate YouTube videos`);
    }

    if (section === 'all' || section === 'youtube') {
      // 모든 YouTube 비디오
      result.sections.youtube = youtubeVideos.slice(0, 12).map(transformYouTubeVideo);
    }

    // 추천 비디오 (일반 비디오 + YouTube 비디오 혼합)
    if (section === 'all' || section === 'recommended') {
      const transformedRegularVideos = videos.slice(0, 6).map(transformRegularVideo);
      const transformedYouTubeVideos = youtubeVideos.slice(0, 6).map(transformYouTubeVideo);
      
      const mixedVideos = [
        ...transformedRegularVideos,
        ...transformedYouTubeVideos
      ].sort(() => Math.random() - 0.5).slice(0, 10);
      
      result.sections.recommended = mixedVideos;
    }

    // BigInt을 문자열로 변환
    const serializedResult = JSON.parse(JSON.stringify(result, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));

    console.log('Final result sections:', Object.keys(serializedResult.sections));
    console.log('Section counts:', Object.entries(serializedResult.sections).map(([key, val]: [string, any]) => `${key}: ${val?.length || 0}`));

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('Home videos API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      sections: {}
    }, { status: 500 });
  }
}