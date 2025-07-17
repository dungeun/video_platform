import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

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

    const { status } = await request.json()
    const campaignId = params.id

    // 상태값 변환 (소문자로 오는 경우 대문자로 변환)
    const dbStatus = status.toUpperCase()

    // 캠페인 상태 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: dbStatus,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error('Campaign status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}