import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
    const body = await request.json()
    
    const { title, description, category, thumbnailUrl } = body

    const updatedStream = await prisma.stream_keys.update({
      where: {
        id: streamId
      },
      data: {
        title,
        description,
        category,
        thumbnailUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedStream)

  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: '스트림 업데이트에 실패했습니다' },
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

    const updatedStream = await prisma.stream_keys.update({
      where: {
        id: streamId
      },
      data: {
        isLive: false,
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
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