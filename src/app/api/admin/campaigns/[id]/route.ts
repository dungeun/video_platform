import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    // 개발 환경에서 토큰 없이도 접근 가능 (디버깅용)
    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string = ''
    let userType: string = ''
    
    if (token) {
      try {
        // 개발 환경에서 mock 토큰 처리
        if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
          if (token === 'mock-admin-access-token') {
            userId = 'mock-admin-id'
            userType = 'ADMIN'
          } else {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
          }
        } else {
          const payload = await verifyJWT(token)
          userId = payload.id
          userType = payload.type
          
          // 관리자 권한 확인
          if (userType !== 'ADMIN' && userType !== 'BUSINESS') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
          }
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    const campaignId = params.id

    // 캠페인 상세 조회
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessProfile: {
              select: {
                companyName: true,
                businessNumber: true,
                representativeName: true,
                businessAddress: true,
                businessCategory: true
              }
            }
          }
        },
        applications: {
          include: {
            influencer: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    profileImage: true,
                    followerCount: true,
                    categories: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
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

    // 응답 데이터 포맷
    const formattedCampaign = {
      ...campaign,
      startDate: campaign.startDate.toISOString().split('T')[0],
      endDate: campaign.endDate.toISOString().split('T')[0],
      status: campaign.status.toLowerCase(),
      createdAt: campaign.createdAt.toISOString().split('T')[0],
      updatedAt: campaign.updatedAt.toISOString().split('T')[0],
      reviewedAt: null // Campaign doesn't have reviewedAt field
    }

    return NextResponse.json({
      campaign: formattedCampaign
    })

  } catch (error) {
    console.error('Campaign detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}