import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/upload/content/[id] - 컨텐츠 미디어 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: '최대 10개까지 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const uploadedFiles = await uploadService.uploadContentMedia(
      params.id,
      userId,
      files
    );
    
    return NextResponse.json(uploadedFiles, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}