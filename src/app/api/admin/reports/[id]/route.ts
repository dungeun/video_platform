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
    try {
      const payload = await verifyJWT(token)
      userId = payload.id
      
      // 관리자 권한 확인
      if (payload.type !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { status, assignedTo, resolution } = await request.json()
    const reportId = params.id

    // 신고 상태 업데이트
    // const updatedReport = await prisma.report.update({
    //   where: { id: reportId },
    //   data: { 
    //     status,
    //     assignedTo,
    //     resolution,
    //     updatedAt: new Date()
    //   }
    // })

    return NextResponse.json({
      success: true,
      // report: updatedReport
    })

  } catch (error) {
    console.error('Report status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}