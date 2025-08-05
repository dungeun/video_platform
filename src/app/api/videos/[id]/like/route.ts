import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

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

    // 현재는 캠페인 좋아요 기능을 사용 (실제 비디오 테이블이 생기면 변경)
    const existingLike = await prisma.campaignLike.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: videoId
        }
      }
    })

    let liked = false

    if (existingLike) {
      // 좋아요 제거
      await prisma.campaignLike.delete({
        where: {
          userId_campaignId: {
            userId,
            campaignId: videoId
          }
        }
      })
      liked = false
    } else {
      // 좋아요 추가
      await prisma.campaignLike.create({
        data: {
          userId,
          campaignId: videoId
        }
      })
      liked = true
    }

    // 총 좋아요 수 조회
    const likeCount = await prisma.campaignLike.count({
      where: { campaignId: videoId }
    })

    return NextResponse.json({
      success: true,
      liked,
      likeCount
    })

  } catch (error) {
    console.error('Error toggling video like:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}