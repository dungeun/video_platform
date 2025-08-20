import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 댓글 좋아요/싫어요
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const { commentId } = params

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
    const { type } = body

    if (!['like', 'dislike'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 반응 타입입니다' },
        { status: 400 }
      )
    }

    // 댓글 존재 여부 확인
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { 
        id: true, 
        likes: true, 
        dislikes: true,
        videoId: true
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 기존 반응 확인
    const existingReaction = await prisma.comment_reactions.findFirst({
      where: {
        userId: user.id,
        commentId: commentId
      }
    })

    let newLikes = comment.likes || 0
    let newDislikes = comment.dislikes || 0
    let userReaction: 'like' | 'dislike' | null = null

    if (existingReaction) {
      if (existingReaction.type === type) {
        // 같은 반응 취소
        await prisma.comment_reactions.delete({
          where: { id: existingReaction.id }
        })
        
        if (type === 'like') {
          newLikes = Math.max(0, newLikes - 1)
        } else {
          newDislikes = Math.max(0, newDislikes - 1)
        }
        userReaction = null
      } else {
        // 반응 변경
        await prisma.comment_reactions.update({
          where: { id: existingReaction.id },
          data: { type: type }
        })
        
        if (existingReaction.type === 'like') {
          newLikes = Math.max(0, newLikes - 1)
          newDislikes = newDislikes + 1
        } else {
          newDislikes = Math.max(0, newDislikes - 1)
          newLikes = newLikes + 1
        }
        userReaction = type
      }
    } else {
      // 새 반응 생성
      await prisma.comment_reactions.create({
        data: {
          userId: user.id,
          commentId: commentId,
          type: type
        }
      })
      
      if (type === 'like') {
        newLikes = newLikes + 1
      } else {
        newDislikes = newDislikes + 1
      }
      userReaction = type
    }

    // 댓글의 좋아요/싫어요 수 업데이트
    await prisma.comments.update({
      where: { id: commentId },
      data: {
        likes: newLikes,
        dislikes: newDislikes
      }
    })

    return NextResponse.json({
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
      userReaction: userReaction
    })

  } catch (error) {
    console.error('Error handling comment reaction:', error)
    return NextResponse.json(
      { error: '반응 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}