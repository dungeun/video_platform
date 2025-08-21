import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 인증 헬퍼 함수
async function verifyAdminAuth(request: NextRequest) {
  let accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value
  
  if (!accessToken) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
    }
  }

  if (!accessToken) {
    return { error: 'Authorization required', status: 401 }
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any
    if (decoded.type !== 'ADMIN') {
      return { error: 'Admin access required', status: 403 }
    }
    return { user: decoded }
  } catch (error) {
    return { error: 'Invalid token', status: 401 }
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const videoId = params.id
    const body = await request.json()
    const { status } = body

    // 비디오 존재 확인
    const existingVideo = await prisma.videos.findUnique({
      where: { id: videoId }
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 상태 업데이트
    const updatedVideo = await prisma.videos.update({
      where: { id: videoId },
      data: {
        status,
        publishedAt: status === 'published' && !existingVideo.publishedAt 
          ? new Date() 
          : existingVideo.publishedAt,
        updatedAt: new Date()
      },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      video: {
        id: updatedVideo.id,
        title: updatedVideo.title,
        status: updatedVideo.status,
        publishedAt: updatedVideo.publishedAt,
        updatedAt: updatedVideo.updatedAt,
        channel: updatedVideo.channels
      }
    })
  } catch (error) {
    console.error('Failed to update video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 인증 확인
    const authResult = await verifyAdminAuth(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const videoId = params.id

    // 비디오 존재 확인
    const existingVideo = await prisma.videos.findUnique({
      where: { id: videoId }
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // 관련 데이터 먼저 삭제 (Foreign Key 제약 때문에)
    await prisma.$transaction(async (tx) => {
      // 슈퍼챗 삭제
      await tx.super_chats.deleteMany({
        where: { directVideoId: videoId }
      })

      // 비디오 좋아요 삭제
      await tx.video_likes.deleteMany({
        where: { videoId: videoId }
      })

      // 시청 기록 삭제
      await tx.watch_history.deleteMany({
        where: { videoId: videoId }
      })

      // 비디오 삭제
      await tx.videos.delete({
        where: { id: videoId }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}