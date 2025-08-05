import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// GET - 정산 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status

    const skip = (page - 1) * limit

    const [settlements, total] = await Promise.all([
      prisma.settlementRequest.findMany({
        where,
        include: {
          channel: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.settlementRequest.count({ where })
    ])

    // 상태별 통계
    const statusStats = await prisma.settlementRequest.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true
    })

    return NextResponse.json({
      settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statusStats.reduce((acc: any, stat) => {
        acc[stat.status] = {
          count: stat._count,
          totalAmount: stat._sum.amount || 0
        }
        return acc
      }, {})
    })
  } catch (error) {
    console.error('Admin settlement list error:', error)
    return NextResponse.json({ 
      error: '정산 목록 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// PUT - 정산 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { settlementId, status, adminNotes, rejectionReason, proofUrl } = await request.json()

    if (!settlementId || !status) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 정산 신청 조회
    const settlement = await prisma.settlementRequest.findUnique({
      where: { id: settlementId },
      include: { channel: true }
    })

    if (!settlement) {
      return NextResponse.json({ error: '정산 신청을 찾을 수 없습니다.' }, { status: 404 })
    }

    const updateData: any = {
      status,
      adminNotes
    }

    // 상태에 따른 추가 처리
    if (status === 'processing') {
      updateData.processedAt = new Date()
    } else if (status === 'completed') {
      updateData.completedAt = new Date()
      if (proofUrl) updateData.proofUrl = proofUrl
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason
      
      // 거절 시 정산 가능 금액 복구
      await prisma.channel.update({
        where: { id: settlement.channelId },
        data: {
          pendingSettlement: {
            increment: settlement.amount
          }
        }
      })
    }

    // 정산 신청 업데이트
    const updatedSettlement = await prisma.settlementRequest.update({
      where: { id: settlementId },
      data: updateData,
      include: {
        channel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // TODO: 이메일 알림 전송
    // 정산 처리 상태 변경 알림

    return NextResponse.json({
      success: true,
      settlement: updatedSettlement,
      message: '정산 상태가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('Admin settlement update error:', error)
    return NextResponse.json({ 
      error: '정산 상태 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}