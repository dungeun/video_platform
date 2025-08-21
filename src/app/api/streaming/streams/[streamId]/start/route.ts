import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 스트림 시작
export async function POST(
  request: NextRequest,
  { params }: { params: { streamId: string } }
) {
  try {
    const { streamId } = params

    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value ||
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('accessToken')?.value

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

    // 스트림 키 찾기 및 권한 확인
    const stream = await prisma.stream_keys.findFirst({
      where: {
        AND: [
          {
            OR: [
              { id: streamId },
              { streamKey: streamId }
            ]
          },
          { userId: user.id }
        ]
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: '스트림을 찾을 수 없거나 권한이 없습니다' },
        { status: 404 }
      )
    }

    if (stream.isLive) {
      return NextResponse.json(
        { error: '이미 방송 중입니다' },
        { status: 400 }
      )
    }

    // 스트림 상태를 LIVE로 변경
    const updatedStream = await prisma.stream_keys.update({
      where: { id: stream.id },
      data: {
        isLive: true,
        updatedAt: new Date()
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

    // 스트림 세션 기록 생성 (선택사항)
    try {
      await prisma.stream_sessions.create({
        data: {
          streamKeyId: stream.id,
          startedAt: new Date(),
          status: 'LIVE'
        }
      })
    } catch (error) {
      console.log('Stream session creation failed (table may not exist):', error)
      // 테이블이 없을 수 있으므로 에러를 무시하고 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: '방송이 시작되었습니다',
      ...updatedStream
    })

  } catch (error) {
    console.error('Error starting stream:', error)
    return NextResponse.json(
      { error: '방송 시작에 실패했습니다' },
      { status: 500 }
    )
  }
}