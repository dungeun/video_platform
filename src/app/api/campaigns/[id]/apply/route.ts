import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'

// POST /api/campaigns/[id]/apply - 캠페인 지원
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyJWT(token)
    if (!user || user.role !== 'INFLUENCER') {
      return NextResponse.json({ error: 'Only influencers can apply' }, { status: 403 })
    }

    const campaignId = params.id

    // 캠페인 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 캠페인 상태 확인
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 })
    }

    // 모집 인원 확인
    if (campaign._count.applications >= campaign.maxApplicants) {
      return NextResponse.json({ error: 'Campaign is full' }, { status: 400 })
    }

    // 이미 지원했는지 확인
    const existingApplication = await prisma.application.findFirst({
      where: {
        campaignId: campaignId,
        influencerId: user.id
      }
    })

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this campaign' }, { status: 400 })
    }

    // 인플루언서 프로필 확인 (팔로워 수 등)
    const influencerProfile = await prisma.profile.findUnique({
      where: { userId: user.id }
    })

    if (!influencerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // 팔로워 수 확인
    const followers = influencerProfile.instagramFollowers || 0
    if (followers < campaign.targetFollowers) {
      return NextResponse.json({ 
        error: `Minimum ${campaign.targetFollowers} followers required. You have ${followers} followers.` 
      }, { status: 400 })
    }

    // 지원 생성
    const application = await prisma.application.create({
      data: {
        campaignId: campaignId,
        influencerId: user.id,
        status: 'PENDING',
        message: ''
      }
    })

    // 알림 생성 (비즈니스에게)
    await prisma.notification.create({
      data: {
        userId: campaign.businessId,
        type: 'APPLICATION',
        title: '새로운 캠페인 지원',
        message: `${user.name || user.email}님이 "${campaign.title}" 캠페인에 지원했습니다.`,
        relatedId: application.id,
        relatedType: 'application'
      }
    })

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: 'Successfully applied to campaign'
    })
  } catch (error) {
    console.error('Campaign apply error:', error)
    return NextResponse.json(
      { error: 'Failed to apply to campaign' },
      { status: 500 }
    )
  }
}