import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';

// POST /api/upload/profile - 프로필 이미지 업로드
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

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    const uploadedFile = await uploadService.updateProfileImage(userId, file);
    
    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}