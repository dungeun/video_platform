import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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
          if (userType !== 'ADMIN' && userType !== 'BUSINESS') { // 임시로 BUSINESS도 허용
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
          }
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 필터 조건 구성
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { campaign: { title: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 결제 목록 조회
    const payments = await prisma.payment.findMany({
      where,
      include: {
        campaign: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    companyName: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // 총 개수 조회
    const totalCount = await prisma.payment.count({ where })

    // 응답 데이터 포맷팅
    const formattedPayments = payments.map(payment => {
      const isBusinessPayment = payment.type === 'CAMPAIGN_PAYMENT'
      const businessName = payment.campaign?.business?.profile?.companyName || 
                          payment.campaign?.business?.name || 
                          (isBusinessPayment ? payment.user?.name : '-')
      const influencerName = !isBusinessPayment ? payment.user?.name : '-'
      
      // metadata 파싱하여 설명 생성
      let description = ''
      try {
        const metadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata || {}
        description = (metadata as any).description || 
                     (isBusinessPayment ? '캠페인 결제' : '인플루언서 정산')
      } catch {
        description = isBusinessPayment ? '캠페인 결제' : '인플루언서 정산'
      }
      
      return {
        id: payment.id,
        campaignId: payment.campaignId || '',
        campaignTitle: payment.campaign?.title || '직접 결제',
        businessName,
        influencerName,
        amount: payment.amount,
        paymentMethod: payment.method,
        status: payment.status.toLowerCase(),
        requestDate: payment.createdAt.toISOString().split('T')[0],
        processedDate: payment.updatedAt?.toISOString().split('T')[0],
        description,
        type: payment.type === 'CAMPAIGN_PAYMENT' ? 'campaign_payment' : 
              payment.type === 'INFLUENCER_SETTLEMENT' ? 'influencer_payout' : 
              'platform_fee'
      }
    })

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Admin payments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}