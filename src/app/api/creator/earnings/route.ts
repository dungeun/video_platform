import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// GET - 크리에이터 수익 조회
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    // 수익 통계 조회
    const where: any = {
      channelId: channel.id,
      year
    }
    if (month) where.month = month

    const earnings = await prisma.creatorEarnings.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // 월별 집계
    const monthlyEarnings = earnings.reduce((acc: any, earning) => {
      const key = `${earning.year}-${earning.month.toString().padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = {
          year: earning.year,
          month: earning.month,
          superchat: 0,
          membership: 0,
          ads: 0,
          sponsorship: 0,
          total: 0,
          fee: 0,
          netTotal: 0
        }
      }
      
      acc[key][earning.type] += earning.amount
      acc[key].total += earning.amount
      acc[key].fee += earning.fee
      acc[key].netTotal += earning.netAmount
      
      return acc
    }, {})

    // 전체 통계
    const totalStats = {
      totalRevenue: channel.totalEarnings,
      pendingSettlement: channel.pendingSettlement,
      totalSuperChat: channel.totalSuperChatAmount,
      monthlyEarnings: Object.values(monthlyEarnings)
    }

    // 최근 SuperChat 조회
    const recentSuperChats = await prisma.superChat.findMany({
      where: {
        channelId: channel.id,
        isPaid: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        totalEarnings: channel.totalEarnings,
        pendingSettlement: channel.pendingSettlement,
        totalSuperChatAmount: channel.totalSuperChatAmount
      },
      totalStats,
      monthlyEarnings: Object.values(monthlyEarnings),
      recentSuperChats,
      earnings
    })
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ 
      error: '수익 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}