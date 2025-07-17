import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let adminId: string = ''
    let userType: string = ''
    
    if (token) {
      try {
        // 개발 환경에서 mock 토큰 처리
        if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
          if (token === 'mock-admin-access-token') {
            adminId = 'mock-admin-id'
            userType = 'ADMIN'
          } else {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
          }
        } else {
          const payload = await verifyJWT(token)
          adminId = payload.id
          userType = payload.type
          
          // 관리자 권한 확인
          if (userType !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
          }
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    const { email, companyName } = await request.json()

    if (!email || !companyName) {
      return NextResponse.json({ error: '이메일과 회사명은 필수입니다.' }, { status: 400 })
    }

    // 기존 비즈니스 계정 찾기
    let businessUser = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    })

    // 없으면 새로 생성
    if (!businessUser) {
      // 임시 비밀번호 생성 (실제로는 이메일로 전송해야 함)
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      businessUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: companyName,
          type: 'BUSINESS',
          profile: {
            create: {
              companyName,
              businessNo: '000-00-00000', // 임시값
            }
          }
        },
        include: { profile: true }
      })

      // 실제로는 여기서 이메일로 임시 비밀번호를 전송해야 함
      console.log(`새 비즈니스 계정 생성: ${email}, 임시 비밀번호: ${tempPassword}`)
    } else {
      // 기존 계정이 비즈니스 타입이 아니면 에러
      if (businessUser.type !== 'BUSINESS') {
        return NextResponse.json({ 
          error: '해당 이메일은 비즈니스 계정이 아닙니다.' 
        }, { status: 400 })
      }

      // 회사명 업데이트 (필요한 경우)
      if (businessUser.profile && (businessUser.profile as any).companyName !== companyName) {
        await prisma.profile.update({
          where: { userId: businessUser.id },
          data: { companyName }
        })
      }
    }

    return NextResponse.json({
      success: true,
      businessId: businessUser.id,
      businessName: businessUser.profile?.companyName || companyName,
      isNewAccount: !businessUser
    })

  } catch (error) {
    console.error('Business find or create API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}