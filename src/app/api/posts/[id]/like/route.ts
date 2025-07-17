import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AuthService } from '@/lib/auth'


// POST /api/posts/[id]/like - 게시글 좋아요/취소
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({
      where: { id: params.id, status: 'PUBLISHED' }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 기존 좋아요 확인
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: user.id
        }
      }
    })

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // 좋아요 취소
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
      liked = false
    } else {
      // 좋아요 추가
      await prisma.postLike.create({
        data: {
          postId: params.id,
          userId: user.id
        }
      })
      liked = true
    }

    // 총 좋아요 수 조회
    likeCount = await prisma.postLike.count({
      where: { postId: params.id }
    })

    return NextResponse.json({
      liked,
      likeCount
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}