import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 미들웨어에서 설정한 헤더에서 사용자 정보 가져오기
    const userType = request.headers.get('x-user-type')
    const userId = request.headers.get('x-user-id')
    
    console.log('Analytics API - Headers:', {
      userType,
      userId,
      authToken: request.cookies.get('auth-token')?.value ? 'exists' : 'missing',
      allHeaders: Object.fromEntries(request.headers.entries())
    })
    
    if (!userType || !userId) {
      console.log('Analytics API - Missing headers, userType:', userType, 'userId:', userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (userType !== 'ADMIN') {
      console.log('Analytics API - Not admin, userType:', userType)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30days'

    // 날짜 범위 계산
    const now = new Date()
    let startDate: Date
    
    switch (range) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 병렬로 모든 통계 데이터 조회
    const [
      totalUsers,
      activeUsers,
      newUsers,
      usersByType,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaignsByPlatform,
      totalRevenue,
      monthlyRevenue,
      platformFees,
      totalApplications,
      campaignBudget
    ] = await Promise.all([
      // 사용자 통계
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startDate
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.user.groupBy({
        by: ['type'],
        _count: true
      }),
      
      // 캠페인 통계
      prisma.campaign.count(),
      prisma.campaign.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.campaign.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.campaign.groupBy({
        by: ['platform' as any],
        _count: true
      }),
      
      // 수익 통계
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          type: 'CAMPAIGN_PAYMENT'
        },
        _sum: {
          amount: true
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          type: 'CAMPAIGN_PAYMENT',
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          type: 'PLATFORM_FEE'
        },
        _sum: {
          amount: true
        }
      }),
      
      // 참여도 통계
      prisma.campaignApplication.count(),
      
      // 캠페인 예산
      prisma.campaignBudget.aggregate({
        _sum: {
          total: true
        },
        _avg: {
          total: true
        }
      })
    ])

    // 이전 기간 데이터 (성장률 계산용)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const [previousUsers, previousRevenue] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          type: 'CAMPAIGN_PAYMENT',
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        },
        _sum: {
          amount: true
        }
      })
    ])

    // 성장률 계산
    const userGrowthRate = previousUsers > 0 
      ? ((newUsers - previousUsers) / previousUsers) * 100 
      : 0

    const revenueGrowthRate = (previousRevenue._sum.amount || 0) > 0
      ? (((monthlyRevenue._sum.amount || 0) - (previousRevenue._sum.amount || 0)) / (previousRevenue._sum.amount || 0)) * 100
      : 0

    // 응용프로그램 비율 계산
    const applicationRate = totalCampaigns > 0 ? (totalApplications / totalCampaigns) : 0
    const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0

    // 사용자 타입별 통계 변환
    const userTypeStats = usersByType.reduce((acc, item) => {
      acc[item.type.toLowerCase()] = item._count
      return acc
    }, {} as any)

    // 플랫폼별 캠페인 통계 변환
    const platformStats = campaignsByPlatform.reduce((acc, item) => {
      acc[item.platform.toLowerCase()] = item._count
      return acc
    }, {} as any)

    const analytics = {
      userStats: {
        totalUsers,
        activeUsers,
        newUsersThisMonth: newUsers,
        userGrowthRate: Math.round(userGrowthRate * 10) / 10,
        usersByType: {
          influencer: userTypeStats.influencer || 0,
          business: userTypeStats.business || 0,
          admin: userTypeStats.admin || 0
        }
      },
      campaignStats: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalBudget: campaignBudget._sum.total || 0,
        averageBudget: Math.round(campaignBudget._avg.total || 0),
        campaignsByPlatform: {
          instagram: platformStats.instagram || 0,
          youtube: platformStats.youtube || 0,
          tiktok: platformStats.tiktok || 0,
          blog: platformStats.blog || 0
        }
      },
      revenueStats: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        revenueGrowth: Math.round(revenueGrowthRate * 10) / 10,
        platformFees: platformFees._sum.amount || 0,
        averageOrderValue: totalCampaigns > 0 ? Math.round((totalRevenue._sum.amount || 0) / totalCampaigns) : 0
      },
      engagementStats: {
        totalApplications,
        applicationRate: Math.round(applicationRate * 100 * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        averageRating: 4.2 // TODO: 실제 평점 데이터가 있으면 계산
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Admin analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}