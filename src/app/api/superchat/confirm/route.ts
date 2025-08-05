import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// POST - SuperChat 결제 확인 및 처리
export async function POST(request: NextRequest) {
  try {
    const user = AuthService.getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { superChatId, paymentId } = await request.json()

    if (!superChatId || !paymentId) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // SuperChat 조회
    const superChat = await prisma.superChat.findUnique({
      where: { id: superChatId },
      include: {
        channel: true
      }
    })

    if (!superChat) {
      return NextResponse.json({ error: 'SuperChat을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (superChat.userId !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    if (superChat.isPaid) {
      return NextResponse.json({ error: '이미 처리된 SuperChat입니다.' }, { status: 400 })
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // SuperChat 상태 업데이트
      const updatedSuperChat = await tx.superChat.update({
        where: { id: superChatId },
        data: {
          isPaid: true,
          paymentId
        }
      })

      // 채널 통계 업데이트
      await tx.channel.update({
        where: { id: superChat.channelId },
        data: {
          totalSuperChatAmount: {
            increment: superChat.amount
          },
          totalEarnings: {
            increment: superChat.amount * 0.7 // 플랫폼 수수료 30% 제외
          },
          pendingSettlement: {
            increment: superChat.amount * 0.7
          }
        }
      })

      // 수익 기록 생성
      const now = new Date()
      await tx.creatorEarnings.create({
        data: {
          channelId: superChat.channelId,
          type: 'superchat',
          amount: superChat.amount,
          fee: superChat.amount * 0.3, // 플랫폼 수수료 30%
          netAmount: superChat.amount * 0.7,
          referenceId: superChat.id,
          description: `SuperChat from ${user.name || user.email}`,
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      })

      return updatedSuperChat
    })

    // TODO: 실시간 알림 전송 (WebSocket/SSE)
    // 채널 소유자에게 SuperChat 알림 전송

    return NextResponse.json({ 
      success: true,
      superChat: result,
      message: 'SuperChat이 성공적으로 전송되었습니다.'
    })
  } catch (error) {
    console.error('SuperChat confirm error:', error)
    return NextResponse.json({ 
      error: 'SuperChat 처리 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}