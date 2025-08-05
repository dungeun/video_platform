import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// 파일 업로드 처리
async function saveFile(file: File, directory: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // 파일 확장자 추출
  const extension = file.name.split('.').pop() || 'bin'
  const filename = `${randomUUID()}.${extension}`
  
  // 업로드 디렉토리 생성
  const uploadDir = join(process.cwd(), 'public', 'uploads', directory)
  await mkdir(uploadDir, { recursive: true })
  
  // 파일 저장
  const filepath = join(uploadDir, filename)
  await writeFile(filepath, buffer)
  
  // 웹 경로 반환
  return `/uploads/${directory}/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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

    // 사용자 확인 (비즈니스 계정만 업로드 가능)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    })

    if (!user || user.type !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Only business users can upload videos' },
        { status: 403 }
      )
    }

    // FormData 파싱
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const thumbnailFile = formData.get('thumbnail') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tagsString = formData.get('tags') as string
    const privacy = formData.get('privacy') as string
    const durationString = formData.get('duration') as string

    // 필수 필드 검증
    if (!videoFile || !title) {
      return NextResponse.json(
        { error: 'Video file and title are required' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (videoFile.size > 100 * 1024 * 1024) { // 100MB
      return NextResponse.json(
        { error: 'Video file must be smaller than 100MB' },
        { status: 400 }
      )
    }

    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json(
        { error: 'Thumbnail file must be smaller than 5MB' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid video file type' },
        { status: 400 }
      )
    }

    if (thumbnailFile && !thumbnailFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid thumbnail file type' },
        { status: 400 }
      )
    }

    // 파일 저장
    const videoUrl = await saveFile(videoFile, 'videos')
    const thumbnailUrl = thumbnailFile ? await saveFile(thumbnailFile, 'thumbnails') : null

    // 태그 파싱
    let tags: string[] = []
    try {
      tags = tagsString ? JSON.parse(tagsString) : []
    } catch (error) {
      tags = []
    }

    // 현재는 캠페인으로 저장 (실제 비디오 테이블이 생기면 변경)
    // 비디오 업로드를 캠페인으로 매핑하여 저장
    const campaign = await prisma.campaign.create({
      data: {
        businessId: user.business.id,
        title: title.trim(),
        description: description?.trim() || '',
        thumbnailImageUrl: thumbnailUrl,
        // 비디오 URL을 미디어 이미지로 임시 저장
        mediaImages: [videoUrl], 
        hashtags: tags,
        budget: 0, // 비디오는 예산이 없음
        deliverables: [`${Math.round(parseInt(durationString) || 0)}분 비디오`],
        requirements: [`카테고리: ${category || '기타'}`, `공개설정: ${privacy || 'public'}`],
        applicationDeadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후
        campaignPeriod: '상시',
        status: privacy === 'private' ? 'DRAFT' : 'ACTIVE',
        targetAudience: '전체',
        preferredInfluencerType: 'ANY'
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true
          }
        },
        _count: {
          select: {
            applications: true,
            likes: true
          }
        }
      }
    })

    // 비디오 형태로 변환하여 반환 
    const video = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      videoUrl: campaign.mediaImages[0] || '',
      thumbnailUrl: campaign.thumbnailImageUrl || '',
      duration: parseInt(durationString) || 0,
      viewCount: 0,
      likeCount: campaign._count.likes,
      dislikeCount: 0,
      commentCount: 0,
      creator: {
        id: campaign.business.id,
        name: campaign.business.name || '크리에이터',
        avatar: campaign.business.logo,
        subscriberCount: 12000, // 임시 데이터
        isVerified: true
      },
      category: category || 'other',
      tags: tags,
      privacy: privacy || 'public',
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      isLiked: false,
      isDisliked: false,
      isSubscribed: false
    }

    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      video
    })

  } catch (error) {
    console.error('Video upload error:', error)
    
    // 구체적인 에러 메시지 반환
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json(
          { error: 'Server storage is full. Please try again later.' },
          { status: 507 }
        )
      }
      
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'File permission error. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload video. Please try again.' },
      { status: 500 }
    )
  }
}

// 파일 업로드 제한 설정
export const runtime = 'nodejs'
export const maxDuration = 30 // 30초 타임아웃