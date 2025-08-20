import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 비디오 좋아요/싫어요
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
    const { type } = body

    if (!['like', 'dislike'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 반응 타입입니다' },
        { status: 400 }
      )
    }

    // 비디오 존재 여부 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { 
        id: true, 
        likes: true, 
        dislikes: true,
        isRatingsEnabled: true
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!video.isRatingsEnabled) {
      return NextResponse.json(
        { error: '이 비디오는 평가가 비활성화되어 있습니다' },
        { status: 403 }
      )
    }

    // 기존 반응 확인
    const existingReaction = await prisma.video_reactions.findFirst({
      where: {
        userId: user.id,
        videoId: videoId
      }
    })

    let newLikes = video.likes || 0
    let newDislikes = video.dislikes || 0
    let userReaction: 'like' | 'dislike' | null = null

    if (existingReaction) {
      if (existingReaction.type === type) {
        // 같은 반응 취소
        await prisma.video_reactions.delete({
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
        await prisma.video_reactions.update({
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
      await prisma.video_reactions.create({
        data: {
          userId: user.id,
          videoId: videoId,
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

    // 비디오의 좋아요/싫어요 수 업데이트
    await prisma.videos.update({
      where: { id: videoId },
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
    console.error('Error handling video reaction:', error)
    return NextResponse.json(
      { error: '반응 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}