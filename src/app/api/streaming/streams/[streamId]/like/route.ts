import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 좋아요 전송
export async function POST(
  request: NextRequest,
  { params }: { params: { streamId: string } }
) {
  try {
    const { streamId } = params

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

    // 스트림 존재 확인
    const stream = await prisma.stream_keys.findFirst({
      where: {
        OR: [
          { id: streamId },
          { streamKey: streamId }
        ],
        isActive: true,
        isLive: true
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: '스트림을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 좋아요 기록 (중복 방지를 위해 임시 테이블 또는 Redis 사용 권장)
    // 여기서는 간단히 처리
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000) // 1분 전

    // 같은 사용자의 최근 1분 내 좋아요 확인 (스팸 방지)
    // 실제로는 Redis나 별도 테이블에서 관리하는 것이 좋음
    
    // 좋아요 수 증가 (실제로는 별도 통계 테이블에서 관리)
    // 여기서는 임시로 응답만 처리

    // WebSocket으로 실시간 좋아요 알림 전송
    try {
      const wsResponse = await fetch(`${process.env.WS_SERVER_URL || 'http://localhost:3001'}/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: `stream:${streamId}`,
          type: 'like',
          data: {
            userId: user.id,
            userName: user.name,
            timestamp: now.toISOString()
          }
        })
      })
    } catch (error) {
      console.log('Could not send WebSocket notification:', error)
    }

    return NextResponse.json({
      success: true,
      message: '좋아요가 전송되었습니다',
      userId: user.id,
      timestamp: now
    })

  } catch (error) {
    console.error('Error sending like:', error)
    return NextResponse.json(
      { error: '좋아요 전송에 실패했습니다' },
      { status: 500 }
    )
  }
}