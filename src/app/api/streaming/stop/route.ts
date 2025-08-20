import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const body = await req.json()
    const { streamId } = body

    // 사용자 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { channels: true }
    })

    if (!user || !user.channels) {
      return NextResponse.json({ error: 'User or channel not found' }, { status: 404 })
    }

    // 스트림 조회 및 소유권 확인
    const liveStream = await prisma.live_streams.findFirst({
      where: {
        id: streamId,
        channelId: user.channels.id,
        status: { in: ['PREPARING', 'LIVE'] }
      }
    })

    if (!liveStream) {
      return NextResponse.json({ 
        error: 'Stream not found or already ended' 
      }, { status: 404 })
    }

    // 스트림 상태 계산
    const startTime = liveStream.startedAt || liveStream.createdAt
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    // 스트림 종료
    const updatedStream = await prisma.live_streams.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        endedAt: endTime,
        duration: duration
      }
    })

    // 스트림 통계 업데이트
    await prisma.stream_stats.create({
      data: {
        streamId: streamId,
        totalViewers: updatedStream.maxViewers || 0,
        peakViewers: updatedStream.maxViewers || 0,
        totalDuration: duration,
        totalMessages: 0, // 채팅 메시지는 별도로 계산
        averageViewTime: duration, // 실제로는 더 복잡한 계산 필요
        streamDate: startTime
      }
    })

    // 채널 통계 업데이트 (총 스트림 시간, 스트림 수 증가)
    await prisma.channels.update({
      where: { id: user.channels.id },
      data: {
        totalStreams: { increment: 1 },
        totalStreamTime: { increment: duration }
      }
    })

    return NextResponse.json({
      success: true,
      stream: {
        id: updatedStream.id,
        status: updatedStream.status,
        duration: duration,
        endedAt: endTime,
        maxViewers: updatedStream.maxViewers,
        stats: {
          totalViewers: updatedStream.maxViewers || 0,
          duration: duration,
          ended: true
        }
      }
    })

  } catch (error) {
    console.error('Error stopping stream:', error)
    return NextResponse.json({ 
      error: 'Failed to stop stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 강제 종료 (관리자용)
export async function DELETE(req: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // 관리자 권한 확인
    const user = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const streamId = searchParams.get('streamId')

    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID required' }, { status: 400 })
    }

    // 스트림 강제 종료
    const updatedStream = await prisma.live_streams.update({
      where: { id: streamId },
      data: {
        status: 'TERMINATED',
        endedAt: new Date(),
        terminatedReason: 'ADMIN_ACTION'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Stream terminated by admin',
      stream: {
        id: updatedStream.id,
        status: updatedStream.status,
        endedAt: updatedStream.endedAt
      }
    })

  } catch (error) {
    console.error('Error terminating stream:', error)
    return NextResponse.json({ 
      error: 'Failed to terminate stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}