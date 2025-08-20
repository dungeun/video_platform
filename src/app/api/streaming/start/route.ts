import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

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
    const { title, description, category = 'general', scheduled = false, scheduledAt } = body

    // 사용자 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { channels: true }
    })

    if (!user || !user.channels) {
      return NextResponse.json({ error: 'User or channel not found' }, { status: 404 })
    }

    // 진행 중인 스트림 확인
    const existingStream = await prisma.live_streams.findFirst({
      where: {
        channelId: user.channels.id,
        status: { in: ['PREPARING', 'LIVE'] }
      }
    })

    if (existingStream) {
      return NextResponse.json({ 
        error: 'You already have an active stream',
        streamId: existingStream.id
      }, { status: 409 })
    }

    // 스트림 키 생성
    const streamKey = crypto.randomBytes(32).toString('hex')

    // 라이브 스트림 생성
    const liveStream = await prisma.live_streams.create({
      data: {
        title,
        description,
        channelId: user.channels.id,
        streamKey,
        category,
        status: scheduled ? 'SCHEDULED' : 'PREPARING',
        scheduledAt: scheduled ? new Date(scheduledAt) : null,
        rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
        hlsUrl: `http://localhost:8000/live/${streamKey}/index.m3u8`,
        flvUrl: `http://localhost:8000/live/${streamKey}.flv`,
        viewerCount: 0,
        maxViewers: 0
      }
    })

    return NextResponse.json({
      success: true,
      stream: {
        id: liveStream.id,
        streamKey: liveStream.streamKey,
        title: liveStream.title,
        status: liveStream.status,
        urls: {
          rtmp: liveStream.rtmpUrl,
          hls: liveStream.hlsUrl,
          flv: liveStream.flvUrl
        },
        instructions: {
          rtmp: {
            server: 'rtmp://localhost:1935/live',
            streamKey: streamKey,
            obs: {
              server: 'rtmp://localhost:1935/live',
              streamKey: streamKey
            }
          },
          test: {
            hls: `http://localhost:8000/live/${streamKey}/index.m3u8`,
            flv: `http://localhost:8000/live/${streamKey}.flv`
          }
        }
      }
    })

  } catch (error) {
    console.error('Error starting stream:', error)
    return NextResponse.json({ 
      error: 'Failed to start stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // 사용자의 채널 정보 가져오기
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { channels: true }
    })

    if (!user || !user.channels) {
      return NextResponse.json({ error: 'User or channel not found' }, { status: 404 })
    }

    // 현재 진행 중인 스트림 조회
    const activeStream = await prisma.live_streams.findFirst({
      where: {
        channelId: user.channels.id,
        status: { in: ['PREPARING', 'LIVE', 'SCHEDULED'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!activeStream) {
      return NextResponse.json({ 
        hasActiveStream: false,
        stream: null 
      })
    }

    return NextResponse.json({
      hasActiveStream: true,
      stream: {
        id: activeStream.id,
        streamKey: activeStream.streamKey,
        title: activeStream.title,
        status: activeStream.status,
        viewerCount: activeStream.viewerCount,
        startedAt: activeStream.startedAt,
        urls: {
          rtmp: activeStream.rtmpUrl,
          hls: activeStream.hlsUrl,
          flv: activeStream.flvUrl
        }
      }
    })

  } catch (error) {
    console.error('Error getting stream status:', error)
    return NextResponse.json({ 
      error: 'Failed to get stream status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}