import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { transformCampaignToVideo } from '@/lib/utils/video'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id
    let userId: string | null = null

    // 인증 토큰 확인 (선택적)
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = await verifyJWT(token)
        userId = payload.userId
      } catch (error) {
        // 토큰이 유효하지 않아도 계속 진행 (public 접근 허용)
        console.warn('Invalid token provided:', error)
      }
    }

    // 먼저 실제 비디오 테이블에서 찾기 (미래 확장용)
    // 현재는 비디오 테이블이 없으므로 캠페인 데이터를 비디오로 변환하여 사용
    
    // 캠페인을 비디오로 변환하여 사용
    const campaign = await prisma.campaigns.findUnique({
      where: { id: videoId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            campaign_applications: true,
            campaign_likes: true
          }
        },
        campaign_likes: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // 캠페인을 비디오 형태로 변환
    const video = transformCampaignToVideo(campaign)
    
    // 사용자별 상호작용 정보 추가
    const videoWithInteractions = {
      ...video,
      isLiked: userId ? campaign.campaign_likes.length > 0 : false,
      isDisliked: false, // 캠페인에는 dislike가 없으므로 false
      likeCount: campaign._count.campaign_likes,
      dislikeCount: 0,
      // 크리에이터 정보 보강
      creator: {
        ...video.creator,
        subscriberCount: 12000, // 임시 데이터
        isSubscribed: false // 임시 데이터
      }
    }

    return NextResponse.json({
      success: true,
      video: videoWithInteractions
    })

  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 비디오 업데이트 (크리에이터만 가능)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    const userId = payload.userId

    const { title, description, thumbnailUrl, tags, category, isPublic } = await request.json()

    // 현재는 캠페인을 업데이트 (실제 비디오 테이블이 생기면 변경)
    const campaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
      include: { users: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // 업데이트 권한 확인 (캠페인 소유자만)
    if (campaign.businessId !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const updatedCampaign = await prisma.campaigns.update({
      where: { id: params.id },
      data: {
        title: title || campaign.title,
        description: description || campaign.description,
        thumbnailImageUrl: thumbnailUrl || campaign.thumbnailImageUrl,
        hashtags: tags || campaign.hashtags,
        // category는 캠페인에 없으므로 임시로 무시
        status: isPublic !== undefined ? (isPublic ? 'ACTIVE' : 'DRAFT') : campaign.status
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            campaign_applications: true,
            campaign_likes: true
          }
        }
      }
    })

    const video = transformCampaignToVideo(updatedCampaign)

    return NextResponse.json({
      success: true,
      video
    })

  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 비디오 삭제 (크리에이터만 가능)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    const userId = payload.userId

    // 현재는 캠페인 삭제 (실제 비디오 테이블이 생기면 변경)
    const campaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
      include: { users: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // 삭제 권한 확인 (캠페인 소유자만)
    if (campaign.businessId !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    await prisma.campaigns.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}