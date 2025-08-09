import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    // Check both cookie names for compatibility
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

    // Get user - handle both userId and id fields for compatibility
    const userId = decoded.userId || decoded.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 401, headers: corsHeaders }
      )
    }

    // 데이터베이스 연결 스킵 시 mock 처리
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      // Mock 사용자 반환
      const mockUser = {
        id: userId,
        email: decoded.email,
        name: decoded.name,
        type: decoded.type,
        verified: true
      }

      return NextResponse.json(
        { user: mockUser },
        { headers: corsHeaders }
      )
    }
    
    // 데이터베이스에서 사용자 찾기
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        profiles: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // 계정 상태 확인
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403, headers: corsHeaders }
      )
    }

    // 사용자 정보 반환
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
          verified: user.verified,
          profile: user.profiles
        }
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500, headers: corsHeaders }
    )
  }
}