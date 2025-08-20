import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 비디오 상세 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

    // 비디오 정보 조회
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            subscriberCount: true
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 권한 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value
    
    let currentUser = null
    let isOwner = false

    if (token) {
      currentUser = AuthService.verifyToken(token)
      isOwner = currentUser?.id === video.userId
    }

    // 비공개 비디오 접근 권한 체크
    if (video.visibility === 'private' && !isOwner) {
      return NextResponse.json(
        { error: '비공개 비디오입니다' },
        { status: 403 }
      )
    }

    // 처리 중이거나 실패한 비디오 체크
    if (video.status === 'processing') {
      return NextResponse.json(
        { error: '비디오가 아직 처리 중입니다' },
        { status: 202 } // Accepted but processing
      )
    }

    if (video.status === 'failed') {
      return NextResponse.json(
        { error: '비디오 처리에 실패했습니다' },
        { status: 422 }
      )
    }

    // 조회수 증가 (비로그인 사용자도 포함)
    await prisma.videos.update({
      where: { id: videoId },
      data: {
        views: { increment: 1 }
      }
    })

    // 응답 데이터 구성
    const responseData = {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration || 0,
      views: video.views + 1, // 증가된 조회수 반영
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
      status: video.status,
      visibility: video.visibility,
      category: video.category || '기타',
      tags: video.tags ? JSON.parse(video.tags as string) : [],
      language: video.language || 'ko',
      isCommentsEnabled: video.isCommentsEnabled ?? true,
      isRatingsEnabled: video.isRatingsEnabled ?? true,
      ageRestriction: video.ageRestriction ?? false,
      creator: {
        id: video.User.id,
        name: video.User.name,
        email: video.User.email,
        avatar: video.User.avatar,
        subscriberCount: video.User.subscriberCount || 0,
        isVerified: video.User.isVerified || false
      },
      isOwner // 현재 사용자가 소유자인지 여부
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: '비디오 정보를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT - 비디오 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // 비디오 소유권 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { userId: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (video.userId !== user.id) {
      return NextResponse.json(
        { error: '비디오를 수정할 권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      visibility,
      category,
      tags,
      isCommentsEnabled,
      isRatingsEnabled,
      ageRestriction
    } = body

    // 비디오 정보 업데이트
    const updatedVideo = await prisma.videos.update({
      where: { id: videoId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility }),
        ...(category && { category }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(isCommentsEnabled !== undefined && { isCommentsEnabled }),
        ...(isRatingsEnabled !== undefined && { isRatingsEnabled }),
        ...(ageRestriction !== undefined && { ageRestriction }),
        updatedAt: new Date()
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            subscriberCount: true
          }
        }
      }
    })

    const responseData = {
      id: updatedVideo.id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      videoUrl: updatedVideo.videoUrl,
      thumbnailUrl: updatedVideo.thumbnailUrl,
      duration: updatedVideo.duration || 0,
      views: updatedVideo.views,
      likes: updatedVideo.likes || 0,
      dislikes: updatedVideo.dislikes || 0,
      createdAt: updatedVideo.createdAt.toISOString(),
      updatedAt: updatedVideo.updatedAt.toISOString(),
      status: updatedVideo.status,
      visibility: updatedVideo.visibility,
      category: updatedVideo.category || '기타',
      tags: updatedVideo.tags ? JSON.parse(updatedVideo.tags as string) : [],
      language: updatedVideo.language || 'ko',
      isCommentsEnabled: updatedVideo.isCommentsEnabled ?? true,
      isRatingsEnabled: updatedVideo.isRatingsEnabled ?? true,
      ageRestriction: updatedVideo.ageRestriction ?? false,
      creator: {
        id: updatedVideo.User.id,
        name: updatedVideo.User.name,
        email: updatedVideo.User.email,
        avatar: updatedVideo.User.avatar,
        subscriberCount: updatedVideo.User.subscriberCount || 0,
        isVerified: updatedVideo.User.isVerified || false
      }
    }

    return NextResponse.json({
      success: true,
      message: '비디오 정보가 업데이트되었습니다',
      ...responseData
    })

  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: '비디오 정보 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE - 비디오 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // 비디오 소유권 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { userId: true, videoUrl: true, thumbnailUrl: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (video.userId !== user.id) {
      return NextResponse.json(
        { error: '비디오를 삭제할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 관련 데이터 삭제 (댓글, 좋아요 등)
    await prisma.$transaction([
      // 댓글 삭제
      prisma.comments.deleteMany({
        where: { videoId: videoId }
      }),
      
      // 비디오 삭제
      prisma.videos.delete({
        where: { id: videoId }
      })
    ])

    // TODO: 실제 파일 삭제 로직 구현
    // - 비디오 파일 삭제
    // - 썸네일 이미지 삭제
    
    return NextResponse.json({
      success: true,
      message: '비디오가 삭제되었습니다'
    })

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: '비디오 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}