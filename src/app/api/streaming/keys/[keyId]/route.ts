import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 스트림 키 상세 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { keyId } = params

    // 스트림 키 조회 및 소유권 확인
    const streamKey = await prisma.stream_keys.findFirst({
      where: {
        id: keyId,
        channels: {
          userId: userId
        }
      },
      include: {
        channels: true,
        live_streams: {
          orderBy: { createdAt: 'desc' },
          take: 5 // 최근 5개 스트림
        }
      }
    })

    if (!streamKey) {
      return NextResponse.json({ error: 'Stream key not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      streamKey: {
        id: streamKey.id,
        name: streamKey.keyName,
        key: streamKey.streamKey,
        status: streamKey.status,
        permissions: streamKey.permissions,
        createdAt: streamKey.createdAt,
        lastUsedAt: streamKey.lastUsedAt,
        expiresAt: streamKey.expiresAt,
        isExpired: streamKey.expiresAt ? new Date() > streamKey.expiresAt : false,
        recentStreams: streamKey.live_streams.map(stream => ({
          id: stream.id,
          title: stream.title,
          status: stream.status,
          viewerCount: stream.viewerCount,
          duration: stream.duration,
          startedAt: stream.startedAt,
          endedAt: stream.endedAt
        })),
        instructions: {
          obs: {
            server: 'rtmp://localhost:1935/live',
            streamKey: streamKey.streamKey
          },
          urls: {
            rtmp: `rtmp://localhost:1935/live/${streamKey.streamKey}`,
            hls: `http://localhost:8000/live/${streamKey.streamKey}/index.m3u8`,
            flv: `http://localhost:8000/live/${streamKey.streamKey}.flv`
          }
        }
      }
    })

  } catch (error) {
    console.error('Error getting stream key:', error)
    return NextResponse.json({ 
      error: 'Failed to get stream key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 스트림 키 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { keyId } = params
    const body = await req.json()
    const { name, permissions, regenerateKey } = body

    // 스트림 키 소유권 확인
    const existingKey = await prisma.stream_keys.findFirst({
      where: {
        id: keyId,
        channels: {
          userId: userId
        }
      }
    })

    if (!existingKey) {
      return NextResponse.json({ error: 'Stream key not found' }, { status: 404 })
    }

    // 업데이트 데이터 구성
    const updateData: any = {}
    
    if (name) {
      updateData.keyName = name
    }
    
    if (permissions) {
      updateData.permissions = permissions
    }
    
    if (regenerateKey) {
      updateData.streamKey = crypto.randomBytes(32).toString('hex')
      updateData.regeneratedAt = new Date()
    }

    // 스트림 키 업데이트
    const updatedKey = await prisma.stream_keys.update({
      where: { id: keyId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      streamKey: {
        id: updatedKey.id,
        name: updatedKey.keyName,
        key: updatedKey.streamKey,
        status: updatedKey.status,
        permissions: updatedKey.permissions,
        regenerated: !!regenerateKey,
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error updating stream key:', error)
    return NextResponse.json({ 
      error: 'Failed to update stream key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 스트림 키 활성화/비활성화
export async function PATCH(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { keyId } = params
    const body = await req.json()
    const { status } = body

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // 스트림 키 소유권 확인
    const existingKey = await prisma.stream_keys.findFirst({
      where: {
        id: keyId,
        channels: {
          userId: userId
        }
      }
    })

    if (!existingKey) {
      return NextResponse.json({ error: 'Stream key not found' }, { status: 404 })
    }

    // 상태 업데이트
    const updatedKey = await prisma.stream_keys.update({
      where: { id: keyId },
      data: { 
        status: status as 'ACTIVE' | 'INACTIVE',
        statusUpdatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      streamKey: {
        id: updatedKey.id,
        status: updatedKey.status,
        statusUpdatedAt: updatedKey.statusUpdatedAt
      }
    })

  } catch (error) {
    console.error('Error updating stream key status:', error)
    return NextResponse.json({ 
      error: 'Failed to update stream key status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 스트림 키 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { keyId } = params

    // 스트림 키 소유권 확인
    const existingKey = await prisma.stream_keys.findFirst({
      where: {
        id: keyId,
        channels: {
          userId: userId
        }
      }
    })

    if (!existingKey) {
      return NextResponse.json({ error: 'Stream key not found' }, { status: 404 })
    }

    // 활성 스트림 확인
    const activeStream = await prisma.live_streams.findFirst({
      where: {
        streamKey: existingKey.streamKey,
        status: { in: ['PREPARING', 'LIVE'] }
      }
    })

    if (activeStream) {
      return NextResponse.json({ 
        error: 'Cannot delete stream key with active stream' 
      }, { status: 409 })
    }

    // 스트림 키 소프트 삭제 (상태를 DELETED로 변경)
    await prisma.stream_keys.update({
      where: { id: keyId },
      data: {
        status: 'DELETED',
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Stream key deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting stream key:', error)
    return NextResponse.json({ 
      error: 'Failed to delete stream key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}