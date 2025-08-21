import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authService } from '@/lib/auth/services'

const prisma = new PrismaClient()

// PATCH - 비디오 메타데이터 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('accessToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const tokenPayload = await authService.verifyToken(token)
    if (!tokenPayload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // JWT 토큰에서 사용자 ID 추출
    const userId = tokenPayload.userId || tokenPayload.id

    // 비디오 존재 및 권한 확인
    const existingVideo = await prisma.videos.findUnique({
      where: { id: videoId }
    })

    if (!existingVideo) {
      return NextResponse.json(
        { error: '비디오를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (existingVideo.userId !== userId) {
      return NextResponse.json(
        { error: '이 비디오를 수정할 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 요청 바디 파싱
    const body = await request.json()
    const {
      duration,
      width,
      height,
      thumbnailUrl,
      status,
      bitrate,
      fps,
      format
    } = body

    // 업데이트할 필드만 포함
    const updateData: any = {}
    
    if (duration !== undefined) updateData.duration = Math.round(duration)
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (status !== undefined) updateData.status = status
    if (bitrate !== undefined) updateData.bitrate = bitrate
    if (fps !== undefined) updateData.fps = fps
    if (format !== undefined) updateData.format = format

    // 메타데이터가 업데이트되면 처리 완료로 간주
    if (Object.keys(updateData).length > 0) {
      updateData.processedAt = new Date()
    }

    // 비디오 메타데이터 업데이트
    const updatedVideo = await prisma.videos.update({
      where: { id: videoId },
      data: updateData,
      select: {
        id: true,
        title: true,
        duration: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        status: true,
        processedAt: true,
        updatedAt: true
      }
    })

    console.log('비디오 메타데이터 업데이트 완료:', {
      videoId,
      updateData,
      updatedAt: updatedVideo.updatedAt
    })

    return NextResponse.json({
      success: true,
      message: '비디오 메타데이터가 성공적으로 업데이트되었습니다',
      video: updatedVideo
    })

  } catch (error) {
    console.error('Error updating video metadata:', error)
    return NextResponse.json(
      { error: '비디오 메타데이터 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}