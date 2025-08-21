import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { authService } from '@/lib/auth/services'

// POST - 썸네일 업로드
export async function POST(request: NextRequest) {
  try {
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

    // FormData 파싱
    const formData = await request.formData()
    
    const thumbnailFile = formData.get('thumbnail') as File | null
    const videoId = formData.get('videoId') as string
    const index = formData.get('index') as string || '0'

    // 필수 필드 검증
    if (!thumbnailFile || !videoId) {
      return NextResponse.json(
        { error: '썸네일 파일과 비디오 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!thumbnailFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (thumbnailFile.size > maxSize) {
      return NextResponse.json(
        { error: '썸네일 크기는 5MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }

    // 업로드 디렉토리 경로
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails')
    
    // 디렉토리가 없으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 파일명 생성
    const fileExtension = path.extname(thumbnailFile.name) || '.jpg'
    const fileName = `${videoId}_${index}_${Date.now()}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)

    // 파일 저장
    const bytes = await thumbnailFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 썸네일 URL
    const thumbnailUrl = `/uploads/thumbnails/${fileName}`

    console.log('썸네일 업로드 완료:', {
      videoId,
      index,
      fileName,
      size: thumbnailFile.size,
      type: thumbnailFile.type
    })

    return NextResponse.json({
      success: true,
      thumbnailUrl,
      message: '썸네일이 성공적으로 업로드되었습니다'
    })

  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    return NextResponse.json(
      { error: '썸네일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}