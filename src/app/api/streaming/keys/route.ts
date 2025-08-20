import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 새 스트림 키 생성
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

    // 사용자 및 채널 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { channels: true }
    })

    if (!user || !user.channels) {
      return NextResponse.json({ error: 'User or channel not found' }, { status: 404 })
    }

    // 기존 활성 스트림 키 확인
    const existingKeys = await prisma.stream_keys.findMany({
      where: {
        channelId: user.channels.id,
        status: 'ACTIVE'
      }
    })

    // 최대 3개의 활성 키 제한
    if (existingKeys.length >= 3) {
      return NextResponse.json({ 
        error: 'Maximum number of active stream keys reached (3)' 
      }, { status: 400 })
    }

    // 새 스트림 키 생성
    const streamKey = crypto.randomBytes(32).toString('hex')
    const keyName = `Stream Key ${existingKeys.length + 1}`

    const newStreamKey = await prisma.stream_keys.create({
      data: {
        id: uuidv4(),
        channelId: user.channels.id,
        keyName: keyName,
        streamKey: streamKey,
        status: 'ACTIVE',
        permissions: ['STREAM', 'RECORD'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1년 후 만료
      }
    })

    return NextResponse.json({
      success: true,
      streamKey: {
        id: newStreamKey.id,
        name: newStreamKey.keyName,
        key: newStreamKey.streamKey,
        status: newStreamKey.status,
        permissions: newStreamKey.permissions,
        createdAt: newStreamKey.createdAt,
        expiresAt: newStreamKey.expiresAt,
        instructions: {
          rtmp: {
            server: 'rtmp://localhost:1935/live',
            streamKey: streamKey
          },
          urls: {
            rtmp: `rtmp://localhost:1935/live/${streamKey}`,
            hls: `http://localhost:8000/live/${streamKey}/index.m3u8`,
            flv: `http://localhost:8000/live/${streamKey}.flv`
          }
        }
      }
    })

  } catch (error) {
    console.error('Error creating stream key:', error)
    return NextResponse.json({ 
      error: 'Failed to create stream key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 스트림 키 목록 조회
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

    // 사용자 및 채널 확인
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { channels: true }
    })

    if (!user || !user.channels) {
      return NextResponse.json({ error: 'User or channel not found' }, { status: 404 })
    }

    // 스트림 키 목록 조회
    const streamKeys = await prisma.stream_keys.findMany({
      where: {
        channelId: user.channels.id
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            live_streams: true // 이 키로 생성된 스트림 수
          }
        }
      }
    })

    const formattedKeys = streamKeys.map(key => ({
      id: key.id,
      name: key.keyName,
      key: key.status === 'ACTIVE' ? key.streamKey : '••••••••',
      status: key.status,
      permissions: key.permissions,
      usageCount: key._count.live_streams,
      lastUsed: key.lastUsedAt,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      isExpired: key.expiresAt ? new Date() > key.expiresAt : false
    }))

    return NextResponse.json({
      success: true,
      streamKeys: formattedKeys,
      stats: {
        total: streamKeys.length,
        active: streamKeys.filter(k => k.status === 'ACTIVE').length,
        inactive: streamKeys.filter(k => k.status === 'INACTIVE').length,
        expired: streamKeys.filter(k => k.expiresAt && new Date() > k.expiresAt).length
      }
    })

  } catch (error) {
    console.error('Error getting stream keys:', error)
    return NextResponse.json({ 
      error: 'Failed to get stream keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}