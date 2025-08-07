import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

// 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 현재는 캠페인 댓글이 없으므로 빈 배열 반환
    // 실제 비디오 댓글 테이블이 생기면 실제 댓글 조회
    const comments: any[] = []

    // 임시 더미 댓글 데이터
    const dummyComments = [
      {
        id: '1',
        content: '정말 좋은 영상이네요! 도움이 많이 되었습니다.',
        author: {
          id: 'user1',
          name: '김영희',
          profileImage: null,
          isVerified: false
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        likeCount: 5,
        isLiked: false,
        replies: []
      },
      {
        id: '2',
        content: '다음 영상도 기대됩니다!',
        author: {
          id: 'user2',
          name: '박민수',
          profileImage: null,
          isVerified: true
        },
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        likeCount: 3,
        isLiked: false,
        replies: []
      }
    ]

    return NextResponse.json({
      success: true,
      comments: dummyComments,
      pagination: {
        page,
        limit,
        total: dummyComments.length,
        totalPages: Math.ceil(dummyComments.length / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching video comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    const userId = payload.userId
    const videoId = params.id

    const { content, parentId } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // 사용자 정보 조회
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profileImage: true,
        // isVerified 필드가 없다면 임시로 false
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 현재는 실제 댓글 저장 없이 임시 댓글 객체 반환
    // 실제 비디오 댓글 테이블이 생기면 실제 저장
    const newComment = {
      id: `temp_${Date.now()}`,
      content: content.trim(),
      author: {
        id: user.id,
        name: user.name || '익명',
        profileImage: user.profileImage,
        isVerified: false // 임시
      },
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      replies: []
    }

    return NextResponse.json({
      success: true,
      comment: newComment
    })

  } catch (error) {
    console.error('Error creating video comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}