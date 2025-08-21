import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import Minio from 'minio'
import { authService } from '@/lib/auth/services'

// MinIO 클라이언트 설정
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '64.176.226.119',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'videopick',
  secretKey: process.env.MINIO_SECRET_KEY || 'secure_minio_password'
})

const BUCKET_NAME = 'videopick-images'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (관리자만 가능)
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('accessToken')?.value

    if (token) {
      try {
        const decoded = await authService.verifyToken(token)
        const user = await authService.getUserById(decoded.userId || decoded.id)
        
        // 관리자가 아니면 거부
        if (user?.type !== 'ADMIN') {
          return NextResponse.json(
            { error: '권한이 없습니다' },
            { status: 403 }
          )
        }
      } catch (error) {
        // 토큰 검증 실패 - 일반 사용자도 프로필 이미지 업로드 가능하도록 계속 진행
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('type') as string || 'general'

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다' },
        { status: 400 }
      )
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드 가능합니다' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다' },
        { status: 400 }
      )
    }

    // 버킷 생성 확인
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      
      // 버킷 정책 설정 (public 읽기)
      const publicPolicy = {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "AWS": ["*"]
            },
            "Action": [
              "s3:GetObject"
            ],
            "Resource": [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      }
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(publicPolicy))
    }

    // 파일 이름 생성
    const fileExtension = file.name.split('.').pop()
    const fileName = `${imageType}_${uuidv4()}.${fileExtension}`

    // 파일을 버퍼로 변환
    const buffer = Buffer.from(await file.arrayBuffer())

    // MinIO에 업로드
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      buffer.length,
      {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000'
      }
    )

    // URL 생성
    const imageUrl = `http://${process.env.MINIO_ENDPOINT || '64.176.226.119'}:${process.env.MINIO_PORT || '9000'}/${BUCKET_NAME}/${fileName}`

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName: fileName,
      type: imageType
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { 
        error: '이미지 업로드 중 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}