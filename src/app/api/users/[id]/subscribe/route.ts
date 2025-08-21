import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 구독하기
export async function POST(
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
      select: { id: true, name: true, subscriberCount: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 자신은 자신을 구독할 수 없음
    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: '자신은 구독할 수 없습니다' },
        { status: 400 }
      )
    }

    // 이미 구독했는지 확인
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        subscriberId: user.id,
        creatorId: targetUserId
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: '이미 구독한 사용자입니다' },
        { status: 409 }
      )
    }

    // 트랜잭션으로 구독 생성 및 구독자 수 증가
    await prisma.$transaction([
      // 구독 생성
      prisma.subscriptions.create({
        data: {
          subscriberId: user.id,
          creatorId: targetUserId
        }
      }),
      
      // 구독자 수 증가
      prisma.users.update({
        where: { id: targetUserId },
        data: {
          subscriberCount: { increment: 1 }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '구독이 완료되었습니다',
      subscriberCount: (targetUser.subscriberCount || 0) + 1
    })

  } catch (error) {
    console.error('Error subscribing:', error)
    return NextResponse.json(
      { error: '구독 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE - 구독 취소
export async function DELETE(
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
      select: { id: true, name: true, subscriberCount: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 구독 여부 확인
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        subscriberId: user.id,
        creatorId: targetUserId
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: '구독하지 않은 사용자입니다' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 구독 삭제 및 구독자 수 감소
    await prisma.$transaction([
      // 구독 삭제
      prisma.subscriptions.delete({
        where: { id: subscription.id }
      }),
      
      // 구독자 수 감소 (0보다 작아지지 않게)
      prisma.users.update({
        where: { id: targetUserId },
        data: {
          subscriberCount: { decrement: 1 }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '구독이 취소되었습니다',
      subscriberCount: Math.max(0, (targetUser.subscriberCount || 0) - 1)
    })

  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: '구독 취소 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}