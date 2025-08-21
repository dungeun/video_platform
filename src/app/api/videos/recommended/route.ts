import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 추천 비디오 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exclude = searchParams.get('exclude')
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const limit = parseInt(searchParams.get('limit') || '20')

    // 기본 where 조건
    const where: any = {
      status: 'published',
      ...(exclude && { id: { not: exclude } })
    }

    // 추천 비디오를 찾는 전략:
    // 1. 같은 카테고리의 비디오 (50%)
    // 2. 같은 태그를 가진 비디오 (30%)
    // 3. 인기 비디오 (조회수 기준) (20%)

    const categoryLimit = Math.floor(limit * 0.5)
    const tagLimit = Math.floor(limit * 0.3)
    const popularLimit = limit - categoryLimit - tagLimit

    const recommendedVideos = []

    // 1. 같은 카테고리 비디오
    if (category && categoryLimit > 0) {
      const categoryVideos = await prisma.videos.findMany({
        where: {
          ...where,
          category: category
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
              isVerified: true
            }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: categoryLimit
      })

      recommendedVideos.push(...categoryVideos)
    }

    // 2. 같은 태그 비디오
    if (tags.length > 0 && tagLimit > 0) {
      const tagVideos = await prisma.videos.findMany({
        where: {
          ...where,
          id: { notIn: recommendedVideos.map(v => v.id) },
          OR: tags.map(tag => ({
            tags: {
              contains: tag
            }
          }))
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
              isVerified: true
            }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: tagLimit
      })

      recommendedVideos.push(...tagVideos)
    }

    // 3. 인기 비디오 (부족한 수만큼 채움)
    const remainingLimit = limit - recommendedVideos.length
    if (remainingLimit > 0) {
      const popularVideos = await prisma.videos.findMany({
        where: {
          ...where,
          id: { notIn: recommendedVideos.map(v => v.id) }
        },
        include: {
          channels: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarUrl: true,
              isVerified: true
            }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { likeCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: remainingLimit
      })

      recommendedVideos.push(...popularVideos)
    }

    // 응답 데이터 포맷팅
    const formattedVideos = recommendedVideos.map(video => {
      // 썸네일 URL을 절대 경로로 변환
      let thumbnailUrl = video.thumbnailUrl || '/default-thumbnail.jpg';
      if (thumbnailUrl && thumbnailUrl.startsWith('/')) {
        // 상대 경로인 경우 스토리지 서버 URL 추가
        thumbnailUrl = `http://64.176.226.119:9000${thumbnailUrl}`;
      }
      
      return {
        id: video.id,
        title: video.title,
        thumbnailUrl,
        duration: video.duration || 0,
        views: Number(video.viewCount) || 0,
        createdAt: video.createdAt.toISOString(),
        creator: {
          id: video.channels.id,
          name: video.channels.name,
          handle: video.channels.handle,
          avatar: video.channels.avatarUrl,
          isVerified: video.channels.isVerified || false
        },
        category: video.category || '기타',
        tags: video.tags ? JSON.parse(video.tags as string) : []
      }
    })

    // 배열 셔플 (다양성을 위해)
    const shuffledVideos = formattedVideos.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      videos: shuffledVideos,
      total: shuffledVideos.length
    })

  } catch (error) {
    console.error('Error fetching recommended videos:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: '추천 비디오를 불러오는 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    )
  }
}