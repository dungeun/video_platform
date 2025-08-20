import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 시청 기록 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params

    // 사용자 인증 확인 (선택사항 - 비로그인 사용자도 조회수 증가 가능)
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    let userId = null
    if (token) {
      const user = AuthService.verifyToken(token)
      userId = user?.id
    }

    // 비디오 존재 여부 확인
    const video = await prisma.videos.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, userId: true }
    })

    if (!video) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 시청 기록 저장 (로그인한 사용자만)
    if (userId) {
      // 기존 시청 기록 확인
      const existingRecord = await prisma.watch_history.findFirst({
        where: {
          userId: userId,
          videoId: videoId
        }
      })

      if (existingRecord) {
        // 기존 기록 업데이트
        await prisma.watch_history.update({
          where: { id: existingRecord.id },
          data: {
            watchedAt: new Date(),
            watchCount: { increment: 1 }
          }
        })
      } else {
        // 새 시청 기록 생성
        await prisma.watch_history.create({
          data: {
            userId: userId,
            videoId: videoId,
            watchedAt: new Date(),
            watchCount: 1
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '시청 기록이 저장되었습니다'
    })

  } catch (error) {
    console.error('Error recording view:', error)
    return NextResponse.json(
      { error: '시청 기록 저장 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}