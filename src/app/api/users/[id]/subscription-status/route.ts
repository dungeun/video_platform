import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 구독 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: targetUserId } = params

    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // 대상 사용자 존재 여부 확인
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 자신은 자신을 구독할 수 없음
    if (user.id === targetUserId) {
      return NextResponse.json({
        isSubscribed: false,
        canSubscribe: false,
        message: '자신은 구독할 수 없습니다'
      })
    }

    // 구독 상태 확인
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        subscriberId: user.id,
        creatorId: targetUserId
      }
    })

    return NextResponse.json({
      isSubscribed: !!subscription,
      canSubscribe: true,
      subscriptionDate: subscription?.createdAt?.toISOString() || null
    })

  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { error: '구독 상태 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}