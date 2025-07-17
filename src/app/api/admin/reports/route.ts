import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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
      if (!payload?.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { type: true }
    })

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Report 모델이 schema에 없어서 임시로 빈 배열 반환
    const reports = [] as any[]
    const totalCount = 0

    return NextResponse.json({
      success: true,
      reports: [],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Report 모델이 schema에 없어서 임시로 에러 반환
    return NextResponse.json(
      { error: 'Report functionality not implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}