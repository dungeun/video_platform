'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    userGrowthRate: number
    usersByType: {
      influencer: number
      business: number
      admin: number
    }
  }
  campaignStats: {
    totalCampaigns: number
    activeCampaigns: number
    completedCampaigns: number
    totalBudget: number
    averageBudget: number
    campaignsByPlatform: {
      instagram: number
      youtube: number
      tiktok: number
      blog: number
    }
  }
  revenueStats: {
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    platformFees: number
    averageOrderValue: number
  }
  engagementStats: {
    totalApplications: number
    applicationRate: number
    completionRate: number
    averageRating: number
  }
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      console.log('Fetching analytics with range:', timeRange)
      
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        credentials: 'include'
      })
      
      console.log('Analytics response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Analytics data received:', data)
        setAnalytics(data)
      } else {
        const errorData = await response.text()
        console.error('Analytics API failed:', response.status, response.statusText, errorData)
        setAnalytics(null)
      }
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-500 mb-4">
            통계 데이터를 가져오는 중 문제가 발생했습니다. 
            네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계 분석</h1>
          <p className="text-gray-600 mt-1">플랫폼 성과와 트렌드를 분석합니다</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="90days">최근 90일</option>
            <option value="1year">최근 1년</option>
          </select>
        </div>
      </div>

      {/* 사용자 통계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.userStats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-500">총 사용자</div>
            <div className="text-xs text-green-600 mt-1">+{analytics.userStats.userGrowthRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.userStats.activeUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-500">활성 사용자</div>
            <div className="text-xs text-gray-500 mt-1">
              {((analytics.userStats.activeUsers / analytics.userStats.totalUsers) * 100).toFixed(1)}% 활성률
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analytics.userStats.newUsersThisMonth.toLocaleString()}</div>
            <div className="text-sm text-gray-500">신규 사용자</div>
            <div className="text-xs text-gray-500 mt-1">이번 달</div>
          </div>
          <div className="text-center">
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div>인플루언서: {analytics.userStats.usersByType.influencer}</div>
              <div>업체: {analytics.userStats.usersByType.business}</div>
              <div>관리자: {analytics.userStats.usersByType.admin}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 캠페인 통계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">캠페인 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 캠페인</span>
              <span className="text-lg font-semibold">{analytics.campaignStats.totalCampaigns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">진행중</span>
              <span className="text-lg font-semibold text-green-600">{analytics.campaignStats.activeCampaigns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">완료</span>
              <span className="text-lg font-semibold text-blue-600">{analytics.campaignStats.completedCampaigns}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">평균 예산</span>
              <span className="text-lg font-semibold">₩{analytics.campaignStats.averageBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">플랫폼별 캠페인</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg mr-2">📷</span>
                  <span className="text-sm">Instagram</span>
                </div>
                <span className="text-sm font-medium">{analytics.campaignStats.campaignsByPlatform.instagram}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🎥</span>
                  <span className="text-sm">YouTube</span>
                </div>
                <span className="text-sm font-medium">{analytics.campaignStats.campaignsByPlatform.youtube}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🎵</span>
                  <span className="text-sm">TikTok</span>
                </div>
                <span className="text-sm font-medium">{analytics.campaignStats.campaignsByPlatform.tiktok}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-lg mr-2">✍️</span>
                  <span className="text-sm">Blog</span>
                </div>
                <span className="text-sm font-medium">{analytics.campaignStats.campaignsByPlatform.blog}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 수익 통계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">수익 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">₩{analytics.revenueStats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">총 수익</div>
            <div className="text-xs text-green-600 mt-1">+{analytics.revenueStats.revenueGrowth}%</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">₩{analytics.revenueStats.monthlyRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">월간 수익</div>
            <div className="text-xs text-gray-500 mt-1">이번 달</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">₩{analytics.revenueStats.platformFees.toLocaleString()}</div>
            <div className="text-sm text-gray-500">플랫폼 수수료</div>
            <div className="text-xs text-gray-500 mt-1">
              {((analytics.revenueStats.platformFees / analytics.revenueStats.totalRevenue) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 참여도 통계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">참여도 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.engagementStats.totalApplications.toLocaleString()}</div>
            <div className="text-sm text-gray-500">총 지원</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.engagementStats.applicationRate}%</div>
            <div className="text-sm text-gray-500">지원률</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analytics.engagementStats.completionRate}%</div>
            <div className="text-sm text-gray-500">완료율</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{analytics.engagementStats.averageRating}</div>
            <div className="text-sm text-gray-500">평균 평점</div>
            <div className="text-xs text-gray-500 mt-1">5점 만점</div>
          </div>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 성장률</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">사용자 증가율</span>
              <span className="text-sm font-semibold text-green-600">+{analytics.userStats.userGrowthRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">수익 증가율</span>
              <span className="text-sm font-semibold text-green-600">+{analytics.revenueStats.revenueGrowth}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">캠페인 완료율</span>
              <span className="text-sm font-semibold text-blue-600">{analytics.engagementStats.completionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 지표</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">평균 주문 가치</span>
              <span className="text-sm font-semibold">₩{analytics.revenueStats.averageOrderValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">활성 사용자 비율</span>
              <span className="text-sm font-semibold">
                {((analytics.userStats.activeUsers / analytics.userStats.totalUsers) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">캠페인당 평균 지원자</span>
              <span className="text-sm font-semibold">
                {Math.round(analytics.engagementStats.totalApplications / analytics.campaignStats.totalCampaigns)}명
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}