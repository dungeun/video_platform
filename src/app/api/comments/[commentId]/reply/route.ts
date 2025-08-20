import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 댓글 답글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId: parentCommentId } = params

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

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: '답글 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: '답글은 1000자 이하로 입력해주세요' },
        { status: 400 }
      )
    }

    // 부모 댓글 존재 및 정보 확인
    const parentComment = await prisma.comments.findUnique({
      where: { id: parentCommentId },
      include: {
        Video: {
          select: {
            id: true,
            isCommentsEnabled: true,
            userId: true
          }
        }
      }
    })

    if (!parentComment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!parentComment.Video.isCommentsEnabled) {
      return NextResponse.json(
        { error: '이 비디오는 댓글이 비활성화되어 있습니다' },
        { status: 403 }
      )
    }

    // 답글은 최상위 댓글에만 달 수 있음 (대댓글의 댓글 방지)
    if (parentComment.parentId) {
      return NextResponse.json(
        { error: '답글에는 답글을 달 수 없습니다' },
        { status: 400 }
      )
    }

    // 답글 생성
    const reply = await prisma.comments.create({
      data: {
        content: content.trim(),
        videoId: parentComment.videoId,
        userId: user.id,
        parentId: parentCommentId
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true
          }
        }
      }
    })

    // 응답 데이터 포맷팅
    const formattedReply = {
      id: reply.id,
      content: reply.content,
      author: {
        id: reply.User.id,
        name: reply.User.name,
        avatar: reply.User.avatar,
        isCreator: reply.User.id === parentComment.Video.userId,
        isVerified: reply.User.isVerified || false
      },
      likes: 0,
      dislikes: 0,
      createdAt: reply.createdAt.toISOString(),
      isPinned: false,
      isHearted: false
    }

    return NextResponse.json({
      success: true,
      message: '답글이 작성되었습니다',
      ...formattedReply
    })

  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: '답글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}