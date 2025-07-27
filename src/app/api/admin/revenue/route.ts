import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAdmin } from '@/lib/auth/verify-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const adminUser = await verifyAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'monthly'
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // 날짜 범위 설정
    const endDate = endDateStr ? new Date(endDateStr) : new Date()
    const startDate = startDateStr ? new Date(startDateStr) : new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    // 캠페인 결제 데이터 조회
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        campaign: {
          include: {
            business: {
              include: {
                businessProfile: true
              }
            }
          }
        }
      }
    })

    // 정산 데이터 조회
    const settlements = await prisma.settlement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        items: true
      }
    })

    // 매출 계산
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
    
    // 정산금 계산 (인플루언서에게 지급한 금액)
    const totalSettlements = settlements.reduce((sum, settlement) => 
      sum + settlement.items.reduce((itemSum, item) => itemSum + item.amount, 0), 0
    )
    
    // 플랫폼 수수료 (20%)
    const platformFee = totalRevenue * 0.2
    
    // 총 지출 (정산금)
    const totalExpenses = totalSettlements
    
    // 순이익 (플랫폼 수수료)
    const netProfit = platformFee

    // 월별 데이터 집계
    const monthlyData = new Map<string, {
      revenue: number
      expenses: number
      netProfit: number
    }>()

    // 결제 데이터를 월별로 집계
    payments.forEach(payment => {
      const monthKey = payment.createdAt.toISOString().substring(0, 7)
      const existing = monthlyData.get(monthKey) || { revenue: 0, expenses: 0, netProfit: 0 }
      existing.revenue += payment.amount
      monthlyData.set(monthKey, existing)
    })

    // 정산 데이터를 월별로 집계
    settlements.forEach(settlement => {
      const monthKey = settlement.createdAt.toISOString().substring(0, 7)
      const existing = monthlyData.get(monthKey) || { revenue: 0, expenses: 0, netProfit: 0 }
      const settlementAmount = settlement.items.reduce((sum, item) => sum + item.amount, 0)
      existing.expenses += settlementAmount
      monthlyData.set(monthKey, existing)
    })

    // 순이익 계산
    monthlyData.forEach((data, key) => {
      data.netProfit = data.revenue * 0.2 // 플랫폼 수수료가 순이익
    })

    // 월별 데이터 배열로 변환
    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // 카테고리별 매출 집계
    const categoryData = new Map<string, number>()
    
    payments.forEach(payment => {
      const category = payment.campaign?.business?.businessProfile?.businessCategory || '기타'
      const existing = categoryData.get(category) || 0
      categoryData.set(category, existing + payment.amount)
    })

    // 카테고리별 매출 배열로 변환
    const categoryRevenue = Array.from(categoryData.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: Math.round((revenue / totalRevenue) * 100)
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // 전월 대비 성장률 계산
    let monthlyGrowth = 0
    if (monthlyRevenue.length >= 2) {
      const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]
      const previousMonth = monthlyRevenue[monthlyRevenue.length - 2]
      if (previousMonth.revenue > 0) {
        monthlyGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      }
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        platformFee,
        settlementAmount: totalSettlements,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
      },
      monthlyRevenue,
      categoryRevenue
    })

  } catch (error) {
    console.error('매출 데이터 조회 오류:', error)
    return NextResponse.json(
      { error: '매출 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}