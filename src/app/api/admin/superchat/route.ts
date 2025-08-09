import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// GET - 관리자용 SuperChat 통계 및 목록
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'list' // list, stats, daily
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const channelId = searchParams.get('channelId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (view === 'stats') {
      // 전체 통계
      const totalStats = await prisma.super_chats.aggregate({
        where: { isPaid: true },
        _sum: { amount: true },
        _count: true
      })

      // 오늘 통계
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayStats = await prisma.super_chats.aggregate({
        where: {
          isPaid: true,
          createdAt: { gte: today }
        },
        _sum: { amount: true },
        _count: true
      })

      // 이번 달 통계
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const monthStats = await prisma.super_chats.aggregate({
        where: {
          isPaid: true,
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { amount: true },
        _count: true
      })

      // 상위 채널
      const topChannels = await prisma.channels.findMany({
        where: {
          totalSuperChatAmount: { gt: 0 }
        },
        orderBy: { totalSuperChatAmount: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: { super_chats: true }
          }
        }
      })

      return NextResponse.json({
        total: {
          amount: totalStats._sum.amount || 0,
          count: totalStats._count
        },
        today: {
          amount: todayStats._sum.amount || 0,
          count: todayStats._count
        },
        month: {
          amount: monthStats._sum.amount || 0,
          count: monthStats._count
        },
        topChannels: topChannels.map(channel => ({
          id: channel.id,
          name: channel.name,
          handle: channel.handle,
          totalAmount: channel.totalSuperChatAmount,
          superChatCount: channel._count.super_chats,
          owner: channel.users
        }))
      })
    } else if (view === 'daily') {
      // 일별 통계 (최근 30일)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const dailyStats = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*)::int as count,
          SUM(amount)::float as total_amount,
          COUNT(DISTINCT "userId")::int as unique_donors,
          COUNT(DISTINCT "channelId")::int as unique_channels
        FROM super_chats
        WHERE "isPaid" = true AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date DESC
      `

      return NextResponse.json({ dailyStats })
    } else {
      // SuperChat 목록
      const where: any = { isPaid: true }
      
      if (channelId) where.channelId = channelId
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }

      const skip = (page - 1) * limit

      const [superChats, total] = await Promise.all([
        prisma.super_chats.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                profiles: {
                  select: {
                    profileImage: true
                  }
                }
              }
            },
            channels: {
              select: {
                id: true,
                name: true,
                handle: true,
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            payments: {
              select: {
                id: true,
                orderId: true,
                status: true,
                approvedAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.super_chats.count({ where })
      ])

      return NextResponse.json({
        superChats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }
  } catch (error) {
    console.error('Admin SuperChat error:', error)
    return NextResponse.json({ 
      error: 'SuperChat 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}