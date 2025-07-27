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

    const { status, adminNotes } = await request.json()
    const reportId = params.id

    // 신고 상태 업데이트
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (status) {
      updateData.status = status.toUpperCase()
      
      // 해결됨 상태로 변경시 추가 정보 저장
      if (status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'REJECTED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = userId
      }
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        ...updatedReport,
        type: updatedReport.type.toLowerCase(),
        targetType: updatedReport.targetType.toLowerCase(),
        status: updatedReport.status.toLowerCase(),
        reporter: {
          ...updatedReport.reporter,
          type: updatedReport.reporter.type.toLowerCase()
        }
      }
    })

  } catch (error) {
    console.error('Report status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}