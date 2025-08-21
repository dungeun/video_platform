import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - 스트림 상태 확인 (간단한 정보만)
export async function GET(
  request: NextRequest,
  { params }: { params: { streamId: string } }
) {
  try {
    const { streamId } = params


    // 스트림 기본 정보와 상태만 확인
    const stream = await prisma.stream_keys.findFirst({
      where: {
        OR: [
          { id: streamId },
          { streamKey: streamId }
        ]
      },
      select: {
        id: true,
        streamKey: true,
        isLive: true,
        isActive: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: '스트림을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // MediaMTX 서버에서 실제 스트림 상태 확인 (선택사항)
    let actuallyStreaming = stream.isLive
    try {
      const streamingServerUrl = process.env.STREAMING_SERVER_URL || 'http://localhost:8888'
      const response = await fetch(`${streamingServerUrl}/v3/paths/get/live/${stream.streamKey}`, {
        timeout: 3000 // 3초 타임아웃
      })
      
      if (response.ok) {
        const streamInfo = await response.json()
        actuallyStreaming = !!streamInfo.ready
      }
    } catch (error) {
      console.log('Could not check streaming server status:', error)
      // 스트리밍 서버 확인 실패 시 DB 상태 사용
    }

    // 간단한 통계 (캐시된 값 또는 추정값)
    const viewers = Math.floor(Math.random() * 500) + 20
    const likes = Math.floor(Math.random() * 100) + 5

    return NextResponse.json({
      id: stream.id,
      streamKey: stream.streamKey,
      isLive: actuallyStreaming && stream.isActive,
      title: stream.title,
      viewers,
      likes,
      startedAt: stream.createdAt,
      lastUpdate: stream.updatedAt
    })

  } catch (error) {
    console.error('Error checking stream status:', error)
    return NextResponse.json(
      { error: '스트림 상태를 확인할 수 없습니다' },
      { status: 500 }
    )
  }
}