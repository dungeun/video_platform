import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { AppError, ErrorTypes, createErrorResponse, logError } from '@/lib/utils/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 프로덕션 환경에서 기본 시크릿 사용 방지
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-secret-key') {
  throw new Error('JWT_SECRET must be set in production environment')
}

export async function POST(request: NextRequest) {
  try {
    // 개발 환경에서만 디버그 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt at:', new Date().toISOString())
    }
    
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      throw new AppError(
        '잘못된 요청 형식입니다.',
        400,
        ErrorTypes.VALIDATION_ERROR
      )
    }
    
    const { email, password } = body

    // 입력 검증
    if (!email || !password) {
      throw new AppError(
        '이메일과 비밀번호를 입력해주세요.',
        400,
        ErrorTypes.VALIDATION_ERROR
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new AppError(
        '올바른 이메일 형식이 아닙니다.',
        400,
        ErrorTypes.VALIDATION_ERROR
      )
    }

    // 데이터베이스 연결 스킵 시 mock 처리
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      // Mock users for development (test계정들과 password는 'password')
      const mockUsers = [
        {
          email: 'test@example.com',
          password: 'password',
          user: {
            id: 'mock-influencer-1',
            email: 'test@example.com',
            name: '테스트 인플루언서',
            type: 'INFLUENCER',
            verified: true,
            profiles: {
              id: 'mock-profile-1',
              bio: '테스트 인플루언서 프로필',
              profileImage: null
            }
          }
        },
        {
          email: 'business@example.com',
          password: 'password',
          user: {
            id: 'mock-business-1',
            email: 'business@example.com',
            name: '테스트 비즈니스',
            type: 'BUSINESS',
            verified: true,
            profiles: {
              id: 'mock-profile-2',
              bio: '테스트 비즈니스 프로필',
              profileImage: null
            }
          }
        },
        {
          email: 'admin@example.com',
          password: 'password',
          user: {
            id: 'mock-admin-1',
            email: 'admin@example.com',
            name: '테스트 관리자',
            type: 'ADMIN',
            verified: true,
            profiles: {
              id: 'mock-profile-3',
              bio: '테스트 관리자 프로필',
              profileImage: null
            }
          }
        }
      ]

      const mockAccount = mockUsers.find(account => account.email === email && account.password === password)
      
      if (mockAccount) {
        const mockUser = mockAccount.user

        // JWT 토큰 생성
        const token = jwt.sign(
          {
            id: mockUser.id,
            userId: mockUser.id,
            email: mockUser.email,
            type: mockUser.type,
            name: mockUser.name
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        const response = NextResponse.json({
          user: mockUser,
          token,
          accessToken: token
        })

        // 쿠키 설정
        const cookieOptions = {
          httpOnly: true,
          secure: false,
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 7,
          path: '/'
        }

        response.cookies.set('auth-token', token, cookieOptions)
        response.cookies.set('accessToken', token, cookieOptions)

        return response
      } else {
        throw new AppError(
          '개발용 계정: test@example.com, business@example.com, admin@example.com (비밀번호: password)',
          401,
          ErrorTypes.AUTHENTICATION_ERROR
        )
      }
    }

    // 데이터베이스에서 사용자 찾기
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        profiles: true
      }
    })

    if (!user) {
      // 보안을 위해 사용자 존재 여부를 명시하지 않음
      throw new AppError(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      )
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      // 로그인 실패 시도 기록 (추후 구현 가능)
      logError(new Error('Invalid password attempt'), {
        email,
        timestamp: new Date().toISOString()
      })
      
      throw new AppError(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        401,
        ErrorTypes.AUTHENTICATION_ERROR
      )
    }

    // 계정 상태 확인
    if (user.status !== 'ACTIVE') {
      throw new AppError(
        '계정이 비활성화되었습니다. 관리자에게 문의하세요.',
        403,
        ErrorTypes.AUTHORIZATION_ERROR,
        true,
        { accountStatus: user.status }
      )
    }

    // 마지막 로그인 시간 업데이트
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id, // 호환성을 위해 추가
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
        verified: user.verified,
        profile: user.profiles
      },
      token,
      accessToken: token // 호환성을 위해 추가
    })

    // 쿠키 설정
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // 프로덕션에서는 HTTPS 필수
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    }

    response.cookies.set('auth-token', token, cookieOptions)
    response.cookies.set('accessToken', token, cookieOptions) // 호환성

    return response

  } catch (error) {
    logError(error, { 
      endpoint: '/api/auth/login',
      method: 'POST'
    })
    return createErrorResponse(error)
  }
}