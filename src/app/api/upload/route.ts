import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';

// POST /api/upload - 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const metadata = formData.get('metadata');

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    if (!type || !['profile', 'campaign', 'content', 'document', 'video'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 파일 타입입니다.' },
        { status: 400 }
      );
    }

    const parsedMetadata = metadata ? JSON.parse(metadata as string) : undefined;
    
    const uploadedFile = await uploadService.uploadFile(
      file,
      userId,
      type,
      parsedMetadata
    );
    
    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}