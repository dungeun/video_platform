import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 스트림 키 유효성 검증
export async function GET(
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

    // 스트림 키 존재 및 소유권 확인
    const stream = await prisma.stream_keys.findFirst({
      where: {
        OR: [
          { id: streamId },
          { streamKey: streamId }
        ],
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        streamKey: true,
        userId: true,
        title: true,
        isActive: true,
        isLive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: '스트림을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      )
    }

    // 스트림 키가 유효하고 사용자 소유임을 확인
    return NextResponse.json({
      valid: true,
      stream: {
        id: stream.id,
        streamKey: stream.streamKey,
        title: stream.title,
        isActive: stream.isActive,
        isLive: stream.isLive,
        createdAt: stream.createdAt,
        updatedAt: stream.updatedAt
      }
    })

  } catch (error) {
    console.error('Error validating stream key:', error)
    return NextResponse.json(
      { error: '스트림 키 검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}