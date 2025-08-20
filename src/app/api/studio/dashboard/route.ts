import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// OPTIONS 메서드 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    let accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value
    
    // Also check Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7)
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    // JWT 토큰 검증
    let decoded: any
    try {
      decoded = jwt.verify(accessToken, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get user ID
    const userId = decoded.userId || decoded.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 401, headers: corsHeaders }
      )
    }

    // 데이터베이스 연결 스킵 시 mock 처리
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      const mockDashboardData = {
        // 수익 데이터
        revenue: {
          total: 1250000,
          thisMonth: 1250000,
          lastMonth: 1086950,
          growth: 15,
          adRevenue: 980000,
          superchatRevenue: 270000,
          dailyRevenue: [
            { date: '2024-01-15', ad: 45000, superchat: 12000 },
            { date: '2024-01-14', ad: 38000, superchat: 8000 },
            { date: '2024-01-13', ad: 52000, superchat: 15000 },
            { date: '2024-01-12', ad: 41000, superchat: 11000 },
            { date: '2024-01-11', ad: 48000, superchat: 13000 },
            { date: '2024-01-10', ad: 55000, superchat: 18000 },
            { date: '2024-01-09', ad: 43000, superchat: 9000 }
          ],
          recentTransactions: [
            { type: '광고 수익', amount: 45000, date: '2024-01-15', video: 'React 튜토리얼 #1' },
            { type: 'SuperChat', amount: 12000, date: '2024-01-14', video: '라이브 스트림' },
            { type: '광고 수익', amount: 32000, date: '2024-01-13', video: 'JavaScript 강의' },
            { type: 'SuperChat', amount: 8000, date: '2024-01-12', video: '코딩 실습 라이브' }
          ]
        },
        
        // 시청자 통계
        viewerStats: {
          dailyViews: [
            { time: '00:00', views: 1200, watchTime: 45 },
            { time: '04:00', views: 800, watchTime: 32 },
            { time: '08:00', views: 2200, watchTime: 68 },
            { time: '12:00', views: 3500, watchTime: 85 },
            { time: '16:00', views: 4100, watchTime: 92 },
            { time: '20:00', views: 3800, watchTime: 88 },
            { time: '24:00', views: 2800, watchTime: 75 }
          ],
          engagement: {
            likeRate: 4.2,
            commentRate: 0.85,
            watchCompletionRate: 68
          }
        },

        // 댓글 및 알림
        notifications: {
          newComments: 24,
          repliesCompleted: 18,
          pendingReplies: 6,
          responseRate: 92,
          recentComments: [
            { user: '김민수', comment: '정말 유용한 강의였어요! 다음 편은 언제 올라오나요?', video: 'React 튜토리얼 #1', time: '2시간 전' },
            { user: '이지은', comment: '설명이 너무 잘 되어있네요. 감사합니다!', video: 'JavaScript 기초', time: '4시간 전' },
            { user: '박철수', comment: '코드에서 오타가 있는 것 같은데 확인해주세요', video: 'Node.js 실습', time: '6시간 전' }
          ]
        },

        // 최근 활동
        recentActivity: [
          { type: 'upload', content: 'React 고급 패턴 #3', time: '2시간 전', icon: 'upload', color: 'text-green-600 bg-green-100' },
          { type: 'comment', content: '신규 댓글 5개에 답글 완료', time: '4시간 전', icon: 'comment', color: 'text-blue-600 bg-blue-100' },
          { type: 'milestone', content: '구독자 10,000명 달성!', time: '1일 전', icon: 'users', color: 'text-purple-600 bg-purple-100' },
          { type: 'revenue', content: '이번주 수익 목표 달성', time: '2일 전', icon: 'dollar', color: 'text-yellow-600 bg-yellow-100' }
        ]
      }

      return NextResponse.json({
        success: true,
        data: mockDashboardData
      }, { headers: corsHeaders })
    }

    // 실제 데이터베이스 쿼리 (향후 구현)
    // const dashboardData = await fetchDashboardData(userId)

    // 현재는 mock 데이터를 반환
    const mockDashboardData = {
      revenue: {
        total: 1250000,
        thisMonth: 1250000,
        lastMonth: 1086950,
        growth: 15,
        adRevenue: 980000,
        superchatRevenue: 270000
      },
      notifications: {
        newComments: 24,
        repliesCompleted: 18,
        pendingReplies: 6,
        responseRate: 92
      }
    }

    return NextResponse.json({
      success: true,
      data: mockDashboardData
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get dashboard data' },
      { status: 500, headers: corsHeaders }
    )
  }
}