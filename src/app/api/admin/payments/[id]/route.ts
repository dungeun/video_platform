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
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    let userType: string
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

    const paymentId = params.id

    // 결제 상세 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 응답 데이터 포맷팅
    const isBusinessPayment = payment.type === 'CAMPAIGN_PAYMENT'
    const businessName = payment.campaign?.business?.profile?.companyName || 
                        payment.campaign?.business?.name || 
                        (isBusinessPayment ? payment.user?.name : '-')
    const businessEmail = payment.campaign?.business?.email || 
                         (isBusinessPayment ? payment.user?.email : '-')
    
    let influencerName = '-'
    let influencerEmail = '-'
    
    if (!isBusinessPayment && payment.user?.type === 'INFLUENCER') {
      influencerName = payment.user?.name || '-'
      influencerEmail = payment.user?.email || '-'
    }
    
    // metadata 파싱
    let metadata = {}
    try {
      metadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata || {}
    } catch {
      metadata = {}
    }
    
    const formattedPayment = {
      id: payment.id,
      orderId: payment.orderId,
      campaignId: payment.campaignId || '',
      campaignTitle: payment.campaign?.title || '직접 결제',
      businessId: payment.campaign?.businessId || payment.userId,
      businessName,
      businessEmail,
      influencerId: !isBusinessPayment ? payment.userId : undefined,
      influencerName,
      influencerEmail,
      amount: payment.amount,
      type: payment.type,
      status: payment.status.toLowerCase(),
      paymentMethod: payment.method,
      paymentKey: payment.paymentKey,
      requestDate: payment.createdAt.toISOString().split('T')[0],
      processedDate: payment.updatedAt?.toISOString().split('T')[0],
      description: (metadata as any).description || 
                   (isBusinessPayment ? '캠페인 결제' : '인플루언서 정산'),
      metadata,
      receipt: null,
      refundedAmount: 0,
      failReason: null
    }

    return NextResponse.json({
      payment: formattedPayment
    })

  } catch (error) {
    console.error('Payment detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    let userType: string
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

    const { action } = await request.json()
    const paymentId = params.id

    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = 'COMPLETED'
        break
      case 'reject':
        newStatus = 'CANCELLED'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // 결제 상태 업데이트
    const updateData: any = { 
      status: newStatus,
      updatedAt: new Date()
    }
    
    // 승인된 경우 approvedAt 설정
    if (action === 'approve') {
      updateData.approvedAt = new Date()
    }
    
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      payment: updatedPayment
    })

  } catch (error) {
    console.error('Payment action API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}