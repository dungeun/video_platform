import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

// GET /api/mypage/liked-campaigns - 사용자가 좋아요한 캠페인 목록
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await verifyJWT(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const userId = user.userId || user.id
    if (!user || !userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 좋아요한 캠페인 목록 조회
    const likedCampaigns = await prisma.campaignLike.findMany({
      where: {
        userId: userId
      },
      include: {
        campaign: {
          include: {
            business: {
              select: {
                businessProfile: {
                  select: {
                    companyName: true
                  }
                }
              }
            },
            _count: {
              select: {
                campaignLikes: true,
                campaignApplications: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 활성 캠페인만 필터링하고 형식 맞추기
    const campaigns = likedCampaigns
      .filter(like => like.campaign.status === 'ACTIVE')
      .map(like => ({
        id: like.campaign.id,
        title: like.campaign.title,
        brand_name: like.campaign.business.businessProfile?.companyName || 'Unknown',
        category: like.campaign.category,
        platform: like.campaign.platform,
        budget_min: like.campaign.budgetMin,
        budget_max: like.campaign.budgetMax,
        image_url: like.campaign.thumbnailUrl,
        requirements: like.campaign.requirements,
        application_deadline: like.campaign.applicationDeadline,
        likes: like.campaign._count.campaignLikes,
        applications: like.campaign._count.campaignApplications,
        likedAt: like.createdAt
      }))

    return NextResponse.json({
      campaigns,
      total: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching liked campaigns:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}