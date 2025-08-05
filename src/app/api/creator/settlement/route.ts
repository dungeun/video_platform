import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// POST - 정산 신청
export async function POST(request: NextRequest) {
  try {
    const user = AuthService.getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 사용자의 채널 조회
    const channel = await prisma.channel.findUnique({
      where: { userId: user.id }
    })

    if (!channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { amount, bankName, bankAccount, accountHolder } = await request.json()

    // 최소 정산 금액 체크
    if (amount < 10000) {
      return NextResponse.json({ 
        error: '최소 정산 금액은 10,000원입니다.' 
      }, { status: 400 })
    }

    // 정산 가능 금액 체크
    if (amount > channel.pendingSettlement) {
      return NextResponse.json({ 
        error: `정산 가능 금액을 초과했습니다. (가능 금액: ${channel.pendingSettlement.toLocaleString()}원)` 
      }, { status: 400 })
    }

    // 진행 중인 정산 신청 확인
    const pendingSettlement = await prisma.settlementRequest.findFirst({
      where: {
        channelId: channel.id,
        status: { in: ['pending', 'processing'] }
      }
    })

    if (pendingSettlement) {
      return NextResponse.json({ 
        error: '이미 진행 중인 정산 신청이 있습니다.' 
      }, { status: 400 })
    }

    // 정산 신청 생성
    const settlement = await prisma.settlementRequest.create({
      data: {
        channelId: channel.id,
        amount,
        bankName,
        bankAccount,
        accountHolder,
        status: 'pending'
      }
    })

    // 채널의 pendingSettlement 차감
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        pendingSettlement: {
          decrement: amount
        }
      }
    })

    return NextResponse.json({
      success: true,
      settlement,
      message: '정산 신청이 완료되었습니다. 영업일 기준 3-5일 내에 처리됩니다.'
    })
  } catch (error) {
    console.error('Settlement request error:', error)
    return NextResponse.json({ 
      error: '정산 신청 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// GET - 정산 신청 내역 조회
export async function GET(request: NextRequest) {
  try {
    const user = AuthService.getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 사용자의 채널 조회
    const channel = await prisma.channel.findUnique({
      where: { userId: user.id }
    })

    if (!channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    const where: any = {
      channelId: channel.id
    }
    if (status) where.status = status

    const settlements = await prisma.settlementRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    })

    const nextCursor = settlements.length === limit ? settlements[settlements.length - 1].id : null

    // 정산 통계
    const stats = await prisma.settlementRequest.groupBy({
      by: ['status'],
      where: { channelId: channel.id },
      _sum: { amount: true },
      _count: true
    })

    const settlementStats = stats.reduce((acc: any, stat) => {
      acc[stat.status] = {
        count: stat._count,
        totalAmount: stat._sum.amount || 0
      }
      return acc
    }, {})

    return NextResponse.json({
      settlements,
      nextCursor,
      hasMore: settlements.length === limit,
      stats: {
        pendingSettlement: channel.pendingSettlement,
        ...settlementStats
      }
    })
  } catch (error) {
    console.error('Settlement fetch error:', error)
    return NextResponse.json({ 
      error: '정산 내역 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}