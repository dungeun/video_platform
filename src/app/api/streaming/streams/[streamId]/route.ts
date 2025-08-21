import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 스트림 정보 가져오기
export async function GET(
  request: NextRequest,
  { params }: { params: { streamId: string } }
) {
  try {
    const { streamId } = params

    // 스트림 정보 조회
    const stream = await prisma.stream_keys.findFirst({
      where: {
        OR: [
          { id: streamId },
          { streamKey: streamId }
        ],
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            type: true,
            verified: true
          }
        }
      }
    })

    if (!stream) {
      return NextResponse.json(
        { error: '스트림을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 스트림 통계 조회 (임시 더미 데이터)
    const viewers = Math.floor(Math.random() * 1000) + 50
    const likes = Math.floor(Math.random() * 500) + 10

    const streamData = {
      id: stream.id,
      title: stream.title || '라이브 방송',
      description: stream.description || '',
      streamKey: stream.streamKey,
      isLive: stream.isLive,
      thumbnailUrl: stream.thumbnailUrl,
      category: stream.category || '기타',
      createdAt: stream.createdAt,
      creator: {
        id: stream.user.id,
        name: stream.user.name,
        profileImage: stream.user.profileImage,
        isVerified: stream.user.verified || false,
        followers: 1250 // 임시 더미 데이터
      },
      viewers,
      likes,
      superChatEnabled: true,
      chatEnabled: true
    }

    return NextResponse.json(streamData)

  } catch (error) {
    console.error('Error fetching stream:', error)
    return NextResponse.json(
      { error: '스트림 정보를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

// PUT - 스트림 정보 업데이트
export async function PUT(
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

    // 요청 본문에서 업데이트할 데이터 가져오기
    const body = await request.json()
    const { title, description, category, tags, thumbnailUrl } = body

    // 제목은 필수
    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목은 필수입니다' },
        { status: 400 }
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

    // 스트림 정보 업데이트
    const updatedStream = await prisma.stream_keys.update({
      where: { id: stream.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        streamKey: true,
        userId: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        thumbnailUrl: true,
        isActive: true,
        isLive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '스트림 정보가 업데이트되었습니다',
      ...updatedStream,
      tags: updatedStream.tags ? updatedStream.tags.split(',') : []
    })

  } catch (error) {
    console.error('Error updating stream info:', error)
    return NextResponse.json(
      { error: '스트림 정보 업데이트에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE - 스트림 삭제/종료
export async function DELETE(
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

    const updatedStream = await prisma.stream_keys.update({
      where: { id: stream.id },
      data: {
        isLive: false,
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: '스트림이 종료되었습니다',
      stream: updatedStream 
    })

  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json(
      { error: '스트림 종료에 실패했습니다' },
      { status: 500 }
    )
  }
}