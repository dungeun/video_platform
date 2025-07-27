import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Request method:', request.method)
    console.log('Request URL:', request.url)
    
    let body;
    try {
      const textBody = await request.text()
      console.log('Raw request body:', textBody)
      body = JSON.parse(textBody)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    console.log('Login attempt for:', email, 'Password length:', password?.length)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 데이터베이스에서 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    })

    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    console.log('User found:', user.email, 'Type:', user.type, 'Status:', user.status)
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password validation result:', isValidPassword)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 상태 확인
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '계정이 비활성화되었습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: user.type,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 응답 생성
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        verified: (user as any).emailVerified,
        profile: user.profile
      },
      token,
      accessToken: token // Add this for backward compatibility with useAuth hook
    })

    // 쿠키 설정
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // HTTP 환경에서도 작동하도록 수정
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    )
  }
}