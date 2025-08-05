import { NextRequest, NextResponse } from 'next/server';
import { uploadService, VideoProcessOptions } from '@/lib/services/upload.service';
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 비디오 업로드 스키마
const videoUploadSchema = z.object({
  generateThumbnail: z.boolean().optional().default(true),
  thumbnailTime: z.number().min(0).max(3600).optional().default(1),
  quality: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  maxDuration: z.number().min(1).max(7200).optional(), // 최대 2시간
});

// POST /api/upload/video - 비디오 파일 업로드
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 - BUSINESS와 CREATOR 타입만 허용
    const authResult = await requireAuth(request, ['BUSINESS', 'CREATOR']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // FormData에서 파일과 옵션 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsString = formData.get('options') as string;

    if (!file) {
      return createErrorResponse('비디오 파일이 필요합니다.', 400);
    }

    // 비디오 파일인지 확인
    if (!file.type.startsWith('video/')) {
      return createErrorResponse('비디오 파일만 업로드할 수 있습니다.', 400);
    }

    // 옵션 파싱 및 검증
    let options: VideoProcessOptions = {};
    if (optionsString) {
      try {
        const parsedOptions = JSON.parse(optionsString);
        const validationResult = videoUploadSchema.safeParse(parsedOptions);
        
        if (!validationResult.success) {
          return createErrorResponse(
            '잘못된 업로드 옵션입니다.',
            400,
            validationResult.error.errors
          );
        }
        
        options = validationResult.data;
      } catch (error) {
        return createErrorResponse('옵션 파싱에 실패했습니다.', 400);
      }
    } else {
      // 기본 옵션 설정
      options = {
        generateThumbnail: true,
        thumbnailTime: 1,
        quality: 'medium'
      };
    }

    // 사용자별 폴더에 업로드
    const subfolder = `videos/${user.id}`;
    
    // 비디오 업로드 수행
    const uploadResult = await uploadService.uploadVideo(file, subfolder, options);

    // 업로드 정보를 데이터베이스에 저장 (선택사항)
    // 추후 파일 관리를 위해 필요시 구현

    return createAuthResponse({
      message: '비디오 업로드가 완료되었습니다.',
      file: {
        id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        filename: uploadResult.filename,
        size: uploadResult.size,
        type: uploadResult.type,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      }
    }, 201);

  } catch (error) {
    console.error('비디오 업로드 오류:', error);
    
    // 구체적인 에러 메시지 반환
    if (error instanceof Error) {
      if (error.message.includes('파일 크기')) {
        return createErrorResponse(error.message, 413); // Payload Too Large
      } else if (error.message.includes('형식')) {
        return createErrorResponse(error.message, 415); // Unsupported Media Type
      } else {
        return createErrorResponse(error.message, 500);
      }
    }

    return createErrorResponse(
      '비디오 업로드에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// GET /api/upload/video - 업로드된 비디오 목록 조회 (선택사항)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['BUSINESS', 'CREATOR']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // 추후 데이터베이스에서 사용자의 업로드된 비디오 목록을 조회
    // 현재는 임시 응답
    return createAuthResponse({
      message: '비디오 목록 조회는 추후 구현 예정입니다.',
      videos: [],
      totalCount: 0
    });

  } catch (error) {
    console.error('비디오 목록 조회 오류:', error);
    return createErrorResponse(
      '비디오 목록 조회에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// DELETE /api/upload/video/[filename] - 비디오 파일 삭제 (선택사항)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['BUSINESS', 'CREATOR']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    // URL에서 파일명 추출
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');

    if (!filename) {
      return createErrorResponse('파일명이 필요합니다.', 400);
    }

    // 파일 삭제 로직 (추후 구현)
    // 1. 사용자 권한 확인
    // 2. 파일 시스템에서 삭제
    // 3. 데이터베이스에서 기록 삭제

    return createAuthResponse({
      message: '비디오 파일 삭제는 추후 구현 예정입니다.',
      filename
    });

  } catch (error) {
    console.error('비디오 삭제 오류:', error);
    return createErrorResponse(
      '비디오 삭제에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}