import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authService } from '@/lib/auth/services'

const prisma = new PrismaClient()

// GET - 비디오 상세 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: videoId } = params

    // 개발 환경에서 DB 연결 스킵 시 mock 데이터 반환
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      const mockVideo = {
        id: videoId,
        title: '샘플 비디오',
        description: '이것은 테스트 비디오입니다.',
        videoUrl: '/sample-video.mp4',
        thumbnailUrl: '/sample-thumbnail.jpg',
        duration: 120,
        views: 1234,
        likes: 100,
        dislikes: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'published',
        visibility: 'public',
        category: '엔터테인먼트',
        tags: ['샘플', '테스트'],
        language: 'ko',
        isCommentsEnabled: true,
        isRatingsEnabled: true,
        ageRestriction: false,
        creator: {
          id: 'creator-1',
          name: '테스트 크리에이터',
          handle: '@testcreator',
          avatar: null,
          profileImage: null,
          subscriberCount: 1000,
          isVerified: false,
          isSubscribed: false
        },
        isOwner: false,
        isLiked: false,
        isDisliked: false
      }
      return NextResponse.json(mockVideo)
    }

    // 비디오 정보 조회
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
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
      try {
        currentUser = await authService.verifyToken(token)
        isOwner = currentUser?.id === video.channels?.userId
      } catch (error) {
        console.log('Token verification failed:', error)
      }
    }

    // Note: visibility field doesn't exist in current schema
    // All videos are considered public unless status is not published

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
        viewCount: { increment: 1 }
      }
    })

    // Check if current user has liked/disliked the video
    let isLiked = false
    let isDisliked = false
    let isSubscribed = false
    
    if (currentUser) {
      // Check like/dislike status (would need to be implemented in your schema)
      // For now, we'll set default values
      // TODO: Implement actual like/dislike check from database
      isLiked = false
      isDisliked = false
      
      // Check subscription status
      // TODO: Implement actual subscription check from database
      isSubscribed = false
    }

    // 썸네일 URL 처리 - 로컬 파일로 제공
    let thumbnailUrl = video.thumbnailUrl;
    
    // 응답 데이터 구성
    const responseData = {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl,
      duration: video.duration || 0,
      views: Number(video.viewCount) + 1, // 증가된 조회수 반영 (BigInt to Number)
      likes: video.likeCount || 0,
      dislikes: video.dislikeCount || 0,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
      status: video.status,
      visibility: 'public', // Default since visibility field doesn't exist in schema
      category: video.category || '기타',
      tags: video.tags ? (typeof video.tags === 'string' ? video.tags.split(',').filter(t => t) : (Array.isArray(video.tags) ? video.tags : [])) : [],
      language: video.language || 'ko',
      isCommentsEnabled: video.isCommentsEnabled ?? true,
      isRatingsEnabled: video.isRatingsEnabled ?? true,
      ageRestriction: video.ageRestriction ?? false,
      creator: {
        id: video.channels.id,
        name: video.channels.name,
        handle: video.channels.handle,
        avatar: video.channels.avatarUrl,
        profileImage: video.channels.avatarUrl, // Also include as profileImage
        subscriberCount: video.channels.subscriberCount || 0,
        isVerified: video.channels.isVerified || false,
        isSubscribed // User's subscription status
      },
      isOwner, // 현재 사용자가 소유자인지 여부
      isLiked, // User's like status
      isDisliked // User's dislike status
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
  { params }: { params: { id: string } }
) {
  try {
    const { id: videoId } = params

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
      select: { channelId: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (video.channelId !== user.id) {
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
        // Note: visibility field doesn't exist in current schema
        ...(category && { category }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(isCommentsEnabled !== undefined && { isCommentsEnabled }),
        ...(isRatingsEnabled !== undefined && { isRatingsEnabled }),
        ...(ageRestriction !== undefined && { ageRestriction }),
        updatedAt: new Date()
      },
      include: {
        channels: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
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
      views: Number(updatedVideo.viewCount),
      likes: updatedVideo.likeCount || 0,
      dislikes: updatedVideo.dislikeCount || 0,
      createdAt: updatedVideo.createdAt.toISOString(),
      updatedAt: updatedVideo.updatedAt.toISOString(),
      status: updatedVideo.status,
      visibility: 'public', // Default since visibility field doesn't exist in schema
      category: updatedVideo.category || '기타',
      tags: updatedVideo.tags ? JSON.parse(updatedVideo.tags as string) : [],
      language: updatedVideo.language || 'ko',
      isCommentsEnabled: updatedVideo.isCommentsEnabled ?? true,
      isRatingsEnabled: updatedVideo.isRatingsEnabled ?? true,
      ageRestriction: updatedVideo.ageRestriction ?? false,
      creator: {
        id: updatedVideo.channels.id,
        name: updatedVideo.channels.name,
        handle: updatedVideo.channels.handle,
        avatar: updatedVideo.channels.avatarUrl,
        subscriberCount: updatedVideo.channels.subscriberCount || 0,
        isVerified: updatedVideo.channels.isVerified || false
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
  { params }: { params: { id: string } }
) {
  try {
    const { id: videoId } = params

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
      select: { channelId: true, videoUrl: true, thumbnailUrl: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (video.channelId !== user.id) {
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