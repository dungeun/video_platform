import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // URL 파라미터 추출
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // PUBLISHED, PROCESSING, DRAFT, etc.
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 페이지네이션 계산
    const skip = (page - 1) * limit

    // 필터 조건 구성
    const where: any = {
      userId: userId
    }

    if (status) {
      where.status = status
    }

    // 정렬 조건 구성
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 비디오 조회
    const [videos, totalCount] = await Promise.all([
      prisma.videos.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              video_views: true,
              video_likes: true,
              video_comments: true
            }
          },
          channels: {
            select: {
              name: true,
              profileImageUrl: true
            }
          }
        }
      }),
      prisma.videos.count({ where })
    ])

    // 응답 데이터 포맷팅
    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      hlsUrl: video.hlsUrl,
      dashUrl: video.dashUrl,
      duration: video.duration,
      fileSize: video.fileSize,
      width: video.width,
      height: video.height,
      status: video.status,
      category: video.category,
      tags: video.tags,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      processedAt: video.processedAt,
      isLiveRecording: video.isLiveRecording,
      
      // 통계 정보
      viewCount: video._count.video_views,
      likeCount: video._count.video_likes,
      commentCount: video._count.video_comments,
      
      // 채널 정보
      channel: video.channels
    }))

    // 페이지네이션 정보
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      videos: formattedVideos,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      summary: {
        totalVideos: totalCount,
        totalViews: formattedVideos.reduce((sum, v) => sum + v.viewCount, 0),
        totalDuration: formattedVideos.reduce((sum, v) => sum + (v.duration || 0), 0),
        totalFileSize: formattedVideos.reduce((sum, v) => sum + (v.fileSize || 0), 0),
        statusBreakdown: await getStatusBreakdown(userId)
      }
    })

  } catch (error) {
    console.error('Error fetching user videos:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 상태별 비디오 수 집계
async function getStatusBreakdown(userId: string) {
  const statusCounts = await prisma.videos.groupBy({
    by: ['status'],
    where: { userId },
    _count: { status: true }
  })

  const breakdown: Record<string, number> = {}
  statusCounts.forEach(item => {
    breakdown[item.status] = item._count.status
  })

  return breakdown
}

// 비디오 정보 업데이트
export async function PUT(req: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const body = await req.json()
    const { 
      videoId, 
      title, 
      description, 
      category, 
      tags, 
      thumbnailUrl,
      status 
    } = body

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // 비디오 소유권 확인
    const existingVideo = await prisma.videos.findFirst({
      where: {
        id: videoId,
        userId: userId
      }
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found or access denied' }, { status: 404 })
    }

    // 업데이트 데이터 구성
    const updateData: any = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (status !== undefined) updateData.status = status

    // 비디오 업데이트
    const updatedVideo = await prisma.videos.update({
      where: { id: videoId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      video: updatedVideo
    })

  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ 
      error: 'Failed to update video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}