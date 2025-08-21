import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    let accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value
    
    // Authorization header도 확인
    if (!accessToken) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7)
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // JWT 토큰 검증
    let decoded: any
    try {
      decoded = jwt.verify(accessToken, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 관리자 권한 확인
    if (decoded.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Query parameters 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    // 오프셋 계산
    const offset = (page - 1) * limit

    // Where 조건 구성
    const whereConditions: any = {}
    
    if (status && status !== 'all') {
      whereConditions.status = status
    }
    
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { 
          channels: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // 통계 계산
    const [totalVideos, publishedVideos, totalViewsResult, totalLikesResult] = await Promise.all([
      prisma.videos.count(),
      prisma.videos.count({ where: { status: 'published' } }),
      prisma.videos.aggregate({
        _sum: { viewCount: true }
      }),
      prisma.videos.aggregate({
        _sum: { likeCount: true }
      })
    ])

    // 비디오 목록 조회 (channels 관계 포함)
    const videos = await prisma.videos.findMany({
      where: whereConditions,
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // 전체 개수 조회 (페이지네이션용)
    const totalCount = await prisma.videos.count({ where: whereConditions })
    const totalPages = Math.ceil(totalCount / limit)

    // 응답 데이터 구성
    const response = {
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
        duration: video.duration,
        viewCount: Number(video.viewCount), // BigInt를 Number로 변환
        likeCount: video.likeCount,
        dislikeCount: video.dislikeCount,
        status: video.status,
        publishedAt: video.publishedAt,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        tags: video.tags,
        category: video.category,
        isShort: video.isShort,
        channel: video.channels ? {
          id: video.channels.id,
          name: video.channels.name,
          handle: video.channels.handle,
          avatarUrl: video.channels.avatarUrl
        } : null
      })),
      stats: {
        totalVideos,
        publishedVideos,
        totalViews: Number(totalViewsResult._sum.viewCount || 0), // BigInt를 Number로 변환
        totalLikes: totalLikesResult._sum.likeCount || 0
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch admin videos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}