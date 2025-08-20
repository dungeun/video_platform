import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'popular'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 정렬 조건 설정
    let orderBy: any = [{ createdAt: 'desc' }]
    if (sort === 'popular') {
      orderBy = [{ likes: 'desc' }, { createdAt: 'desc' }]
    }

    // 비디오 존재 및 댓글 활성화 여부 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        isCommentsEnabled: true,
        userId: true
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!video.isCommentsEnabled) {
      return NextResponse.json({
        comments: [],
        total: 0,
        hasMore: false,
        message: '댓글이 비활성화되어 있습니다'
      })
    }

    // 댓글 조회 (최상위 댓글만)
    const comments = await prisma.comments.findMany({
      where: {
        videoId: videoId,
        parentId: null // 최상위 댓글만
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true
          }
        },
        replies: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                avatar: true,
                isVerified: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 3 // 처음 3개 답글만 로드
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // 전체 댓글 수 조회
    const total = await prisma.comments.count({
      where: {
        videoId: videoId,
        parentId: null
      }
    })

    // 응답 데이터 포맷팅
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.User.id,
        name: comment.User.name,
        avatar: comment.User.avatar,
        isCreator: comment.User.id === video.userId,
        isVerified: comment.User.isVerified || false
      },
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.User.id,
          name: reply.User.name,
          avatar: reply.User.avatar,
          isCreator: reply.User.id === video.userId,
          isVerified: reply.User.isVerified || false
        },
        likes: reply.likes || 0,
        dislikes: reply.dislikes || 0,
        createdAt: reply.createdAt.toISOString(),
        isPinned: reply.isPinned || false,
        isHearted: reply.isHearted || false
      })),
      createdAt: comment.createdAt.toISOString(),
      isPinned: comment.isPinned || false,
      isHearted: comment.isHearted || false
    }))

    return NextResponse.json({
      success: true,
      comments: formattedComments,
      total,
      page,
      limit,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST - 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

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
        { error: '댓글 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: '댓글은 1000자 이하로 입력해주세요' },
        { status: 400 }
      )
    }

    // 비디오 존재 및 댓글 활성화 여부 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        isCommentsEnabled: true,
        userId: true
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!video.isCommentsEnabled) {
      return NextResponse.json(
        { error: '이 비디오는 댓글이 비활성화되어 있습니다' },
        { status: 403 }
      )
    }

    // 댓글 생성
    const comment = await prisma.comments.create({
      data: {
        content: content.trim(),
        videoId: videoId,
        userId: user.id
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
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.User.id,
        name: comment.User.name,
        avatar: comment.User.avatar,
        isCreator: comment.User.id === video.userId,
        isVerified: comment.User.isVerified || false
      },
      likes: 0,
      dislikes: 0,
      replies: [],
      createdAt: comment.createdAt.toISOString(),
      isPinned: false,
      isHearted: false
    }

    return NextResponse.json({
      success: true,
      message: '댓글이 작성되었습니다',
      ...formattedComment
    })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}