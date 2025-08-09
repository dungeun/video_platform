import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'


// POST /api/posts/[id]/like - 게시글 좋아요/취소
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Like API called for post:', params.id)
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('Token exists:', !!token)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await verifyJWT(token)
      console.log('Verified user:', user)
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const userId = user.userId || user.id
    if (!user || !userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 게시글 존재 확인
    console.log('Checking post existence...')
    const post = await prisma.posts.findUnique({
      where: { id: params.id, status: 'PUBLISHED' }
    })

    if (!post) {
      console.log('Post not found:', params.id)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    console.log('Post found:', post.id)

    // 기존 좋아요 확인
    console.log('Checking existing like for user:', userId)
    const existingLike = await prisma.post_likes.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: userId
        }
      }
    })
    console.log('Existing like:', !!existingLike)

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // 좋아요 취소
      await prisma.post_likes.delete({
        where: { id: existingLike.id }
      })
      liked = false
    } else {
      // 좋아요 추가
      await prisma.post_likes.create({
        data: {
          id: `like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          postId: params.id,
          userId: userId
        }
      })
      liked = true
    }

    // 총 좋아요 수 조회
    likeCount = await prisma.post_likes.count({
      where: { postId: params.id }
    })

    return NextResponse.json({
      liked,
      likeCount
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}