import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

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