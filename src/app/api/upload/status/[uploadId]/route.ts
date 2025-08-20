import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { uploadId } = params

    // 업로드 파일 상태 조회
    const file = await prisma.files.findUnique({
      where: { id: uploadId },
      include: {
        videos: true // 비디오 변환 정보 포함
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // 소유권 확인
    if (file.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 응답 데이터 구성
    const responseData = {
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      uploadProgress: file.uploadProgress,
      uploadedSize: file.uploadedSize,
      status: file.status,
      errorMessage: file.errorMessage,
      createdAt: file.createdAt,
      processedAt: file.processedAt,
      video: file.videos ? {
        id: file.videos.id,
        title: file.videos.title,
        status: file.videos.status,
        duration: file.videos.duration,
        thumbnailUrl: file.videos.thumbnailUrl,
        hlsUrl: file.videos.hlsUrl,
        dashUrl: file.videos.dashUrl
      } : null
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error getting upload status:', error)
    return NextResponse.json({ 
      error: 'Failed to get upload status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 업로드 취소/삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    // JWT 토큰 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { uploadId } = params

    // 파일 조회 및 소유권 확인
    const file = await prisma.files.findUnique({
      where: { id: uploadId }
    })

    if (!file) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (file.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 진행 중인 업로드만 취소 가능
    if (file.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Cannot cancel completed upload' 
      }, { status: 400 })
    }

    // TUS 서버에 업로드 취소 요청
    try {
      await fetch(`http://localhost:3001/api/upload/video/tus/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Tus-Resumable': '1.0.0'
        }
      })
    } catch (tusError) {
      console.error('Failed to cancel TUS upload:', tusError)
    }

    // 데이터베이스에서 상태 업데이트
    const updatedFile = await prisma.files.update({
      where: { id: uploadId },
      data: {
        status: 'CANCELLED',
        errorMessage: 'Cancelled by user'
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        status: updatedFile.status,
        cancelledAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error cancelling upload:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}