import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

// POST - 새 비디오 생성 (TUS 업로드 완료 후)
export async function POST(request: NextRequest) {
  try {
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

    // FormData 파싱
    const formData = await request.formData()
    
    const videoUrl = formData.get('videoUrl') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''
    const category = formData.get('category') as string || ''
    const tagsString = formData.get('tags') as string || '[]'
    const visibility = formData.get('visibility') as string || 'public'
    const language = formData.get('language') as string || 'ko'
    const isCommentsEnabled = formData.get('isCommentsEnabled') === 'true'
    const isRatingsEnabled = formData.get('isRatingsEnabled') === 'true'
    const isMonetizationEnabled = formData.get('isMonetizationEnabled') === 'true'
    const ageRestriction = formData.get('ageRestriction') === 'true'
    const license = formData.get('license') as string || 'standard'
    const scheduledAt = formData.get('scheduledAt') as string
    const thumbnailFile = formData.get('thumbnail') as File | null

    // 필수 필드 검증
    if (!videoUrl || !title.trim()) {
      return NextResponse.json(
        { error: '비디오 URL과 제목은 필수입니다' },
        { status: 400 }
      )
    }

    // 태그 파싱
    let tags: string[] = []
    try {
      tags = JSON.parse(tagsString)
      if (!Array.isArray(tags)) {
        tags = []
      }
    } catch (error) {
      tags = []
    }

    // 예약 게시 날짜 검증
    let scheduledDate = null
    if (visibility === 'scheduled' && scheduledAt) {
      scheduledDate = new Date(scheduledAt)
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: '예약 게시 날짜는 현재 시간보다 이후여야 합니다' },
          { status: 400 }
        )
      }
    }

    // 썸네일 업로드 처리 (간단한 구현)
    let thumbnailUrl = null
    if (thumbnailFile && thumbnailFile.size > 0) {
      // 실제로는 스토리지 서버에 업로드해야 함
      // 여기서는 임시로 처리
      try {
        const buffer = await thumbnailFile.arrayBuffer()
        const fileName = `thumbnail_${Date.now()}_${thumbnailFile.name}`
        // 실제 업로드 로직이 필요함
        thumbnailUrl = `/uploads/thumbnails/${fileName}`
      } catch (error) {
        console.error('Thumbnail upload failed:', error)
        // 썸네일 업로드 실패는 비디오 생성을 막지 않음
      }
    }

    // 비디오 레코드 생성
    const video = await prisma.videos.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        userId: user.id,
        category,
        tags: tags.join(','),
        visibility: visibility as any,
        language,
        license,
        isCommentsEnabled,
        isRatingsEnabled,
        isMonetizationEnabled,
        ageRestriction,
        scheduledAt: scheduledDate,
        status: visibility === 'scheduled' ? 'scheduled' : 'processing',
        duration: 0, // 실제로는 비디오에서 추출해야 함
        views: 0,
        likes: 0,
        dislikes: 0
      }
    })

    // 비디오 처리를 위한 백그라운드 작업 큐에 추가
    // 실제로는 Redis Queue나 별도 처리 서비스 필요
    try {
      await processVideoInBackground(video.id, videoUrl)
    } catch (error) {
      console.error('Failed to queue video processing:', error)
      // 처리 큐 실패는 비디오 생성을 막지 않음
    }

    return NextResponse.json({
      success: true,
      videoId: video.id,
      message: '비디오가 성공적으로 생성되었습니다',
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        visibility: video.visibility,
        createdAt: video.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: '비디오 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 백그라운드 비디오 처리 (간단한 구현)
async function processVideoInBackground(videoId: string, videoUrl: string) {
  // 실제로는 별도 워커나 큐 서비스에서 처리해야 함
  // 여기서는 간단히 DB 상태만 업데이트
  setTimeout(async () => {
    try {
      await prisma.videos.update({
        where: { id: videoId },
        data: {
          status: 'published',
          // 실제로는 비디오 분석 결과를 업데이트해야 함
          duration: Math.floor(Math.random() * 3600), // 임시 더미 duration
        }
      })
      console.log(`Video ${videoId} processing completed`)
    } catch (error) {
      console.error(`Failed to update video ${videoId}:`, error)
      
      // 처리 실패 시 상태 업데이트
      try {
        await prisma.videos.update({
          where: { id: videoId },
          data: { status: 'failed' }
        })
      } catch (updateError) {
        console.error(`Failed to update video status to failed:`, updateError)
      }
    }
  }, 5000) // 5초 후 "처리 완료"로 시뮬레이션
}