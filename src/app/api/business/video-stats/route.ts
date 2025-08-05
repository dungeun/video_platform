import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request)
    
    if (!user || user.type !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // 비즈니스 정보 확인
    const business = await prisma.business.findUnique({
      where: { userId: user.id }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // 현재는 캠페인을 비디오로 간주하여 통계 계산
    const campaigns = await prisma.campaign.findMany({
      where: { 
        businessId: business.id,
        status: 'ACTIVE' // 활성 상태의 캠페인만 (= 공개된 비디오)
      },
      include: {
        _count: {
          select: {
            applications: true,
            likes: true
          }
        }
      }
    })

    // 비디오 통계 계산
    const totalVideos = campaigns.length
    const totalViews = campaigns.reduce((sum, campaign) => {
      // 조회수는 지원자 수를 기준으로 계산 (임시)
      return sum + (campaign._count.applications * 10) // 지원자 1명당 조회수 10개로 가정
    }, 0)
    
    const totalLikes = campaigns.reduce((sum, campaign) => sum + campaign._count.likes, 0)
    const totalComments = campaigns.reduce((sum, campaign) => {
      // 댓글 수는 좋아요 수의 20% 정도로 가정
      return sum + Math.floor(campaign._count.likes * 0.2)
    }, 0)

    // 최근 7일간 업로드된 비디오
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const recentVideos = campaigns.filter(campaign => 
      campaign.createdAt >= lastWeek
    ).length

    // 평균 조회수
    const averageViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0

    // 구독자 수 (임시 데이터)
    const subscriberCount = 12000 + Math.floor(totalLikes * 1.5)

    // 월별 통계 (최근 6개월)
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthCampaigns = campaigns.filter(campaign => 
        campaign.createdAt >= monthStart && campaign.createdAt <= monthEnd
      )
      
      const monthViews = monthCampaigns.reduce((sum, campaign) => 
        sum + (campaign._count.applications * 10), 0
      )
      
      monthlyStats.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM 형식
        videos: monthCampaigns.length,
        views: monthViews,
        likes: monthCampaigns.reduce((sum, campaign) => sum + campaign._count.likes, 0)
      })
    }

    // 인기 비디오 TOP 5
    const popularVideos = campaigns
      .sort((a, b) => b._count.likes - a._count.likes)
      .slice(0, 5)
      .map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        views: campaign._count.applications * 10,
        likes: campaign._count.likes,
        createdAt: campaign.createdAt.toISOString(),
        thumbnail: campaign.thumbnailImageUrl
      }))

    const stats = {
      totalVideos,
      totalViews,
      totalLikes,
      totalComments,
      subscriberCount,
      recentVideos,
      averageViews,
      monthlyStats,
      popularVideos,
      // 추가 지표
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0,
      averageLikesPerVideo: totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0,
      // 성장률 (임시 데이터)
      growthMetrics: {
        viewsGrowth: '+15.3%',
        likesGrowth: '+8.7%',
        subscribersGrowth: '+12.1%',
        videosGrowth: `+${recentVideos}`
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('비즈니스 비디오 통계 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}