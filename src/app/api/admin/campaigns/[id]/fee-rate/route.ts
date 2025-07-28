import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.type !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { platformFeeRate } = await request.json()

    // 유효성 검사
    if (typeof platformFeeRate !== 'number' || platformFeeRate < 0 || platformFeeRate > 1) {
      return NextResponse.json(
        { error: '수수료율은 0~100% 사이의 값이어야 합니다.' },
        { status: 400 }
      )
    }

    // 캠페인 수수료율 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: { 
        platformFeeRate: platformFeeRate 
      },
      select: {
        id: true,
        platformFeeRate: true
      }
    })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error('Fee rate update error:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '수수료율 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}